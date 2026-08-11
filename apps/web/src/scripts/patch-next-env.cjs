/**
 * Env + interop bootstrap for Payload CLI/script runs outside the Next.js
 * runtime (migrate, seed).
 *
 * 1. Interop patch: payload/dist/bin/loadEnv.js destructures
 *    `require('@next/env').default`, but @next/env v16 (CJS) exposes
 *    `loadEnvConfig` at the top level with no `default`. We intercept the
 *    module load and hand back a shape that satisfies both patterns.
 * 2. Env loading: load Next-style env files (.env.local, .env) from the app
 *    dir first, then the repo root, without overriding already-set vars.
 */
const path = require('node:path')
const Module = require('node:module')

const originalLoad = Module._load
Module._load = function patchedLoad(request, parent, isMain) {
  const loaded = originalLoad.call(this, request, parent, isMain)
  if (request === '@next/env' && loaded && typeof loaded === 'object') {
    if (typeof loaded.loadEnvConfig === 'function' && loaded.default === undefined) {
      // Satisfy `const { loadEnvConfig } = mod.default` interop consumers.
      return { ...loaded, default: loaded, __esModule: true }
    }
  }
  return loaded
}

function load(dir) {
  try {
    const { loadEnvConfig } = require('@next/env')
    loadEnvConfig(dir, true, { info: () => {}, error: console.error })
  } catch {
    // @next/env unavailable: rely on process env / --env-file flags.
  }
}

// apps/web first (wins), then the repo root.
load(path.resolve(__dirname, '..', '..'))
load(path.resolve(__dirname, '..', '..', '..', '..'))
