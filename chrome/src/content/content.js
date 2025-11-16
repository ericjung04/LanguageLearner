/**
 * Main content script for Linguist extension
 * 
 * - Injects the universal subtitle overlay (Shadow DOM)
 * - Connects to the active platform adapter (only Youtube currently, will add other platforms later) to receive caption updates
 * - Mirrors platform captions into the interactive subtitle component
 * - Detects user text selections inside the subtitle overlay
 * - Builds flashcard payloads using context provided by the adapter
 * - Sends events to the background script for storage or UI actions
 */

// Import Subtitle component and Youtube adapter
import * as Subtitles from './subtitles/subtitles.js';
import { start as startYoutube, getContextForTime } from './adapters/youtube.js';

let lastSent = ''; // Last message sent to background


// Normalize selected text by collapsing whitespace/newline into a single space
function normalizeSelectedText(text) {
    return (text || '')
        .replace(/\s+/g, ' ')
        .trim();
}


// Create overlay and Shadow DOM
let host = document.getElementById('linguist-overlay');
if (!host) {
    host = document.createElement('div');
    host.id = 'linguist-overlay';
    host.style.all = 'initial'; // Keep it out of main content page
    document.documentElement.appendChild(host);
}
const shadow = host.shadowRoot || host.attachShadow({mode: 'open'});
Subtitles.init(shadow);


// Start youtube adapter, updates subtitles when they change
// stopYT disconnects Youtube adapter (cleanup when you need it)
const stopYT = startYoutube(({ text }) => {
    Subtitles.update({ text }); // Mirror text into the custom subtitles
});


// Safely sends messages to background, prevents crashes when context is invalidated
async function safeSend(message) {
    if (!chrome?.runtime?.id) return;

    try {
        await chrome.runtime.sendMessage(message);
    } catch (e) {
        const msg = String(e?.message || e);
        if (
            msg.includes('Extension context invalidated') ||
            msg.includes('Receiving end does not exist')
        ) {
            // Expected errors to be caught
            return;
        }
        console.error('sendMessage failed: ', e);
    }
}


// Builds payload with user selected text for the message to be sent to the background
function buildPayload(text) {
    let data = null;

    if (text && text.trim() !== '') {
        const video = document.querySelector('video');
        const anchorTime = video?.currentTime ?? null;

        if (anchorTime !== null) {
            // Ask the adapter for context around this time
            data = getContextForTime(anchorTime);
        }
    }

    return {
        type: 'SELECTION_CHANGED',
        payload: {
            text, // User selected text
            subtitleText: data?.subtitleText ?? null, // Full subtitle line
            anchorTime: data?.anchorTime ?? null, // When the selection happened
            fullContextText: data?.fullContextText ?? null, // 15sec of context before selected words
        }
    };
}


// Returns the current text selection inside subtitles or null if nothing is selected
function getCustomSelection() {
    if (!shadow || !shadow.getSelection) return null;

    const sel = shadow.getSelection();
    if (!sel || sel.isCollapsed) return null; // Nothing selected

    return sel;
}


// End of selection gesture (mouse click released)
document.addEventListener('mouseup', () => {
    const sel = getCustomSelection();
    const rawText = sel ? sel.toString().trim() : '';
    const text = normalizeSelectedText(rawText);
    const hasSelected = text.length > 0;

    // No selection inside custom subtitles
    if (!hasSelected) {
        if (lastSent !== '') {
            safeSend(buildPayload(''));
            lastSent = '';
            console.log('Unselected text');
        }
        return;
    }

    // New selection inside custom subtitles
    if (text !== '' && text !== lastSent) {
        const message = buildPayload(text);
        safeSend(message);
        lastSent = text;
        console.log(text);
        console.log(message.payload);
    }
});
