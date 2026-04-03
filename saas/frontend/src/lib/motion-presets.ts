/** Courbes et durées pour des animations lentes et fluides (respect de prefers-reduced-motion côté composants). */
export const pageTransition = (reduceMotion: boolean | null) =>
  reduceMotion
    ? { duration: 0 }
    : { duration: 0.62, ease: [0.19, 1, 0.22, 1] as const };

export const noticeTransition = (reduceMotion: boolean | null) =>
  reduceMotion
    ? { duration: 0 }
    : { duration: 0.55, ease: [0.17, 1, 0.32, 1] as const };
