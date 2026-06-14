// Hermes doesn't expose browser globals like DOMException.
// Some packages (including older fetch polyfills) reference them at module load time.
if (typeof global.DOMException === 'undefined') {
  // @ts-ignore
  global.DOMException = class DOMException extends Error {
    constructor(message?: string, name?: string) {
      super(message)
      this.name = name ?? 'DOMException'
    }
  }
}
