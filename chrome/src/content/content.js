let lastSent = ''; // Last message sent to background
let isSelecting = false; // Is user selecting or no

// Listen for when user starts selecting text
document.addEventListener('selectstart', () => {
    isSelecting = true;
});

// Listen for when user stops selecting text
document.addEventListener('mouseup', () => {
    const selected = window.getSelection();
    const text = selected.toString().trim();
    const hasSelected = !selected.isCollapsed; // Is there text highlighted?

    // Case 1: User had selection gesture and has selected text
    if (isSelecting && hasSelected) {
        if (text !== '' && text !== lastSent) { // User did not select the same text twice
            chrome.runtime.sendMessage({type : 'SELECTION_CHANGED', payload : {text : text}});
            lastSent = text;
            console.log(text);
        }
        isSelecting = false;
        return;
    }

    // Case 2: User clicks on something on the page or user clicks away from highlighted text (no selection)
    if (!hasSelected && lastSent !== '') {
        chrome.runtime.sendMessage({type : 'SELECTION_CHANGED', payload : {text : ''}});
        lastSent = '';
        console.log('Unselected text');
    }
    isSelecting = false;
});