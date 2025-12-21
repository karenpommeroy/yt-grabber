import {debounce} from "lodash-es";
import {useEffect} from "react";

const useWindowUpdater = (callback: () => void, debounceTime = 100) => {
    useEffect(() => {
        const onWindowResized = debounce(
            callback,
            debounceTime,
        );


        window.addEventListener("resize", onWindowResized);
        onWindowResized();

        return () => {
            window.removeEventListener("resize", onWindowResized);
        };
    }, [callback, debounceTime]);
};

export default useWindowUpdater;
