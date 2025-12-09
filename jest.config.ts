import type {Config} from "jest";

const config: Config = {
    rootDir: ".",
    testEnvironment: "jsdom",
    transform: {
        "^.+\\.(t|j)sx?$": ["@swc/jest", {}],
    },
    transformIgnorePatterns: [
        "node_modules/(?!(lodash-es)/)",
    ],
    moduleNameMapper: {
        "\\.(css|less|scss|sass|styl)$": "identity-obj-proxy",
        "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/tests/mocks/FileMock.ts",
        "^@tests/(.*)$": "<rootDir>/tests/$1",
        "^@app/(.*)$": "<rootDir>/src/$1",
    },
    setupFilesAfterEnv: [
        "@testing-library/jest-dom",
        "<rootDir>/jest.setup.ts",
    ],
    testPathIgnorePatterns: ["/node_modules/", "/dist/", "/out/", "/e2e/"],
    reporters: [
        "default",
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        "src/**/*.{ts,tsx}",
        "!src/**/*.d.ts",
        "!src/**/index.ts",
        "!src/react/actions/Action.ts",
    ],
    coverageDirectory: "<rootDir>/coverage",
    coverageProvider: "v8",
    coverageReporters: [
        "json",
        "lcov",
    ],
};

export default config;
