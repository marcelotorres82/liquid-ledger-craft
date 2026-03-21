export const sparkleTransition = {
  duration: 0.6,
  ease: [0.2, 0, 0, 1] as const,
};

export const sparkleCardInitial = {
  opacity: 0,
  y: 20,
  scale: 0.98,
};

export const sparkleCardAnimate = {
  opacity: 1,
  y: 0,
  scale: 1,
};

export const sparkleItemInitial = {
  opacity: 0,
  x: -10,
};

export const sparkleItemAnimate = {
  opacity: 1,
  x: 0,
};
