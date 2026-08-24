/**
 * -----------------------------------------------------------------
 * transitions.js
 * Page animation timelines + native navigation handling.
 * - runPageOnceAnimation       : intro on every page load
 * - runPageLeaveAnimation      : outro before navigating away
 * - initLeaveTransition        : click interceptor
 * - initHistoryTransitionReset : force reload on browser back/forward
 * - initPrefetch               : hover prefetch
 * No Barba dependency — works with native browser navigation.
 * -----------------------------------------------------------------
 */

import { getReducedMotion } from "./config.js";

import {
  hasLenis,
  updateLenis,
  startLenis,
  stopLenis,
  scrollToTop,
  refreshScrollTrigger,
} from "./scroll.js";

/**
 * Duration constants
 */

export const ONCE_DURATION = 2.35;
export const LEAVE_DURATION = 1;

/**
 * isFirstLoad
 * True only on the very first page load of a session.
 * Exported so other modules can branch on first-load behaviour.
 */

export const isFirstLoad = !sessionStorage.getItem("visited");

if (isFirstLoad) {
  sessionStorage.setItem("visited", "1");
}

// ---------------------------------------------------------------------------

/**
 * resetPage
 * Called at the end of every intro animation.
 * Clears inline GSAP props and restarts Lenis.
 */

function resetPage(container) {
  gsap.set(container, {
    clearProps: "all",
  });

  if (hasLenis) {
    updateLenis();
    startLenis();
    refreshScrollTrigger();
  }
}

// ---------------------------------------------------------------------------

/**
 * runPageOnceAnimation
 * Plays on every fresh page load.
 *
 * @param {Element} container
 * @returns {Promise}
 */

export function runPageOnceAnimation(container) {
  const pageWrapper = document.querySelector(".page-wrapper");
  const transitionWrap = document.querySelector("[data-transition-wrap]");

  if (!transitionWrap) {
    resetPage(container);
    return Promise.resolve();
  }

  const panel = transitionWrap.querySelector("[data-transition-panel]");
  const panelTop = transitionWrap.querySelector("[data-transition-panel-top]");
  const panelBottom = transitionWrap.querySelector(
    "[data-transition-panel-bottom]"
  );

  const tl = gsap.timeline();

  /**
   * Reduced motion
   */

  if (getReducedMotion()) {
    if (pageWrapper) {
      tl.set(pageWrapper, {
        autoAlpha: 1,
      });
    }

    if (panel) {
      tl.set(panel, {
        autoAlpha: 0,
      });
    }

    tl.set(container, {
      autoAlpha: 1,
    });

    tl.call(resetPage, [container]);

    return new Promise((resolve) => {
      tl.call(resolve);
    });
  }

  stopLenis();

  /**
   * Initial states
   */

  if (pageWrapper) {
    tl.set(
      pageWrapper,
      {
        autoAlpha: 1,
      },
      0
    );
  }

  if (panel) {
    tl.set(
      panel,
      {
        autoAlpha: 1,
        yPercent: -100,
      },
      0
    );
  }

  if (panelTop) {
    tl.set(
      panelTop,
      {
        scaleY: 1,
        height: "15vw",
      },
      0
    );
  }

  if (panelBottom) {
    tl.set(
      panelBottom,
      {
        scaleY: 1,
        height: "20vw",
      },
      0
    );
  }

  tl.set(
    container,
    {
      autoAlpha: 0,
    },
    0
  );

  /**
   * Panel slide out + page reveal
   */

  tl.add("startEnter", isFirstLoad ? 0.5 : 0.5);

  tl.set(
    container,
    {
      autoAlpha: 1,
    },
    "startEnter"
  );

  if (panel) {
    tl.fromTo(
      panel,
      {
        yPercent: -100,
      },
      {
        yPercent: -200,
        duration: 1,
        overwrite: "auto",
        immediateRender: false,
      },
      "startEnter"
    );
  }

  if (panelBottom) {
    tl.fromTo(
      panelBottom,
      {
        scaleY: 1,
      },
      {
        scaleY: 0,
        duration: 1,
      },
      "<"
    );
  }

  if (panel) {
    tl.set(
      panel,
      {
        autoAlpha: 0,
      },
      ">"
    );
  }

  tl.from(
    container,
    {
      y: "25dvh",
      duration: 1,
    },
    "startEnter"
  );

  /**
   * Page ready
   */

  tl.add("pageReady");

  tl.call(resetPage, [container], "pageReady");

  return new Promise((resolve) => {
    tl.call(resolve, null, "pageReady");
  });
}

// ---------------------------------------------------------------------------

/**
 * runPageLeaveAnimation
 * Plays when the user clicks an internal link,
 * before the browser navigates.
 *
 * @param {Element} container
 * @returns {GSAPTimeline}
 */

export function runPageLeaveAnimation(container) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");

  if (!transitionWrap) {
    return gsap.timeline();
  }

  const panel = transitionWrap.querySelector("[data-transition-panel]");
  const panelTop = transitionWrap.querySelector("[data-transition-panel-top]");
  const panelBottom = transitionWrap.querySelector(
    "[data-transition-panel-bottom]"
  );

  const tl = gsap.timeline();

  /**
   * Reduced motion
   */

  if (getReducedMotion()) {
    return tl.set(container, {
      autoAlpha: 0,
    });
  }

  /**
   * Initial states
   */

  if (panel) {
    tl.set(
      panel,
      {
        autoAlpha: 1,
      },
      0
    );
  }

  if (panelTop) {
    tl.set(
      panelTop,
      {
        scaleY: 0,
        height: "15vw",
      },
      0
    );
  }

  if (panelBottom) {
    tl.set(
      panelBottom,
      {
        scaleY: 1,
        height: "20vw",
      },
      0
    );
  }

  /**
   * Panel slide in
   */

  if (panel) {
    tl.fromTo(
      panel,
      {
        yPercent: 0,
      },
      {
        yPercent: -100,
        duration: 1,
      },
      0
    );
  }

  if (panelTop) {
    tl.fromTo(
      panelTop,
      {
        scaleY: 0,
      },
      {
        scaleY: 1,
        duration: 1,
      },
      "<"
    );
  }

  /**
   * Page slides up and out
   */

  tl.fromTo(
    container,
    {
      y: "0vh",
    },
    {
      y: "-15dvh",
      duration: 1,
    },
    0
  );

  return tl;
}

// ---------------------------------------------------------------------------

/**
 * initHistoryTransitionReset
 *
 * Fixes browser Back / Forward navigation.
 *
 * Browsers can restore a page from BFCache exactly in the state
 * it had when navigation occurred.
 *
 * This means the transition panel and page transforms created by
 * runPageLeaveAnimation() may still be present.
 *
 * Forcing a clean reload guarantees the normal page entrance
 * initialization runs again.
 */

export function initHistoryTransitionReset() {
  window.addEventListener("pageshow", (event) => {
    const navigationEntry = performance.getEntriesByType("navigation")[0];

    const isHistoryNavigation =
      event.persisted || navigationEntry?.type === "back_forward";

    if (!isHistoryNavigation) return;

    window.location.reload();
  });
}

// ---------------------------------------------------------------------------

/**
 * shouldHandleLink
 * Determines whether a clicked link should trigger
 * the page leave transition.
 *
 * @param {HTMLAnchorElement} link
 * @returns {boolean}
 */

function shouldHandleLink(link) {
  if (!link) return false;

  const href = link.getAttribute("href");

  if (!href) return false;

  if (href.startsWith("#")) return false;
  if (href.startsWith("mailto:")) return false;
  if (href.startsWith("tel:")) return false;
  if (href.startsWith("javascript:")) return false;

  if (link.hasAttribute("download")) return false;

  if (link.target === "_blank") return false;

  const url = new URL(link.href, window.location.href);

  /**
   * External link
   */

  if (url.origin !== window.location.origin) {
    return false;
  }

  /**
   * Same-page anchor
   */

  if (
    url.pathname === window.location.pathname &&
    url.search === window.location.search &&
    url.hash
  ) {
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------

/**
 * initLeaveTransition
 * Intercepts internal link clicks,
 * plays the leave animation,
 * then navigates natively.
 */

export function initLeaveTransition() {
  let isLeaving = false;

  document.addEventListener("click", async (event) => {
    /**
     * Ignore already handled clicks
     */

    if (event.defaultPrevented) return;

    /**
     * Left click only
     */

    if (event.button !== 0) return;

    /**
     * Modifier keys
     */

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const link = event.target.closest("a");

    if (!shouldHandleLink(link)) return;

    /**
     * Prevent double navigation
     */

    if (isLeaving) return;

    event.preventDefault();

    isLeaving = true;

    const destination = link.href;

    const container =
      document.querySelector("[data-barba='container']") || document.body;

    if (hasLenis) {
      stopLenis();
    }

    /**
     * Run leave transition
     */

    await new Promise((resolve) => {
      const tl = runPageLeaveAnimation(container);

      tl.eventCallback("onComplete", resolve);
    });

    /**
     * Native navigation
     */

    window.location.href = destination;
  });
}

// ---------------------------------------------------------------------------

/**
 * initPrefetch
 * Prefetches internal pages on link hover
 * to speed up navigation.
 */

export function initPrefetch() {
  const seen = new Set();

  function prefetch(link) {
    if (!shouldHandleLink(link)) return;

    const href = link.href;

    if (seen.has(href)) return;

    seen.add(href);

    const prefetchLink = document.createElement("link");

    prefetchLink.rel = "prefetch";
    prefetchLink.href = href;

    document.head.appendChild(prefetchLink);
  }

  document.addEventListener(
    "pointerover",
    (event) => {
      const link = event.target.closest("a");

      if (!link) return;

      prefetch(link);
    },
    {
      passive: true,
    }
  );
}
