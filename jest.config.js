module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(jest|spec|integration).[jt]s?(x)'],
  testPathIgnorePatterns: ['/dist/'],
  clearMocks: true,
  restoreMocks: true,
  coverageProvider: 'v8',
  setupFiles: ['./jest.setup.js'],
  testTimeout: 15000,
};
