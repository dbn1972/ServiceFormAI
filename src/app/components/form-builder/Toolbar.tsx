/**
 * Toolbar — Undo/redo, save, publish, layout controls, import/export.
 *
 * Displays undo/redo buttons, save/publish buttons, layout column count
 * selector, gap spacing dropdown, save status indicator, last auto-save
 * timestamp, and import/export buttons.
 */

import { useRef } from 'react';
import {
  Undo2,
  Redo2,
  Save,
  Upload as PublishIcon,
  Download,
  Upload,
  Columns2,
  Play,
} from 'lucide-react';
import type { SpacingToken } from './types';

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  saveStatus: 'saved' | 'unsaved' | 'saving';
  lastAutoSave: number | null;
  columns: number;
  gap: SpacingToken;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onSimulate?: () => void;
  canSimulate?: boolean;
  simulationLoading?: boolean;
  onPublish: () => void;
  onImport: (json: string) => void;
  onExport: () => void;
  onColumnsChange: (columns: number) => void;
  onGapChange: (gap: SpacingToken) => void;
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Toolbar({
  canUndo,
  canRedo,
  isDirty,
  saveStatus,
  lastAutoSave,
  columns,
  gap,
  onUndo,
  onRedo,
  onSave,
  onSimulate,
  canSimulate = false,
  simulationLoading = false,
  onPublish,
  onImport,
  onExport,
  onColumnsChange,
  onGapChange,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        onImport(text);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-imported
    e.target.value = '';
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background"
      role="toolbar"
      aria-label="Form Builder Toolbar"
    >
      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo (Ctrl+Z)"
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo (Ctrl+Shift+Z)"
          title="Redo (Ctrl+Shift+Z)"
          className="p-1.5 rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-border" />

      {/* Layout controls */}
      <div className="flex items-center gap-2">
        <Columns2 className="w-4 h-4 text-muted-foreground" />
        <select
          value={columns}
          onChange={(e) => onColumnsChange(parseInt(e.target.value, 10))}
          className="px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Column count"
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n} col{n > 1 ? 's' : ''}
            </option>
          ))}
        </select>
        <select
          value={gap}
          onChange={(e) => onGapChange(e.target.value as SpacingToken)}
          className="px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Gap spacing"
        >
          <option value="xs">XS gap</option>
          <option value="sm">SM gap</option>
          <option value="md">MD gap</option>
          <option value="lg">LG gap</option>
          <option value="xl">XL gap</option>
        </select>
      </div>

      <div className="w-px h-5 bg-border" />

      {/* Import / Export */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleImportClick}
          aria-label="Import JSON schema"
          title="Import JSON"
          className="p-1.5 rounded hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={onExport}
          aria-label="Export JSON schema"
          title="Export JSON"
          className="p-1.5 rounded hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
        >
          <Upload className="w-4 h-4" />
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save status */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {saveStatus === 'saving' && <span>Saving...</span>}
        {saveStatus === 'saved' && !isDirty && <span>Saved</span>}
        {saveStatus === 'unsaved' && isDirty && <span>Unsaved changes</span>}
        {lastAutoSave && (
          <span>Auto-saved {formatTimestamp(lastAutoSave)}</span>
        )}
      </div>

      {/* Save / Publish */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onSimulate}
          disabled={!onSimulate || !canSimulate || simulationLoading || isDirty}
          aria-label="Simulate service"
          title="Run service validation and sample submissions"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded
            hover:bg-accent disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
        >
          <Play className="w-4 h-4" />
          {simulationLoading ? 'Simulating…' : 'Simulate'}
        </button>
        <button
          type="button"
          onClick={onSave}
          aria-label="Save form (Ctrl+S)"
          title="Save (Ctrl+S)"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded
            hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
        <button
          type="button"
          onClick={onPublish}
          aria-label="Publish form"
          title="Publish"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded
            hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
        >
          <PublishIcon className="w-4 h-4" />
          Publish
        </button>
      </div>
    </div>
  );
}
