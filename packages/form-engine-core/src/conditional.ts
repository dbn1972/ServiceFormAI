/**
 * Conditional Visibility Resolver for the Form Validation Engine.
 *
 * Resolves which fields are visible based on their `conditional` clauses
 * and the current form data. Supports conditional chains up to depth 5
 * using topological ordering. Circular dependencies are detected and
 * treated as visible (fail-open).
 */

import type { FormField, FormData } from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum allowed depth for conditional chains. */
const MAX_CHAIN_DEPTH = 5;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve the visibility of all fields based on their conditional clauses
 * and the current form data.
 *
 * @param fields  The array of FormField definitions from the schema.
 * @param data    The current FormData payload (field ID → value map).
 * @returns A Map of field ID → boolean indicating whether each field is visible.
 */
export function resolveVisibility(
  fields: FormField[],
  data: FormData,
): Map<string, boolean> {
  const fieldMap = new Map<string, FormField>();
  for (const field of fields) {
    fieldMap.set(field.id, field);
  }

  // Build adjacency list: field → set of fields it depends on
  const dependsOn = new Map<string, string>();
  for (const field of fields) {
    if (field.conditional) {
      dependsOn.set(field.id, field.conditional.field);
    }
  }

  // Detect cycles and compute topological order
  const { order, cycleMembers } = topologicalSort(fields, dependsOn);

  // Resolve visibility in topological order
  const visibility = new Map<string, boolean>();

  // Mark cycle members as visible (fail-open)
  for (const id of cycleMembers) {
    visibility.set(id, true);
  }

  // Resolve in topological order
  for (const id of order) {
    if (visibility.has(id)) {
      continue; // Already resolved (e.g., cycle member)
    }

    const field = fieldMap.get(id);
    if (!field) {
      continue;
    }

    if (!field.conditional) {
      // No conditional clause → always visible
      visibility.set(id, true);
      continue;
    }

    // Check chain depth
    const depth = getChainDepth(id, dependsOn);
    if (depth > MAX_CHAIN_DEPTH) {
      // Chain exceeds max depth → treat as visible
      visibility.set(id, true);
      continue;
    }

    // Check if the dependency field is visible
    const depFieldId = field.conditional.field;
    const depVisible = visibility.get(depFieldId);

    // If the dependency field is not visible, this field is not visible
    if (depVisible === false) {
      visibility.set(id, false);
      continue;
    }

    // Evaluate the conditional clause
    visibility.set(id, evaluateCondition(field.conditional, data));
  }

  return visibility;
}

// ---------------------------------------------------------------------------
// Condition evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate a single conditional clause against the form data.
 */
function evaluateCondition(
  conditional: NonNullable<FormField['conditional']>,
  data: FormData,
): boolean {
  const actualValue = data[conditional.field];
  const expectedValue = conditional.value;

  switch (conditional.operator) {
    case 'equals':
      return String(actualValue) === String(expectedValue);

    case 'not_equals':
      return String(actualValue) !== String(expectedValue);

    case 'greater_than':
      return Number(actualValue) > Number(expectedValue);

    case 'less_than':
      return Number(actualValue) < Number(expectedValue);

    case 'contains':
      return String(actualValue).includes(String(expectedValue));

    default:
      // Unknown operator → treat as visible (fail-open)
      return true;
  }
}

// ---------------------------------------------------------------------------
// Topological sort with cycle detection
// ---------------------------------------------------------------------------

interface TopoResult {
  /** Fields in dependency-first order (no cycle members). */
  order: string[];
  /** Fields that are part of a cycle. */
  cycleMembers: Set<string>;
}

/**
 * Perform a topological sort of fields based on their conditional dependencies.
 * Detects cycles and separates cycle members from the sorted order.
 */
function topologicalSort(
  fields: FormField[],
  dependsOn: Map<string, string>,
): TopoResult {
  const allIds = new Set(fields.map((f) => f.id));
  const cycleMembers = new Set<string>();

  // Detect all cycles using the tortoise-and-hare approach per connected component
  for (const id of allIds) {
    if (cycleMembers.has(id)) continue;
    if (!dependsOn.has(id)) continue;

    // Follow the chain from this node; if we find a cycle, mark all members
    const visited = new Set<string>();
    let current: string | undefined = id;
    while (current !== undefined && allIds.has(current) && !visited.has(current) && !cycleMembers.has(current)) {
      visited.add(current);
      current = dependsOn.get(current);
    }

    // If current is in visited, we found a cycle
    if (current !== undefined && visited.has(current)) {
      // Mark all nodes in the cycle starting from `current`
      const cycleStart = current;
      cycleMembers.add(cycleStart);
      let node = dependsOn.get(cycleStart);
      while (node !== undefined && node !== cycleStart) {
        cycleMembers.add(node);
        node = dependsOn.get(node);
      }
    }
  }

  // Build topological order using Kahn's algorithm (ignoring cycle members)
  // Compute in-degree for non-cycle nodes
  const nonCycleIds = [...allIds].filter((id) => !cycleMembers.has(id));
  const inDegree = new Map<string, number>();
  for (const id of nonCycleIds) {
    inDegree.set(id, 0);
  }

  for (const id of nonCycleIds) {
    const dep = dependsOn.get(id);
    if (dep !== undefined && allIds.has(dep) && !cycleMembers.has(dep)) {
      // dep has an incoming edge from id (id depends on dep, so dep must come first)
      // Actually: id depends on dep, so id has in-degree from dep
      // We need: dep before id. So id's in-degree increases.
      inDegree.set(id, (inDegree.get(id) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);

    // Find nodes that depend on this node
    for (const id of nonCycleIds) {
      const dep = dependsOn.get(id);
      if (dep === node) {
        const newDeg = (inDegree.get(id) ?? 1) - 1;
        inDegree.set(id, newDeg);
        if (newDeg === 0) {
          queue.push(id);
        }
      }
    }
  }

  return { order, cycleMembers };
}

// ---------------------------------------------------------------------------
// Chain depth calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the depth of a conditional chain for a given field.
 * Depth 1 means the field depends directly on a non-conditional field.
 */
function getChainDepth(
  fieldId: string,
  dependsOn: Map<string, string>,
): number {
  let depth = 0;
  let current: string | undefined = fieldId;
  const visited = new Set<string>();

  while (current !== undefined && dependsOn.has(current)) {
    if (visited.has(current)) {
      // Cycle — return current depth (cycle detection handles this separately)
      return depth;
    }
    visited.add(current);
    depth++;
    current = dependsOn.get(current);
  }

  return depth;
}
