import i18next from "i18next";

const actual = jest.requireActual("react-i18next");

export const useTranslation = jest.fn(() => ({
    t: (key: string) => key,
    i18n: i18next
}));

const ReactI18NextMock = {
    ...actual,
    useTranslation,
};

export const {initReactI18next, getI18n, I18nextProvider} = actual;

export default ReactI18NextMock;
