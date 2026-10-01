/**
 * FormBuilder — Top-level component composing all builder panels.
 *
 * Wraps children in DndProvider with HTML5Backend. Initializes
 * useBuilderReducer, provides BuilderContext, handles save/publish
 * flows, auto-save, keyboard shortcuts, and beforeunload.
 */

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FileText } from 'lucide-react';
import type {
  BuilderState,
  BuilderCrossFieldRule,
  BuilderMetadata,
  FormSettings,
  FormTemplate,
} from './types';
import { createBlankBuilderState } from './types';
import { BuilderProvider } from './BuilderContext';
import { useBuilderReducer } from '../../hooks/useBuilderReducer';
import { exportSchemaCanonical } from '../../utils/schemaExporter';
import { importSchema, isImportError } from '../../utils/schemaImporter';
import {
  autoSaveSave,
  autoSaveLoad,
  autoSaveClear,
} from '../../utils/autoSaveManager';
import { FORM_TEMPLATES } from '../../utils/formTemplates';
import { buildServiceDefinition } from '../../utils/builderServiceDefinition';
import { producerService } from '../../services/api/producer.service';
import FieldPalette from './FieldPalette';
import Canvas from './Canvas';
import PropertyPanel from './PropertyPanel';
import LivePreview from './LivePreview';
import Toolbar from './Toolbar';
import SectionManager from './SectionManager';
import toast from '../../utils/toast';

// ---------------------------------------------------------------------------
// Template Selection Screen
// ---------------------------------------------------------------------------

function TemplateSelector({
  onSelect,
  onBlank,
}: {
  onSelect: (template: FormTemplate) => void;
  onBlank: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <h2 className="text-2xl font-bold mb-2">Create a New Form</h2>
      <p className="text-muted-foreground mb-8">
        Start from scratch or choose a template to get started quickly.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl w-full">
        {/* Blank form */}
        <button
          type="button"
          onClick={onBlank}
          className="flex flex-col items-center p-6 border-2 border-dashed border-border rounded-lg
            hover:border-primary hover:bg-primary/5 transition-colors
            focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <FileText className="w-10 h-10 text-muted-foreground mb-3" />
          <span className="font-medium">Blank Form</span>
          <span className="text-xs text-muted-foreground mt-1">Start from scratch</span>
        </button>

        {/* Templates */}
        {FORM_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className="flex flex-col items-start p-6 border border-border rounded-lg text-left
              hover:border-primary hover:bg-primary/5 transition-colors
              focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <span className="font-medium mb-1">{template.name}</span>
            <span className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {template.description}
            </span>
            <div className="text-xs text-muted-foreground">
              {template.fieldSummary.length} fields
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auto-save recovery prompt
// ---------------------------------------------------------------------------

function RecoveryPrompt({
  timestamp,
  onRestore,
  onDiscard,
}: {
  timestamp: number;
  onRestore: () => void;
  onDiscard: () => void;
}) {
  const date = new Date(timestamp);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
      <div className="bg-background border border-border rounded-lg p-6 max-w-md shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Recover Auto-Saved Work?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          An auto-saved version from{' '}
          <strong>{date.toLocaleString()}</strong> was found. Would you like to
          restore it or discard it?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onRestore}
            className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded
              hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            Restore
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="flex-1 px-4 py-2 text-sm border border-border rounded
              hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormBuilder
// ---------------------------------------------------------------------------

interface FormBuilderProps {
  serviceId?: string;
  tenantId: string;
  initialSchema?: string;
}

export default function FormBuilder({
  serviceId,
  tenantId,
  initialSchema,
}: FormBuilderProps) {
  const [, setSearchParams] = useSearchParams();
  const [savedServiceId, setSavedServiceId] = useState(serviceId ?? null);

  // Determine initial state
  const initialState = useMemo(() => {
    if (initialSchema) {
      const result = importSchema(initialSchema);
      if (!isImportError(result)) return result;
    }
    return createBlankBuilderState(serviceId);
  }, [initialSchema, serviceId]);

  const [showTemplateSelector, setShowTemplateSelector] = useState(
    !initialSchema && !serviceId
  );
  const [recoveryData, setRecoveryData] = useState<{
    state: BuilderState;
    timestamp: number;
  } | null>(null);

  const {
    builderState,
    dispatch,
    canUndo,
    canRedo,
    isDirty,
  } = useBuilderReducer(initialState);

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);

  const selectedField = useMemo(
    () => builderState.fields.find((f) => f.id === selectedFieldId) || null,
    [builderState.fields, selectedFieldId]
  );

  const effectiveServiceId = serviceId || savedServiceId || builderState.metadata.serviceId || 'new';

  // ---------------------------------------------------------------------------
  // Auto-save recovery on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const saved = autoSaveLoad(tenantId, effectiveServiceId);
    if (saved) {
      setRecoveryData(saved);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRestore = useCallback(() => {
    if (recoveryData) {
      dispatch({ type: 'LOAD_STATE', state: recoveryData.state });
      toast.success('Auto-saved work restored');
    }
    setRecoveryData(null);
  }, [recoveryData, dispatch]);

  const handleDiscardRecovery = useCallback(() => {
    autoSaveClear(tenantId, effectiveServiceId);
    setRecoveryData(null);
  }, [tenantId, effectiveServiceId]);

  // ---------------------------------------------------------------------------
  // Auto-save interval (30 seconds)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isDirty) return;

    const interval = setInterval(() => {
      const success = autoSaveSave(tenantId, effectiveServiceId, builderState);
      if (success) {
        setLastAutoSave(Date.now());
      } else {
        toast.warning('Auto-save unavailable — storage full');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isDirty, tenantId, effectiveServiceId, builderState]);

  // ---------------------------------------------------------------------------
  // beforeunload warning
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Ctrl+Z / Cmd+Z — Undo
      if (isMod && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canUndo) dispatch({ type: 'UNDO' });
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z — Redo
      if (isMod && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canRedo) dispatch({ type: 'REDO' });
      }
      // Also Ctrl+Y for redo
      if (isMod && e.key === 'y') {
        e.preventDefault();
        if (canRedo) dispatch({ type: 'REDO' });
      }

      // Ctrl+S / Cmd+S — Save
      if (isMod && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canUndo, canRedo, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Template selection
  // ---------------------------------------------------------------------------

  const handleSelectTemplate = useCallback(
    (template: FormTemplate) => {
      dispatch({ type: 'LOAD_STATE', state: template.state });
      setShowTemplateSelector(false);
      toast.success(`Loaded "${template.name}" template`);
    },
    [dispatch]
  );

  const handleBlankForm = useCallback(() => {
    setShowTemplateSelector(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Save flow
  // ---------------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const definition = buildServiceDefinition(builderState);
      const currentServiceId = serviceId || savedServiceId || builderState.metadata.serviceId;
      const savedService = currentServiceId
        ? await producerService.updateService(currentServiceId, definition)
        : await producerService.createService(definition);
      const persistedServiceId = savedService.id;
      if (!persistedServiceId) {
        throw new Error('The API did not return a service ID.');
      }

      setSavedServiceId(persistedServiceId);
      setSimulationLoading(false);
      dispatch({
        type: 'LOAD_STATE',
        state: {
          ...builderState,
          metadata: { ...builderState.metadata, serviceId: persistedServiceId },
        },
      });

      // Clear auto-save on successful save
      autoSaveClear(tenantId, effectiveServiceId);
      setLastAutoSave(null);
      setSaveStatus('saved');
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set('serviceId', persistedServiceId);
        return next;
      }, { replace: true });
      toast.success('Service draft saved');
    } catch (error) {
      setSaveStatus('unsaved');
      toast.error('Save failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    }
  }, [builderState, dispatch, effectiveServiceId, savedServiceId, serviceId, setSearchParams, tenantId]);

  const handleSimulate = useCallback(async () => {
    const currentServiceId = serviceId || savedServiceId || builderState.metadata.serviceId;
    if (!currentServiceId) {
      toast.warning('Save the draft before running simulation.');
      return;
    }
    if (isDirty) {
      toast.warning('Save your changes before running simulation.');
      return;
    }

    setSimulationLoading(true);
    try {
      const result = await producerService.simulateService(currentServiceId);
      const failedChecks = result.checks.filter((check) => !check.passed);
      if (!result.passed || failedChecks.length > 0) {
        toast.error('Simulation failed; the draft was retained', {
          description: failedChecks.map((check) => check.id).join(', ') || 'Review the service configuration.',
        });
        return;
      }
      toast.success('Simulation passed; the service is ready for approval');
    } catch (error) {
      toast.error('Simulation failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setSimulationLoading(false);
    }
  }, [builderState.metadata.serviceId, isDirty, savedServiceId, serviceId]);

  // ---------------------------------------------------------------------------
  // Publish flow
  // ---------------------------------------------------------------------------

  const handlePublish = useCallback(async () => {
    if (isDirty) {
      toast.warning('Please save your changes before publishing.');
      return;
    }

    const currentServiceId = serviceId || savedServiceId || builderState.metadata.serviceId;
    if (!currentServiceId) {
      toast.warning('Save the draft before requesting publication.');
      return;
    }

    try {
      const simulation = await producerService.simulateService(currentServiceId);
      const failedChecks = simulation.checks.filter((check) => !check.passed);
      if (!simulation.passed || failedChecks.length > 0) {
        toast.error('Simulation failed; publication was not requested', {
          description: failedChecks.map((check) => check.id).join(', ') || 'Review the service configuration.',
        });
        return;
      }
      await producerService.publishService(currentServiceId);
      toast.success('Publication request sent for maker-checker approval');
    } catch (error) {
      toast.error('Publish request failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    }
  }, [builderState.metadata.serviceId, isDirty, savedServiceId, serviceId]);

  // ---------------------------------------------------------------------------
  // Import / Export
  // ---------------------------------------------------------------------------

  const handleImport = useCallback(
    (json: string) => {
      const result = importSchema(json);
      if (isImportError(result)) {
        toast.error('Import failed', { description: result.message });
        return;
      }
      dispatch({ type: 'LOAD_STATE', state: result });
      toast.success('Schema imported successfully');
    },
    [dispatch]
  );

  const handleExport = useCallback(() => {
    try {
      const json = exportSchemaCanonical(builderState);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${builderState.metadata.serviceName || 'form'}-schema.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Schema exported');
    } catch {
      toast.error('Export failed');
    }
  }, [builderState]);

  // ---------------------------------------------------------------------------
  // Dispatch helpers for child components
  // ---------------------------------------------------------------------------

  const handleAddField = useCallback(
    (fieldType: string) => {
      dispatch({
        type: 'ADD_FIELD',
        fieldType,
        index: builderState.fields.length,
      });
    },
    [dispatch, builderState.fields.length]
  );

  const handleDropNewField = useCallback(
    (fieldType: string, index: number) => {
      dispatch({ type: 'ADD_FIELD', fieldType, index });
    },
    [dispatch]
  );

  const handleReorderField = useCallback(
    (fromIndex: number, toIndex: number) => {
      dispatch({ type: 'REORDER_FIELD', fromIndex, toIndex });
    },
    [dispatch]
  );

  const handleDeleteField = useCallback(
    (fieldId: string) => {
      dispatch({ type: 'REMOVE_FIELD', fieldId });
      if (selectedFieldId === fieldId) setSelectedFieldId(null);
    },
    [dispatch, selectedFieldId]
  );

  const handleUpdateField = useCallback(
    (fieldId: string, updates: Partial<any>) => {
      dispatch({ type: 'UPDATE_FIELD', fieldId, updates });
    },
    [dispatch]
  );

  const handleUpdateFormSettings = useCallback(
    (updates: Partial<FormSettings>) => {
      dispatch({ type: 'UPDATE_FORM_SETTINGS', updates });
    },
    [dispatch]
  );

  const handleUpdateMetadata = useCallback(
    (updates: Partial<BuilderMetadata>) => {
      dispatch({ type: 'UPDATE_METADATA', updates });
    },
    [dispatch]
  );

  const handleAddCrossFieldRule = useCallback(
    (rule: BuilderCrossFieldRule) => {
      dispatch({ type: 'ADD_CROSS_FIELD_RULE', rule });
    },
    [dispatch]
  );

  const handleUpdateCrossFieldRule = useCallback(
    (index: number, rule: BuilderCrossFieldRule) => {
      dispatch({ type: 'UPDATE_CROSS_FIELD_RULE', index, rule });
    },
    [dispatch]
  );

  const handleRemoveCrossFieldRule = useCallback(
    (index: number) => {
      dispatch({ type: 'REMOVE_CROSS_FIELD_RULE', index });
    },
    [dispatch]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Template selection screen
  if (showTemplateSelector) {
    return (
      <DndProvider backend={HTML5Backend}>
        <TemplateSelector
          onSelect={handleSelectTemplate}
          onBlank={handleBlankForm}
        />
      </DndProvider>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <BuilderProvider
        builderState={builderState}
        dispatch={dispatch}
        canUndo={canUndo}
        canRedo={canRedo}
        isDirty={isDirty}
      >
        {/* Recovery prompt */}
        {recoveryData && (
          <RecoveryPrompt
            timestamp={recoveryData.timestamp}
            onRestore={handleRestore}
            onDiscard={handleDiscardRecovery}
          />
        )}

        <div className="flex flex-col h-full">
          <div className="grid grid-cols-1 gap-3 border-b border-border bg-background p-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-medium text-muted-foreground">
              Service name
              <input
                value={builderState.metadata.serviceName}
                onChange={(event) => handleUpdateMetadata({ serviceName: event.target.value })}
                className="mt-1 block w-full rounded border border-border bg-card px-2 py-1.5 text-sm text-foreground"
                maxLength={160}
                required
              />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Category
              <input
                value={builderState.metadata.category}
                onChange={(event) => handleUpdateMetadata({ category: event.target.value })}
                className="mt-1 block w-full rounded border border-border bg-card px-2 py-1.5 text-sm text-foreground"
                maxLength={120}
                required
              />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Description
              <input
                value={builderState.metadata.description}
                onChange={(event) => handleUpdateMetadata({ description: event.target.value })}
                className="mt-1 block w-full rounded border border-border bg-card px-2 py-1.5 text-sm text-foreground"
                maxLength={1000}
              />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              SLA (days)
              <input
                type="number"
                min={1}
                max={365}
                value={builderState.metadata.slaDays ?? 30}
                onChange={(event) => handleUpdateMetadata({ slaDays: Number(event.target.value) || 1 })}
                className="mt-1 block w-full rounded border border-border bg-card px-2 py-1.5 text-sm text-foreground"
              />
            </label>
          </div>

          {/* Toolbar */}
          <Toolbar
            canUndo={canUndo}
            canRedo={canRedo}
            isDirty={isDirty}
            saveStatus={isDirty ? 'unsaved' : saveStatus}
            lastAutoSave={lastAutoSave}
            columns={builderState.formSettings.columns}
            gap={builderState.formSettings.gap}
            onUndo={() => dispatch({ type: 'UNDO' })}
            onRedo={() => dispatch({ type: 'REDO' })}
            onSave={handleSave}
            onSimulate={handleSimulate}
            canSimulate={Boolean(serviceId || savedServiceId || builderState.metadata.serviceId)}
            simulationLoading={simulationLoading}
            onPublish={handlePublish}
            onImport={handleImport}
            onExport={handleExport}
            onColumnsChange={(columns) =>
              handleUpdateFormSettings({ columns })
            }
            onGapChange={(gap) => handleUpdateFormSettings({ gap })}
          />

          {/* Main content area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Field Palette — left sidebar */}
            <div className="w-64 border-r border-border flex-shrink-0 overflow-hidden">
              <FieldPalette
                tenantId={tenantId}
                onAddField={handleAddField}
              />
            </div>

            {/* Canvas — center */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <Canvas
                fields={builderState.fields}
                selectedFieldId={selectedFieldId}
                columns={builderState.formSettings.columns}
                onSelectField={setSelectedFieldId}
                onReorderField={handleReorderField}
                onDropNewField={handleDropNewField}
                onDeleteField={handleDeleteField}
              />

              {/* Section Manager */}
              <SectionManager
                sections={builderState.sections}
                fields={builderState.fields}
                onAddSection={(section) =>
                  dispatch({ type: 'ADD_SECTION', section })
                }
                onUpdateSection={(sectionId, updates) =>
                  dispatch({ type: 'UPDATE_SECTION', sectionId, updates })
                }
                onRemoveSection={(sectionId) =>
                  dispatch({ type: 'REMOVE_SECTION', sectionId })
                }
              />
            </div>

            {/* Property Panel — right sidebar */}
            <div className="w-72 border-l border-border flex-shrink-0 overflow-hidden">
              <PropertyPanel
                selectedField={selectedField}
                builderState={builderState}
                onUpdateField={handleUpdateField}
                onUpdateFormSettings={handleUpdateFormSettings}
                onAddCrossFieldRule={handleAddCrossFieldRule}
                onUpdateCrossFieldRule={handleUpdateCrossFieldRule}
                onRemoveCrossFieldRule={handleRemoveCrossFieldRule}
              />
            </div>

            {/* Live Preview — far right */}
            <div className="w-96 border-l border-border flex-shrink-0 overflow-hidden">
              <LivePreview
                builderState={builderState}
                tenantId={tenantId}
              />
            </div>
          </div>
        </div>
      </BuilderProvider>
    </DndProvider>
  );
}
