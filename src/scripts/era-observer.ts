const initEraObserver = () => {
  const sections = document.querySelectorAll<HTMLElement>('section[data-era]');
  if (!sections.length) return;

  const setEra = (era: string) => {
    if (document.documentElement.dataset.era !== era) {
      document.documentElement.dataset.era = era;
    }
  };

  setEra(sections[0].dataset.era || '');

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length && visible[0].target instanceof HTMLElement) {
        const era = visible[0].target.dataset.era;
        if (era) setEra(era);
      }
    },
    {
      rootMargin: '-45% 0px -45% 0px',
      threshold: [0, 0.01, 0.5, 1],
    },
  );

  sections.forEach((s) => observer.observe(s));
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEraObserver);
} else {
  initEraObserver();
}
