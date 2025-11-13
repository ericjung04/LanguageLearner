// Element lookups
const noteInput = document.getElementById('noteInput');
const saveButton = document.getElementById('saveButton');
const savedText = document.getElementById('savedText');
const selectedText = document.getElementById('selectedText');

console.log('Extension Loaded');

// Display previously saved note (No purpose, for later reference)
if (noteInput && savedText) {
  chrome.storage.local.get('note', (data) => {
    const value = data.note ?? '';
    noteInput.value = value;
    savedText.textContent = value || 'N/A';
  });
}

// Save note (No purpose, for later reference)
if (saveButton && noteInput && savedText) {
  saveButton.addEventListener('click', () => {
    const value = noteInput.value.trim();
    chrome.storage.local.set({ note: value }, () => {
      savedText.textContent = value || '-';
    });
  });
}

// Get the current tab's saved text in the service worker
function getSelectedText() {
  const btn = document.getElementById('textButton');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    chrome.runtime.sendMessage({type : 'GET_TEXT'}, (response) => {
      selectedText.textContent = response.data.text;
    });
  });
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', getSelectedText);
}
else {
  getSelectedText();
}
