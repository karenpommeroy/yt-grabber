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
        "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/tests/FileMock.ts",
        "^@tests/(.*)$": "<rootDir>/tests/$1"
    },
    setupFilesAfterEnv: [
        "@testing-library/jest-dom",
        "<rootDir>/jest.setup.ts",
    ],
    testPathIgnorePatterns: ["/node_modules/", "/dist/", "/out/", "/e2e/"],
};

export default config;
