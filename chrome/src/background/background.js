const tabs = {}; // Stores last selected text per tab

// Test to see if popup and service worker can communicate
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message?.type) 
    {
        case 'PING': // For testing purposes, will later be different message types
        {
            console.log('PING from ', sender?.id, 'message: ', message.payload);
            chrome.tabs.query({active : true, currentWindow : true}, (tabs) => {
                const [tab] = tabs;
                chrome.tabs.sendMessage(tab.id, {type : 'PING'}, (response) => {
                if (response.ok) {
                    console.log('Content script received PING!');
                }
                });
            });
            sendResponse({ok : true, data : {pong : true, ts : Date.now()}});
            return; // Synchronous response so no need to keep channel open
        }

        case 'SELECTION_CHANGED' : // User selected/deselected text on the page
        {
            // Get tab where text was selected, send error if can't find ID
            const tabId = sender.tab?.id;
            if (!tabId) {
                console.warn('No tab ID found for sender');
                sendResponse({ok: false, error: 'NO_TAB_ID'});
                return;
            }

            // Current tab doesn't have saved text, create entry for current tab
            if (!tabs[tabId]) {
                tabs[tabId] = {savedText : '', cues : []};
            }

            // Store current tabs selected text
            if (tabId) {
                tabs[tabId].savedText = message.payload.text || ''; // Empty string when user deselects text
            }

            // Confirmation purposes
            console.log('Tab ', tabId, ' text:', tabs[tabId].savedText);
            sendResponse({ok : true});
            return;
        }

        case 'GET_TEXT' : // User clicked 'Get Text' button in the popup, sends text based on active tab
        {
            chrome.tabs.query({active : true, currentWindow : true}, (tabsArr) => {
                const [tab] = tabsArr;
                const text = tabs[tab.id]?.savedText ?? 'N/A';
                sendResponse({ok : true, data : {text}});
            });
            return true;
        }

        default: // Unknown message type
            console.warn('Unkown message type', message?.type);
            sendResponse({ok : false, error : 'UNKNOWN_MESSAGE_TYPE'});
    }
});

// User closes a tab
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabs[tabId];
  console.log('Cleaned up tab', tabId);
});
