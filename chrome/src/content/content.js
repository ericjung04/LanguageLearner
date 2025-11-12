// Import subtitle and youtube caption renderer
import * as Subtitles from './subtitles/subtitles.js';
import {start as startYoutube} from './adapters/youtube.js'

let lastSent = ''; // Last message sent to background
let isSelecting = false; // Is user selecting text?
let mirrorRoot = null; // points to the selectable subtitles element


// Create overlay and Shadow DOM
let host = document.getElementById('linguist-overlay');
if (!host) {
  host = document.createElement('div');
  host.id = 'linguist-overlay';
  // keep it out of layout/ARIA
  host.style.all = 'initial';
  document.documentElement.appendChild(host);
}
const shadow = host.shadowRoot || host.attachShadow({mode : 'open'});


// Init subtitles component in the shadow
Subtitles.init(shadow);
mirrorRoot = Subtitles.getRootElement?.(); // Mirrored subtitles


// Start youtube adapter, updates mirror when captions change
const stopYT = startYoutube(({ text, rect }) => {
  Subtitles.update({ text, rect });
});


// Checks if user selected text is from the mirrored subtitles
function isInsideMirror(node) {
  if (!mirrorRoot || !node) return false;
  const el = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  return mirrorRoot.contains(el);
}


// Start of selection gesture (mouse dragging)
document.addEventListener('selectstart', () => {
    isSelecting = true;
});


// Safely sends messages to background, prevents crashes when context is invalidated (i.e. awake from sleep, reload extension, background unload)
async function safeSend(message) {
    if (!chrome?.runtime?.id) return;

    try {
        await chrome.runtime.sendMessage(message);
    }
    catch (e) {
        const msg = String(e?.message || e);
        if (msg.includes('Extension context invalidated') || msg.includes('Receiving end does not exist')) { // Expected errors to be caught
            return;
        }
        console.error('sendMessage failed: ', e);
    }
}

// Builds payload for the message to be sent to the background with the user selected text
function buildPayload(text) {
    let data = null;

    return {type : 'SELECTION_CHANGED', 
        payload : {
            text : text, // User selected text
            cueText : data?.cue?.text || null, // Full subtitle line of what the user selected from
            cueId : data?.cue?.id || null, // Identifier of the subtitle line the text came from
            contextCues : data?.contextCues || [], // Nearby subtitles for more context of the selected text
            timeRange : data?.timeRange || null // Start and end time of current cue +/- small buffer for surrounding context
        }
    };
}


// End of selection gesture (mouse click released)
document.addEventListener('mouseup', () => {
    isSelecting = false; // User released mouse click, selecting is false
    const selected = window.getSelection(); // Current highlighted item
    const text = selected.toString().trim(); // Highlighted text
    const hasSelected = !selected.isCollapsed; // True if there is highlighted text

    const anchorNode = selected.anchorNode || selected.focusNode;
    if (hasSelected && !isInsideMirror(anchorNode)) {
        return; // ignore selections outside mirrored subtitles
    }

    // User highlighted new text
    if (hasSelected && text !== '' && text !== lastSent) {
        const message = buildPayload(text);
        safeSend(message);
        lastSent = text;
        console.log(text);
        console.log(message.payload);
    }

    // User unselects text/clicks away
    else if (!hasSelected && lastSent !== '') {
        safeSend(buildPayload(''));
        lastSent = '';
        console.log('Unselected text');
    }
});


// Selection changed (keyboard adjust, double click extend, etc)
document.addEventListener('selectionchange', () => {
    const selected = window.getSelection();
    if (!selected) return;

    const text = selected.toString().trim();
    const hasSelected = !selected.isCollapsed;

    const anchorNode = selected.anchorNode || selected.focusNode;
    if (hasSelected && !isInsideMirror(anchorNode)) {
        return; // ignore selections outside mirrored subtitles
    }

    // User deselected text
    if (!hasSelected && lastSent !== '') {
        safeSend(buildPayload(''));
        lastSent = '';
        console.log('Unselected text');
        return;
    }

    // Expanded selection not through mouse selection (shift + arrow, word jump, etc)
    if (hasSelected && !isSelecting && text !== '' && text !== lastSent) {
        const message = buildPayload(text);
        safeSend(message);
        lastSent = text;
        console.log(message.payload);
    }
});
