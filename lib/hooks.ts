"use client";
import { useState, useEffect } from "react";

export function useResponsive() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return { mob: w < 768, tab: w >= 768 && w < 1024, cols: w < 768 ? 1 : w < 1024 ? 2 : 4 };
}

export function smoothScroll(el: HTMLElement, distance: number) {
  const start = el.scrollLeft;
  const duration = 900;
  let startTime: number | null = null;
  const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  el.style.scrollSnapType = "none";
  const step = (time: number) => {
    if (!startTime) startTime = time;
    const progress = Math.min((time - startTime) / duration, 1);
    el.scrollLeft = start + distance * ease(progress);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.style.scrollSnapType = "x mandatory";
    }
  };
  requestAnimationFrame(step);
}
