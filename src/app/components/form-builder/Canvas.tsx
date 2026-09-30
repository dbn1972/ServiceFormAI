/**
 * Canvas — Central drag-and-drop area for the form builder.
 *
 * Renders fields as draggable cards in a CSS Grid. Supports drop from
 * palette, reordering within canvas, field selection, deletion, and
 * keyboard reordering (Alt+Arrow).
 */

import { useRef, useState, useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
  GripVertical,
  X,
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
  Puzzle,
} from 'lucide-react';
import type { BuilderField } from './types';
import { DND_ITEM_TYPES } from './types';
import type { DragFieldTypeItem, DragCanvasFieldItem } from './types';

// ---------------------------------------------------------------------------
// Field type icon mapping
// ---------------------------------------------------------------------------

const FIELD_ICONS: Record<string, React.ReactNode> = {
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

function getFieldIcon(type: string) {
  return FIELD_ICONS[type] || <Puzzle className="w-4 h-4" />;
}

// ---------------------------------------------------------------------------
// FieldCard — individual draggable field on the canvas
// ---------------------------------------------------------------------------

interface FieldCardProps {
  field: BuilderField;
  index: number;
  isSelected: boolean;
  onSelect: (fieldId: string) => void;
  onDelete: (fieldId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  totalFields: number;
}

function FieldCard({
  field,
  index,
  isSelected,
  onSelect,
  onDelete,
  onReorder,
  totalFields,
}: FieldCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DND_ITEM_TYPES.CANVAS_FIELD,
      item: { type: DND_ITEM_TYPES.CANVAS_FIELD, fieldId: field.id, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [field.id, index]
  );

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: [DND_ITEM_TYPES.CANVAS_FIELD, DND_ITEM_TYPES.FIELD_TYPE],
      hover: () => {},
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [index]
  );

  // Combine refs
  drag(drop(ref));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onDelete(field.id);
    }
    if (e.altKey && e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      onReorder(index, index - 1);
    }
    if (e.altKey && e.key === 'ArrowDown' && index < totalFields - 1) {
      e.preventDefault();
      onReorder(index, index + 1);
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(field.id);
    }
  };

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={`${field.label} (${field.type}). Position ${index + 1} of ${totalFields}. Press Delete to remove, Alt+Arrow to reorder.`}
      aria-selected={isSelected}
      className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all cursor-pointer
        ${isSelected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border hover:border-primary/30 hover:bg-accent/50'}
        ${isDragging ? 'opacity-40' : ''}
        ${isOver ? 'border-primary border-dashed' : ''}
        focus:outline-none focus:ring-2 focus:ring-primary/50`}
      style={{ gridColumn: field.colSpan ? `span ${field.colSpan}` : undefined }}
      onClick={() => onSelect(field.id)}
      onKeyDown={handleKeyDown}
    >
      <div className="flex-shrink-0 cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-shrink-0 text-muted-foreground">
        {getFieldIcon(field.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{field.label}</div>
        <div className="text-xs text-muted-foreground truncate">
          {field.type}
          {field.required && ' • Required'}
          {field.conditional && ' • Conditional'}
        </div>
      </div>
      <button
        type="button"
        aria-label={`Remove ${field.label}`}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100
          p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive
          transition-opacity focus:outline-none focus:ring-2 focus:ring-destructive/50"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(field.id);
        }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Canvas component
// ---------------------------------------------------------------------------

interface CanvasProps {
  fields: BuilderField[];
  selectedFieldId: string | null;
  columns: number;
  onSelectField: (fieldId: string | null) => void;
  onReorderField: (fromIndex: number, toIndex: number) => void;
  onDropNewField: (fieldType: string, index: number) => void;
  onDeleteField: (fieldId: string) => void;
}

export default function Canvas({
  fields,
  selectedFieldId,
  columns,
  onSelectField,
  onReorderField,
  onDropNewField,
  onDeleteField,
}: CanvasProps) {
  const [announcement, setAnnouncement] = useState('');

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: [DND_ITEM_TYPES.FIELD_TYPE, DND_ITEM_TYPES.CANVAS_FIELD],
      drop: (item: DragFieldTypeItem | DragCanvasFieldItem, monitor) => {
        if (monitor.didDrop()) return; // Already handled by a child
        if ('fieldType' in item && item.type === DND_ITEM_TYPES.FIELD_TYPE) {
          onDropNewField(item.fieldType, fields.length);
          setAnnouncement(`Added ${item.fieldType} field at position ${fields.length + 1}`);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [fields.length, onDropNewField]
  );

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      onReorderField(fromIndex, toIndex);
      setAnnouncement(
        `Moved field from position ${fromIndex + 1} to position ${toIndex + 1}`
      );
    },
    [onReorderField]
  );

  const handleDelete = useCallback(
    (fieldId: string) => {
      const field = fields.find((f) => f.id === fieldId);
      onDeleteField(fieldId);
      if (field) {
        setAnnouncement(`Removed ${field.label} field`);
      }
      if (selectedFieldId === fieldId) {
        onSelectField(null);
      }
    },
    [fields, onDeleteField, selectedFieldId, onSelectField]
  );

  return (
    <div
      className="flex flex-col h-full"
      role="region"
      aria-label="Form Canvas"
    >
      {/* ARIA live region for announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <div
        ref={drop}
        className={`flex-1 p-4 overflow-y-auto min-h-[200px] rounded-lg border-2 border-dashed transition-colors
          ${isOver && canDrop ? 'border-primary bg-primary/5' : 'border-transparent'}
          ${fields.length === 0 ? 'flex items-center justify-center' : ''}`}
      >
        {fields.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <div className="text-lg font-medium mb-2">No fields yet</div>
            <p className="text-sm">
              Drag field types from the palette on the left, or press Enter on a
              field type to add it here.
            </p>
          </div>
        ) : (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
            }}
          >
            {fields.map((field, index) => (
              <FieldCard
                key={field.id}
                field={field}
                index={index}
                isSelected={selectedFieldId === field.id}
                onSelect={onSelectField}
                onDelete={handleDelete}
                onReorder={handleReorder}
                totalFields={fields.length}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
