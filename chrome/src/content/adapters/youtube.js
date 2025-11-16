/**
 * YouTube caption adapter
 *
 * Watches Youtube's native caption container for text changes,
 * extracts the current subtitle text, and sends them
 * to the content script through a callback
 *
 */

const MAX_HISTORY_WINDOW = 90; // Max history window is 90sec
const CONTEXT_WINDOW_SECONDS = 15; // Send back 15sec of previous subtitles for context
const MAX_GAP_SECONDS = 6; // 6sec in between captions indicates a new conversation

// [{text : string, time : number}]
const captionHistory = [];

// Remove unnecessary text from subtitles
function cleanText(text) {
  if (!text) return '';

  return text
      .replace(/\(auto-generated\)/gi, '')
      .replace(/Click\s*for\s*settings.*$/gim, '') // Handle "Click for settings"
      .replace(/English(\s*\(auto-generated\))?/gi, '') // Sometimes "English" appears as a separate line/label
      .replace(/\s+/g, ' ') // Collapse any remaining whitespace/newlines to single spaces
      .trim();
}


// Adds subtitle history for when user selects text
function addCaptionToHistory(rawText) {
  let text = cleanText(rawText);
  if (!text || !text.trim()) return;

  const video = document.querySelector('video');
  if (!video) return;

  const time = video.currentTime;

  // User rewinded the video
  if (captionHistory.length) {
    const lastTime = captionHistory[captionHistory.length - 1].time;
    if (time + 0.25 < lastTime) {
      // User went backwards so drop future entries
      while (captionHistory.length && captionHistory[captionHistory.length - 1].time > time) {
        captionHistory.pop();
      }
    }
  }

  const lastEntry = captionHistory[captionHistory.length - 1];

  if (lastEntry) {
    // Skip exact duplicates within the same-conversation window
    for (let i = captionHistory.length - 1; i >= 0; i--) {
      const h = captionHistory[i];
      if (time - h.time > MAX_GAP_SECONDS) break; // Out of window
      if (h.text === text) return; // Exact duplicate
    }
  }

  // Raw subtitles from Youtube
  captionHistory.push({ text, time });

  // Trim anything older than MAX_HISTORY_WINDOW
  const cutoff = time - MAX_HISTORY_WINDOW;
  while (captionHistory.length && captionHistory[0].time < cutoff) {
    captionHistory.shift();
  }
}


// Split text into lowercase tokens for merging context lines
function tokenize(text) {
  return text
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
}


// Ratio of shared words between context lines
function wordOverlapRatio(a, b) {
  const wa = tokenize(a);
  const wb = tokenize(b);
  if (!wa.length || !wb.length) return 0;

  const setA = new Set(wa);
  const setB = new Set(wb);
  let common = 0;

  for (const w of setA) {
    if (setB.has(w)) common++;
  }
  const minSize = Math.min(setA.size, setB.size);
  return minSize ? common / minSize : 0;
}


// Merge one cluster of rolling captions into a single string
function mergeClusterTexts(cluster) {
  if (!cluster.length) return '';

  let merged = cluster[0].text;

  for (let i = 1; i < cluster.length; i++) {
    const next = cluster[i].text;
    if (!next) continue;

    // Try to merge by overlapping suffix of merged with substring of next
    const maxLen = Math.min(merged.length, next.length);
    let mergedCandidate = null;

    for (let len = maxLen; len >= 8; len--) { // 8 chars min overlap
      const suffix = merged.slice(-len);
      const idx = next.indexOf(suffix);
      if (idx !== -1) {
        mergedCandidate = merged + next.slice(idx + len);
        break;
      }
    }

    if (mergedCandidate) {
      merged = mergedCandidate;
    } 
    else if (!merged.includes(next)) {
      merged += ' ' + next; // No overlap found, append if it's not already inside
    }
  }

  return merged;
}


// Merge a list of caption lines into a single context string
function mergeLinesToString(lines) {
  if (!lines.length) return '';

  const ROLLING_THRESHOLD = 3.0; // Seconds: captions updating word-by-word

  // Clean and filter lines
  const cleaned = lines
      .map(l => ({
          text: cleanText(l.text),
          time: l.time,
      }))
      .filter(l => l.text);

  if (!cleaned.length) return '';

  const clusters = [];
  let currentCluster = [cleaned[0]];

  // Walk forward and group into rolling clusters
  for (let i = 1; i < cleaned.length; i++) {
    const prev = currentCluster[currentCluster.length - 1];
    const curr = cleaned[i];

    const dt = curr.time - prev.time;
    const overlap = wordOverlapRatio(prev.text, curr.text);

    // Same rolling sentence if close in time and share a good chunk of words (at least 50%)
    const sameRolling = dt <= ROLLING_THRESHOLD && overlap >= 0.5;

    if (sameRolling) {
      currentCluster.push(curr);
    }
    else {
      clusters.push(currentCluster);
      currentCluster = [curr];
    }
  }

  clusters.push(currentCluster);

  // Merge each cluster into one string
  const clusterTexts = clusters.map(mergeClusterTexts);

  // Join cluster texts into the final context string
  return clusterTexts.join(' ');
}


// Build context for the user selected text
function buildSelectedData(anchorTime) {
  // No subtitles or invalid anchorTime
  if (!captionHistory.length || anchorTime === null) return null;

  // Time to start gathering subtitles from
  const startTime = anchorTime - CONTEXT_WINDOW_SECONDS;

  // Find the subtitle line at anchorTime
  let anchorIndex = -1;
  for (let i = captionHistory.length - 1; i >= 0; i--) {
    if (captionHistory[i].time <= anchorTime) {
      anchorIndex = i;
      break;
    }
  }

  if (anchorIndex === -1) return null;

  const anchorLine = captionHistory[anchorIndex];

  // Build context array with previous lines only
  const context = [];
  for (let i = anchorIndex - 1; i >= 0; i--) {
    const line = captionHistory[i];
    const nextLine = captionHistory[i + 1];

    // Past max context window size
    if (line.time < startTime) break;

    // New conversation so stop
    if (nextLine.time - line.time > MAX_GAP_SECONDS) break;

    context.unshift(line); // Keep chronological order
  }

  // Lines to use for the full merged context string:
  const windowLines = [...context, anchorLine];
  const fullContextText = mergeLinesToString(windowLines);

  // You can still return individual context lines if you want them
  const contextLines = context.map(line => ({
    text: line.text,
    time: line.time,
  }));

  const subtitleText = anchorLine.text;

  const timeRange = {
    start: windowLines.length ? windowLines[0].time : anchorLine.time,
    end: anchorLine.time,
  };

  return {
    subtitleText, // The current line
    anchorTime, // Time the selection happened
    fullContextText, // 15sec of context before selected text
  };
}


// What the content script calls to get context for selection
export function getContextForTime(anchorTime) {
  return buildSelectedData(anchorTime);
}


// Read and display captions from youtube videos in our custom subtitles
export function start(onCaption) {
  let root = null; // Holds original caption container
  let lastText = ''; // Used to avoid spamming mutation observations

  // Is user on a video or preview
  const isOnVideo = () => location.pathname.startsWith('/watch');

  // Find youtube caption root container
  const findRoot = () => document.querySelector('.ytp-caption-window-container') || document.querySelector('.ytp-caption-window');

  // Helper to read the actual subtitle text
  const readText = () => (root?.innerText || '').trim();

  // Hide original subtitles but keep them in DOM so we can read them
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .ytp-caption-window-container,
    .ytp-caption-window-container * {
      opacity: 0 !important;
      pointer-events: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
    }`;
  document.documentElement.appendChild(styleEl);


  // Helper that sends latest subtitles to custom subtitles to display
  const emit = () => {
    // Only care when we are actually on a video, not previews
    if (!isOnVideo()) {
      // If we previously had subtitles clear them
      if (lastText !== '') {
        lastText = '';
        onCaption({ text: '' }); // Hide subtitle box
      }

      // Reset state for next video
      root = null;
      return;
    }

    // Make sure we have a valid captions root
    if (!root || !document.body.contains(root)) {
      root = findRoot(); // Get subtitle container in main player

      // If subtitles not available hide subtitles
      if (!root) {
        if (lastText !== '') {
          lastText = '';
          onCaption({ text: '' });
        }
        return;
      }
    }

    const text = readText(); // Valid subtitles, get original text
    if (text === lastText) return; // Prevent unnecessary mutation observations

    // Update cache
    lastText = text;

    // Update YouTube caption history with this new text
    addCaptionToHistory(text);

    // Stream text up to content script (it just displays this)
    onCaption({ text });
  };


  // Watch for caption DOM changes (text, nodes, style), call emit() when it does
  const domObserver = new MutationObserver(emit);
  domObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
  });


  // Send very first caption state to custom subtitles
  emit();


  // Return cleanup function for content script (called stopYT in content.js)
  return () => {
    domObserver.disconnect();
    styleEl.remove();
  };
}
