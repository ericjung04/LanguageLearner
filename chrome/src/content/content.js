// Script to change the background color when the change color button in the popup is clicked, for testing purposes for now
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'CHANGE_BG')
    {
        const color = msg.color || '#fff7b1';
        document.documentElement.style.backgroundColor = color;
        console.log('Background color changed!');
        sendResponse({ok : true});
        return;
    }
});