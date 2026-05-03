/**
 * Fuzzy search hook using Fuse.js
 * For intelligent search with typo tolerance and relevance ranking
 */

import { useMemo, useState } from 'react';
import Fuse, { type IFuseOptions } from 'fuse.js';

interface UseFuzzySearchOptions<T> extends Partial<IFuseOptions<T>> {
  keys: string[];
  threshold?: number;
}

export function useFuzzySearch<T>(
  items: T[],
  options: UseFuzzySearchOptions<T>
) {
  const [query, setQuery] = useState('');

  // Create Fuse instance
  const fuse = useMemo(() => {
    const { keys, threshold, ...restOptions } = options;
    const fuseOptions: IFuseOptions<T> = {
      keys,
      threshold: threshold ?? 0.4, // 0 = exact match, 1 = match anything
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
      ...restOptions,
    };

    return new Fuse(items, fuseOptions);
  }, [items, options]);

  // Perform search
  const results = useMemo(() => {
    if (!query.trim()) {
      return items;
    }

    const fuseResults = fuse.search(query);
    return fuseResults.map(result => result.item);
  }, [query, fuse, items]);

  return {
    query,
    setQuery,
    results,
    resultCount: results.length,
  };
}

/**
 * Example usage:
 *
 * const { query, setQuery, results } = useFuzzySearch(templates, {
 *   keys: ['name', 'description', 'category'],
 *   threshold: 0.3,
 * });
 *
 * // In render:
 * <input value={query} onChange={e => setQuery(e.target.value)} />
 * {results.map(template => <TemplateCard key={template.id} {...template} />)}
 */
