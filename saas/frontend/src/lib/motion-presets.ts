/** Courbes et durées pour les notices (respect de prefers-reduced-motion côté composants). */
export const noticeTransition = (reduceMotion: boolean | null) =>
  reduceMotion
    ? { duration: 0 }
    : { duration: 0.55, ease: [0.17, 1, 0.32, 1] as const };
