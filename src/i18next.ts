import i18next from "i18next";
import i18nextBackend from "i18next-node-fs-backend";
import $_ from "lodash";
import path from "path";
import {initReactI18next} from "react-i18next";

const isMac = process.platform === "darwin";
const isDev = process.env.NODE_ENV === "development";
const prependPath = isMac && !isDev ? path.join(process.resourcesPath, "..") :  ".";
const localePath = $_.replace(!isDev ? path.join(process.resourcesPath, "locales") : path.join(__dirname, "resources", "locales"), /\\/g, "/");

i18next.use(i18nextBackend).use(initReactI18next).init({
    backend: {
        loadPath: localePath + "/{{lng}}/{{ns}}.json",
        addPath: prependPath + "/src/resources/locales/{{lng}}/{{ns}}.missing.json",
    },
    lng: "en-GB",
    preload: ["en-GB", "de-DE", "pl-PL"],
    debug: false, // process.env.NODE_ENV === "development",
    saveMissing: false,
    saveMissingTo: "all",
    load: "currentOnly",
    returnEmptyString: false,
    fallbackLng: false,
    defaultNS: "translation",
    ns: "translation",
    interpolation: {
        escapeValue: false,
    },
    supportedLngs: ["en-GB", "de-DE", "pl-PL"],
});

export default i18next;
