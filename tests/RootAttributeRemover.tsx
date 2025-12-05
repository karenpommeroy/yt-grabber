import React from "react";

export type RootAttributeRemoverProps = {
    rootSelector: string;
    attributeName?: string;
};

export const RootAttributeRemover = (props:RootAttributeRemoverProps): null => {
    const {
        rootSelector = "body > div",
        attributeName = "aria-hidden",
    } = props;
    const root = document.querySelector(rootSelector);

    React.useEffect(() => {
        if (!root) {
            throw new Error("RootAttributeRemover couldn't find the element.");
        }
        const observer = new MutationObserver(() => {
            if (!root.getAttribute(attributeName)) return;
            
            root.removeAttribute(attributeName);
        });
        
        observer.observe(root, {attributeFilter: [attributeName]});

        if (root.getAttribute(attributeName)) {
            root.removeAttribute(attributeName);
        }

        return () => {
            observer.disconnect();
        };
    }, [root]);

    return null;
};

export default RootAttributeRemover;
