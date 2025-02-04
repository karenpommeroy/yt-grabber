import React, {useRef} from "react";

import {ICancelablePromise} from "../common/CancellablePromise";

const useCancellablePromises = () => {
    const pendingPromises = useRef([]);

    const appendPendingPromise = (promise: ICancelablePromise) =>
        (pendingPromises.current = [...pendingPromises.current, promise]);

    const removePendingPromise = (promise: ICancelablePromise) =>
        (pendingPromises.current = pendingPromises.current.filter((p) => p !== promise));

    const clearPendingPromises = () => pendingPromises.current.map((p) => p.cancel());

    const api = {
        appendPendingPromise,
        removePendingPromise,
        clearPendingPromises,
    };

    return api;
};

export default useCancellablePromises;
