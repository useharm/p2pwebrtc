import { useCallback, useEffect, useRef, useState } from "react";

export default function useStateWithCallback(initialState) {
    const [state, setState] = useState(initialState);
    const callback = useRef(null);

    const updateState = useCallback((newState, cb) => {
        callback.current = cb;

        setState(prev => typeof newState === 'function' ? newState(prev) : newState);
    }, [])

    useEffect(() => {
        if (callback.current) {
            callback.current(state);
            callback.current = null;
        }
    }, [state])

    return [state, updateState];
}