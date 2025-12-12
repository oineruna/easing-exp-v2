// src/utils/easings.ts
import { EasingFunction } from "../experiment";

const VAR_MAP: Record<EasingFunction, string> = {
    linear: "--linear",
    easeInOutQuad: "--easeInOutQuad",
    easeInOutQuint: "--easeInOutQuint",
    easeInOutExpo: "--easeInOutExpo",
    easeInOutBack: "--easeInOutBack",
};

export const getEasingBezier = (easing: EasingFunction): [number, number, number, number] => {
    // Default fallback (matches easing_functions.css values)
    const defaults: Record<EasingFunction, [number, number, number, number]> = {
        linear: [0.25, 0.25, 0.75, 0.75],
        easeInOutQuad: [0.455, 0.03, 0.515, 0.955],
        easeInOutQuint: [0.86, 0, 0.07, 1],
        easeInOutExpo: [1, 0, 0, 1],
        easeInOutBack: [0.68, -0.55, 0.265, 1.55]
    };

    if (typeof window === 'undefined') return defaults[easing];

    const val = getComputedStyle(document.documentElement).getPropertyValue(VAR_MAP[easing]).trim();
    if (!val) return defaults[easing];

    // Parse cubic-bezier(n, n, n, n)
    const match = val.match(/cubic-bezier\(([\d.-]+),\s*([\d.-]+),\s*([\d.-]+),\s*([\d.-]+)\)/);
    if (match) {
        return [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]), parseFloat(match[4])];
    }
    return defaults[easing];
};
