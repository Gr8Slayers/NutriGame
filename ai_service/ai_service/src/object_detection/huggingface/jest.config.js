/** @type {import('jest').Config} */
export default {
    testEnvironment: 'node',
    transform:       {},          // ESM – no Babel transform needed
    testMatch:       ['**/test/**/*.test.js'],
    testTimeout:     15_000,
    // Silence verbose HF upload/SSE logs during tests
    silent:          false,
};
