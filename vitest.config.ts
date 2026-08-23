import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // No DOM environment needed for pure logic tests. If component rendering
    // tests are added later, switch to 'jsdom' and add @testing-library/react.
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
