import moment from "moment";
import momentDurationFormat from "moment-duration-format";

import {render, screen} from "@testing-library/react";

import {Bootstrap} from "./bootstrap";
import i18n from "./i18next";

jest.mock("./App", () => require("@tests/mocks/App"));
jest.mock("./react/contexts/AppContext", () => require("@tests/mocks/react/contexts/AppContext"));
jest.mock("./react/contexts/AppThemeContext", () => require("@tests/mocks/react/contexts/AppThemeContext"));
jest.mock("./react/contexts/DataContext", () => require("@tests/mocks/react/contexts/DataContext"));
jest.mock("moment-duration-format", () => require("@tests/mocks/moment-duration-format"));

describe("bootstrap", () => {
    let updateLocaleSpy: jest.SpyInstance;
    let changeLanguageSpy: jest.SpyInstance;
    const mockedMomentDurationFormat = momentDurationFormat as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        updateLocaleSpy = jest.spyOn(moment, "updateLocale");
        changeLanguageSpy = jest.spyOn(i18n, "changeLanguage");
    });

    afterEach(() => {
        updateLocaleSpy.mockRestore();
        changeLanguageSpy.mockRestore();
    });

    test("initializes moment plugins and locale", () => {
        render(<Bootstrap />);

        expect(mockedMomentDurationFormat).toHaveBeenCalledWith(moment);
        expect(updateLocaleSpy).toHaveBeenCalledWith("en", {week: {dow: 1}});
    });

    test("switches i18n language based on stored preference", () => {
        const mockedStoreGet = store.get as jest.Mock;
        
        mockedStoreGet.mockReturnValue({language: "pl-PL"});
        render(<Bootstrap />);

        expect(mockedStoreGet).toHaveBeenCalledWith("application");
        expect(changeLanguageSpy).toHaveBeenCalledWith("pl-PL");
    });

    test("renders the App component inside every provider", () => {
        render(<Bootstrap />);

        expect(screen.getByTestId("app-context-provider")).toBeInTheDocument();
        expect(screen.getByTestId("data-provider")).toBeInTheDocument();
        expect(screen.getByTestId("app-theme-provider")).toBeInTheDocument();
        expect(screen.getByTestId("app")).toBeInTheDocument();
    });
});
