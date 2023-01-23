chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(function (request, sender, sendResponse) {
    return true;
  });
});

chrome.runtime.onInstalled.addListener((reason) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({
      url: 'index.html',
    });
  }
});
