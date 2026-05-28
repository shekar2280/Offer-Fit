document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const tabSync = document.getElementById("tab-sync");
  const tabProfile = document.getElementById("tab-profile");
  const viewSync = document.getElementById("view-sync");
  const viewProfile = document.getElementById("view-profile");

  tabSync.addEventListener("click", () => {
    tabSync.style.color = "#F2AA4C";
    tabProfile.style.color = "rgba(255,255,255,0.4)";
    viewSync.style.display = "block";
    viewProfile.style.display = "none";
  });

  tabProfile.addEventListener("click", () => {
    tabProfile.style.color = "#F2AA4C";
    tabSync.style.color = "rgba(255,255,255,0.4)";
    viewSync.style.display = "none";
    viewProfile.style.display = "block";
  });

  function updateCopyCards(profile) {
    if (!profile) return;
    document.getElementById("c-name").innerText = profile.full_name || profile.name || "Not Synced";
    document.getElementById("c-email").innerText = profile.email || "Not Synced";

    document.getElementById("c-location").innerText = profile.city_country || "Not Synced";
    document.getElementById("c-headline").innerText = profile.headline || "Not Synced";
    document.getElementById("c-skills").innerText = profile.primary_skills || "Not Synced";
    document.getElementById("c-university").innerText = profile.university || "Not Synced";
    document.getElementById("c-study").innerText = profile.field_of_study || "Not Synced";
    document.getElementById("c-grad-year").innerText = profile.graduation_year || "Not Synced";
    document.getElementById("c-linkedin").innerText = profile.linkedin || "Not Synced";
    document.getElementById("c-website").innerText = profile.portfolio_url || profile.website || profile.githubLink || "Not Synced";
  }

  chrome.storage.local.get(["profile"], (result) => {
    if (result.profile) {
      updateCopyCards(result.profile);
    }
  });

  document.querySelectorAll(".copy-card").forEach(card => {
    card.addEventListener("click", (e) => {
      const btn = card.querySelector(".copy-btn");
      const targetId = btn.getAttribute("data-target");
      const text = document.getElementById(targetId).innerText;
      if (text === "Not Synced") return;

      navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.innerText;
        btn.innerText = "Copied!";
        btn.style.background = "#F2AA4C";
        btn.style.color = "black";
        setTimeout(() => {
          btn.innerText = originalText;
          btn.style.background = "rgba(242, 170, 76, 0.1)";
          btn.style.color = "#F2AA4C";
        }, 1500);
      });
    });
  });

  document.getElementById("sync-web-profile").addEventListener("click", () => {
    chrome.tabs.sendMessage(
      tab.id,
      { action: "scrapeWebProfile" },
      (response) => {
        if (response && response.success) {
          chrome.storage.local.get(["profile"], (result) => {
            const currentProfile = result.profile || {};
            const updatedProfile = {
              ...currentProfile,
              full_name: response.data.full_name || currentProfile.full_name || "",
              email: response.data.email || currentProfile.email || "",
              portfolio_url: response.data.portfolio_url || currentProfile.portfolio_url || ""
            };
            chrome.storage.local.set({ profile: updatedProfile }, () => {
              updateCopyCards(updatedProfile);
              alert("Profile synced successfully!");
            });
          });
        } else {
          alert("Make sure you are on the profile page in the web application to sync!");
        }
      }
    );
  });

  document.getElementById("no-job").style.display = "none";
  document.getElementById("job-info").style.display = "none";

  chrome.tabs.sendMessage(tab.id, { action: "extractJobData" }, (response) => {
    if (chrome.runtime.lastError) {
      document.getElementById("no-job").style.display = "block";
      document.getElementById("job-info").style.display = "none";
      return;
    }

    if (response && (response.role || response.company)) {
      document.getElementById("no-job").style.display = "none";
      document.getElementById("job-info").style.display = "block";

      document.getElementById("company").innerText =
        response.company || "Unknown Company";
      document.getElementById("role").innerText =
        response.role || "Unknown Position";
      document.getElementById("location").innerText =
        response.location || "Not Detected";
      document.getElementById("jobType").innerText =
        response.jobType || "Not Detected";

      document.getElementById("sync-btn").onclick = () => {
        // const baseUrl = "https://offerfit.vercel.app/analyze";
        const baseUrl = "http://localhost:3000/analyze";
        const params = new URLSearchParams({
          company: response.company || "",
          role: response.role || "",
          location: response.location || "",
          jobType: response.jobType || "",
          jd: response.description || "",
        });
        chrome.tabs.create({ url: `${baseUrl}?${params.toString()}` });
      };
    } else {
      document.getElementById("no-job").style.display = "block";
      document.getElementById("job-info").style.display = "none";
    }
  });

});
