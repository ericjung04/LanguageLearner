let lastSent = ''; // Last message sent to background
let isSelecting = false; // Is user selecting text?


// Start of selection gesture (mouse dragging)
document.addEventListener('selectstart', () => {
    isSelecting = true;
});


// End of selection gesture
document.addEventListener('mouseup', () => {
    isSelecting = false; // User let go of mouse click, selecting is false
    const selected = window.getSelection(); // Current highlighted item
    const text = selected.toString().trim(); // Highlighted text
    const hasSelected = !selected.isCollapsed; // True if there is highlighted text

    // User highlighted new text
    if (hasSelected && text !== '' && text !== lastSent) {
        chrome.runtime.sendMessage({type : 'SELECTION_CHANGED', payload : {text : text}});
        lastSent = text;
        console.log(text);
    }

    // User unselects text/clicks away
    else if (!hasSelected && lastSent !== '') {
        chrome.runtime.sendMessage({type : 'SELECTION_CHANGED', payload : {text : ''}});
        lastSent = '';
        console.log('Unselected text');
    }
});


// User unselects text without clicking away (keyboard event)
document.addEventListener('selectionchange', () => {
    const selected = window.getSelection();
    if (selected.isCollapsed && lastSent !== '') {
        chrome.runtime.sendMessage({type : 'SELECTION_CHANGED', payload : {text : ''}});
        lastSent = '';
        console.log('Unselected text');
    }
});
