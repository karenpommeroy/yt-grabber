import i18next from "i18next";

import {fireEvent, waitFor, within} from "@testing-library/react";
import {render} from "@tests/TestRenderer";

import LanguagePicker from "./LanguagePicker";

jest.unmock("react-i18next");

describe("LanguagePicker", () => {
    test("renders picker with default options", async () => {
        const shell = await render(<LanguagePicker data-testid="language-picker" />);

        const component = shell.getByTestId("language-picker");
        expect(component).toBeInTheDocument();

        const trigger = await shell.findByRole("button");
        fireEvent.click(trigger);
        
        const menu = await shell.findByRole("menu");
        const menuItems = within(menu).getAllByRole("menuitem");
        const menuItemsTexts = menuItems.map((item) => item.textContent);
        
        expect(menuItemsTexts).toEqual(expect.arrayContaining(["Deutsch", "English", "Polski"]));
    });

    test("handles changing language using dropdown correctly", async () => {
        const changeLanguageSpy = jest.spyOn(i18next, "changeLanguage");
        const shell = await render(<LanguagePicker data-testid="language-picker" />);

        const trigger = shell.getByRole("button");
        fireEvent.click(trigger);
        
        const menu = await shell.findByRole("menu");
        const deItem = within(menu).getAllByRole("menuitem").find(el => el.getAttribute("value") === "de-DE");

        fireEvent.click(deItem);

        expect(changeLanguageSpy).toHaveBeenCalledTimes(1);
        expect(changeLanguageSpy).toHaveBeenCalledWith("de-DE", expect.any(Function));
        expect(menu).not.toBeInTheDocument();

        fireEvent.click(trigger);
       
        const menu1 = await shell.findByRole("menu");
        const plItem = within(menu1).getAllByRole("menuitem").find(el => el.getAttribute("value") === "pl-PL");
        
        fireEvent.click(plItem);

        expect(changeLanguageSpy).toHaveBeenCalledTimes(2);
        expect(changeLanguageSpy).toHaveBeenCalledWith("pl-PL", expect.any(Function));
        expect(menu1).not.toBeInTheDocument();

        fireEvent.click(trigger);

        const menu2 = await shell.findByRole("menu");
        const enItem = within(menu2).getAllByRole("menuitem").find(el => el.getAttribute("value") === "en-GB");
        
        fireEvent.click(enItem);

        expect(changeLanguageSpy).toHaveBeenCalledTimes(3);
        expect(changeLanguageSpy).toHaveBeenCalledWith("en-GB", expect.any(Function));
        expect(menu2).not.toBeInTheDocument();

        changeLanguageSpy.mockRestore();
    });

    test("closes menu on click away", async () => {
        const shell = await render(<LanguagePicker data-testid="language-picker" />);

        const trigger = shell.getByRole("button");
        fireEvent.click(trigger);

        await shell.findByRole("menu");
        expect(shell.getByRole("menu")).toBeInTheDocument();

        await new Promise((resolve) => setTimeout(resolve, 0));
        fireEvent.click(document.body);

        await waitFor(() => expect(shell.queryByRole("menu")).not.toBeInTheDocument());
    });

    test("does not close menu when clicking the trigger (anchorEl)", async () => {
        const shell = await render(<LanguagePicker data-testid="language-picker" />);

        const trigger = shell.getByRole("button");
        fireEvent.click(trigger);

        await shell.findByRole("menu");
        expect(shell.getByRole("menu")).toBeInTheDocument();

        await new Promise((resolve) => setTimeout(resolve, 0));
        fireEvent.click(trigger);

        await waitFor(() => expect(shell.getByRole("menu")).toBeInTheDocument());
    });
});
