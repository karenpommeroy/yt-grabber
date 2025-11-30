import fs from "fs-extra";
import path from "path";

import {getBinPath, getProfilePath, getResourcesPath, removeIncompleteFiles} from "./FileSystem";
import {isDev} from "./Helpers";

jest.mock("fs-extra", () => require("@tests/mocks/fs-extra"));
jest.mock("./Helpers", () => require("@tests/mocks/common/Helpers"));

describe("FileSystem", () => {
    const resourcesPath = ((process as any).resourcesPath ?? "/mocked/resources/path") as string;
    const mockedIsDev = isDev as jest.MockedFunction<typeof isDev>;
    const existsSyncMock = fs.existsSync as jest.Mock;
    const readdirSyncMock = fs.readdirSync as jest.Mock;
    const removeSyncMock = fs.removeSync as jest.Mock;

    beforeEach(() => {
        mockedIsDev.mockReset();
        existsSyncMock.mockReset();
        readdirSyncMock.mockReset();
        removeSyncMock.mockReset();
    });

    test("getBinPath returns dev bin directory when isDev is true", () => {
        mockedIsDev.mockReturnValue(true);
        const expected = path.join(__dirname, "resources", "bin").replace(/\\/g, "/");

        expect(getBinPath()).toBe(expected);
    });

    test("getBinPath returns packaged bin directory when isDev is false", () => {
        mockedIsDev.mockReturnValue(false);
        const expected = path.join(resourcesPath, "bin").replace(/\\/g, "/");

        expect(getBinPath()).toBe(expected);
    });

    test("getResourcesPath switches between dev and packaged locations", () => {
        mockedIsDev.mockReturnValue(true);
        const devPath = path.join(__dirname, "resources").replace(/\\/g, "/");
        expect(getResourcesPath()).toBe(devPath);

        mockedIsDev.mockReturnValue(false);
        const prodPath = path.join(resourcesPath).replace(/\\/g, "/");
        expect(getResourcesPath()).toBe(prodPath);
    });

    test("getProfilePath returns profile directory based on environment", () => {
        mockedIsDev.mockReturnValue(true);
        const devPath = path.resolve("./public", "profile").replace(/\\/g, "/");
        expect(getProfilePath()).toBe(devPath);

        mockedIsDev.mockReturnValue(false);
        const prodPath = path.join(resourcesPath, "profile").replace(/\\/g, "/");
        expect(getProfilePath()).toBe(prodPath);
    });

    test("removeIncompleteFiles removes base file when present", () => {
        const dir = path.join(process.cwd(), "downloads");
        const tokens = {dir, name: "sample", ext: "mp4"};

        existsSyncMock.mockReturnValue(true);
        readdirSyncMock.mockReturnValue([
            {name: "sample.mp4", isFile: () => true, parentPath: dir},
            {name: "other.txt", isFile: () => true, parentPath: dir},
        ]);

        removeIncompleteFiles(tokens);

        expect(removeSyncMock).toHaveBeenCalledTimes(1);
        expect(removeSyncMock).toHaveBeenCalledWith(path.join(dir, "sample.mp4"));
    });

    test("removeIncompleteFiles removes chunked web media when hasParts is true", () => {
        const dir = path.join(process.cwd(), "downloads");
        const tokens = {dir, name: "movie", ext: "mkv"};

        existsSyncMock.mockReturnValue(true);
        readdirSyncMock.mockReturnValue([
            {name: "movie.mkv", isFile: () => true, parentPath: dir},
            {name: "movie 001.webm.part", isFile: () => true, parentPath: dir},
            {name: "movie 001.webm", isFile: () => true, parentPath: dir},
        ]);

        removeIncompleteFiles(tokens, true);

        expect(removeSyncMock).toHaveBeenCalledTimes(3);
        expect(removeSyncMock).toHaveBeenNthCalledWith(1, path.join(dir, "movie.mkv"));
        expect(removeSyncMock).toHaveBeenNthCalledWith(2, path.join(dir, "movie 001.webm.part"));
        expect(removeSyncMock).toHaveBeenNthCalledWith(3, path.join(dir, "movie 001.webm"));
    });

    test("removeIncompleteFiles skips work when directory does not exist", () => {
        existsSyncMock.mockReturnValue(false);

        removeIncompleteFiles({dir: "missing", name: "file", ext: "mp3"});

        expect(readdirSyncMock).not.toHaveBeenCalled();
        expect(removeSyncMock).not.toHaveBeenCalled();
    });
});
