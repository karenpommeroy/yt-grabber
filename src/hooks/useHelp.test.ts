import {useTranslation} from "react-i18next";

import {act, renderHook, waitFor} from "@testing-library/react";

import {useAppContext} from "../react/contexts/AppContext";
import useHelp from "./useHelp";

jest.mock("../react/contexts/AppContext", () => require("@tests/mocks/react/contexts/AppContext"));
jest.mock("react-i18next", () => require("@tests/mocks/react-i18next"));

const useAppContextMock = useAppContext as jest.MockedFunction<typeof useAppContext>;
const useTranslationMock = useTranslation as jest.MockedFunction<typeof useTranslation>;

const originalGetComputedStyle = window.getComputedStyle;

beforeAll(() => {
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
        const state = {help: true};

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
        const state = {help: true};
        
        useAppContextMock. mockImplementation(() => ({state, actions}));
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


    test("clicking inside help overlay does not close it", async () => {
        const helpElement = document.createElement("button");
        helpElement.dataset.help = "demo";
        document.body.appendChild(helpElement);

        const {result} = renderHook(() => useHelp());

        await act(async () => {
            helpElement.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true}));
        });

        await waitFor(() => expect(result.current.anchorEl).not.toBeNull());
        const anchorEl = result.current.anchorEl!;

        await act(async () => {
            anchorEl.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true}));
        });

        expect(result.current.anchorEl).not.toBeNull();
    });

    test("clicking outside help overlay closes it", async () => {
        const helpElement = document.createElement("button");
        helpElement.dataset.help = "demo";
        document.body.appendChild(helpElement);

        const {result} = renderHook(() => useHelp());

        await act(async () => {
            helpElement.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true}));
        });

        await waitFor(() => expect(result.current.anchorEl).not.toBeNull());

        await act(async () => {
            document.body.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true}));
        });

        await waitFor(() => expect(result.current.anchorEl).toBeNull());
    });

    test("handleMouseEvent stops propagation and prevents default", async () => {
        const event = new MouseEvent("mouseup", {bubbles: true, cancelable: true});
        event.stopPropagation = jest.fn();
        event.preventDefault = jest.fn();

        renderHook(() => useHelp());

        await act(async () => {
            document.body.dispatchEvent(event);
        });

        expect(event.stopPropagation).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
    });

    test("recursively copies styles and disables events for nested children", async () => {
        const helpElement = document.createElement("div");
        helpElement.dataset.help = "nested";
        
        const child = document.createElement("div");
        child.className = "child";
        helpElement.appendChild(child);

        const grandchild = document.createElement("span");
        grandchild.textContent = "Grandchild";
        child.appendChild(grandchild);

        document.body.appendChild(helpElement);

        const {result, unmount} = renderHook(() => useHelp());

        await act(async () => {
            helpElement.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true}));
        });

        await waitFor(() => expect(result.current.anchorEl).not.toBeNull());
        const anchorEl = result.current.anchorEl!;

        const clonedChild = anchorEl.children[0] as HTMLElement;
        expect(clonedChild).toBeDefined();
        expect(clonedChild.style.pointerEvents).toBe("none");
        
        const clonedGrandchild = clonedChild.children[0] as HTMLElement;
        expect(clonedGrandchild).toBeDefined();

        expect(clonedGrandchild.textContent).toBe("Grandchild");
        expect(clonedGrandchild.style.pointerEvents).toBe("none");
        unmount();
    });

    test("copyComputedStyle error is caught and logged", async () => {
        const helpElement = document.createElement("button");
        helpElement.dataset.help = "demo";
        document.body.appendChild(helpElement);

        const logger = { error: jest.fn() };
        (global as any).logger = logger;

        const error = new Error("Style error");
        window.getComputedStyle = jest.fn(() => {
            return {
                length: 1,
                item: () => "color",
                getPropertyValue: () => { throw error; },
            } as any;
        });

        const { result, unmount } = renderHook(() => useHelp());

        await act(async () => {
            helpElement.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        });

        await waitFor(() => expect(result.current.anchorEl).not.toBeNull());
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining("Error copying style property"),
            "color",
            error
        );

        unmount();
        window.getComputedStyle = originalGetComputedStyle;
    });
});
