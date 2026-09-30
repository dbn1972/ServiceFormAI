/**
 * SectionManager — Create/edit/delete sections, assign fields, collapsible toggle.
 *
 * Displays below the Canvas. Allows admins to organize fields into
 * named sections with titles, descriptions, and collapsible behaviour.
 */

import { useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  Layers,
} from 'lucide-react';
import type { BuilderField, BuilderSection } from './types';

interface SectionManagerProps {
  sections: BuilderSection[];
  fields: BuilderField[];
  onAddSection: (section: BuilderSection) => void;
  onUpdateSection: (sectionId: string, updates: Partial<BuilderSection>) => void;
  onRemoveSection: (sectionId: string) => void;
}

function generateSectionId(): string {
  return `section_${Math.random().toString(36).substring(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Section Editor
// ---------------------------------------------------------------------------

function SectionEditor({
  section,
  fields,
  onSave,
  onCancel,
}: {
  section: BuilderSection;
  fields: BuilderField[];
  onSave: (section: BuilderSection) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<BuilderSection>({ ...section });

  const toggleField = (fieldId: string) => {
    setDraft((prev) => ({
      ...prev,
      fieldIds: prev.fieldIds.includes(fieldId)
        ? prev.fieldIds.filter((id) => id !== fieldId)
        : [...prev.fieldIds, fieldId],
    }));
  };

  return (
    <div className="p-3 border border-border rounded-lg space-y-3 bg-accent/30">
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Section Title</label>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
          className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Section title"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">Description (optional)</label>
        <input
          type="text"
          value={draft.description || ''}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, description: e.target.value || undefined }))
          }
          className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Section description"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`collapsible-${draft.id}`}
          checked={draft.collapsible || false}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, collapsible: e.target.checked }))
          }
          className="w-4 h-4"
        />
        <label htmlFor={`collapsible-${draft.id}`} className="text-sm">
          Collapsible
        </label>
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">Assign Fields</label>
        <div className="max-h-32 overflow-y-auto border border-border rounded p-2 space-y-1">
          {fields.map((f) => (
            <label key={f.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={draft.fieldIds.includes(f.id)}
                onChange={() => toggleField(f.id)}
                className="w-3.5 h-3.5"
              />
              <span className="truncate">{f.label}</span>
            </label>
          ))}
          {fields.length === 0 && (
            <span className="text-xs text-muted-foreground">No fields available</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90
            focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-sm border border-border rounded hover:bg-accent
            focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionManager
// ---------------------------------------------------------------------------

export default function SectionManager({
  sections,
  fields,
  onAddSection,
  onUpdateSection,
  onRemoveSection,
}: SectionManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleAdd = useCallback(
    (section: BuilderSection) => {
      onAddSection(section);
      setIsAdding(false);
    },
    [onAddSection]
  );

  const handleUpdate = useCallback(
    (section: BuilderSection) => {
      onUpdateSection(section.id, section);
      setEditingId(null);
    },
    [onUpdateSection]
  );

  return (
    <div className="border-t border-border" role="region" aria-label="Section Manager">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium hover:bg-accent
          focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
        aria-expanded={!isCollapsed}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        <Layers className="w-4 h-4 text-muted-foreground" />
        <span>Sections ({sections.length})</span>
      </button>

      {!isCollapsed && (
        <div className="px-4 pb-3 space-y-2">
          {/* Existing sections */}
          {sections.map((section) => {
            if (editingId === section.id) {
              return (
                <SectionEditor
                  key={section.id}
                  section={section}
                  fields={fields}
                  onSave={handleUpdate}
                  onCancel={() => setEditingId(null)}
                />
              );
            }

            return (
              <div
                key={section.id}
                className="flex items-center gap-2 p-2 border border-border rounded"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{section.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {section.fieldIds.length} field{section.fieldIds.length !== 1 ? 's' : ''}
                    {section.collapsible && ' • Collapsible'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingId(section.id)}
                  className="p-1 rounded hover:bg-accent text-muted-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label={`Edit section "${section.title}"`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveSection(section.id)}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive
                    focus:outline-none focus:ring-2 focus:ring-destructive/50"
                  aria-label={`Delete section "${section.title}"`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {/* Add new section */}
          {isAdding ? (
            <SectionEditor
              section={{
                id: generateSectionId(),
                title: '',
                fieldIds: [],
              }}
              fields={fields}
              onSave={handleAdd}
              onCancel={() => setIsAdding(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1 text-sm text-primary hover:underline
                focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          )}
        </div>
      )}
    </div>
  );
}
