// wideTableSupport.js

let cleanupWideTableSupport = null;

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function getWideTableState({
  scrollWidth,
  clientWidth,
  scrollLeft,
}) {
  const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
  const wide = maxScrollLeft > 2;

  return {
    wide,
    canScrollLeft: wide && scrollLeft > 2,
    canScrollRight: wide && scrollLeft < maxScrollLeft - 2,
  };
}

export function initializeWideTableSupport() {
  if (cleanupWideTableSupport) {
    cleanupWideTableSupport();
    cleanupWideTableSupport = null;
  }

  const container = document.querySelector('.outputTable');
  const table = container?.querySelector('.merged-table');
  const notice = document.getElementById('wideTableNotice');
  const scrollButtons = Array.from(
    document.querySelectorAll('[data-table-scroll]')
  );

  if (!container || !table || !notice) {
    return;
  }

  let resizeObserver = null;

  function currentState() {
    return getWideTableState({
      scrollWidth: container.scrollWidth,
      clientWidth: container.clientWidth,
      scrollLeft: container.scrollLeft,
    });
  }

  function updateScrollButtons() {
    const state = currentState();

    for (const button of scrollButtons) {
      const direction = Number(button.dataset.tableScroll);
      button.disabled =
        direction < 0
          ? !state.canScrollLeft
          : !state.canScrollRight;
    }
  }

  function updateWideState() {
    const state = currentState();

    container.classList.toggle('is-wide-table', state.wide);
    notice.hidden = !state.wide;
    updateScrollButtons();
  }

  function handleScrollButton(event) {
    const direction = Number(
      event.currentTarget.dataset.tableScroll
    );

    if (!direction) {
      return;
    }

    const distance = Math.max(
      320,
      Math.round(container.clientWidth * 0.7)
    );

    container.scrollBy({
      left: direction * distance,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }

  for (const button of scrollButtons) {
    button.addEventListener('click', handleScrollButton);
  }

  container.addEventListener('scroll', updateScrollButtons, {
    passive: true,
  });

  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(updateWideState);
    resizeObserver.observe(container);
    resizeObserver.observe(table);
  } else {
    window.addEventListener('resize', updateWideState, {
      passive: true,
    });
  }

  requestAnimationFrame(updateWideState);

  cleanupWideTableSupport = () => {
    for (const button of scrollButtons) {
      button.removeEventListener('click', handleScrollButton);
    }

    container.removeEventListener(
      'scroll',
      updateScrollButtons
    );

    if (resizeObserver) {
      resizeObserver.disconnect();
    } else {
      window.removeEventListener('resize', updateWideState);
    }
  };
}
