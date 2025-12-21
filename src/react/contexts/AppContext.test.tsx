import React from "react";

import {act, render, screen} from "@testing-library/react";

import {ColorMode} from "../../common/Theme";
import AppContext, {AppContextProvider, IAppContext, useAppContext} from "./AppContext";

const TestConsumer: React.FC<{onContext?: (ctx: IAppContext) => void}> = ({onContext}) => {
    const context = useAppContext();
    React.useEffect(() => {
        if (onContext) {
            onContext(context);
        }
    }, [context, onContext]);

    return <div data-testid="consumer">{context.state.location}</div>;
};

describe("AppContext", () => {
    describe("AppContextProvider", () => {
        it("should render children", () => {
            render(
                <AppContextProvider>
                    <div data-testid="child">Child Content</div>
                </AppContextProvider>
            );

            expect(screen.getByTestId("child")).toBeInTheDocument();
            expect(screen.getByText("Child Content")).toBeInTheDocument();
        });

        it("should provide context with default state", () => {
            let capturedContext: IAppContext | undefined;

            render(
                <AppContextProvider>
                    <TestConsumer onContext={(ctx) => { capturedContext = ctx; }} />
                </AppContextProvider>
            );

            expect(capturedContext).toBeDefined();
            expect(capturedContext!.state.location).toBe("/");
            expect(capturedContext!.state.theme).toBe("purple-rain");
            expect(capturedContext!.state.mode).toBe(ColorMode.Dark);
            expect(capturedContext!.state.loading).toBe(false);
            expect(capturedContext!.state.help).toBe(false);
        });

        it("should provide action functions", () => {
            let capturedContext: IAppContext | undefined;

            render(
                <AppContextProvider>
                    <TestConsumer onContext={(ctx) => { capturedContext = ctx; }} />
                </AppContextProvider>
            );

            expect(typeof capturedContext!.actions.setLocation).toBe("function");
            expect(typeof capturedContext!.actions.setTheme).toBe("function");
            expect(typeof capturedContext!.actions.setMode).toBe("function");
            expect(typeof capturedContext!.actions.setLoading).toBe("function");
            expect(typeof capturedContext!.actions.setHelp).toBe("function");
        });
    });

    describe("actions", () => {
        it("should update location via setLocation", () => {
            let capturedContext: IAppContext | undefined;

            render(
                <AppContextProvider>
                    <TestConsumer onContext={(ctx) => { capturedContext = ctx; }} />
                </AppContextProvider>
            );

            expect(capturedContext!.state.location).toBe("/");

            act(() => {
                capturedContext!.actions.setLocation("/home");
            });

            expect(capturedContext!.state.location).toBe("/home");
        });

        it("should update theme via setTheme", () => {
            let capturedContext: IAppContext | undefined;

            render(
                <AppContextProvider>
                    <TestConsumer onContext={(ctx) => { capturedContext = ctx; }} />
                </AppContextProvider>
            );

            expect(capturedContext!.state.theme).toBe("purple-rain");

            act(() => {
                capturedContext!.actions.setTheme("dark-knight");
            });

            expect(capturedContext!.state.theme).toBe("dark-knight");
        });

        it("should update mode via setMode", () => {
            let capturedContext: IAppContext | undefined;

            render(
                <AppContextProvider>
                    <TestConsumer onContext={(ctx) => { capturedContext = ctx; }} />
                </AppContextProvider>
            );

            expect(capturedContext!.state.mode).toBe(ColorMode.Dark);

            act(() => {
                capturedContext!.actions.setMode(ColorMode.Light);
            });

            expect(capturedContext!.state.mode).toBe(ColorMode.Light);
        });

        it("should update loading via setLoading", () => {
            let capturedContext: IAppContext | undefined;

            render(
                <AppContextProvider>
                    <TestConsumer onContext={(ctx) => { capturedContext = ctx; }} />
                </AppContextProvider>
            );

            expect(capturedContext!.state.loading).toBe(false);

            act(() => {
                capturedContext!.actions.setLoading(true);
            });

            expect(capturedContext!.state.loading).toBe(true);
        });

        it("should update help via setHelp", () => {
            let capturedContext: IAppContext | undefined;

            render(
                <AppContextProvider>
                    <TestConsumer onContext={(ctx) => { capturedContext = ctx; }} />
                </AppContextProvider>
            );

            expect(capturedContext!.state.help).toBe(false);

            act(() => {
                capturedContext!.actions.setHelp(true);
            });

            expect(capturedContext!.state.help).toBe(true);
        });
    });

    describe("useAppContext hook", () => {
        it("should throw error when used outside provider", () => {
            const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

            expect(() => {
                render(<TestConsumer />);
            }).toThrow("useAppContext must be used within AppContextProvider");

            consoleError.mockRestore();
        });

        it("should return context when used inside provider", () => {
            let capturedContext: IAppContext | undefined;

            render(
                <AppContextProvider>
                    <TestConsumer onContext={(ctx) => { capturedContext = ctx; }} />
                </AppContextProvider>
            );

            expect(capturedContext).toBeDefined();
            expect(capturedContext!.state).toBeDefined();
            expect(capturedContext!.actions).toBeDefined();
        });
    });

    describe("AppContext default export", () => {
        it("should export context that can be consumed directly", () => {
            let contextValue: IAppContext | undefined;

            const DirectConsumer: React.FC = () => {
                contextValue = React.useContext(AppContext);
                return null;
            };

            render(
                <AppContextProvider>
                    <DirectConsumer />
                </AppContextProvider>
            );

            expect(contextValue).toBeDefined();
            expect(contextValue!.state).toBeDefined();
        });

        it("should return undefined when consumed outside provider", () => {
            let contextValue: IAppContext | undefined = {} as IAppContext;

            const DirectConsumer: React.FC = () => {
                contextValue = React.useContext(AppContext);
                return null;
            };

            render(<DirectConsumer />);

            expect(contextValue).toBeUndefined();
        });
    });
});
