import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const ScreenShake = ({ intensity = 0, duration = 500, children, className = "" }) => {
  const shakeRef = useRef();
  const timeoutRef = useRef();

  useEffect(() => {
    if (intensity > 0 && shakeRef.current) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Apply shake effect
      const element = shakeRef.current;
      element.style.animation = `screen-shake-${intensity} ${duration}ms ease-in-out`;
      
      // Remove animation after duration
      timeoutRef.current = setTimeout(() => {
        if (element) {
          element.style.animation = '';
        }
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [intensity, duration]);

  // Generate shake keyframes based on intensity
  const getShakeVariants = () => {
    const baseShake = intensity * 2;
    return {
      initial: { x: 0, y: 0 },
      shake: {
        x: [0, -baseShake, baseShake, -baseShake * 0.8, baseShake * 0.6, -baseShake * 0.4, baseShake * 0.2, 0],
        y: [0, baseShake * 0.5, -baseShake * 0.7, baseShake * 0.3, -baseShake * 0.5, baseShake * 0.2, -baseShake * 0.1, 0],
        transition: {
          duration: duration / 1000,
          ease: "easeInOut"
        }
      }
    };
  };

  return (
    <motion.div
      ref={shakeRef}
      className={className}
      variants={getShakeVariants()}
      initial="initial"
      animate={intensity > 0 ? "shake" : "initial"}
    >
      {children}
    </motion.div>
  );
};

export default ScreenShake;
