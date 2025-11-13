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


  // Helper that sends latest subtitles to custom subtitles to display
  const emit = () => {
    // Only care about when we are actually on a video, not previews
    if (!isOnVideo()) {

      // If we previously had subtitles clear them
      if (lastText !== '') {
        lastText = '';
        onCaption({text : ''}); // Hide subtitle box
      }

      // Reset state for next video
      root = null;
      return;
    }
    
    // Make sure we have a valid captions root
    if (!root || ! document.body.contains(root)) {
      root = findRoot(); // Get subtitle container in main playe

      // If subtitles not available, hide subtitles
      if (!root) {
        if (lastText !== '') {
          lastText = '';
          onCaption({text : ''});
        }
        return;
      }
    }

    const text = readText(); // Valid subtitles, get original text
    if (text === lastText) return; // Prevent unnecessary mutation observations

    // Update cache and send text to custom subtitle component
    lastText = text;
    onCaption({text});
  };


  // Watch for caption DOM changes (text, nodes, style), call emit() when it does
  const domObserver = new MutationObserver(emit);
  domObserver.observe(document.body, {
    childList : true,
    subtree : true,
    characterData : true,
    attributes : true,
  });

  
  // Send very first caption state to custom subtitles
  emit();


  // Return cleanup function for content script (called stopYT in content.js)
  return () => {
    domObserver.disconnect();
  };
}
