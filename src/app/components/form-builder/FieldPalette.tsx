/**
 * FieldPalette — Sidebar listing available field types for drag-and-drop.
 *
 * Displays built-in field types with icons and descriptions, queries
 * ComponentRegistry for custom field types, supports text search filtering,
 * and makes each field type a drag source via useDrag.
 */

import { useState, useMemo } from 'react';
import { useDrag } from 'react-dnd';
import {
  Type,
  Hash,
  Mail,
  Phone,
  Calendar,
  ChevronDown,
  CircleDot,
  CheckSquare,
  Upload,
  AlignLeft,
  Search,
  Puzzle,
} from 'lucide-react';
import { DND_ITEM_TYPES, BUILT_IN_FIELD_TYPES } from './types';
import type { BuiltInFieldType } from './types';
import { componentRegistry } from '../../services/componentRegistry';

// ---------------------------------------------------------------------------
// Field type metadata
// ---------------------------------------------------------------------------

export interface FieldTypeEntry {
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isCustom?: boolean;
}

const FIELD_TYPE_ICONS: Record<BuiltInFieldType, React.ReactNode> = {
  text: <Type className="w-4 h-4" />,
  number: <Hash className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  date: <Calendar className="w-4 h-4" />,
  dropdown: <ChevronDown className="w-4 h-4" />,
  radio: <CircleDot className="w-4 h-4" />,
  checkbox: <CheckSquare className="w-4 h-4" />,
  file: <Upload className="w-4 h-4" />,
  textarea: <AlignLeft className="w-4 h-4" />,
};

const FIELD_TYPE_DESCRIPTIONS: Record<BuiltInFieldType, string> = {
  text: 'Single-line text input',
  number: 'Numeric input with min/max',
  email: 'Email address input',
  phone: 'Phone number input',
  date: 'Date picker input',
  dropdown: 'Dropdown select menu',
  radio: 'Radio button group',
  checkbox: 'Checkbox toggle',
  file: 'File upload input',
  textarea: 'Multi-line text area',
};

export const BUILT_IN_ENTRIES: FieldTypeEntry[] = BUILT_IN_FIELD_TYPES.map((t) => ({
  type: t,
  name: t.charAt(0).toUpperCase() + t.slice(1),
  description: FIELD_TYPE_DESCRIPTIONS[t],
  icon: FIELD_TYPE_ICONS[t],
}));

/**
 * Filter field type entries by search query (case-insensitive substring match).
 */
export function filterFieldTypes(
  entries: FieldTypeEntry[],
  query: string
): FieldTypeEntry[] {
  if (!query.trim()) return entries;
  const q = query.toLowerCase().trim();
  return entries.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
  );
}

// ---------------------------------------------------------------------------
// DraggableFieldType component
// ---------------------------------------------------------------------------

function DraggableFieldType({
  entry,
  onAddField,
}: {
  entry: FieldTypeEntry;
  onAddField: (fieldType: string) => void;
}) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DND_ITEM_TYPES.FIELD_TYPE,
      item: { type: DND_ITEM_TYPES.FIELD_TYPE, fieldType: entry.type },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [entry.type]
  );

  return (
    <div
      ref={drag}
      role="button"
      tabIndex={0}
      aria-label={`Add ${entry.name} field`}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border border-border cursor-grab
        hover:bg-accent hover:border-primary/30 transition-colors select-none
        focus:outline-none focus:ring-2 focus:ring-primary/50
        ${isDragging ? 'opacity-50' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAddField(entry.type);
        }
      }}
    >
      <div className="flex-shrink-0 text-muted-foreground">{entry.icon}</div>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{entry.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {entry.description}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldPalette component
// ---------------------------------------------------------------------------

interface FieldPaletteProps {
  tenantId: string;
  onAddField: (fieldType: string) => void;
}

export default function FieldPalette({ tenantId, onAddField }: FieldPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Get custom field types from ComponentRegistry
  const customEntries = useMemo<FieldTypeEntry[]>(() => {
    try {
      const registered = componentRegistry.listRegistered(tenantId);
      return registered.map((reg) => ({
        type: reg.manifest.fieldType,
        name: reg.manifest.displayName || reg.manifest.fieldType,
        description: reg.manifest.description || 'Custom field type',
        icon: <Puzzle className="w-4 h-4" />,
        isCustom: true,
      }));
    } catch {
      return [];
    }
  }, [tenantId]);

  // Filter entries
  const filteredBuiltIn = useMemo(
    () => filterFieldTypes(BUILT_IN_ENTRIES, searchQuery),
    [searchQuery]
  );
  const filteredCustom = useMemo(
    () => filterFieldTypes(customEntries, searchQuery),
    [customEntries, searchQuery]
  );

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      role="region"
      aria-label="Field Palette"
    >
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold mb-2">Field Types</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-md
              focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            aria-label="Search field types"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Built-in field types */}
        {filteredBuiltIn.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Built-in Fields
            </h4>
            <div className="space-y-1.5">
              {filteredBuiltIn.map((entry) => (
                <DraggableFieldType
                  key={entry.type}
                  entry={entry}
                  onAddField={onAddField}
                />
              ))}
            </div>
          </div>
        )}

        {/* Custom field types */}
        {filteredCustom.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Custom Fields
            </h4>
            <div className="space-y-1.5">
              {filteredCustom.map((entry) => (
                <DraggableFieldType
                  key={entry.type}
                  entry={entry}
                  onAddField={onAddField}
                />
              ))}
            </div>
          </div>
        )}

        {filteredBuiltIn.length === 0 && filteredCustom.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No field types match your search.
          </div>
        )}
      </div>
    </div>
  );
}
