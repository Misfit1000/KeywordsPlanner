import React, { useEffect, useRef, useState } from 'react';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function MotionReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => prefersReducedMotion());

  useEffect(() => {
    const element = elementRef.current;
    if (!element || visible) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={elementRef}
      className={`motion-reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={{ '--motion-delay': `${Math.max(0, delay)}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

export function useAnimatedNumber(target: number, duration = 650) {
  const safeTarget = Number.isFinite(target) ? target : 0;
  const [displayValue, setDisplayValue] = useState(() => prefersReducedMotion() ? safeTarget : 0);
  const displayedRef = useRef(displayValue);

  useEffect(() => {
    if (prefersReducedMotion()) {
      displayedRef.current = safeTarget;
      setDisplayValue(safeTarget);
      return;
    }

    const startValue = displayedRef.current;
    const delta = safeTarget - startValue;
    if (Math.abs(delta) < 0.01) return;

    let frame = 0;
    const startedAt = performance.now();
    const update = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - startedAt) / Math.max(1, duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + delta * eased;
      displayedRef.current = nextValue;
      setDisplayValue(nextValue);
      if (progress < 1) frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, safeTarget]);

  return displayValue;
}
