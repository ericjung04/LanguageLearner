import html from './subtitles.html?raw';
import css from './subtitles.css?inline';

let root; // holds main container for subtitles
let textEl; // what holds the caption text

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
}


// Updates subtitle text and positioning
export function update({ text, rect }) {
    if (!textEl) return;

    const hasText = !!(text && text.trim());
    if (!hasText) {
        textEl.textContent = '';
        textEl.classList.remove('visible');   // hides and removes bubble styling
        return;
    }

    textEl.textContent = text;
    textEl.classList.add('visible');

    // Dynamically position relative to caption box
    if (rect) {
        textEl.style.left = `${rect.left}px`;
        textEl.style.top = `${rect.top + rect.height + 10}px`;
        textEl.style.width = `${rect.width}px`;
    }
}


// Returns the root element, used by content.js for isInsideMirror() function
export function getRootElement() {
    return root;
}
