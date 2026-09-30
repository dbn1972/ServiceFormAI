/**
 * ComponentSandbox — iframe-based isolation boundary for third-party
 * custom components. Communicates with the sandboxed component via
 * a structured postMessage protocol.
 *
 * Premium (platform) components do NOT use this sandbox — they render
 * directly in the host page since they are trusted platform code.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ComponentManifest, CustomFieldProps } from '../types/customComponent';
import type {
  HostToSandboxMessage,
  SandboxToHostMessage,
  SandboxedFieldProps,
  SerializableFormField,
} from '../types/sandboxProtocol';
import { AlertCircle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ComponentSandboxProps {
  /** The component manifest with bundle URL. */
  manifest: ComponentManifest;
  /** Tenant ID for origin isolation. */
  tenantId: string;
  /** Props to pass to the sandboxed component. */
  fieldProps: CustomFieldProps;
  /** Callback when the sandboxed component changes its value. */
  onChange: (value: unknown) => void;
  /** Callback when the sandboxed component triggers blur. */
  onBlur: () => void;
  /** Callback when the sandbox encounters an error. */
  onError: (error: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INIT_TIMEOUT_MS = 5000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSerializableField(field: CustomFieldProps['field']): SerializableFormField {
  return {
    id: field.id,
    type: field.type,
    label: field.label,
    required: field.required,
    placeholder: field.placeholder,
    helpText: field.helpText,
    validation: field.validation as Record<string, unknown> | undefined,
    options: field.options as Array<{ value: string; label: string }> | undefined,
    customConfig: (field as any).customConfig,
  };
}

function buildSandboxedProps(props: CustomFieldProps): SandboxedFieldProps {
  return {
    fieldId: props.fieldId,
    field: toSerializableField(props.field),
    value: props.value,
    error: props.error,
    disabled: props.disabled,
    config: props.config,
  };
}

function isValidSandboxMessage(data: unknown): data is SandboxToHostMessage {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Record<string, unknown>;
  const validTypes = ['ready', 'value-change', 'blur', 'error', 'resize'];
  return typeof msg.type === 'string' && validTypes.includes(msg.type);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ComponentSandbox({
  manifest,
  tenantId,
  fieldProps,
  onChange,
  onBlur,
  onError,
}: ComponentSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [height, setHeight] = useState(200);
  const readyRef = useRef(false);
  const destroyedRef = useRef(false);

  // Send a message to the sandbox iframe
  const postToSandbox = useCallback((message: HostToSandboxMessage) => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow && !destroyedRef.current) {
      try {
        iframe.contentWindow.postMessage(message, '*');
      } catch {
        // Silently ignore if iframe is not accessible
      }
    }
  }, []);

  // Handle incoming messages from the sandbox
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Validate message structure
      if (!isValidSandboxMessage(event.data)) return;

      const msg = event.data;

      switch (msg.type) {
        case 'ready':
          readyRef.current = true;
          setReady(true);
          // Send initial config
          postToSandbox({
            type: 'config-update',
            props: buildSandboxedProps(fieldProps),
          });
          break;

        case 'value-change':
          onChange(msg.value);
          break;

        case 'blur':
          onBlur();
          break;

        case 'error':
          setError(msg.message);
          onError(msg.message);
          console.error(
            `[ComponentSandbox] Error in sandboxed component "${manifest.fieldType}" (tenant: ${tenantId}):`,
            msg.message,
          );
          break;

        case 'resize':
          if (typeof msg.height === 'number' && msg.height > 0) {
            setHeight(msg.height);
          }
          break;
      }
    },
    [fieldProps, manifest.fieldType, tenantId, onChange, onBlur, onError, postToSandbox],
  );

  // Listen for postMessage events
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Enforce 5-second initialization timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!readyRef.current && !destroyedRef.current) {
        const timeoutMsg = `Component "${manifest.fieldType}" failed to initialize within ${INIT_TIMEOUT_MS / 1000} seconds`;
        setError(timeoutMsg);
        onError(timeoutMsg);
        console.error(
          `[ComponentSandbox] Initialization timeout for "${manifest.fieldType}" (tenant: ${tenantId})`,
        );
      }
    }, INIT_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [manifest.fieldType, tenantId, onError]);

  // Send updated props when they change (after ready)
  useEffect(() => {
    if (ready && !destroyedRef.current) {
      postToSandbox({
        type: 'config-update',
        props: buildSandboxedProps(fieldProps),
      });
    }
  }, [ready, fieldProps, postToSandbox]);

  // Cleanup on unmount: send destroy message and remove iframe
  useEffect(() => {
    return () => {
      destroyedRef.current = true;
      postToSandbox({ type: 'destroy' });
      // Release iframe reference
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank';
        iframeRef.current = null;
      }
    };
  }, [postToSandbox]);

  // Build the sandbox URL
  const sandboxUrl =
    manifest.bundleUrl ??
    `https://${tenantId}.sandbox.serviceformai.in/component/${manifest.fieldType}`;

  // Build CSP for the iframe
  const cspContent = [
    `script-src ${manifest.bundleUrl ?? "'self'"}`,
    `connect-src ${manifest.allowedDomains?.join(' ') ?? "'none'"}`,
    "default-src 'none'",
    "style-src 'unsafe-inline'",
  ].join('; ');

  // Error fallback
  if (error) {
    return (
      <div
        className="border border-destructive/50 rounded-lg p-4 bg-destructive/5"
        role="alert"
        aria-label={`Error loading custom component: ${manifest.fieldType}`}
      >
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-medium">
            Failed to load component: {manifest.fieldType}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={sandboxUrl}
      sandbox="allow-scripts"
      title={`Custom component: ${manifest.displayName}`}
      aria-label={manifest.displayName}
      style={{
        width: '100%',
        height: `${height}px`,
        border: 'none',
        overflow: 'hidden',
      }}
      data-csp={cspContent}
      data-tenant-id={tenantId}
      data-field-type={manifest.fieldType}
    />
  );
}
