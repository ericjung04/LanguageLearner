// Currently listens for a PING message from the popup, logs acknowledgement in page's console
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'PING')
    {
        console.log('Ping received from popup!');
        sendResponse({ok : true});
        return;
    }
});