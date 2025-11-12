// Read and display captions from youtube videos
export function start(onCaption) {
    // Find youtube caption root container
    const root = document.querySelector('.ytp-caption-window-container') || document.querySelector('.ytp-caption-window');
    if (!root) return null;

    // Helper to read all current captions and put them in one string
    const readText = () => [...document.querySelectorAll('.ytp-caption-segment')].map(n => n.innerText).join(' ').trim();

    // Display current captions text
    const emit = () => {
        const text = readText();
        // if (!text) return;
        const r = root.getBoundingClientRect();
        onCaption({text, rect: { top: r.top, left: r.left, width: r.width, height: r.height }
    });
  };

    // Display and observe caption changes
    emit();
    const obs = new MutationObserver(() => emit());
    obs.observe(root, { childList: true, characterData: true, subtree: true });

    // Return a cleanup function to stop watching for caption changes
    return () => obs.disconnect();
}
