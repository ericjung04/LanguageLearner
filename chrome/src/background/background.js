// Test to see if popup and service worker can communicate
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message?.type) 
    {
        case 'PING': // For testing purposes, will later be different message types
        {
            console.log('PING from ', sender?.id, 'message: ', message.payload);
            sendResponse({ok : true, data : {pong : true, ts : Date.now()}});
            return; // Synchronous response so no need to keep channel open
        }
        default: // Unknown message type
            console.warn('Unkown message type', message?.type);
            sendResponse({ok : false, error : 'UNKNOWN_MESSAGE_TYPE'});
    }
});