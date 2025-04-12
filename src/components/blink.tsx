import React, { useState, useEffect } from 'react';

interface BlinkProps {
    delay?: number; // Delay in milliseconds
    children: React.ReactNode;
}

const Blink: React.FC<BlinkProps> = ({ delay = 500, children }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible((prev) => !prev);
        }, delay);

        return () => clearInterval(interval);
    }, [delay]);

    return <div style={{ opacity: isVisible ? 1 : 0.7, transition: `opacity ${delay / 2}ms` }}>{children}</div>;
};

export default Blink;
