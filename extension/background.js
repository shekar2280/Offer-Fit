const APP_ORIGIN = "https://offerfit.vercel.app";
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message?.action === "openApplication" && sender.tab && typeof message.url === "string") {
    // Destination is fixed; source URLs are transferred through extension storage.
    chrome.storage.local.set({ pendingJobTransfer: { company: message.company || "", role: message.role || "", url: message.url, description: "", capturedAt: Date.now() } }, () => {
      chrome.tabs.create({ url: `${APP_ORIGIN}/hub?view=applications` }); reply({ ok: true });
    });
    return true;
  }
});
