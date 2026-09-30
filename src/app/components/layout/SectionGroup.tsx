/**
 * SectionGroup
 *
 * Renders a group of fields with a header, optional description,
 * and optional collapsible behaviour using Radix UI Collapsible.
 * Each section has its own independent CSS Grid layout.
 */

import { useState, type ReactNode } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import type { FormSection } from '../../types/layoutTypes';
import { SPACING_SCALE_DEFAULTS, type SpacingToken } from '../../types/layoutTypes';
import { ChevronDown } from 'lucide-react';

interface SectionGroupProps {
  section: FormSection;
  children: ReactNode;
  defaultCollapsed?: boolean;
  /** Number of grid columns for this section. */
  columns: number;
  /** Gap value (spacing token or CSS length). */
  gap: string;
}

/**
 * Resolves a gap value — either a spacing token or a raw CSS length.
 */
function resolveGap(gap: string): string {
  if (gap in SPACING_SCALE_DEFAULTS) {
    return SPACING_SCALE_DEFAULTS[gap as SpacingToken];
  }
  return gap;
}

export default function SectionGroup({
  section,
  children,
  defaultCollapsed,
  columns,
  gap,
}: SectionGroupProps) {
  const sectionId = `section-${section.id}`;
  const contentId = `section-content-${section.id}`;
  const resolvedGap = resolveGap(gap);

  const isCollapsible = section.collapsible === true;
  const [open, setOpen] = useState(
    isCollapsible ? !(defaultCollapsed ?? section.defaultCollapsed ?? false) : true,
  );

  const gridStyle = {
    display: 'grid' as const,
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: resolvedGap,
  };

  const header = (
    <>
      <h3
        id={sectionId}
        className="text-lg font-semibold"
        style={{ marginBlockEnd: section.description ? '0.25rem' : '0.75rem' }}
      >
        {isCollapsible ? (
          <Collapsible.Trigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between text-left cursor-pointer bg-transparent border-0 p-0 font-semibold text-lg"
              aria-expanded={open}
              aria-controls={contentId}
            >
              <span>{section.title}</span>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          </Collapsible.Trigger>
        ) : (
          section.title
        )}
      </h3>
      {section.description && (
        <p className="text-sm text-muted-foreground" style={{ marginBlockEnd: '0.75rem' }}>
          {section.description}
        </p>
      )}
    </>
  );

  if (isCollapsible) {
    return (
      <Collapsible.Root
        open={open}
        onOpenChange={setOpen}
        data-testid={`section-${section.id}`}
        className="section-group"
        style={{ pageBreakBefore: 'always' as const }}
      >
        {header}
        <Collapsible.Content
          id={contentId}
          forceMount
          style={{
            ...gridStyle,
            display: open ? 'grid' : 'none',
          }}
          data-state={open ? 'open' : 'closed'}
        >
          {children}
        </Collapsible.Content>
      </Collapsible.Root>
    );
  }

  return (
    <div
      data-testid={`section-${section.id}`}
      className="section-group"
      style={{ pageBreakBefore: 'always' as const }}
    >
      {header}
      <div style={gridStyle}>{children}</div>
    </div>
  );
}
