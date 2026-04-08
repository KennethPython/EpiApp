import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  testMatch: ['**/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: /\.(html|svg)$/,
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  moduleNameMapper: {
    '^@capacitor/local-notifications$': '<rootDir>/src/__mocks__/@capacitor/local-notifications.ts',
    '^@capacitor/core$': '<rootDir>/src/__mocks__/@capacitor/core.ts',
  },
  testEnvironment: 'jsdom',
};

export default config;
