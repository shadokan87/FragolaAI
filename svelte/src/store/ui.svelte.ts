export function createTimeout(ms: number = 5000, callback?: () => void) {
    let isActive = $state(false);
    let timeoutId = $state(-1);
    const _callback = () => {
        isActive = false;
        callback && callback();
    }

    return {
        get isActive() {
            return isActive
        },
        extend() {
            if (timeoutId)
                clearTimeout(timeoutId);
            timeoutId = setTimeout(_callback, ms) as unknown as number;
        },
        trigger() {
            if (!isActive) {
                isActive = true;
                timeoutId = setTimeout(_callback, ms) as unknown as number;
            }
        }
    }
}