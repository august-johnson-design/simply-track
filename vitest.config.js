import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// better-sqlite3 (v13+) ships prebuilt Node-API binaries, which are ABI-stable
// across Node and Electron versions — no rebuild step needed, and tests run
// under plain Node like any other Vitest project.
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
