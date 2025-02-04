import $_ from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";

export const useClickCounter = (callback: () => void, clicks = 3, timeout = 500) => {
    const [clickCounter, setClickCount] = useState(0);

    const onReset = useRef($_.debounce(() => setClickCount(0), timeout, { leading: false, trailing: true }));

    const onClick = useCallback(() => {
        setClickCount(clickCounter + 1);
        onReset.current();
    }, [callback]);

    useEffect(() => {
        if (clickCounter >= clicks) {
            onReset.current.flush();
            callback();
        }
    }, [clickCounter]);

    return { clickCounter, onClick };
};

export default useClickCounter;
