import React from 'react';

const IDLE_TIME = 60; // 60 seconds

export const useIdleLock = (isPasswordProtected: boolean) => {
    const [isLocked, setIsLocked] = React.useState(false);
    const [timeLeft, setTimeLeft] = React.useState(IDLE_TIME);
    const idleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetIdleTimer = React.useCallback(() => {
        if (!isPasswordProtected || isLocked) return;
        setTimeLeft(IDLE_TIME);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            if (isPasswordProtected) setIsLocked(true);
        }, IDLE_TIME * 1000);
    }, [isPasswordProtected, isLocked]);

    React.useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        const handler = () => resetIdleTimer();

        events.forEach(e => document.addEventListener(e, handler));
        resetIdleTimer();

        return () => {
            events.forEach(e => document.removeEventListener(e, handler));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, [resetIdleTimer]);

    // Countdown effect
    React.useEffect(() => {
        if (!isPasswordProtected || isLocked) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setIsLocked(true);
                    return IDLE_TIME;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPasswordProtected, isLocked]);

    return {
        isLocked,
        setIsLocked,
        timeLeft,
        resetIdleTimer
    };
};
