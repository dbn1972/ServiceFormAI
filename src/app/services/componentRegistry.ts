/**
 * ComponentRegistry — Tenant-scoped in-memory registry that maps custom
 * field type names to React component implementations and their metadata.
 *
 * The registry is keyed by `${tenantId}:${fieldType}`. Premium (platform-level)
 * components are registered under the special `__platform__` tenant scope and
 * are visible to all tenants as a fallback.
 */

import type {
  ComponentManifest,
  ComponentRegistration,
  CustomFieldProps,
} from '../types/customComponent';

// ---------------------------------------------------------------------------
// Reserved built-in field types that cannot be overridden
// ---------------------------------------------------------------------------

export const RESERVED_TYPES: ReadonlySet<string> = new Set([
  'text',
  'number',
  'email',
  'phone',
  'date',
  'dropdown',
  'radio',
  'checkbox',
  'file',
  'textarea',
]);

// ---------------------------------------------------------------------------
// Platform tenant scope constant
// ---------------------------------------------------------------------------

export const PLATFORM_TENANT = '__platform__';

// ---------------------------------------------------------------------------
// ComponentRegistry class
// ---------------------------------------------------------------------------

export class ComponentRegistry {
  /** Internal storage keyed by `${tenantId}:${fieldType}`. */
  private registry = new Map<string, ComponentRegistration>();

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private key(tenantId: string, fieldType: string): string {
    return `${tenantId}:${fieldType}`;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Register a custom component for a field type, scoped to a tenant.
   *
   * Returns an error string if the fieldType is reserved (built-in).
   * Returns `null` on success.
   */
  register(
    tenantId: string,
    manifest: ComponentManifest,
    component: React.ComponentType<CustomFieldProps>,
  ): string | null {
    const { fieldType } = manifest;

    // Reject built-in types
    if (RESERVED_TYPES.has(fieldType)) {
      return `Cannot register component: fieldType "${fieldType}" is a reserved built-in type`;
    }

    // Validate that the component is a renderable function/class (basic check)
    if (typeof component !== 'function') {
      return `Cannot register component: provided component for "${fieldType}" is not a valid React component`;
    }

    const mapKey = this.key(tenantId, fieldType);

    // Warn on replacement
    if (this.registry.has(mapKey)) {
      console.warn(
        `ComponentRegistry: replacing existing registration for "${fieldType}" (tenant: ${tenantId})`,
      );
    }

    this.registry.set(mapKey, { component, manifest });
    return null;
  }

  /**
   * Look up a registered component by field type and tenant.
   *
   * Falls back to platform-level premium components if not found for the
   * specific tenant.
   */
  getComponent(
    fieldType: string,
    tenantId: string,
  ): ComponentRegistration | undefined {
    // Tenant-scoped lookup first
    const tenantKey = this.key(tenantId, fieldType);
    const tenantReg = this.registry.get(tenantKey);
    if (tenantReg) {
      return tenantReg;
    }

    // Fallback to platform-level premium component
    const platformKey = this.key(PLATFORM_TENANT, fieldType);
    return this.registry.get(platformKey);
  }

  /**
   * List all registered components for a tenant.
   *
   * Includes the tenant's own registrations plus platform-level premium
   * components (excluding any whose fieldType the tenant has overridden).
   */
  listRegistered(tenantId: string): ComponentRegistration[] {
    const tenantPrefix = `${tenantId}:`;
    const platformPrefix = `${PLATFORM_TENANT}:`;

    // Collect tenant-scoped registrations and track their fieldTypes
    const tenantFieldTypes = new Set<string>();
    const results: ComponentRegistration[] = [];

    for (const [key, registration] of this.registry) {
      if (key.startsWith(tenantPrefix)) {
        tenantFieldTypes.add(registration.manifest.fieldType);
        results.push(registration);
      }
    }

    // Add platform-level premium components not overridden by the tenant
    for (const [key, registration] of this.registry) {
      if (
        key.startsWith(platformPrefix) &&
        !tenantFieldTypes.has(registration.manifest.fieldType)
      ) {
        results.push(registration);
      }
    }

    return results;
  }

  /**
   * Remove a component registration.
   *
   * Returns `true` if the registration was found and removed, `false` otherwise.
   */
  remove(fieldType: string, tenantId: string): boolean {
    const mapKey = this.key(tenantId, fieldType);
    return this.registry.delete(mapKey);
  }

  /**
   * Check whether a resolved component for a given fieldType and tenantId
   * is a platform-level (premium) component rather than a tenant-specific one.
   *
   * Returns `true` if the component comes from the `__platform__` scope
   * (i.e., the tenant does not have their own override).
   */
  isPlatformComponent(fieldType: string, tenantId: string): boolean {
    const tenantKey = this.key(tenantId, fieldType);
    if (this.registry.has(tenantKey)) {
      return false; // Tenant has their own registration
    }
    const platformKey = this.key(PLATFORM_TENANT, fieldType);
    return this.registry.has(platformKey);
  }
}

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

export const componentRegistry = new ComponentRegistry();
