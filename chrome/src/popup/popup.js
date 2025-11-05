// Element lookups
const noteInput = document.getElementById('noteInput');
const saveButton = document.getElementById('saveButton');
const savedText = document.getElementById('savedText');

// Display previously saved note
if (noteInput && savedText) {
  chrome.storage.local.get('note', (data) => {
    const value = data.note ?? '';
    noteInput.value = value;
    savedText.textContent = value || 'N/A';
  });
}

// Save note
if (saveButton && noteInput && savedText) {
  saveButton.addEventListener('click', () => {
    const value = noteInput.value.trim();
    chrome.storage.local.set({ note: value }, () => {
      savedText.textContent = value || '-';
    });
  });
}


// Send message directly to the content script, not service worker (For reference now)
function changeBgColor() {
  const btn = document.getElementById('bgButton');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      chrome.tabs.sendMessage(tab.id, { type: 'CHANGE_BG', color: '#d52121ff' }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Runtime error:', chrome.runtime.lastError.message);
            return;
          }
          if (response?.ok) console.log('Background color changed!');
        }
      );
    } catch (e) {
      console.error('Error changing color:', e);
    }
  });
}


// Send a ping notification to the service worker so that the content can see it
function sendPing() {
  const btn = document.getElementById('pingButton');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    chrome.runtime.sendMessage({type : 'PING', payload : 'Hello from popup!'}, (response) => {
      if (chrome.runtime.lastError)
      {
        console.warn('Error sending message: ', chrome.runtime.lastError.message);
        return;
      } 
      if (response?.ok)
      {
        const ts = response.data?.ts;
        const readable = new Date(ts).toLocaleDateString();
        console.log('Ping successfully received by service worker at ', readable);
      }
    })  
  });
}


if (document.readyState === 'loading') 
{
  document.addEventListener('DOMContentLoaded', sendPing);
  document.addEventListener('DOMContentLoaded', changeBgColor);
}
else 
{
  sendPing();
  changeBgColor();
}
