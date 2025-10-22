/**
 * Giftsmate Chat Widget - Lazy Bootstrap
 *
 * Progressive enhancement loader that hydrates the static shell on user intent.
 * Warms widget on idle/viewport proximity for better perceived performance.
 *
 * @version 2.0.0
 * @date 2025-10-22
 * @size ~6KB unminified, ~2.5KB gzipped
 * @requires ES2018+ browser (Chrome 60+, Firefox 55+, Safari 11+)
 */

(function() {
  'use strict';

  // ============================================================================
  // CONFIG - Adjust these as needed
  // ============================================================================

  const CONFIG = {
    // Widget bundle URL (will be versioned via PHP)
    WIDGET_SRC: window.GIFTSMATE_WIDGET_URL || '/wp-content/uploads/2025/10/giftsmate-chat.js?v=20251022',

    // Feature flags
    PREFETCH_ON_IDLE: true,
    PREFETCH_ON_NEAR_VIEWPORT: true,
    PRECONNECT_API_BASE: true,

    // Timing
    IDLE_TIMEOUT_FALLBACK: 4000, // ms to wait if requestIdleCallback unavailable
    VIEWPORT_THRESHOLD: '100px',  // Load when within 1 viewport height
    SCRIPT_LOAD_TIMEOUT: 10000,   // 10s timeout for script loading
  };

  // ============================================================================
  // STATE
  // ============================================================================

  let widgetLoadState = {
    prefetched: false,
    loading: false,
    loaded: false,
    error: null,
  };

  let apiPreconnected = new Set(); // Track which API bases we've preconnected to

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Get query parameter from URL
   * @param {string} name - Parameter name
   * @returns {string} - Parameter value (trimmed) or empty string
   */
  function getQueryParam(name) {
    const searchParams = new URLSearchParams(window.location.search);
    const value = searchParams.get(name);
    return value ? value.trim() : '';
  }

  /**
   * STEP 5: Analytics - Bucket load time into ranges
   * @param {number} ms - Milliseconds
   * @returns {string} - Bucketed range
   */
  function bucket(ms) {
    if (ms < 300) return '<300';
    if (ms < 600) return '300-600';
    if (ms < 1000) return '600-1000';
    if (ms < 2000) return '1-2s';
    return '>2s';
  }

  /**
   * STEP 5: Analytics - Emit event beacon
   * @param {string} event - Event name
   * @param {object} data - Event data (lightweight, no PII)
   */
  function emit(event, data) {
    try {
      const url = window.GIFTSMATE_METRICS_URL || 'https://gm-ai-pages.vercel.app/api/metrics/gm-widget';
      const payload = JSON.stringify({ event: event, ts: Date.now(), ...data });

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(function() {}); // Silent fail
      }
    } catch (_e) {
      // Fail silently, never block UX
    }
  }

  /**
   * Preconnect to API base for faster future requests
   */
  function preconnectToAPI(apiBase) {
    if (!CONFIG.PRECONNECT_API_BASE || !apiBase || apiPreconnected.has(apiBase)) {
      return;
    }

    try {
      const url = new URL(apiBase);
      const origin = url.origin;

      // Check if link already exists
      if (document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
        apiPreconnected.add(apiBase);
        return;
      }

      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);

      apiPreconnected.add(apiBase);
    } catch (e) {
      // Invalid URL, skip silently
    }
  }

  /**
   * Prefetch widget bundle (non-blocking)
   */
  function prefetchWidget() {
    if (widgetLoadState.prefetched || widgetLoadState.loading || widgetLoadState.loaded) {
      return;
    }

    // Check if already exists
    if (document.querySelector(`link[rel="prefetch"][href="${CONFIG.WIDGET_SRC}"]`)) {
      widgetLoadState.prefetched = true;
      return;
    }

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'script';
    link.href = CONFIG.WIDGET_SRC;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    widgetLoadState.prefetched = true;
  }

  /**
   * Load widget bundle and wait for it to be ready
   * @returns {Promise<void>}
   */
  function ensureWidgetLoaded() {
    // Already loaded
    if (widgetLoadState.loaded && window.GiftsmateChat) {
      return Promise.resolve();
    }

    // Already loading
    if (widgetLoadState.loading) {
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (widgetLoadState.loaded && window.GiftsmateChat) {
            clearInterval(checkInterval);
            resolve();
          } else if (widgetLoadState.error) {
            clearInterval(checkInterval);
            reject(widgetLoadState.error);
          }
        }, 100);

        // Timeout after 10s
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!widgetLoadState.loaded) {
            reject(new Error('Widget load timeout'));
          }
        }, CONFIG.SCRIPT_LOAD_TIMEOUT);
      });
    }

    // Start loading
    widgetLoadState.loading = true;

    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${CONFIG.WIDGET_SRC}"]`);
      if (existingScript) {
        // Script exists but may not be loaded yet
        existingScript.addEventListener('load', () => {
          widgetLoadState.loaded = true;
          widgetLoadState.loading = false;
          resolve();
        });
        existingScript.addEventListener('error', () => {
          const err = new Error('Widget script failed to load');
          widgetLoadState.error = err;
          widgetLoadState.loading = false;
          reject(err);
        });
        return;
      }

      // Inject new script
      const script = document.createElement('script');
      script.src = CONFIG.WIDGET_SRC;
      script.defer = true;
      script.crossOrigin = 'anonymous';

      script.onload = () => {
        widgetLoadState.loaded = true;
        widgetLoadState.loading = false;
        resolve();
      };

      script.onerror = () => {
        const err = new Error('Widget script failed to load');
        widgetLoadState.error = err;
        widgetLoadState.loading = false;
        reject(err);
      };

      // Timeout fallback
      setTimeout(() => {
        if (!widgetLoadState.loaded && !widgetLoadState.error) {
          script.onerror();
        }
      }, CONFIG.SCRIPT_LOAD_TIMEOUT);

      document.head.appendChild(script);
    });
  }

  /**
   * Parse chips from pipe-separated string
   */
  function parseChips(chipsString) {
    if (!chipsString || typeof chipsString !== 'string') {
      return [];
    }

    return chipsString
      .split('|')
      .map(s => s.trim())
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i) // Dedupe
      .slice(0, 12); // Cap at 12
  }

  /**
   * Set loading state on shell
   */
  function setLoadingState(shell, loading) {
    if (loading) {
      shell.setAttribute('aria-busy', 'true');
      shell.classList.add('gm-chat--loading');

      // Update button text
      const btn = shell.querySelector('.gm-chat-shell__btn-primary');
      if (btn) {
        btn.setAttribute('data-original-text', btn.textContent);
        btn.innerHTML = '⏳ Loading chat...';
      }
    } else {
      shell.setAttribute('aria-busy', 'false');
      shell.classList.remove('gm-chat--loading');

      // Restore button text
      const btn = shell.querySelector('.gm-chat-shell__btn-primary');
      if (btn && btn.getAttribute('data-original-text')) {
        btn.textContent = btn.getAttribute('data-original-text');
      }
    }
  }

  /**
   * Show error state on shell
   */
  function setErrorState(shell, error) {
    shell.classList.add('gm-chat--error');
    shell.setAttribute('aria-busy', 'false');

    // Find or create error container
    let errorNode = shell.querySelector('.gm-chat-shell__error');
    if (!errorNode) {
      errorNode = document.createElement('div');
      errorNode.className = 'gm-chat-shell__error';
      errorNode.setAttribute('role', 'alert');
      errorNode.setAttribute('aria-live', 'polite');

      const actions = shell.querySelector('.gm-chat-shell__actions');
      if (actions) {
        actions.parentNode.insertBefore(errorNode, actions);
      } else {
        shell.appendChild(errorNode);
      }
    }

    errorNode.innerHTML = `
      <p>Unable to load the AI chat widget. Please try again.</p>
      <button type="button" class="gm-chat-shell__btn-retry">
        ↻ Retry
      </button>
    `;

    // Wire retry button
    const retryBtn = errorNode.querySelector('.gm-chat-shell__btn-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        errorNode.remove();
        shell.classList.remove('gm-chat--error');
        widgetLoadState.error = null;
        widgetLoadState.loading = false;
        openChat(shell);
      });
    }
  }

  /**
   * Mount the widget into the shell
   */
  function mountWidget(shell, config) {
    // Build mount config
    const mountConfig = {
      apiBase: config.apiBase,
      starterPrompts: config.chips || [],
      firstPrompt: config.firstPrompt || '',
      relationship: config.relationship || '',
      occasion: config.occasion || '',
      snapshotKey: config.snapshotKey || '',
      snapshotLimit: parseInt(config.snapshotLimit, 10) || 8,
    };

    try {
      // Path 1: Modern mount API
      if (window.GiftsmateChat && typeof window.GiftsmateChat.mount === 'function') {
        // Find or create mount point
        let root = shell.querySelector('.gm-chat-root');
        if (!root) {
          root = document.createElement('div');
          root.className = 'gm-chat-root';

          // Clear placeholder grid and insert mount point
          const grid = shell.querySelector('.gm-chat-shell__snapshot-grid');
          if (grid) {
            grid.style.display = 'none';
          }

          const actions = shell.querySelector('.gm-chat-shell__actions');
          if (actions) {
            actions.parentNode.insertBefore(root, actions);
          } else {
            shell.appendChild(root);
          }
        }

        // Mount
        window.GiftsmateChat.mount(root, mountConfig);

      } else {
        // Path 2: Web Component fallback
        const widget = document.createElement('giftsmate-chat');
        widget.setAttribute('api-base', mountConfig.apiBase);

        if (mountConfig.starterPrompts.length > 0) {
          widget.setAttribute('starter-prompts', mountConfig.starterPrompts.join('|'));
        }

        // STEP 4: Try first-prompt attribute, fallback to data-first-prompt
        if (mountConfig.firstPrompt) {
          widget.setAttribute('first-prompt', mountConfig.firstPrompt);
          widget.setAttribute('data-first-prompt', mountConfig.firstPrompt); // Fallback
        }

        // Future-proof data attributes
        if (mountConfig.relationship) {
          widget.setAttribute('data-relationship', mountConfig.relationship);
        }
        if (mountConfig.occasion) {
          widget.setAttribute('data-occasion', mountConfig.occasion);
        }

        // Hide placeholder grid
        const grid = shell.querySelector('.gm-chat-shell__snapshot-grid');
        if (grid) {
          grid.style.display = 'none';
        }

        // Insert widget
        const actions = shell.querySelector('.gm-chat-shell__actions');
        if (actions) {
          actions.parentNode.insertBefore(widget, actions);
        } else {
          shell.appendChild(widget);
        }
      }

      // Mark as hydrated
      shell.classList.add('gm-chat--hydrated');
      setLoadingState(shell, false);

    } catch (err) {
      console.error('[Giftsmate Bootstrap] Mount error:', err);
      setErrorState(shell, err);
    }
  }

  /**
   * Open chat - load widget and mount
   * @param {HTMLElement} shell - Widget shell
   * @param {string|boolean} source - 'cta', 'chip', 'auto', or false/undefined for skipAnnouncement
   */
  async function openChat(shell, source) {
    // Prevent double-loading
    if (shell.classList.contains('gm-chat--hydrated') ||
        shell.classList.contains('gm-chat--loading')) {
      return;
    }

    // Read config from data attributes
    let chips = parseChips(shell.dataset.chips || '');
    let firstPrompt = shell.dataset.firstPrompt || '';

    // STEP 4: Get URL params
    const urlChip = shell.dataset.urlChip || '';
    const urlFirstPrompt = shell.dataset.urlFirstPrompt || '';

    // Override firstPrompt if URL param exists
    if (urlFirstPrompt) {
      firstPrompt = urlFirstPrompt;
    }

    // Reorder chips to put selected chip first (case-insensitive match + dedupe)
    if (urlChip) {
      const chipLower = urlChip.toLowerCase();
      const matchIndex = chips.findIndex(c => c.toLowerCase() === chipLower);

      if (matchIndex !== -1) {
        // Move matched chip to front
        const [matched] = chips.splice(matchIndex, 1);
        chips.unshift(matched);
      } else {
        // Chip not in list, add it to front
        chips.unshift(urlChip);
      }
    }

    const config = {
      relationship: shell.dataset.relationship || '',
      occasion: shell.dataset.occasion || '',
      chips: chips,
      firstPrompt: firstPrompt,
      snapshotKey: shell.dataset.snapshotKey || '',
      snapshotLimit: shell.dataset.snapshotLimit || '8',
      apiBase: shell.dataset.apiBase || 'https://gm-ai-pages.vercel.app',
    };

    // STEP 5: Analytics - Emit auto_open or chat_open
    const baseContext = {
      page_path: location.pathname,
      snapshot_key: config.snapshotKey,
      relationship: config.relationship,
      occasion: config.occasion,
      ua_mobile: /Mobi|Android/i.test(navigator.userAgent)
    };

    if (source === 'auto') {
      // Auto-open event
      emit('auto_open', {
        ...baseContext,
        chip: urlChip || '',
        first_prompt_present: !!urlFirstPrompt,
        auto_open: true
      });
    } else if (source === 'cta' || source === 'chip') {
      // User-initiated open
      emit('chat_open', {
        ...baseContext,
        source: source,
        chip: urlChip || ''
      });
    }

    // STEP 4: Announce auto-open for accessibility
    const skipAnnouncement = (source === 'cta' || source === 'chip');
    if (!skipAnnouncement && (urlFirstPrompt || urlChip)) {
      const announceText = urlFirstPrompt
        ? `Opening AI Gift Finder for: ${urlFirstPrompt}`
        : `Opening AI Gift Finder for: ${urlChip}`;

      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('role', 'status');
      announcer.className = 'sr-only';
      announcer.textContent = announceText;
      shell.appendChild(announcer);

      // Remove after announcement
      setTimeout(() => announcer.remove(), 3000);
    }

    // Preconnect to API
    preconnectToAPI(config.apiBase);

    // Set loading state
    setLoadingState(shell, true);

    // STEP 5: Track load start time
    const loadStart = Date.now();

    try {
      // Load widget script
      await ensureWidgetLoaded();

      // Mount widget
      mountWidget(shell, config);

      // STEP 5: Analytics - widget loaded successfully
      const loadTime = Date.now() - loadStart;
      emit('widget_loaded', {
        ...baseContext,
        lt: bucket(loadTime)
      });

    } catch (err) {
      console.error('[Giftsmate Bootstrap] Load error:', err);
      setLoadingState(shell, false);
      setErrorState(shell, err);

      // STEP 5: Analytics - widget error
      let errorCode = 'unknown';
      if (err.message && err.message.includes('timeout')) {
        errorCode = 'timeout';
      } else if (err.message && err.message.includes('load')) {
        errorCode = 'network';
      }

      emit('widget_error', {
        ...baseContext,
        code: errorCode
      });
    }
  }

  /**
   * Update gift finder link with current params
   */
  function updateGiftFinderLink(shell, chipParam, firstPromptParam) {
    const link = shell.querySelector('[data-gift-finder-link]');
    if (!link) return;

    const baseUrl = link.pathname || '/gift-finder/';
    const params = new URLSearchParams();

    if (chipParam) params.set('chip', chipParam);
    if (firstPromptParam) params.set('first_prompt', firstPromptParam);

    const newUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    link.href = newUrl;
  }

  /**
   * Setup event handlers for a shell instance
   */
  function setupShell(shell) {
    // STEP 4: Get URL parameters
    const chipParam = getQueryParam('chip');
    const firstPromptParam = getQueryParam('first_prompt');
    const autoOpen = getQueryParam('auto_open') === '1';

    // Store these for later use in openChat
    shell.dataset.urlChip = chipParam;
    shell.dataset.urlFirstPrompt = firstPromptParam;
    shell.dataset.urlAutoOpen = autoOpen ? '1' : '';

    // Wire primary CTA button
    const primaryBtn = shell.querySelector('.gm-chat-shell__btn-primary');
    if (primaryBtn) {
      primaryBtn.disabled = false;
      primaryBtn.style.cursor = 'pointer';
      primaryBtn.style.opacity = '1';

      primaryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openChat(shell, 'cta');
      });
    }

    // Wire chip links - intercept clicks and highlight
    const chips = shell.querySelectorAll('.gm-chat-shell__chip');
    let activeChip = null;

    chips.forEach(chip => {
      const chipText = chip.dataset.chipText || chip.textContent.trim();

      // STEP 4: Highlight if matches URL param (case-insensitive)
      if (chipParam && chipText.toLowerCase() === chipParam.toLowerCase()) {
        chip.classList.add('gm-chat-shell__chip--active');
        activeChip = chip;
      }

      // Intercept click - prevent navigation, highlight, and open chat
      chip.addEventListener('click', (e) => {
        e.preventDefault();

        // STEP 5: Analytics - chip click
        emit('chip_click', {
          page_path: location.pathname,
          snapshot_key: shell.dataset.snapshotKey || '',
          relationship: shell.dataset.relationship || '',
          occasion: shell.dataset.occasion || '',
          chip: chipText,
          ua_mobile: /Mobi|Android/i.test(navigator.userAgent)
        });

        // Update active state
        chips.forEach(c => c.classList.remove('gm-chat-shell__chip--active'));
        chip.classList.add('gm-chat-shell__chip--active');
        activeChip = chip;

        // Update stored chip param
        shell.dataset.urlChip = chipText;

        // Update gift finder link
        updateGiftFinderLink(shell, chipText, shell.dataset.urlFirstPrompt);

        // Open chat with selected chip
        openChat(shell, 'chip');
      });
    });

    // Update gift finder link on initial load
    updateGiftFinderLink(shell, chipParam, firstPromptParam);

    // Preconnect to API base
    const apiBase = shell.dataset.apiBase;
    if (apiBase) {
      preconnectToAPI(apiBase);
    }
  }

  /**
   * Setup idle prefetch
   */
  function setupIdlePrefetch() {
    if (!CONFIG.PREFETCH_ON_IDLE) return;

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        prefetchWidget();
      }, { timeout: CONFIG.IDLE_TIMEOUT_FALLBACK });
    } else {
      setTimeout(() => {
        prefetchWidget();
      }, CONFIG.IDLE_TIMEOUT_FALLBACK);
    }
  }

  /**
   * Setup viewport-based prefetch using IntersectionObserver
   */
  function setupViewportPrefetch(shells) {
    if (!CONFIG.PREFETCH_ON_NEAR_VIEWPORT) return;
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            prefetchWidget();
            // Disconnect after first trigger
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: CONFIG.VIEWPORT_THRESHOLD,
      }
    );

    shells.forEach(shell => observer.observe(shell));
  }

  /**
   * Initialize all shells on the page
   */
  function init() {
    const shells = document.querySelectorAll('.gm-chat-shell');

    if (shells.length === 0) {
      return; // No widgets on this page
    }

    // Setup each shell
    shells.forEach(setupShell);

    // STEP 4: Check for auto-hydration params
    const firstPromptParam = getQueryParam('first_prompt');
    const autoOpen = getQueryParam('auto_open') === '1';

    if (firstPromptParam || autoOpen) {
      // Auto-hydrate the first shell on the page
      if (shells.length > 0) {
        const firstShell = shells[0];

        // Small delay to ensure DOM is settled
        setTimeout(() => {
          openChat(firstShell, 'auto'); // 'auto' = auto-open source
        }, 100);
      }
    } else {
      // Setup prefetch strategies only if not auto-opening
      // (auto-open will load immediately anyway)
      setupIdlePrefetch();
      setupViewportPrefetch(shells);
    }
  }

  // ============================================================================
  // BOOTSTRAP
  // ============================================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already loaded
    init();
  }

})();
