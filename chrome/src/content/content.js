// Listen for when user selects text on the page
document.addEventListener('selectionchange', () => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
        console.log(selectedText);
    }
    else {
        console.log('Empty');
    }
    chrome.runtime.sendMessage({type : 'SELECTION_CHANGED', payload : {text : selectedText}});
});