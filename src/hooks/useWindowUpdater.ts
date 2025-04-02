import _debounce from "lodash/debounce";
import {useEffect} from "react";

const useWindowUpdater = (callback: () => void, debounceTime = 100) => {
    useEffect(() => {
        const onWindowResized = _debounce(
            callback,
            debounceTime,
        );

        const setupListeners = () => {
            window.addEventListener("resize", onWindowResized);
            onWindowResized();

            return () => {
                window.removeEventListener("resize", onWindowResized);
            };
        };

        setupListeners();
    }, [callback, debounceTime]);
};

export default useWindowUpdater;
