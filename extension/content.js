chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractJobData") {
    const jobData = ScraperEngine.extract();
    sendResponse({
      ...jobData,
      url: window.location.href,
    });
  }
  return true;
});

window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data && event.data.type === "FROM_WEB_APP") {
    if (event.data.action === "REQUEST_JOB_DATA") {
      chrome.storage.local.get(["pendingJobTransfer"], (result) => {
        if (result.pendingJobTransfer) {
          window.postMessage(
            {
              type: "FROM_EXTENSION",
              action: "JOB_DATA_RESPONSE",
              data: result.pendingJobTransfer,
            },
            "*",
          );
        }
      });
    } else if (event.data.action === "ACK_JOB_DATA") {
      chrome.storage.local.remove("pendingJobTransfer");
    }
  }
});

if (window.location.hostname === "offerfit.vercel.app") {
  chrome.storage.local.get(["pendingJobTransfer"], (result) => {
    if (result.pendingJobTransfer) {
      const sendData = () => {
        window.postMessage(
          {
            type: "FROM_EXTENSION",
            action: "JOB_DATA_RESPONSE",
            data: result.pendingJobTransfer,
          },
          "*",
        );
      };
      sendData();
      setTimeout(sendData, 500);
      setTimeout(sendData, 1500);
    }
  });
}
