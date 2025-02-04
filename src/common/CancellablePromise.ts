export interface ICancelablePromise {
    promise: Promise<any>;
    cancel: () => void;
}

export const cancellablePromise = (promise: Promise<any>): ICancelablePromise => {
    let isCanceled = false;

    const wrappedPromise = new Promise((resolve, reject) => {
        promise.then(
            (value) => (isCanceled ? reject({ isCanceled, value }) : resolve(value)),
            (error) => reject({ isCanceled, error }),
        );
    });

    return {
        promise: wrappedPromise,
        cancel: () => (isCanceled = true),
    };
};

export default cancellablePromise;
