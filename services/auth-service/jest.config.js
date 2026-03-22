/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  globalSetup: '<rootDir>/jest.globalSetup.js',
  globalTeardown: '<rootDir>/jest.globalTeardown.js',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },
  moduleNameMapper: {
    // Internal path alias: @/* → src/*
    '^@/(.*)$': '<rootDir>/src/$1',
    // Workspace packages: resolve to TypeScript source directly.
    // Without this, Jest follows package.json "main" → dist/ which
    // doesn't have the generated Prisma client files.
    '^@fs-project/db$': '<rootDir>/../../packages/db/src/index.ts',
    '^@fs-project/backend-common$':
      '<rootDir>/../../packages/backend-common/src/index.ts',
    '^@fs-project/common$': '<rootDir>/../../packages/common/src/index.ts',
  },
  // testcontainers needs time to pull + start a Postgres container
  testTimeout: 60000,
  verbose: true,
};

module.exports = config;
