import {defineConfig} from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: "./e2e",
    testIgnore: "./e2e/helpers.ts",
    fullyParallel: true,
    timeout: 120000,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 0 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [["list"], ["html"]],
    use: {
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "electron",
        },
    ],
});
