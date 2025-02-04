import cancellablePromise from "../common/CancellablePromise";
import delay from "../common/Delay";
import useCancellablePromises from "./useCancellablePromises";

export interface IUseMultiClickHandlerProps {
    timeout?: number;
    onClick?: (data?: any) => void;
    onDoubleClick?: (data?: any) => void;
}

const useMultiClickHandler = (props: IUseMultiClickHandlerProps) => {
    const { timeout = 300, onClick, onDoubleClick } = props;
    const api = useCancellablePromises();

    const handleClick = (data?: any) => {
        api.clearPendingPromises();
        const waitForClick = cancellablePromise(delay(timeout));
        api.appendPendingPromise(waitForClick);

        return waitForClick.promise
            .then(() => {
                api.removePendingPromise(waitForClick);
                onClick(data);
            })
            .catch((errorInfo: any) => {
                api.removePendingPromise(waitForClick);
                if (!errorInfo.isCanceled) {
                    throw errorInfo.error;
                }
            });
    };

    const handleDoubleClick = (data?: any) => {
        api.clearPendingPromises();
        onDoubleClick(data);
    };

    return [handleClick, handleDoubleClick];
};

export default useMultiClickHandler;
