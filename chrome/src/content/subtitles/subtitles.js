/**
 * Custom Subtitle component that displays the subtitles from the video the user is watching
 */

import html from './subtitles.html?raw'; // HTML for subtitles
import css from './subtitles.css?inline'; // CSS for subtitles

let root; // Main container for subtitles
let textEl; // What holds the caption text
let lastSubtitleText = ''; // Last subtitle

 // Initializes subtitles component in the given shadow root
export function init(shadow) {
    if (root) return; // Prevent double init

    // Load HTML into shadow
    const template = document.createElement('template');
    template.innerHTML = html;
    root = template.content.firstElementChild;

    // Load CSS into shadow
    const style = document.createElement('style');
    style.textContent = css;
    shadow.appendChild(style);

    // Append component structure
    shadow.appendChild(root);
    textEl = root.querySelector('.subtitle-text');

    // Default position for subtitles
    root.style.position = 'fixed';
    root.style.left = '50%';
    root.style.bottom = '10vh';      
    root.style.transform = 'translateX(-50%)';
    root.style.pointerEvents = 'none';

    if (textEl) {
        // Enable text and keyboard navigation without allowing editing
        textEl.style.userSelect = 'text';
        textEl.style.webkitUserSelect = 'text';
        textEl.style.pointerEvents = 'auto'; // Allow clicks/selection on the text
        textEl.setAttribute('contenteditable', 'false'); // Prevent editing the subtitles

        // Drag to move behavior (Use Shift + drag)
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let startLeft = 0;
        let startTop = 0;

        const doc = shadow.ownerDocument; // Main page document

        // Listen for mouse clicks only with Shift pressed for moving the subtitles
        textEl.addEventListener('mousedown', (e) => {
            if (!e.shiftKey) return; // Only move when holding Shift so normal dragging still selects text

            // Start drag and save initial mouse position
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;

            // Save subtitle box's starting position before dragging
            const rect = root.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            // Once we start moving the subtitles, disable centering
            root.style.transform = 'none';

            e.preventDefault(); // Avoid selecting text while moving the subtitles
        });

        // Listen for mouse movement while dragging
        doc.addEventListener('mousemove', (e) => {
            if (!isDragging) return; // Not moving subtitle box

            // Mouse's current position
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;

            // Apply movement to subtitle box
            root.style.position = 'fixed';
            root.style.left = `${startLeft + dx}px`;
            root.style.top  = `${startTop + dy}px`;
        });

        // Stop dragging when mouse is released
        doc.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
}


// Updates subtitle text
export function update({text}) {
    if (!textEl || !root) return; // If called before init() or after teardown, ignore

    const hasText = !!(text && text.trim()); // True if text has any non space characters

    // Hide custom subtitles when original subtitles disappear
    if (!hasText) {
        textEl.textContent = '';
        textEl.classList.remove('visible'); // Hides and removes subtitle box
        return;
    }

    // If subtitles didnt change, dont touch the DOM
    if (text === lastSubtitleText) return;

    // Get and display subtitle text
    lastSubtitleText = text;
    textEl.textContent = text;
    textEl.classList.add('visible');
}


// Returns the root element so content.js can check if a selection was inside the subtitle box
export function getRootElement() {
    return root;
}
