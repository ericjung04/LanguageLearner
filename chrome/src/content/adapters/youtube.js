// Read and display captions from youtube videos in our custom subtitles
export function start(onCaption) {
  // Find youtube caption root container
  let root = document.querySelector('.ytp-caption-window-container') || document.querySelector('.ytp-caption-window');
  if (!root) return null; // No captions available


  // Helper to read the actual subtitle text
  const readText = () => root.innerText.trim();


  // Helper that sends latest subtitles to custom subtitles to display
  const emit = () => {
    // In case subtitle HTML element changes in Youtube
    root = document.querySelector('.ytp-caption-window-container') || document.querySelector('.ytp-caption-window');
    if (!root) return;

    const text = readText(); // Get original subtitle text

    // Callback function for content script to update subtitles when changes occur
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
