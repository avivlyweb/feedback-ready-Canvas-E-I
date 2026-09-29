/**
 * agent.js - Injected client agent for live reviewed websites.
 * Runs inside the same-origin iframe (served via proxy or local dev),
 * communicates with the parent CanvasFeedback window via postMessage.
 *
 * Capabilities:
 * - Emits 'ready' with page path, title, document dimensions (docW, docH)
 * - Emits 'scroll' with scroll position
 * - Listens for 'click' in comment mode and generates precise CSS selector,
 *   text snippet, element offsets, and normalized docX / docY fractions (0..100)
 * - Listens for 'scrollTo' { selector, docY, highlight }
 * - Listens for 'setMode' { mode: 'comment' | 'browse' }
 * - Re-evaluates pin positions and notifies parent if elements move
 */

(function () {
  if (window.__CANVAS_FEEDBACK_AGENT_LOADED__) return;
  window.__CANVAS_FEEDBACK_AGENT_LOADED__ = true;

  let currentMode = 'comment';
  let isNavigating = false;

  // Helper: compute stable unique CSS selector
  function getElementSelector(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
    if (el.getAttribute('data-testid')) {
      return `[data-testid="${el.getAttribute('data-testid')}"]`;
    }
    if (el.id) {
      return `#${el.id}`;
    }

    const path = [];
    let current = el;

    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body && current !== document.documentElement) {
      let tag = current.tagName.toLowerCase();
      let parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((c) => c.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          tag += `:nth-of-type(${index})`;
        }
      }
      path.unshift(tag);
      current = parent;
      if (path.length >= 5) break; // keep path reasonably short
    }

    return path.join(' > ') || el.tagName.toLowerCase();
  }

  function getDocumentDimensions() {
    const doc = document.documentElement;
    const body = document.body || { scrollHeight: 0, offsetHeight: 0, scrollWidth: 0, offsetWidth: 0 };
    const docW = Math.max(
      body.scrollWidth,
      doc.scrollWidth,
      body.offsetWidth,
      doc.offsetWidth,
      doc.clientWidth
    );
    const docH = Math.max(
      body.scrollHeight,
      doc.scrollHeight,
      body.offsetHeight,
      doc.offsetHeight,
      doc.clientHeight
    );
    return { docW: Math.max(docW, window.innerWidth), docH: Math.max(docH, window.innerHeight) };
  }

  function sendToParent(type, payload) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          source: 'canvas-feedback-agent',
          type,
          ...payload,
        },
        '*'
      );
    }
  }

  // Send ready event
  function notifyReady() {
    const { docW, docH } = getDocumentDimensions();
    sendToParent('ready', {
      path: window.location.pathname || '/',
      title: document.title || 'Page',
      docW,
      docH,
      scrollY: window.scrollY || window.pageYOffset || 0,
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
    });
  }

  // Scroll listener
  window.addEventListener(
    'scroll',
    () => {
      sendToParent('scroll', {
        scrollY: window.scrollY || window.pageYOffset || 0,
      });
    },
    { passive: true }
  );

  // Click capture in comment mode
  document.addEventListener(
    'click',
    (e) => {
      if (currentMode !== 'comment') return;

      // Don't trigger if clicked on an injected pin overlay
      const target = e.target;
      if (target && target.closest && target.closest('.canvas-feedback-injected-pin')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const el = e.target;
      const rect = el.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      const offsetXInElement = rect.width > 0 ? offsetX / rect.width : 0.5;
      const offsetYInElement = rect.height > 0 ? offsetY / rect.height : 0.5;

      const pageX = e.pageX || e.clientX + (window.scrollX || window.pageXOffset || 0);
      const pageY = e.pageY || e.clientY + (window.scrollY || window.pageYOffset || 0);

      const { docW, docH } = getDocumentDimensions();
      const docX = docW > 0 ? (pageX / docW) * 100 : 50;
      const docY = docH > 0 ? (pageY / docH) * 100 : 50;

      const selector = getElementSelector(el);
      const textSnippet = (el.innerText || el.textContent || '').trim().substring(0, 100);

      sendToParent('click', {
        selector,
        textSnippet,
        offsetXInElement,
        offsetYInElement,
        docX: Math.round(docX * 100) / 100,
        docY: Math.round(docY * 100) / 100,
        scrollY: window.scrollY || window.pageYOffset || 0,
        viewportW: window.innerWidth,
        viewportH: window.innerHeight,
        path: window.location.pathname || '/',
      });
    },
    true // Capture phase to intercept clicks before any page link navigation
  );

  // Handle parent instructions
  window.addEventListener('message', (e) => {
    const data = e.data;
    if (!data || data.source !== 'canvas-feedback-parent') return;

    if (data.type === 'setMode') {
      currentMode = data.mode;
      if (document.body) {
        if (currentMode === 'comment') {
          document.body.style.cursor = 'crosshair';
        } else {
          document.body.style.cursor = 'default';
        }
      }
    }

    if (data.type === 'scrollTo') {
      let targetY = 0;
      let targetEl = null;

      if (data.selector) {
        try {
          targetEl = document.querySelector(data.selector);
        } catch (err) {
          // invalid selector syntax
        }
      }

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        targetY = window.pageYOffset + rect.top - window.innerHeight / 2 + rect.height / 2;
      } else if (typeof data.docY === 'number') {
        const { docH } = getDocumentDimensions();
        targetY = (data.docY / 100) * docH - window.innerHeight / 2;
      }

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth',
      });

      if (data.highlight && targetEl) {
        const originalOutline = targetEl.style.outline;
        const originalTransition = targetEl.style.transition;
        targetEl.style.transition = 'outline 0.2s ease';
        targetEl.style.outline = '3px solid #6366f1';
        targetEl.classList.add('canvas-pulse-highlight');

        setTimeout(() => {
          targetEl.style.outline = originalOutline;
          targetEl.style.transition = originalTransition;
          targetEl.classList.remove('canvas-pulse-highlight');
        }, 1800);
      }
    }

    if (data.type === 'navigate' && data.path) {
      if (window.location.pathname !== data.path) {
        isNavigating = true;
        window.location.href = data.path;
      }
    }
  });

  // Pulse CSS styling injection
  const style = document.createElement('style');
  style.textContent = `
    @keyframes canvasPulse {
      0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
      70% { box-shadow: 0 0 0 12px rgba(99, 102, 241, 0); }
      100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
    }
    .canvas-pulse-highlight {
      animation: canvasPulse 1.5s ease-out;
    }
  `;
  document.head.appendChild(style);

  // Ready triggers
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    notifyReady();
  } else {
    document.addEventListener('DOMContentLoaded', notifyReady);
    window.addEventListener('load', notifyReady);
  }

  // Monitor DOM resize to inform parent
  if (window.ResizeObserver && document.body) {
    const ro = new ResizeObserver(() => {
      const { docW, docH } = getDocumentDimensions();
      sendToParent('resize', { docW, docH });
    });
    ro.observe(document.body);
  }
})();
