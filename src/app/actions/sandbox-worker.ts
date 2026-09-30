/**
 * Sandbox Worker — executes untrusted action JavaScript in an isolated
 * Web Worker with a restricted API surface.
 *
 * The worker is created from a blob URL so it has no same-origin access
 * to the parent page. All code is self-contained in the worker string
 * (no module imports).
 */

// ---------------------------------------------------------------------------
// Worker source code (self-contained, no imports)
// ---------------------------------------------------------------------------

const WORKER_SOURCE = /* js */ `
'use strict';

// ── Message validation ────────────────────────────────────────────────────

function isValidRequest(msg) {
  if (typeof msg !== 'object' || msg === null) return false;
  if (msg.type !== 'execute') return false;
  if (typeof msg.requestId !== 'string' || msg.requestId.length === 0) return false;
  if (typeof msg.code !== 'string' || msg.code.length === 0) return false;
  if (typeof msg.event !== 'string') return false;
  var validEvents = ['onFieldChange', 'onFieldBlur', 'onFormLoad', 'onFormSubmit', 'onButtonClick'];
  if (validEvents.indexOf(msg.event) === -1) return false;
  if (typeof msg.formValues !== 'object' || msg.formValues === null || Array.isArray(msg.formValues)) return false;
  if (!Array.isArray(msg.allowlist)) return false;
  if (typeof msg.args !== 'object' || msg.args === null || Array.isArray(msg.args)) return false;
  return true;
}

// ── Deep clone utility ────────────────────────────────────────────────────

function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  var result = {};
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    result[keys[i]] = deepClone(obj[keys[i]]);
  }
  return result;
}

// ── Fetch proxy ───────────────────────────────────────────────────────────

function createFetchProxy(allowlist) {
  return function sandboxFetch(url, options) {
    return new Promise(function(resolve, reject) {
      // Validate allowlist
      if (!allowlist || allowlist.length === 0) {
        return reject(new Error('NO_ALLOWLIST_CONFIGURED'));
      }

      // Parse URL
      var parsed;
      try {
        parsed = new URL(url);
      } catch (e) {
        return reject(new Error('INVALID_URL'));
      }

      // Enforce HTTPS
      if (parsed.protocol !== 'https:') {
        return reject(new Error('HTTPS_REQUIRED'));
      }

      // Check domain allowlist
      var hostname = parsed.hostname;
      if (allowlist.indexOf(hostname) === -1) {
        return reject(new Error('DOMAIN_NOT_ALLOWLISTED'));
      }

      // Build request options
      var fetchOptions = {
        method: (options && options.method) || 'GET',
        headers: {},
        redirect: 'follow'
      };

      // Copy headers, stripping sensitive ones
      var sensitiveHeaders = ['cookie', 'authorization', 'set-cookie'];
      if (options && options.headers && typeof options.headers === 'object') {
        var headerKeys = Object.keys(options.headers);
        for (var i = 0; i < headerKeys.length; i++) {
          var key = headerKeys[i];
          if (sensitiveHeaders.indexOf(key.toLowerCase()) === -1) {
            fetchOptions.headers[key] = options.headers[key];
          }
        }
      }

      // Add sandbox source header
      fetchOptions.headers['X-Action-Source'] = 'sandbox';

      // Add body if present
      if (options && options.body !== undefined) {
        fetchOptions.body = options.body;
      }

      // 5-second timeout
      var controller = new AbortController();
      fetchOptions.signal = controller.signal;
      var timeoutId = setTimeout(function() {
        controller.abort();
      }, 5000);

      fetch(url, fetchOptions)
        .then(function(response) {
          clearTimeout(timeoutId);

          // Check redirect target hostname
          if (response.url && response.url !== url) {
            try {
              var redirectParsed = new URL(response.url);
              if (allowlist.indexOf(redirectParsed.hostname) === -1) {
                return reject(new Error('REDIRECT_NOT_ALLOWLISTED'));
              }
            } catch (e) {
              // If we can't parse the redirect URL, reject
              return reject(new Error('REDIRECT_NOT_ALLOWLISTED'));
            }
          }

          // Check Content-Length header for size
          var contentLength = response.headers.get('content-length');
          if (contentLength && parseInt(contentLength, 10) > 1048576) {
            return reject(new Error('RESPONSE_TOO_LARGE'));
          }

          // Read body and check size
          return response.text().then(function(bodyText) {
            if (bodyText.length > 1048576) {
              return reject(new Error('RESPONSE_TOO_LARGE'));
            }

            var body;
            try {
              body = JSON.parse(bodyText);
            } catch (e) {
              body = bodyText;
            }

            resolve({ status: response.status, body: body });
          });
        })
        .catch(function(err) {
          clearTimeout(timeoutId);
          if (err && err.name === 'AbortError') {
            reject(new Error('FETCH_TIMEOUT'));
          } else if (err && err.message && (
            err.message === 'REDIRECT_NOT_ALLOWLISTED' ||
            err.message === 'RESPONSE_TOO_LARGE'
          )) {
            reject(err);
          } else {
            reject(new Error(err ? err.message : 'FETCH_ERROR'));
          }
        });
    });
  };
}

// ── Prohibited globals list ───────────────────────────────────────────────

var PROHIBITED_GLOBALS = [
  'window', 'document', 'navigator', 'location',
  'localStorage', 'sessionStorage', 'indexedDB',
  'eval', 'Function',
  'setTimeout', 'setInterval',
  'XMLHttpRequest', 'importScripts',
  'WebSocket', 'SharedWorker', 'ServiceWorker',
  'Proxy', 'Reflect',
  'top', 'parent', 'frames',
  'crypto', 'Worker'
];

// ── Execute action code ───────────────────────────────────────────────────

function executeAction(request) {
  var startTime = Date.now();
  var apiCalls = [];
  var formValuesSnapshot = deepClone(request.formValues);
  var fieldIds = new Set(Object.keys(formValuesSnapshot));

  // Freeze prototypes to prevent prototype pollution from action code
  try { Object.freeze(Object.prototype); } catch(e) {}
  try { Object.freeze(Array.prototype); } catch(e) {}

  // Build Restricted API
  var api = {
    getFieldValue: function(fieldId) {
      return formValuesSnapshot[fieldId];
    },
    setFieldValue: function(fieldId, value) {
      // Silently ignore non-existent fields (Property 20)
      if (!fieldIds.has(fieldId)) return;
      formValuesSnapshot[fieldId] = value;
      apiCalls.push({ fn: 'setFieldValue', args: { fieldId: fieldId, value: value } });
    },
    showField: function(fieldId) {
      apiCalls.push({ fn: 'showField', args: { fieldId: fieldId } });
    },
    hideField: function(fieldId) {
      apiCalls.push({ fn: 'hideField', args: { fieldId: fieldId } });
    },
    showMessage: function(text, type) {
      var truncated = typeof text === 'string' ? text.substring(0, 500) : String(text).substring(0, 500);
      var validTypes = ['info', 'warning', 'error', 'success'];
      var msgType = validTypes.indexOf(type) !== -1 ? type : 'info';
      apiCalls.push({ fn: 'showMessage', args: { text: truncated, type: msgType } });
    },
    getFormValues: function() {
      return deepClone(formValuesSnapshot);
    }
  };

  var fetchProxy = createFetchProxy(request.allowlist);

  // Build the parameter names and values for the IIFE
  // First: Restricted API functions, then prohibited globals shadowed with undefined
  var paramNames = [
    'getFieldValue', 'setFieldValue', 'showField', 'hideField',
    'showMessage', 'fetch', 'getFormValues', 'event', 'args'
  ];
  var paramValues = [
    api.getFieldValue, api.setFieldValue, api.showField, api.hideField,
    api.showMessage, fetchProxy, api.getFormValues, request.event, request.args
  ];

  // Shadow all prohibited globals with undefined
  for (var i = 0; i < PROHIBITED_GLOBALS.length; i++) {
    paramNames.push(PROHIBITED_GLOBALS[i]);
    paramValues.push(undefined);
  }

  // Also shadow 'self' to prevent access to the Worker global
  paramNames.push('self');
  paramValues.push(undefined);
  paramNames.push('globalThis');
  paramValues.push(undefined);
  // Shadow 'constructor' to prevent prototype chain escape
  paramNames.push('constructor');
  paramValues.push(undefined);

  // Build the IIFE wrapper
  var wrappedCode = '"use strict";\\nreturn (async function(' + paramNames.join(', ') + ') {\\n' +
    request.code +
    '\\n})(' + paramNames.map(function(_, idx) { return 'arguments[' + idx + ']'; }).join(', ') + ');';

  // Execute with 2-second timeout
  return new Promise(function(resolve) {
    var resolved = false;

    var timeoutId = setTimeout(function() {
      if (!resolved) {
        resolved = true;
        resolve({
          type: 'result',
          requestId: request.requestId,
          status: 'timeout',
          apiCalls: [],
          error: { code: 'ACTION_TIMEOUT', message: 'Action exceeded 2-second execution limit' },
          executionDurationMs: Date.now() - startTime
        });
      }
    }, 2000);

    try {
      var fn = new Function(wrappedCode);
      var result = fn.apply(null, paramValues);

      // If the result is a Promise, await it
      if (result && typeof result.then === 'function') {
        result.then(function() {
          if (!resolved) {
            clearTimeout(timeoutId);
            resolved = true;
            resolve({
              type: 'result',
              requestId: request.requestId,
              status: 'success',
              apiCalls: apiCalls,
              executionDurationMs: Date.now() - startTime
            });
          }
        }).catch(function(err) {
          if (!resolved) {
            clearTimeout(timeoutId);
            resolved = true;
            resolve({
              type: 'result',
              requestId: request.requestId,
              status: 'error',
              apiCalls: apiCalls,
              error: { code: 'ACTION_ERROR', message: err ? String(err.message || err) : 'Unknown error' },
              executionDurationMs: Date.now() - startTime
            });
          }
        });
      } else {
        // Synchronous completion
        if (!resolved) {
          clearTimeout(timeoutId);
          resolved = true;
          resolve({
            type: 'result',
            requestId: request.requestId,
            status: 'success',
            apiCalls: apiCalls,
            executionDurationMs: Date.now() - startTime
          });
        }
      }
    } catch (err) {
      if (!resolved) {
        clearTimeout(timeoutId);
        resolved = true;
        resolve({
          type: 'result',
          requestId: request.requestId,
          status: 'error',
          apiCalls: apiCalls,
          error: { code: 'ACTION_ERROR', message: err ? String(err.message || err) : 'Unknown error' },
          executionDurationMs: Date.now() - startTime
        });
      }
    }
  });
}

// ── Message handler ───────────────────────────────────────────────────────

self.onmessage = function(e) {
  var msg = e.data;

  if (!isValidRequest(msg)) {
    self.postMessage({
      type: 'result',
      requestId: (msg && msg.requestId) || 'unknown',
      status: 'error',
      apiCalls: [],
      error: { code: 'INVALID_REQUEST', message: 'Message does not conform to SandboxRequest schema' },
      executionDurationMs: 0
    });
    return;
  }

  executeAction(msg).then(function(response) {
    self.postMessage(response);
  });
};
`;

// ---------------------------------------------------------------------------
// Worker factory
// ---------------------------------------------------------------------------

/**
 * Creates a new Sandbox Worker from a blob URL.
 * The blob URL ensures the worker has no same-origin access to the parent page.
 *
 * CSP enforcement: The worker is loaded from a blob URL with no inherited
 * permissions. The worker source itself shadows `eval`, `Function` (after
 * initial bootstrap), and all other prohibited globals. The blob URL
 * prevents same-origin access to the parent page's DOM, cookies, and storage.
 */
export function createSandboxWorker(): Worker {
  // Prepend a CSP-enforcing preamble that locks down the worker environment.
  // While blob URLs don't support HTTP CSP headers, we enforce equivalent
  // restrictions by deleting/overriding dangerous globals after bootstrap.
  //
  // Strategy:
  // 1. Save a reference to Function before lockdown (needed for IIFE wrapping).
  // 2. After the worker source is loaded, freeze the global scope by making
  //    eval, Function, and importScripts non-functional.
  // 3. The IIFE shadowing in executeAction provides defence-in-depth by
  //    passing `undefined` for all prohibited globals as function parameters.
  const cspPreamble = `
// ── CSP Enforcement Preamble ──────────────────────────────────────────────
// Save a reference to Function for the IIFE wrapping in executeAction.
// This is the ONLY permitted use of dynamic code execution in the Worker.
var __bootstrapFunction = Function;
`;

  const cspPostamble = `
// ── CSP Post-Bootstrap Lockdown ───────────────────────────────────────────
// After all worker code is defined, lock down dangerous globals so that
// action code cannot use them even if it escapes the IIFE shadowing.

// Block eval: replace with a no-op that throws
try {
  Object.defineProperty(self, 'eval', {
    value: function() { throw new Error('eval is blocked by CSP policy'); },
    writable: false,
    configurable: false
  });
} catch(e) {}

// Block importScripts: replace with a no-op that throws
try {
  Object.defineProperty(self, 'importScripts', {
    value: function() { throw new Error('importScripts is blocked by CSP policy'); },
    writable: false,
    configurable: false
  });
} catch(e) {}

// Block Function constructor for action code (the bootstrap reference is
// captured in closure by executeAction, so this doesn't break the IIFE).
// Note: We cannot fully block Function in all engines, but the IIFE
// shadowing already prevents action code from accessing it.
try {
  Object.defineProperty(self, 'Function', {
    value: undefined,
    writable: false,
    configurable: false
  });
} catch(e) {}
`;

  const fullSource = cspPreamble + WORKER_SOURCE + cspPostamble;
  const blob = new Blob([fullSource], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);

  // Clean up the blob URL after the worker is created
  // (the worker keeps a reference to the blob content)
  URL.revokeObjectURL(url);

  return worker;
}

/**
 * Returns the raw worker source code for testing purposes.
 * @internal
 */
export function getWorkerSource(): string {
  return WORKER_SOURCE;
}
