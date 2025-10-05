import i18next from "i18next";
import i18nextBackend from "i18next-node-fs-backend";
import {initReactI18next} from "react-i18next";

import {jest} from "@jest/globals";

describe("i18next configuration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should initialize i18next with the correct configuration", () => {
        const initSpy = jest.spyOn(i18next, "init");

        i18next
            .use(i18nextBackend)
            .use(initReactI18next)
            .init({
                backend: {
                    loadPath: expect.stringContaining("locales/{{lng}}/{{ns}}.json"),
                    addPath: expect.stringContaining("locales/{{lng}}/{{ns}}.missing.json"),
                },
                lng: "en-GB",
                preload: ["en-GB", "de-DE", "pl-PL"],
                debug: false,
                saveMissing: expect.any(Boolean),
                missingKeyHandler: expect.any(Function),
                saveMissingTo: "all",
                load: "currentOnly",
                returnEmptyString: false,
                fallbackLng: false,
                defaultNS: "translation",
                ns: ["translation", "help"],
                interpolation: {
                    escapeValue: false,
                },
                supportedLngs: ["en-GB", "de-DE", "pl-PL"],
            });

        expect(initSpy).toHaveBeenCalled();
    });
});
