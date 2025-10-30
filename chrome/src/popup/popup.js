// Change the text when the user clicks the button
function changeText(){
    const text1 = document.getElementById('status');
    const button1 = document.getElementById('changeButton');
    if (!text1 || !button1) return;

    button1.addEventListener('click', () => {
        text1.textContent = 'Button Clicked!';
        console.log("Button clicked");
    });
    console.log('Linguist popup.js loaded');
}

// Fields to save values into chrome storage
const noteInput = document.getElementById('noteInput');
const saveButton = document.getElementById('saveButton');
const savedText = document.getElementById('savedText');

// Display previously saved note, or display N/A if no previous value
chrome.storage.local.get('note', (data) => {
    const value = data.note ?? '';
    noteInput.value = value;
    savedText.textContent = value || 'N/A';
});

// If the user clicks the save button, store into chrome storage
saveButton.addEventListener('click', () => {
    const value = noteInput.value.trim();
    chrome.storage.local.set({'note' : value}, () => {
        savedText.textContent = value || '-';
    });
});

if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', changeText); // popup.html not loaded
}
else{
    changeText(); // html loaded, run the changeText function
}