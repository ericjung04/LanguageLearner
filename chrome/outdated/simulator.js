// Subtitles simulator (dev/testing only)
// Runs on example.com by default, can enable anywhere with: localStorage.setItem('linguist_sim','1')

(function () {
  const DEV_TEST_HOST = 'example.com';
  const devEnabled = (() => {
    try { return localStorage.getItem('linguist_sim') === '1'; } catch { return false; }
  })();

  if (location.hostname !== DEV_TEST_HOST && !devEnabled) return;

  // Fake caption track
  const CUES = [
    { id: "c1", startMs: 0,    endMs: 2500, text: "so today we are going to go and take the" },
    { id: "c2", startMs: 2500, endMs: 5000, text: "bus to the museum to see the exhibit" },
    { id: "c3", startMs: 5000, endMs: 8000, text: "after that we might grab some lunch nearby" }
  ];
  const TRACK_TOTAL = CUES[CUES.length - 1].endMs;
  const CONTEXT_MS = 2000;


  // Subtitle overlay box
  const box = document.createElement("div");
  Object.assign(box.style, {
    position: "fixed",
    left: "50%",
    bottom: "8%",
    transform: "translateX(-50%)",
    maxWidth: "80vw",
    padding: "10px 14px",
    background: "rgba(0,0,0,0.75)",
    color: "white",
    fontFamily: "system-ui, sans-serif",
    fontSize: "16px",
    lineHeight: "1.4",
    borderRadius: "10px",
    zIndex: 2147483647,
    whiteSpace: "pre-wrap",
    pointerEvents: "auto",
    cursor: "text",
    userSelect: "text",
    WebkitUserSelect: "text",
    MozUserSelect: "text",
  });
  box.setAttribute("data-linguist", "overlay");
  document.documentElement.appendChild(box);


  // Selectable subtitle text
  const textEl = document.createElement("span");
  Object.assign(textEl.style, {
    userSelect: "text",
    WebkitUserSelect: "text",
    MozUserSelect: "text",
    cursor: "text",
    outline: "none"
  });
  textEl.textContent = "";
  box.appendChild(textEl);


  // Virtual clock
  let t0 = Date.now();
  let paused = false;
  let frozenTime = 0;
  let lastCueId = null;

  const nowMs = () => (paused ? frozenTime : ((Date.now() - t0) % TRACK_TOTAL));
  const getCueAt = (ms) => CUES.find(c => ms >= c.startMs && ms < c.endMs) || null;


  // Only update when cue changes
  function tick() {
    if (!paused) {
      const cue = getCueAt(nowMs());
      if (cue && cue.id !== lastCueId) {
        textEl.textContent = cue.text;
        lastCueId = cue.id;
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);


  // Pause/resume helpers
  function pauseNow(reason) {
    if (!paused) {
      paused = true;
      frozenTime = (Date.now() - t0) % TRACK_TOTAL;
    }
  }

  function resumeNow() {
    if (paused) {
      paused = false;
      lastCueId = null; // force cue refresh
    }
  }


  // Pause when selecting subtitle text directly
  textEl.addEventListener("mousedown", () => pauseNow("mousedown"), { capture: true });
  textEl.addEventListener("pointerdown", () => pauseNow("pointerdown"), { capture: true });
  textEl.addEventListener("selectstart", () => pauseNow("selectstart"), { capture: true });


  // Unified selectionchange handler
  document.addEventListener("selectionchange", () => {
    const sel = document.getSelection?.();

    // No selection so resume playback
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      resumeNow();
      return;
    }


    // Selection exists so check if it intersects subtitle text
    const range = sel.getRangeAt(0);
    let touchesText = false;
    try {
      touchesText = range.intersectsNode(textEl);
    } 
    catch {
      touchesText = false; // safe fallback
    }

    if (touchesText) {
      pauseNow("selectionchange-intersect");
    } 
    else {
      resumeNow();
    }
  });
  

  // Helper for content.js
  window.__linguistSim = {
    isActive: true,
    getCurrentCueAndContext() {
      const ms = paused ? frozenTime : nowMs();
      const cue = getCueAt(ms);
      if (!cue) return null;
      const ctxStart = Math.max(0, cue.startMs - CONTEXT_MS);
      const ctxEnd   = Math.min(TRACK_TOTAL, cue.endMs + CONTEXT_MS);
      const contextCues = CUES
        .filter(c => c.endMs > ctxStart && c.startMs < ctxEnd)
        .map(({ id, startMs, endMs, text }) => ({ id, startMs, endMs, text }));
      return { cue, contextCues, timeRange: { startMs: ctxStart, endMs: ctxEnd } };
    }
  };
})();