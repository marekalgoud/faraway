// Polyfills for Node.js modules that are bundled for browser
// This resolves the "buffer" and other Node.js module resolution errors

// Polyfill for 'buffer' module
(globalThis as any).global = globalThis;

// Export buffer from globalThis to avoid "require('buffer')" failures
if (typeof (globalThis as any).Buffer === 'undefined') {
  // Create a minimal Buffer polyfill
  (globalThis as any).Buffer = class Buffer {
    constructor(data: any) {
      return new Uint8Array(data || 0);
    }
  };
}
