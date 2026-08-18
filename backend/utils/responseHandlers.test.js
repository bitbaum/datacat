/**
 * responseHandlers is the SSOT for what every API response looks like. Two
 * properties are worth holding still:
 *
 *  1. The envelope shape. Clients branch on `success`, so a handler that omits
 *     it turns a failure into something the frontend reads as neither.
 *  2. `error()` attaches `details` ONLY outside production. That is a
 *     deliberate leak guard — details carry stack traces and driver messages —
 *     and it is exactly the kind of conditional that survives a refactor in
 *     form while losing its meaning.
 *
 * Nothing executed this file before: backend/package.json's `test` was
 * `echo "Error: no test specified" && exit 1`, a placeholder that fails by
 * design, and the repo's only real suite was Playwright.
 */
// ESM imports even though the module under test is CommonJS: vitest cannot be
// `require`d, and Vite handles the CJS interop on the default import.
import { afterEach, describe, expect, it } from 'vitest'
import handlers from './responseHandlers.js'

/** Minimal Express `res` double that records what was sent. */
function fakeRes() {
  return {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

const originalEnv = process.env.NODE_ENV

afterEach(() => {
  process.env.NODE_ENV = originalEnv
})

describe('success', () => {
  it('sends 200 with success:true by default', () => {
    const res = handlers.success(fakeRes(), { id: 1 })
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.id).toBe(1)
  })

  it('honours an explicit status', () => {
    expect(handlers.success(fakeRes(), {}, 'Created', 201).statusCode).toBe(201)
  })

  it('carries the message through', () => {
    expect(handlers.success(fakeRes(), {}, 'Saved').body.message).toBe('Saved')
  })
})

describe('error', () => {
  it('sends 500 with success:false by default', () => {
    const res = handlers.error(fakeRes())
    expect(res.statusCode).toBe(500)
    expect(res.body.success).toBe(false)
  })

  it('honours an explicit status', () => {
    expect(handlers.error(fakeRes(), 'Not found', 404).statusCode).toBe(404)
  })

  it('includes details in development', () => {
    process.env.NODE_ENV = 'development'
    const res = handlers.error(fakeRes(), 'Boom', 500, { stack: 'at db.query' })
    expect(res.body.details).toEqual({ stack: 'at db.query' })
  })

  it('NEVER includes details in production', () => {
    // The leak guard. `details` is where stack traces and driver errors go;
    // shipping them to a client is how internals reach an attacker. Asserted
    // directly rather than trusted, because the check is one `if` away from
    // being refactored into always-on.
    process.env.NODE_ENV = 'production'
    const res = handlers.error(fakeRes(), 'Boom', 500, { stack: 'at db.query' })
    expect(res.body.details).toBeUndefined()
  })

  it('omits details when none are given, in any environment', () => {
    for (const env of ['development', 'production', 'test']) {
      process.env.NODE_ENV = env
      expect(handlers.error(fakeRes(), 'Boom').body.details).toBeUndefined()
    }
  })
})

describe('validationError', () => {
  it('sends 400 with success:false and the errors array', () => {
    const res = handlers.validationError(fakeRes(), 'Invalid', [{ field: 'email' }])
    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.errors).toEqual([{ field: 'email' }])
  })
})

describe('the envelope is uniform', () => {
  it('every exported handler sets a boolean `success`', () => {
    // A client that branches on `success` must never meet a response without
    // it — that reads as neither a win nor a failure.
    for (const [name, handler] of Object.entries(handlers)) {
      if (typeof handler !== 'function') continue
      const res = handler(fakeRes())
      expect(typeof res.body?.success, `${name} did not set a boolean success`).toBe('boolean')
    }
  })
})
