
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";

import {useAppContext} from "../react/contexts/AppContext";

const useHelp = () => {
    const {state, actions} = useAppContext();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [backdropEl, setBackdropEl] = useState<null | HTMLElement>(null);
    const [help, setHelp] = useState<{header: string, content: string | string[];}>({header: "", content: ""});
    const {t} = useTranslation();
    
    const handleClick = (event: MouseEvent) => {            
        const element = event.target as HTMLElement;
        const elementHelp = element.closest<HTMLElement>("[data-help]");
        const helpId = elementHelp?.dataset.help;

        if (!elementHelp || helpId === "help-toggle") {
            setAnchorEl(null);
            setBackdropEl(null);
            
            return;
        }

        const header = t(helpId + "Header", {ns: "help"});
        const content: string | string[] = t(helpId + "Content", {ns: "help", returnObjects: true}) as string | string[]; 
        const backdrop = document.createElement("div");

        backdrop.id = "help-backdrop";
        setBackdropEl(backdrop);
        setAnchorEl(elementHelp);
        setHelp({header, content});

        event.stopPropagation();
        event.preventDefault();
    };

    const handleMouseEvent = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
    };
    
    const handleKeyUpEvent = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
            
        actions.setHelp(false);
        setBackdropEl(null);
        setAnchorEl(null);
    };

    useEffect(() => {
        if (backdropEl) {
            document.body.appendChild(backdropEl);
        }

        return () => {
            if (!backdropEl) return;

            document.body.removeChild(backdropEl);
        };
    }, [backdropEl]);

    useEffect(() => {
        if (anchorEl) {
            anchorEl.style.zIndex = "99";
        }

        return () => {
            if (!anchorEl) return;

            anchorEl.style.zIndex = "initial";
        };
    }, [anchorEl]);

    useEffect(() => {
        if (state.help) {
            document.addEventListener("click", handleClick, true);
            document.addEventListener("mouseup", handleMouseEvent, true);
            document.addEventListener("mousedown", handleMouseEvent, true);
            document.addEventListener("keyup", handleKeyUpEvent, true);
        } else {
            document.removeEventListener("click", handleClick, true);
            document.removeEventListener("mouseup", handleMouseEvent, true);
            document.removeEventListener("mousedown", handleMouseEvent, true);
            document.removeEventListener("keyup", handleKeyUpEvent, true);
            if (anchorEl) {
                anchorEl.style.zIndex = "initial";
            }
        }

        return () => {
            document.removeEventListener("click", handleClick, true);
            document.removeEventListener("mouseup", handleMouseEvent, true);
            document.removeEventListener("mousedown", handleMouseEvent, true);
            document.removeEventListener("keyup", handleKeyUpEvent, true);
            if (anchorEl) {
                anchorEl.style.zIndex = "initial";
            }
        };
    }, [state]);

    return {
        anchorEl,
        help,
    };
};

export default useHelp;
