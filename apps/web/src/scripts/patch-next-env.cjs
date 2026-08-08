/**
 * Payload's loadEnv does `import nextEnv from '@next/env'` then destructures.
 * Under tsx/CJS interop, @next/env has no `default` — only named exports.
 * This shim makes `default` the module namespace so seed/migrate scripts work.
 */
const Module = require('module')

const originalRequire = Module.prototype.require
Module.prototype.require = function patchedRequire(id) {
  const result = originalRequire.apply(this, arguments)
  if (
    id === '@next/env' ||
    (typeof id === 'string' && id.replace(/\\/g, '/').includes('/@next/env/'))
  ) {
    if (result && !result.default && typeof result.loadEnvConfig === 'function') {
      Object.defineProperty(result, 'default', {
        value: result,
        enumerable: false,
        configurable: true,
      })
    }
  }
  return result
}
