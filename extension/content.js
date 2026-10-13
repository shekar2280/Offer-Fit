const TRUSTED_ORIGINS = new Set(["https://offerfit.vercel.app", "http://localhost:3000"]);
const trustedPage = TRUSTED_ORIGINS.has(window.location.origin);
function normalizedUrl(value) {
  const url = new URL(value); url.hash = "";
  for (const key of [...url.searchParams.keys()]) if (/^(utm_|ref$|source$|trk$|tracking|referrer$|gh_src$)/i.test(key)) url.searchParams.delete(key);
  url.searchParams.sort(); url.pathname = url.pathname.replace(/\/+$/, "") || "/"; return url.toString();
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractJobData") {
    const jobData = ScraperEngine.extract();
    sendResponse({
      ...jobData,
      url: window.location.href,
    });
  }
  if (request.action === "autofillContact") {
    if (!/(^|\.)(greenhouse\.io|lever\.co|ashbyhq\.com)$/.test(window.location.hostname)) { sendResponse({ error: "Contact autofill supports Greenhouse, Lever, and Ashby. Fill other forms manually." }); return; }
    chrome.storage.local.get(["offerfitContact"], result => {
      const profile = result.offerfitContact?.profile;
      if (!profile) { sendResponse({ error: "Sync your profile from OfferFit Settings first." }); return; }
      let filled = 0;
      const fields = { "full name": profile.fullName, "name": profile.fullName, "email": profile.email, "email address": profile.email, "phone": profile.phone, "phone number": profile.phone, "linkedin": profile.linkedin, "linkedin profile": profile.linkedin, "portfolio": profile.portfolio, "website": profile.portfolio };
      for (const input of document.querySelectorAll('input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"])')) {
        if (input.value || input.disabled || input.readOnly || !["text", "email", "tel", "url"].includes(input.type) || !input.getClientRects().length || input.checkVisibility?.({checkOpacity:true,checkVisibilityCSS:true})===false) continue;
        const label = (input.labels?.[0]?.textContent || input.getAttribute("aria-label") || input.name || "").toLowerCase().replace(/[_*]/g," ").trim().replace(/\s+/g," ");
        const value = fields[label];
        if (!value || typeof value !== "string" || value.length > 300) continue;
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true })); input.dispatchEvent(new Event("change", { bubbles: true })); filled++;
      }
      sendResponse({ filled });
    });
    return true;
  }
  return true;
});

window.addEventListener("message", (event) => {
  if (!trustedPage || event.source !== window || event.origin !== window.location.origin) return;

  if (event.data && event.data.type === "FROM_WEB_APP") {
    if (event.data.action === "REQUEST_JOB_DATA") {
      chrome.storage.local.get(["pendingJobTransfer"], (result) => {
        if (result.pendingJobTransfer && Date.now() - result.pendingJobTransfer.capturedAt < 15 * 60000) {
          window.postMessage(
            {
              type: "FROM_EXTENSION",
              action: "JOB_DATA_RESPONSE",
              data: result.pendingJobTransfer,
            },
            window.location.origin,
          );
        }
      });
    } else if (event.data.action === "ACK_JOB_DATA") {
      chrome.storage.local.remove("pendingJobTransfer");
    } else if (event.data.action === "CLEAR_WORKSPACE") {
      chrome.storage.local.remove(["offerfitApplications","offerfitContact","pendingJobTransfer"]);
    } else if (event.data.action === "SYNC_WORKSPACE") {
      const entries = event.data.data?.applications;
      const profile = event.data.data?.profile;
      if (!Array.isArray(entries) || entries.length > 500 || !profile || typeof profile.email !== "string") return;
      const safe = entries.filter(a => typeof a.job_url === "string" && a.job_url.length <= 2048 && typeof a.status === "string" && typeof a.company === "string" && typeof a.role === "string")
        .map(a => ({ job_url: a.job_url, company: a.company.slice(0,160), role: a.role.slice(0,200), status: a.status.slice(0,30) }));
      const contact = Object.fromEntries(["fullName","email","phone","linkedin","portfolio"].map(k => [k, typeof profile[k] === "string" ? profile[k].slice(0,300) : ""]));
      chrome.storage.local.set({ offerfitApplications: safe, offerfitContact: { profile: contact, syncedAt: Date.now() } }, () => {
        window.postMessage({ type: "FROM_EXTENSION", action: "WORKSPACE_SYNCED" }, window.location.origin);
      });
    }
  }
});

if (trustedPage) {
  chrome.storage.local.get(["pendingJobTransfer"], (result) => {
    if (result.pendingJobTransfer && Date.now() - result.pendingJobTransfer.capturedAt < 15 * 60000) {
      const sendData = () => {
        window.postMessage(
          {
            type: "FROM_EXTENSION",
            action: "JOB_DATA_RESPONSE",
            data: result.pendingJobTransfer,
          },
          window.location.origin,
        );
      };
      sendData();
      setTimeout(sendData, 500);
      setTimeout(sendData, 1500);
    }
  });
} else if (/(greenhouse\.io|lever\.co|ashbyhq\.com|myworkdayjobs\.com)$/.test(window.location.hostname)) {
  chrome.storage.local.get(["offerfitApplications","offerfitContact"], result => {
    if (!result.offerfitContact || Date.now() - result.offerfitContact.syncedAt > 7 * 86400000) return;
    const existing = result.offerfitApplications?.find(a => { try { return normalizedUrl(a.job_url) === normalizedUrl(window.location.href); } catch { return false; } });
    if (!existing) return;
    const host = document.createElement("div"); const shadow = host.attachShadow({ mode: "closed" });
    const button = document.createElement("button"); button.textContent = `OfferFit: ${existing.status} · View / update`;
    button.style.cssText = "font:13px system-ui;color:#F2AA4C;background:#101820;border:1px solid #F2AA4C;padding:12px 16px;border-radius:12px;cursor:pointer";
    button.title = "Based on your last manual workspace sync. Review the latest status in OfferFit.";
    button.onclick = () => chrome.runtime.sendMessage({ action: "openApplication", url: window.location.href, company: existing.company, role: existing.role });
    shadow.appendChild(button); host.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:2147483647"; document.documentElement.appendChild(host);
  });
}
