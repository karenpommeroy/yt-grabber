import {debounce} from "lodash-es";
import {useEffect} from "react";

const useWindowUpdater = (callback: () => void, debounceTime = 100) => {
    useEffect(() => {
        const onWindowResized = debounce(
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
