chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error: any) => console.error(error));

chrome.runtime.onInstalled.addListener(() => {
  console.log('FocusReader AI Extension Installed');
});
