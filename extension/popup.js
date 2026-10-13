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

  async function extractFromActiveTab() {
    try { return await chrome.tabs.sendMessage(currentTabId, { action: "extractJobData" }); }
    catch {
      try {
        await chrome.scripting.executeScript({ target: { tabId: currentTabId }, files: ["scraper.js", "content.js"] });
        return await chrome.tabs.sendMessage(currentTabId, { action: "extractJobData" });
      } catch { return null; }
    }
  }
  const response = await extractFromActiveTab();
  if (!response || (!response.role && !response.company)) showNoJobState();
  else { scrapedJob = response; showJobState(); }

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
      });
      chrome.storage.local.set({ pendingJobTransfer: { ...scrapedJob, capturedAt: Date.now() } }, () => {
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
      });
      chrome.storage.local.set({ pendingJobTransfer: { ...scrapedJob, capturedAt: Date.now() } }, () => {
        chrome.tabs.create({ url: `${baseUrl}?${params.toString()}` });
      });
    };
    document.getElementById("track-btn").onclick = () => {
      chrome.storage.local.set({ pendingJobTransfer: { ...scrapedJob, capturedAt: Date.now() } }, () => chrome.tabs.create({ url: `${FRONTEND_URL}/hub?view=applications` }));
    };
    document.getElementById("fill-btn").onclick = async () => {
      const stored = await chrome.storage.local.get(["offerfitContact"]);
      const profile = stored.offerfitContact?.profile;
      if (!profile) { document.getElementById("fill-status").textContent = "Sync your profile from OfferFit Settings first."; return; }
      const preview = [`Name: ${profile.fullName || "—"}`, `Email: ${profile.email || "—"}`, `Phone: ${profile.phone || "—"}`, `LinkedIn: ${profile.linkedin || "—"}`, `Portfolio: ${profile.portfolio || "—"}`].join("\n");
      if (!window.confirm(`Fill empty contact fields with these details?\n\n${preview}\n\nReview before submitting. Eligibility and file uploads remain manual.`)) return;
      chrome.tabs.sendMessage(currentTabId, { action: "autofillContact" }, response => {
        document.getElementById("fill-status").textContent = chrome.runtime.lastError ? "Could not access this page. Reload and retry." : response?.error || `${response?.filled || 0} empty contact fields filled. Review your form.`;
      });
    };
  }
});
