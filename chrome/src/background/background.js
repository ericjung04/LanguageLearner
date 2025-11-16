const tabs = {}; // Stores last selected text per tab

// Test to see if popup and service worker can communicate
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message?.type) 
    {
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

            const payload = message.payload || null;

            // Save full payload, not just text
            tabs[tabId].selection = payload;

            // Confirmation purposes
            console.log('Tab ', tabId, ' Selection:', payload);
            console.log('Readable:\n', JSON.stringify(payload, null, 2));
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
