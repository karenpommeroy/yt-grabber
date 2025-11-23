import {useTranslation} from "react-i18next";

import {act, renderHook, waitFor} from "@testing-library/react";

import {useAppContext} from "../react/contexts/AppContext";
import useHelp from "./useHelp";

jest.mock("../react/contexts/AppContext", () => ({
    useAppContext: jest.fn(),
}));

jest.mock("react-i18next", () => ({
    useTranslation: jest.fn(),
}));

const useAppContextMock = useAppContext as jest.MockedFunction<typeof useAppContext>;
const useTranslationMock = useTranslation as jest.MockedFunction<typeof useTranslation>;

const originalGetComputedStyle = window.getComputedStyle;

beforeAll(() => {
    global.logger = {error: jest.fn()} as any;
    window.getComputedStyle = jest.fn(() => {
        const styles: Record<string, string> = {color: "rgb(0, 0, 0)"};

        return {
            getPropertyValue: (property: string) => styles[property] ?? "",
            [Symbol.iterator]: function* () {
                yield* Object.keys(styles);
            },
        } as any;
    });
});

afterAll(() => {
    window.getComputedStyle = originalGetComputedStyle;
});

afterEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
});

describe("useHelp", () => {
    beforeEach(() => {
        const actions = {
            setLocation: jest.fn(),
            setTheme: jest.fn(),
            setMode: jest.fn(),
            setLoading: jest.fn(),
            setHelp: jest.fn(),
        };
        const state = {help: true} as any;

        useAppContextMock.mockImplementation(() => ({state, actions}));
        useTranslationMock.mockReturnValue({t: jest.fn((key: string) => `translated-${key}`)} as any);
    });

    test("activates help overlay when clicking help element", async () => {
        const helpElement = document.createElement("button");
        helpElement.dataset.help = "demo";
        helpElement.textContent = "Help";
        document.body.appendChild(helpElement);

        const {result, unmount} = renderHook(() => useHelp());

        await act(async () => {
            helpElement.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true}));
        });

        await waitFor(() => expect(result.current.anchorEl).not.toBeNull());
        expect(result.current.help).toEqual({
            header: "translated-demoHeader",
            content: "translated-demoContent",
        });
        expect(document.body.contains(result.current.anchorEl!)).toBe(true);

        unmount();
    });

    test("pressing Escape clears overlay and notifies context", async () => {
        const helpElement = document.createElement("button");
        helpElement.dataset.help = "demo";
        document.body.appendChild(helpElement);

        const actions = {
            setLocation: jest.fn(),
            setTheme: jest.fn(),
            setMode: jest.fn(),
            setLoading: jest.fn(),
            setHelp: jest.fn(),
        };
        const state = {help: true} as any;
        useAppContextMock.mockImplementation(() => ({state, actions}));
        useTranslationMock.mockReturnValue({t: jest.fn((key: string) => `translated-${key}`)} as any);

        const {result} = renderHook(() => useHelp());

        await act(async () => {
            helpElement.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true}));
        });

        await waitFor(() => expect(result.current.anchorEl).not.toBeNull());
        const createdAnchor = result.current.anchorEl!;

        await act(async () => {
            document.dispatchEvent(new KeyboardEvent("keyup", {key: "Escape", bubbles: true}));
        });

        await waitFor(() => expect(result.current.anchorEl).toBeNull());
        expect(document.body.contains(createdAnchor)).toBe(false);
        expect(actions.setHelp).toHaveBeenCalledWith(false);
    });
});
