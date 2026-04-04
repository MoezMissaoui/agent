/** Easing and duration for notices (components should respect prefers-reduced-motion). */
export const noticeTransition = (reduceMotion: boolean | null) =>
  reduceMotion
    ? { duration: 0 }
    : { duration: 0.55, ease: [0.17, 1, 0.32, 1] as const };
