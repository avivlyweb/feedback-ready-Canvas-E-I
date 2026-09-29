(function () {
  if (window.__CANVAS_FEEDBACK_AGENT_LOADED__) return;
  window.__CANVAS_FEEDBACK_AGENT_LOADED__ = true;

  let currentMode = 'comment';

  function dimensions() {
    const doc = document.documentElement;
    const body = document.body || doc;
    return {
      docW: Math.max(body.scrollWidth, body.offsetWidth, doc.scrollWidth, doc.offsetWidth, doc.clientWidth, innerWidth),
      docH: Math.max(body.scrollHeight, body.offsetHeight, doc.scrollHeight, doc.offsetHeight, doc.clientHeight, innerHeight),
    };
  }

  function send(type, payload) {
    if (parent !== window) parent.postMessage({ source: 'canvas-feedback-agent', type, ...payload }, '*');
  }

  function selectorFor(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return '';
    if (element.dataset && element.dataset.testid) return `[data-testid="${element.dataset.testid}"]`;
    if (element.id) return `#${element.id}`;
    const path = [];
    let current = element;
    while (current && current !== document.body && current !== document.documentElement && path.length < 5) {
      let selector = current.tagName.toLowerCase();
      const parentElement = current.parentElement;
      if (parentElement) {
        const siblings = Array.from(parentElement.children).filter((item) => item.tagName === current.tagName);
        if (siblings.length > 1) selector += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }
      path.unshift(selector);
      current = parentElement;
    }
    return path.join(' > ');
  }

  function ready() {
    send('ready', {
      path: location.pathname || '/',
      title: document.title || 'Page',
      ...dimensions(),
      scrollY: scrollY || pageYOffset || 0,
      viewportW: innerWidth,
      viewportH: innerHeight,
    });
  }

  addEventListener('scroll', () => send('scroll', { scrollY: scrollY || pageYOffset || 0 }), { passive: true });

  document.addEventListener('click', (event) => {
    if (currentMode !== 'comment') return;
    const element = event.target;
    if (!element || (element.closest && element.closest('.canvas-feedback-injected-pin'))) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = element.getBoundingClientRect();
    const pageX = event.pageX || event.clientX + (scrollX || pageXOffset || 0);
    const pageY = event.pageY || event.clientY + (scrollY || pageYOffset || 0);
    const { docW, docH } = dimensions();
    send('click', {
      selector: selectorFor(element),
      textSnippet: (element.innerText || element.textContent || '').trim().slice(0, 100),
      offsetXInElement: rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5,
      offsetYInElement: rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5,
      docX: Math.round((pageX / docW) * 10000) / 100,
      docY: Math.round((pageY / docH) * 10000) / 100,
      scrollY: scrollY || pageYOffset || 0,
      viewportW: innerWidth,
      viewportH: innerHeight,
      path: location.pathname || '/',
    });
  }, true);

  addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data.source !== 'canvas-feedback-parent') return;
    if (data.type === 'setMode') {
      currentMode = data.mode;
      if (document.body) document.body.style.cursor = currentMode === 'comment' ? 'crosshair' : 'default';
    }
    if (data.type === 'scrollTo') {
      let target = null;
      try { if (data.selector) target = document.querySelector(data.selector); } catch {}
      const docH = dimensions().docH;
      const top = target
        ? pageYOffset + target.getBoundingClientRect().top - innerHeight / 2
        : typeof data.docY === 'number' ? (data.docY / 100) * docH - innerHeight / 2 : 0;
      scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      if (data.highlight && target) {
        const outline = target.style.outline;
        target.style.outline = '3px solid #6366f1';
        setTimeout(() => { target.style.outline = outline; }, 1800);
      }
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
  addEventListener('load', ready, { once: true });

  if (window.ResizeObserver && document.body) {
    new ResizeObserver(() => send('resize', dimensions())).observe(document.body);
  }
})();
