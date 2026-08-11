import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Tests run under Electron's Node runtime (see the "test" script, which sets
// ELECTRON_RUN_AS_NODE=1) rather than plain system Node. This is required
// because `better-sqlite3` is rebuilt for Electron's Node ABI on every
// `npm install` (see package.json's postinstall script) — running it under
// plain Node would fail with a NODE_MODULE_VERSION mismatch. Electron's
// bundled Node is otherwise a normal Node runtime, so jsdom/React tests work
// exactly the same way here as they would under plain Vitest.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    // Renderer component tests opt into jsdom per-file via a
    // `// @vitest-environment jsdom` docblock at the top of the file.
    include: ['src/**/*.test.{js,jsx}']
  }
})
