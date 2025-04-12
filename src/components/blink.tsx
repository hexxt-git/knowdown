import React, { useState, useEffect } from "react";

interface BlinkProps {
  delay?: number; // Delay in milliseconds
  children: React.ReactNode;
}

const Blink: React.FC<BlinkProps> = ({ delay = 500, children }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let animationFrameId: number;

    const updateVisibility = () => {
      const now = Date.now();
      const phase = Math.floor(now / delay) % 2;
      setIsVisible(phase === 0);

      animationFrameId = requestAnimationFrame(updateVisibility);
    };

    updateVisibility();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [delay]);

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0.7,
        transition: `opacity ${delay / 2}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default Blink;
