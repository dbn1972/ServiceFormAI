/**
 * ThemeProvider
 *
 * Injects tenant theme tokens as CSS custom properties on the form
 * container element. Scoped to the form container — does not leak
 * into the platform's navigation or other non-form UI.
 *
 * Falls back to platform defaults from src/styles/theme.css when
 * no tenant theme is provided.
 */

import { useRef, useEffect, useState, type ReactNode } from 'react';
import type { TenantTheme, SpacingToken } from '../../types/layoutTypes';
import {
  THEME_CSS_VARIABLE_MAP,
  SPACING_CSS_VARIABLE_MAP,
} from '../../types/layoutTypes';
import { isValidCssColor } from '../../utils/themeValidator';

interface ThemeProviderProps {
  theme?: TenantTheme;
  children: ReactNode;
}

/**
 * Converts a borderRadius value (number or string) to a CSS string.
 */
function normalizeBorderRadius(value: string | number): string {
  if (typeof value === 'number') return `${value}px`;
  return value;
}

/**
 * Validates a theme token value. Returns true if the value should be applied.
 * Invalid values are silently skipped (platform defaults are used instead).
 */
function isValidTokenValue(key: string, value: unknown): boolean {
  if (value === undefined || value === null) return false;

  const colorTokens = ['primaryColor', 'secondaryColor', 'borderColor', 'backgroundColor'];
  if (colorTokens.includes(key)) {
    return typeof value === 'string' && isValidCssColor(value);
  }

  if (key === 'fontFamily') {
    return typeof value === 'string' && value.trim().length > 0;
  }

  if (key === 'fontSize') {
    return typeof value === 'string' && value.trim().length > 0;
  }

  if (key === 'borderRadius') {
    if (typeof value === 'number') return value >= 0;
    return typeof value === 'string' && value.trim().length > 0;
  }

  return true;
}

/**
 * Builds a map of CSS custom property name → value from a TenantTheme.
 */
function buildCssVariables(theme: TenantTheme): Record<string, string> {
  const vars: Record<string, string> = {};

  // Simple token properties
  for (const [tokenKey, mapping] of Object.entries(THEME_CSS_VARIABLE_MAP)) {
    const value = (theme as Record<string, unknown>)[tokenKey];
    if (!isValidTokenValue(tokenKey, value)) continue;

    if (tokenKey === 'borderRadius') {
      vars[mapping.variable] = normalizeBorderRadius(value as string | number);
    } else {
      vars[mapping.variable] = String(value);
    }
  }

  // Spacing scale tokens
  if (theme.spacingScale) {
    for (const [scaleKey, scaleValue] of Object.entries(theme.spacingScale)) {
      const mapping = SPACING_CSS_VARIABLE_MAP[scaleKey as SpacingToken];
      if (mapping && typeof scaleValue === 'string' && scaleValue.trim().length > 0) {
        vars[mapping.variable] = scaleValue;
      }
    }
  }

  return vars;
}

export default function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontReady, setFontReady] = useState(!theme?.fontFamily);

  // Apply CSS variables via ref to avoid re-renders of children
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Clear any previously set tenant variables
    const style = el.style;
    for (const mapping of Object.values(THEME_CSS_VARIABLE_MAP)) {
      style.removeProperty(mapping.variable);
    }
    for (const mapping of Object.values(SPACING_CSS_VARIABLE_MAP)) {
      style.removeProperty(mapping.variable);
    }

    if (!theme) return;

    const vars = buildCssVariables(theme);
    for (const [prop, value] of Object.entries(vars)) {
      style.setProperty(prop, value);
    }
  }, [theme]);

  // Await font loading when fontFamily is specified
  useEffect(() => {
    if (!theme?.fontFamily) {
      setFontReady(true);
      return;
    }

    setFontReady(false);

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        setFontReady(true);
      });
    } else {
      // Fallback: render immediately if fonts API is unavailable
      setFontReady(true);
    }
  }, [theme?.fontFamily]);

  return (
    <div
      ref={containerRef}
      className="theme-provider-container"
      data-testid="theme-provider"
      style={{
        fontFamily: theme?.fontFamily
          ? `var(--tenant-fontFamily, inherit)`
          : undefined,
        opacity: fontReady ? 1 : 0,
        transition: 'opacity 0.15s ease-in',
      }}
    >
      {children}
    </div>
  );
}
