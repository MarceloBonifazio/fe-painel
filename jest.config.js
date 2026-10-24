/** @type {import('jest').Config} */
export default { testEnvironment: 'node', testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/cypress/'], coverageReporters: ['text', 'json-summary', 'html', 'lcov'], coverageDirectory: 'coverage' };
