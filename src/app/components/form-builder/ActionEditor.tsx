/**
 * ActionEditor — Panel component for the Visual Form Builder's Property Panel.
 *
 * Allows admins to create, edit, and remove custom form actions attached
 * to fields. Provides a code editor with JavaScript syntax highlighting,
 * event type selection, test execution, and inline prohibited construct warnings.
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Play,
  Save,
  AlertTriangle,
  Code,
  Zap,
  ChevronDown,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import type { ActionDefinition, ActionEvent } from '@serviceformai/validation-engine';
import { createSandboxWorker } from '../../actions/sandbox-worker';
import type { SandboxResponse } from '../../actions/sandbox-types';
import {
  generatePreBuiltAction,
  PRE_BUILT_ACTION_DESCRIPTIONS,
  type PreBuiltActionType,
  type PreBuiltActionConfig,
} from '../../actions/prebuilt-actions';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTION_EVENTS: { value: ActionEvent; label: string }[] = [
  { value: 'onFieldChange', label: 'On Field Change' },
  { value: 'onFieldBlur', label: 'On Field Blur' },
  { value: 'onFormLoad', label: 'On Form Load' },
  { value: 'onFormSubmit', label: 'On Form Submit' },
  { value: 'onButtonClick', label: 'On Button Click' },
];

const PROHIBITED_IDENTIFIERS = [
  'eval', 'Function', 'import', 'require', 'setTimeout', 'setInterval',
  'XMLHttpRequest', 'window', 'document', 'navigator', 'location',
  'localStorage', 'sessionStorage', 'indexedDB', 'cookie', 'importScripts',
  'self.close', 'self.addEventListener', 'WebSocket', 'SharedWorker',
  'ServiceWorker', 'Proxy', 'Reflect.construct',
];

/** TypeScript type definitions for the Restricted API (inline documentation). */
const RESTRICTED_API_TYPES = `// Restricted API — available inside action code
declare function getFieldValue(fieldId: string): any;
declare function setFieldValue(fieldId: string, value: any): void;
declare function showField(fieldId: string): void;
declare function hideField(fieldId: string): void;
declare function showMessage(text: string, type: 'info' | 'warning' | 'error' | 'success'): void;
declare function fetch(url: string, options?: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}): Promise<{ status: number; body: any }>;
declare function getFormValues(): Record<string, any>;

// Event arguments (available as \`args\`)
declare const args: {
  fieldId?: string;
  value?: any;
  previousValue?: any;
  buttonId?: string;
};
declare const event: string;`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check code for prohibited constructs and return warnings. */
function detectProhibitedConstructs(code: string): string[] {
  const warnings: string[] = [];
  for (const id of PROHIBITED_IDENTIFIERS) {
    // Use word boundary check to avoid false positives
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`);
    if (regex.test(code)) {
      warnings.push(`Prohibited construct detected: "${id}"`);
    }
  }
  return warnings;
}

/** Generate a unique action ID. */
function generateActionId(): string {
  return `action_${Math.random().toString(36).substring(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Test Output Panel
// ---------------------------------------------------------------------------

interface TestResult {
  status: 'success' | 'error' | 'timeout';
  apiCalls: SandboxResponse['apiCalls'];
  error?: { code: string; message: string };
  executionDurationMs: number;
}

function TestOutputPanel({ result }: { result: TestResult | null }) {
  if (!result) return null;

  return (
    <div className="mt-3 border border-border rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center gap-2">
        {result.status === 'success' ? (
          <CheckCircle className="w-4 h-4 text-green-600" aria-hidden="true" />
        ) : (
          <XCircle className="w-4 h-4 text-destructive" aria-hidden="true" />
        )}
        <span className="text-xs font-medium">
          {result.status === 'success' ? 'Success' : result.status === 'timeout' ? 'Timeout' : 'Error'}
          {' '}({result.executionDurationMs}ms)
        </span>
      </div>
      <div className="p-3 text-xs font-mono space-y-1 max-h-40 overflow-y-auto">
        {result.error && (
          <div className="text-destructive">
            Error: {result.error.code} — {result.error.message}
          </div>
        )}
        {result.apiCalls.length > 0 ? (
          result.apiCalls.map((call, i) => (
            <div key={i} className="text-muted-foreground">
              {call.fn}({JSON.stringify(call.args)})
            </div>
          ))
        ) : (
          !result.error && <div className="text-muted-foreground">No API calls recorded.</div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action Item Editor
// ---------------------------------------------------------------------------

interface ActionItemEditorProps {
  action: ActionDefinition;
  onSave: (action: ActionDefinition) => void;
  onRemove: () => void;
  onCancel: () => void;
  formValues: Record<string, unknown>;
}

function ActionItemEditor({
  action,
  onSave,
  onRemove,
  onCancel,
  formValues,
}: ActionItemEditorProps) {
  const [editedAction, setEditedAction] = useState<ActionDefinition>({ ...action });
  const [showApiTypes, setShowApiTypes] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const warnings = useMemo(
    () => detectProhibitedConstructs(editedAction.code),
    [editedAction.code],
  );

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const worker = createSandboxWorker();
      workerRef.current = worker;

      const requestId = `test-${Date.now()}`;

      const result = await new Promise<TestResult>((resolve) => {
        const timer = setTimeout(() => {
          worker.terminate();
          resolve({
            status: 'timeout',
            apiCalls: [],
            error: { code: 'TEST_TIMEOUT', message: 'Test execution timed out' },
            executionDurationMs: 5000,
          });
        }, 5000);

        worker.onmessage = (e: MessageEvent) => {
          clearTimeout(timer);
          const data = e.data as SandboxResponse;
          resolve({
            status: data.status,
            apiCalls: data.apiCalls,
            error: data.error,
            executionDurationMs: data.executionDurationMs,
          });
        };

        worker.onerror = () => {
          clearTimeout(timer);
          resolve({
            status: 'error',
            apiCalls: [],
            error: { code: 'WORKER_ERROR', message: 'Worker crashed during test' },
            executionDurationMs: 0,
          });
        };

        worker.postMessage({
          type: 'execute',
          requestId,
          code: editedAction.code,
          event: editedAction.event,
          args: {
            fieldId: editedAction.targetId,
            value: editedAction.targetId ? formValues[editedAction.targetId] : undefined,
          },
          formValues,
          allowlist: [],
        });
      });

      setTestResult(result);
      workerRef.current?.terminate();
      workerRef.current = null;
    } catch {
      setTestResult({
        status: 'error',
        apiCalls: [],
        error: { code: 'TEST_ERROR', message: 'Failed to create test worker' },
        executionDurationMs: 0,
      });
    } finally {
      setTesting(false);
    }
  }, [editedAction, formValues]);

  return (
    <div className="border border-border rounded-lg p-3 space-y-3">
      {/* Event type selector */}
      <div>
        <label htmlFor="action-event" className="text-xs font-medium block mb-1">
          Event Type
        </label>
        <select
          id="action-event"
          value={editedAction.event}
          onChange={(e) =>
            setEditedAction({ ...editedAction, event: e.target.value as ActionEvent })
          }
          className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {ACTION_EVENTS.map((evt) => (
            <option key={evt.value} value={evt.value}>
              {evt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="action-description" className="text-xs font-medium block mb-1">
          Description
        </label>
        <input
          id="action-description"
          type="text"
          value={editedAction.description || ''}
          onChange={(e) =>
            setEditedAction({ ...editedAction, description: e.target.value || undefined })
          }
          placeholder="What does this action do?"
          className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* API type definitions toggle */}
      <button
        type="button"
        onClick={() => setShowApiTypes(!showApiTypes)}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <Code className="w-3 h-3" />
        {showApiTypes ? 'Hide' : 'Show'} API Reference
        <ChevronDown
          className={`w-3 h-3 transition-transform ${showApiTypes ? 'rotate-180' : ''}`}
        />
      </button>

      {showApiTypes && (
        <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto border border-border font-mono text-muted-foreground">
          {RESTRICTED_API_TYPES}
        </pre>
      )}

      {/* Code editor */}
      <div>
        <label htmlFor="action-code" className="text-xs font-medium block mb-1">
          Action Code (JavaScript)
        </label>
        <textarea
          id="action-code"
          value={editedAction.code}
          onChange={(e) => setEditedAction({ ...editedAction, code: e.target.value })}
          rows={10}
          spellCheck={false}
          className="w-full px-3 py-2 text-sm font-mono border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-muted/30 resize-y"
          placeholder="// Write your action code here..."
        />
      </div>

      {/* Inline warnings for prohibited constructs */}
      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((warning, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded"
              role="alert"
            >
              <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || !editedAction.code.trim()}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 rounded transition-colors disabled:opacity-50"
        >
          {testing ? (
            <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="w-3 h-3" aria-hidden="true" />
          )}
          Test Action
        </button>
        <button
          type="button"
          onClick={() => onSave(editedAction)}
          disabled={warnings.length > 0 || !editedAction.code.trim()}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors disabled:opacity-50"
        >
          <Save className="w-3 h-3" aria-hidden="true" />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded transition-colors"
        >
          <Trash2 className="w-3 h-3" aria-hidden="true" />
          Remove
        </button>
      </div>

      {/* Test output */}
      <TestOutputPanel result={testResult} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pre-Built Actions Tab
// ---------------------------------------------------------------------------

interface PreBuiltActionsTabProps {
  fieldId: string;
  onAddAction: (action: ActionDefinition) => void;
}

function PreBuiltActionsTab({ fieldId, onAddAction }: PreBuiltActionsTabProps) {
  const [selectedType, setSelectedType] = useState<PreBuiltActionType | null>(null);

  // Config state for each type
  const [calcSources, setCalcSources] = useState('');
  const [calcTarget, setCalcTarget] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiTargetFields, setApiTargetFields] = useState('');
  const [depTarget, setDepTarget] = useState('');
  const [depMapping, setDepMapping] = useState('');

  const handleGenerate = useCallback(() => {
    if (!selectedType) return;

    let config: PreBuiltActionConfig;
    const id = generateActionId();

    switch (selectedType) {
      case 'auto-calculate':
        config = {
          type: 'auto-calculate',
          params: {
            sourceFields: calcSources.split(',').map((s) => s.trim()).filter(Boolean),
            targetField: calcTarget.trim(),
          },
        };
        break;
      case 'auto-format-phone':
        config = {
          type: 'auto-format-phone',
          params: { fieldId },
        };
        break;
      case 'auto-format-currency':
        config = {
          type: 'auto-format-currency',
          params: { fieldId },
        };
        break;
      case 'conditional-api-lookup':
        try {
          config = {
            type: 'conditional-api-lookup',
            params: {
              triggerField: fieldId,
              apiEndpoint: apiEndpoint.trim(),
              targetFields: JSON.parse(apiTargetFields || '{}'),
            },
          };
        } catch {
          return; // Invalid JSON
        }
        break;
      case 'field-dependency':
        try {
          config = {
            type: 'field-dependency',
            params: {
              sourceField: fieldId,
              targetField: depTarget.trim(),
              mapping: JSON.parse(depMapping || '{}'),
            },
          };
        } catch {
          return; // Invalid JSON
        }
        break;
      default:
        return;
    }

    const action = generatePreBuiltAction(id, config);
    onAddAction(action);
    setSelectedType(null);
  }, [selectedType, fieldId, calcSources, calcTarget, apiEndpoint, apiTargetFields, depTarget, depMapping, onAddAction]);

  const preBuiltTypes: PreBuiltActionType[] = [
    'auto-calculate',
    'auto-format-phone',
    'auto-format-currency',
    'conditional-api-lookup',
    'field-dependency',
  ];

  return (
    <div className="space-y-3">
      {preBuiltTypes.map((type) => (
        <div key={type} className="border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setSelectedType(selectedType === type ? null : type)}
            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-muted/50 transition-colors"
          >
            <Zap className="w-4 h-4 text-primary" aria-hidden="true" />
            <div className="flex-1">
              <div className="text-sm font-medium capitalize">{type.replace(/-/g, ' ')}</div>
              <div className="text-xs text-muted-foreground">
                {PRE_BUILT_ACTION_DESCRIPTIONS[type]}
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                selectedType === type ? 'rotate-180' : ''
              }`}
            />
          </button>

          {selectedType === type && (
            <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
              {/* Type-specific configuration forms */}
              {type === 'auto-calculate' && (
                <>
                  <div>
                    <label className="text-xs font-medium block mb-1">
                      Source Field IDs (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={calcSources}
                      onChange={(e) => setCalcSources(e.target.value)}
                      placeholder="field_1, field_2, field_3"
                      className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Target Field ID</label>
                    <input
                      type="text"
                      value={calcTarget}
                      onChange={(e) => setCalcTarget(e.target.value)}
                      placeholder="total_field"
                      className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </>
              )}

              {type === 'auto-format-phone' && (
                <p className="text-xs text-muted-foreground">
                  Will format the current field ({fieldId}) to +91 XXXXX XXXXX on blur.
                </p>
              )}

              {type === 'auto-format-currency' && (
                <p className="text-xs text-muted-foreground">
                  Will format the current field ({fieldId}) with Indian numbering separators on blur.
                </p>
              )}

              {type === 'conditional-api-lookup' && (
                <>
                  <div>
                    <label className="text-xs font-medium block mb-1">API Endpoint (HTTPS)</label>
                    <input
                      type="text"
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      placeholder="https://api.example.gov.in/lookup"
                      className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">
                      Target Fields (JSON: response key → field ID)
                    </label>
                    <textarea
                      value={apiTargetFields}
                      onChange={(e) => setApiTargetFields(e.target.value)}
                      placeholder='{"name": "name_field", "address": "address_field"}'
                      rows={3}
                      className="w-full px-2 py-1.5 text-sm font-mono border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                    />
                  </div>
                </>
              )}

              {type === 'field-dependency' && (
                <>
                  <div>
                    <label className="text-xs font-medium block mb-1">Target Field ID</label>
                    <input
                      type="text"
                      value={depTarget}
                      onChange={(e) => setDepTarget(e.target.value)}
                      placeholder="district_field"
                      className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">
                      Value Mapping (JSON: source value → target value)
                    </label>
                    <textarea
                      value={depMapping}
                      onChange={(e) => setDepMapping(e.target.value)}
                      placeholder='{"Karnataka": "Bengaluru", "Maharashtra": "Mumbai"}'
                      rows={3}
                      className="w-full px-2 py-1.5 text-sm font-mono border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                    />
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors"
              >
                <Plus className="w-3 h-3" aria-hidden="true" />
                Add Action
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActionEditor (main export)
// ---------------------------------------------------------------------------

interface ActionEditorProps {
  /** Currently selected field ID. */
  fieldId: string;
  /** Current actions array from the schema. */
  actions: ActionDefinition[];
  /** Callback to update the actions array. */
  onUpdateActions: (actions: ActionDefinition[]) => void;
  /** Current form values for test execution. */
  formValues?: Record<string, unknown>;
}

export default function ActionEditor({
  fieldId,
  actions,
  onUpdateActions,
  formValues = {},
}: ActionEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'custom' | 'prebuilt'>('custom');

  // Filter actions for the current field
  const fieldActions = useMemo(
    () => actions.filter((a) => a.targetId === fieldId),
    [actions, fieldId],
  );

  const handleAddAction = useCallback(() => {
    const newAction: ActionDefinition = {
      id: generateActionId(),
      event: 'onFieldChange',
      targetId: fieldId,
      code: '',
      description: '',
      enabled: true,
    };
    const updated = [...actions, newAction];
    onUpdateActions(updated);
    // Find the index of the new action in the full array
    setEditingIndex(updated.length - 1);
  }, [actions, fieldId, onUpdateActions]);

  const handleSaveAction = useCallback(
    (index: number, updatedAction: ActionDefinition) => {
      const globalIndex = actions.findIndex((a) => a.id === fieldActions[index]?.id);
      if (globalIndex === -1) return;
      const updated = [...actions];
      const previousAction = actions[globalIndex];

      // Code versioning: if the code has changed, store the previous version
      if (previousAction.code && previousAction.code !== updatedAction.code) {
        const historyEntry = {
          code: previousAction.code,
          timestamp: new Date().toISOString(),
        };
        updatedAction = {
          ...updatedAction,
          codeHistory: [...(previousAction.codeHistory || []), historyEntry],
        };
      }

      updated[globalIndex] = updatedAction;
      onUpdateActions(updated);
      setEditingIndex(null);
    },
    [actions, fieldActions, onUpdateActions],
  );

  const handleRemoveAction = useCallback(
    (index: number) => {
      const globalIndex = actions.findIndex((a) => a.id === fieldActions[index]?.id);
      if (globalIndex === -1) return;
      const updated = actions.filter((_, i) => i !== globalIndex);
      onUpdateActions(updated);
      setEditingIndex(null);
    },
    [actions, fieldActions, onUpdateActions],
  );

  const handleAddPreBuiltAction = useCallback(
    (action: ActionDefinition) => {
      onUpdateActions([...actions, action]);
    },
    [actions, onUpdateActions],
  );

  return (
    <div className="space-y-3" role="region" aria-label="Action Editor">
      {/* Tab switcher */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'custom'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Code className="w-3 h-3 inline mr-1" aria-hidden="true" />
          Custom Actions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('prebuilt')}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'prebuilt'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap className="w-3 h-3 inline mr-1" aria-hidden="true" />
          Pre-Built Actions
        </button>
      </div>

      {activeTab === 'custom' ? (
        <div className="space-y-3">
          {/* Action list */}
          {fieldActions.length === 0 && editingIndex === null && (
            <p className="text-xs text-muted-foreground py-2">
              No actions attached to this field.
            </p>
          )}

          {fieldActions.map((action, index) => {
            const globalIndex = actions.findIndex((a) => a.id === action.id);
            if (editingIndex === globalIndex) {
              return (
                <ActionItemEditor
                  key={action.id}
                  action={action}
                  onSave={(updated) => handleSaveAction(index, updated)}
                  onRemove={() => handleRemoveAction(index)}
                  onCancel={() => setEditingIndex(null)}
                  formValues={formValues}
                />
              );
            }

            return (
              <div
                key={action.id}
                className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {action.description || action.id}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ACTION_EVENTS.find((e) => e.value === action.event)?.label || action.event}
                    {!action.enabled && (
                      <span className="ml-2 text-amber-600">(disabled)</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingIndex(globalIndex)}
                  className="px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveAction(index)}
                  className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                  aria-label={`Remove action ${action.description || action.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* New action being edited (not yet in fieldActions) */}
          {editingIndex !== null && editingIndex >= actions.length - 1 && !fieldActions.find((a) => a.id === actions[editingIndex]?.id) && actions[editingIndex] && (
            <ActionItemEditor
              key={actions[editingIndex].id}
              action={actions[editingIndex]}
              onSave={(updated) => {
                const updatedActions = [...actions];
                updatedActions[editingIndex] = updated;
                onUpdateActions(updatedActions);
                setEditingIndex(null);
              }}
              onRemove={() => {
                onUpdateActions(actions.filter((_, i) => i !== editingIndex));
                setEditingIndex(null);
              }}
              onCancel={() => {
                // Remove the empty action that was just added
                onUpdateActions(actions.filter((_, i) => i !== editingIndex));
                setEditingIndex(null);
              }}
              formValues={formValues}
            />
          )}

          {/* Add action button */}
          {editingIndex === null && (
            <button
              type="button"
              onClick={handleAddAction}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus className="w-3 h-3" aria-hidden="true" />
              Add Custom Action
            </button>
          )}
        </div>
      ) : (
        <PreBuiltActionsTab fieldId={fieldId} onAddAction={handleAddPreBuiltAction} />
      )}
    </div>
  );
}
