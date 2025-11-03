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

// Send message to the content script
function changeBgColor() {
  const btn = document.getElementById('bgButton');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      chrome.tabs.sendMessage(
        tab.id,
        { type: 'CHANGE_BG', color: '#d52121ff' },
        (response) => {
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', changeBgColor);
} else {
  changeBgColor();
}
