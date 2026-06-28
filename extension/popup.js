const FRONTEND_URL = "https://offerfit.vercel.app";

document.addEventListener("DOMContentLoaded", async () => {
  let currentTabId = null;
  let scrapedJob = null;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab ? tab.id : null;

  if (!currentTabId) {
    showNoJobState();
    return;
  }

  chrome.tabs.sendMessage(
    currentTabId,
    { action: "extractJobData" },
    (response) => {
      if (chrome.runtime.lastError || !response || (!response.role && !response.company)) {
        showNoJobState();
        return;
      }
      scrapedJob = response;
      showJobState();
    }
  );

  function showNoJobState() {
    document.getElementById("no-job").style.display = "block";
    document.getElementById("job-info").style.display = "none";
  }

  function showJobState() {
    document.getElementById("no-job").style.display = "none";
    document.getElementById("job-info").style.display = "block";

    const roleVal = scrapedJob.role ? scrapedJob.role.trim() : "";
    const companyVal = scrapedJob.company ? scrapedJob.company.trim() : "";
    const locationVal = scrapedJob.location ? scrapedJob.location.trim() : "";
    const jobTypeVal = scrapedJob.jobType ? scrapedJob.jobType.trim() : "";

    const roleEl = document.getElementById("job-role-val");
    const companyEl = document.getElementById("job-company-val");
    const locationEl = document.getElementById("job-location-val");
    const typeEl = document.getElementById("job-type-val");

    roleEl.innerText = roleVal || "Not Detected";
    if (!roleVal) roleEl.classList.add("danger-text");

    companyEl.innerText = companyVal || "Not Detected";
    if (!companyVal) companyEl.classList.add("danger-text");

    locationEl.innerText = locationVal || "Unknown";
    if (!locationVal) locationEl.classList.add("warning-text");

    typeEl.innerText = jobTypeVal || "Full-time (Assumed)";
    if (!jobTypeVal) typeEl.classList.add("warning-text");

    document.getElementById("sync-btn").onclick = () => {
      const baseUrl = `${FRONTEND_URL}/analyze`;
      const params = new URLSearchParams({
        company: scrapedJob.company || "",
        role: scrapedJob.role || "",
        location: scrapedJob.location || "",
        jobType: scrapedJob.jobType || "",
        jd: scrapedJob.description || "",
      });
      chrome.storage.local.set({ pendingJobTransfer: scrapedJob }, () => {
        chrome.tabs.create({ url: `${baseUrl}?${params.toString()}` });
      });
    };

    document.getElementById("customize-btn").onclick = () => {
      const baseUrl = `${FRONTEND_URL}/customize`;
      const params = new URLSearchParams({
        company: scrapedJob.company || "",
        role: scrapedJob.role || "",
        location: scrapedJob.location || "",
        jobType: scrapedJob.jobType || "",
        jd: scrapedJob.description || "",
      });
      chrome.storage.local.set({ pendingJobTransfer: scrapedJob }, () => {
        chrome.tabs.create({ url: `${baseUrl}?${params.toString()}` });
      });
    };
  }
});
