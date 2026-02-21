
import {toInteger, toString} from "lodash-es";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";

import {useAppContext} from "../react/contexts/AppContext";

const useHelp = () => {
    const {state, actions} = useAppContext();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [backdropEl, setBackdropEl] = useState<null | HTMLElement>(null);
    const [help, setHelp] = useState<{header: string, content: string | string[];}>({header: "", content: ""});
    const {t} = useTranslation();
    
    const createBackdropElement = (background = "rgba(0, 0, 0, 0.5)", filter = "blur(2px)") => {
        const backdrop = document.createElement("div");
        
        backdrop.style.position = "absolute";
        backdrop.style.width = "100vw";
        backdrop.style.height = "100vh";
        backdrop.style.top = "0";
        backdrop.style.left = "0";
        backdrop.style.zIndex = "1";
        backdrop.style.background = background;
        backdrop.style.backdropFilter = filter;
        backdrop.dataset.testid = "help-backdrop";

        document.body.appendChild(backdrop);

        return backdrop;
    };

    const createAnchorElement = (original: HTMLElement, zIndex = 999) => {
        const bbox = original.getBoundingClientRect();
        const clone = original.cloneNode(true) as HTMLElement;

        const copyComputedStyle = (src: HTMLElement, dest: HTMLElement) => {
            const computedStyle = window.getComputedStyle(src);

            for (let i = 0; i < computedStyle.length; i++) {
                const key = computedStyle.item(i);
                if (!key) continue;

                try {
                    dest.style.setProperty(key, computedStyle.getPropertyValue(key));
                } catch (error) {
                    logger.error("Error copying style property", key, error);
                }
            }
        };
      
        const traverseAndCopy = (srcNode: HTMLElement, destNode: HTMLElement, disableEvents = true) => {
            copyComputedStyle(srcNode, destNode);
            
            if (disableEvents) {
                destNode.style.pointerEvents = "none";
            }

            const srcChildren = srcNode.children as HTMLCollectionOf<HTMLElement>;
            const destChildren = destNode.children as HTMLCollectionOf<HTMLElement>;
            
            for (let i = 0; i < srcChildren.length; i++) {
                traverseAndCopy(srcChildren[i], destChildren[i]);
            }
        };
      
        traverseAndCopy(original, clone);
        document.body.appendChild(clone);

        clone.style.position = "fixed";
        clone.style.left = bbox.x - clone.offsetLeft + "px";
        clone.style.top = bbox.y - clone.offsetTop + "px";
        clone.style.zIndex = toString(zIndex + 1);
        clone.dataset.testid = "help-anchor";

        return clone;
    };

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
        
        const backdropElement = createBackdropElement();
        const anchorElement = createAnchorElement(elementHelp, toInteger(backdropElement.style.zIndex));
        
        setBackdropEl(backdropElement);
        setAnchorEl(anchorElement);
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
        return () => {
            backdropEl?.remove();
        };
    }, [backdropEl]);

    useEffect(() => {        
        return () => {
            anchorEl?.remove();
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
        }

        return () => {
            document.removeEventListener("click", handleClick, true);
            document.removeEventListener("mouseup", handleMouseEvent, true);
            document.removeEventListener("mousedown", handleMouseEvent, true);
            document.removeEventListener("keyup", handleKeyUpEvent, true);
        };
    }, [state]);

    return {
        anchorEl,
        help,
    };
};

export default useHelp;
