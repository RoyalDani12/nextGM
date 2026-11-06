import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  direction?: "up" | "scale" | "fade";
}

export function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  direction = "up",
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = domRef.current;
    if (!el) return;

    // Trigger reveal 30px before it comes fully into view for buttery smooth feel
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.08,
        rootMargin: "30px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animationStyle = {
    transitionDelay: `${delayMs}ms`,
  };

  const getTransformClasses = () => {
    if (!isVisible) {
      if (direction === "up") return "opacity-0 translate-y-8 scale-[0.98]";
      if (direction === "scale") return "opacity-0 scale-95 translate-y-4";
      return "opacity-0";
    }
    return "opacity-100 translate-y-0 scale-100";
  };

  return (
    <div
      ref={domRef}
      style={animationStyle}
      className={`transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${getTransformClasses()} ${className}`}
    >
      {children}
    </div>
  );
}
