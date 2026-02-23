'use strict';

chrome.commands.onCommand.addListener(function (command) {
  if (command === 'show-answer') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'showAnswer' });
      }
    });
  }
});
