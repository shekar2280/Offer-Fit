document.addEventListener("DOMContentLoaded", async () => {
  let currentTabId = null;
  let scrapedJob = null;
  let userProfile = {
    name: "",
    email: "",
    title: "",
    yoe: 0,
    skills: "",
    resumeText: "",
  };

  const tabMatch = document.getElementById("tab-match");
  const tabProfile = document.getElementById("tab-profile");
  const viewMatch = document.getElementById("view-match");
  const viewProfile = document.getElementById("view-profile");

  const btnRunMatch = document.getElementById("btn-run-match");
  const btnForceScrape = document.getElementById("btn-force-scrape-manual");

  const CIRCUMFERENCE = 194.78;
  const scoreRing = document.getElementById("score-ring");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab ? tab.id : null;

  chrome.storage.local.get(["profile"], (result) => {
    if (result.profile) {
      userProfile = normalizeProfile(result.profile);
    }

    initProfileView();
    triggerJobScraping();
  });

  function normalizeProfile(rawProfile) {
    if (!rawProfile)
      return {
        name: "",
        email: "",
        title: "",
        yoe: 0,
        skills: "",
        resumeText: "",
      };
    return {
      name: rawProfile.name || rawProfile.full_name || "",
      email: rawProfile.email || "",
      title: rawProfile.title || rawProfile.headline || "",
      yoe: parseFloat(rawProfile.yoe || rawProfile.experience_years || 0),
      skills: rawProfile.skills || rawProfile.primary_skills || "",
      resumeText: rawProfile.resumeText || rawProfile.resume_text || "",
    };
  }

  function updateScoreRing(score, title = "Match Score", verdict = "") {
    if (!scoreRing) return;

    score = Math.max(0, Math.min(100, Math.round(score)));
    const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
    scoreRing.style.strokeDashoffset = offset;

    document.getElementById("score-percent").innerText = `${score}%`;
    document.getElementById("score-title-text").innerText = title;

    if (verdict) {
      document.getElementById("score-verdict-text").innerText = verdict;
    } else {
      let calcVerdict = "Needs Profile Setup";
      if (score >= 85) calcVerdict = "Excellent Compatibility!";
      else if (score >= 70) calcVerdict = "Strong Fit & Good Skills Match";
      else if (score >= 50) calcVerdict = "Moderate Match (Gaps Present)";
      else if (score > 0) calcVerdict = "Low Compatibility";
      document.getElementById("score-verdict-text").innerText = calcVerdict;
    }

    const percentText = document.getElementById("score-percent");
    if (score >= 80) {
      scoreRing.style.stroke = "#2ed573";
      percentText.style.color = "#2ed573";
    } else if (score >= 50) {
      scoreRing.style.stroke = "#ffa502";
      percentText.style.color = "#ffa502";
    } else {
      scoreRing.style.stroke = "#ff4757";
      percentText.style.color = "#ff4757";
    }
  }

  function triggerJobScraping() {
    if (!currentTabId) {
      showNoJobState();
      return;
    }

    if (btnRunMatch) btnRunMatch.innerText = "Scanning page...";

    chrome.tabs.sendMessage(
      currentTabId,
      { action: "extractJobData" },
      (response) => {
        if (btnRunMatch) btnRunMatch.innerText = "Scan & Match Tab";

        if (
          chrome.runtime.lastError ||
          !response ||
          (!response.role && !response.company)
        ) {
          showNoJobState();
          return;
        }

        scrapedJob = response;
        showJobState();
      },
    );
  }

  function showNoJobState() {
    document.getElementById("no-job").style.display = "block";
    document.getElementById("job-info").style.display = "none";
    document.getElementById("scrape-warning-box").style.display = "none";
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
    const statusBadge = document.getElementById("scrape-status-badge");
    const warningBox = document.getElementById("scrape-warning-box");

    [roleEl, companyEl, locationEl, typeEl].forEach((el) => {
      el.className = "meta-value";
    });

    let hasIncompleteField = false;

    if (
      roleVal &&
      !roleVal.toLowerCase().includes("unknown") &&
      !roleVal.toLowerCase().includes("detecting")
    ) {
      roleEl.innerText = roleVal;
    } else {
      roleEl.innerText = "Not Detected";
      roleEl.classList.add("danger-text");
      hasIncompleteField = true;
    }

    if (
      companyVal &&
      !companyVal.toLowerCase().includes("unknown") &&
      !companyVal.toLowerCase().includes("detecting")
    ) {
      companyEl.innerText = companyVal;
    } else {
      companyEl.innerText = "Not Detected";
      companyEl.classList.add("danger-text");
      hasIncompleteField = true;
    }

    if (
      locationVal &&
      !locationVal.toLowerCase().includes("unknown") &&
      !locationVal.toLowerCase().includes("detecting")
    ) {
      locationEl.innerText = locationVal;
    } else {
      locationEl.innerText = "Unknown";
      locationEl.classList.add("warning-text");
    }

    if (
      jobTypeVal &&
      !jobTypeVal.toLowerCase().includes("unknown") &&
      !jobTypeVal.toLowerCase().includes("detecting")
    ) {
      typeEl.innerText = jobTypeVal;
    } else {
      typeEl.innerText = "Full-time (Assumed)";
      typeEl.classList.add("warning-text");
    }

    if (!scrapedJob.description || scrapedJob.description.length < 50) {
      hasIncompleteField = true;
    }

    if (hasIncompleteField) {
      statusBadge.innerText = "Incomplete";
      statusBadge.className = "badge badge-missing";
      warningBox.style.display = "block";
    } else {
      statusBadge.innerText = "Successful";
      statusBadge.className = "badge badge-matched";
      warningBox.style.display = "none";
    }

    document.getElementById("sync-btn").onclick = () => {
      const baseUrl = "https://offerfit.vercel.app/analyze";
      const params = new URLSearchParams({
        company: scrapedJob.company || "",
        role: scrapedJob.role || "",
        location: scrapedJob.location || "",
        jobType: scrapedJob.jobType || "",
      });
      chrome.storage.local.set({ pendingJobTransfer: scrapedJob }, () => {
        chrome.tabs.create({ url: `${baseUrl}?${params.toString()}` });
      });
    };

    document.getElementById("customize-btn").onclick = () => {
      const baseUrl = "https://offerfit.vercel.app/customize";
      const params = new URLSearchParams({
        company: scrapedJob.company || "",
        role: scrapedJob.role || "",
        location: scrapedJob.location || "",
        jobType: scrapedJob.jobType || "",
      });
      chrome.storage.local.set({ pendingJobTransfer: scrapedJob }, () => {
        chrome.tabs.create({ url: `${baseUrl}?${params.toString()}` });
      });
    };

    runLocalMatch();
  }

  function runLocalMatch() {
    if (!scrapedJob) return;

    const reqYoe = scrapedJob.yoeRequired;
    const userYoe = userProfile.yoe || 0;

    document.getElementById("exp-user-val").innerText = `${userYoe} years`;

    let expScore = 100;
    const banner = document.getElementById("exp-status-banner");

    if (reqYoe !== null && reqYoe !== undefined) {
      document.getElementById("exp-required-val").innerText = `${reqYoe}+ years`;

      if (userYoe >= reqYoe) {
        banner.className = "status-banner success";
        const surplus = userYoe - reqYoe;
        banner.innerText =
          surplus > 0
            ? `Experience Match: You exceed the requirement by ${surplus} year(s).`
            : "Experience Match: You meet the requirement.";
        expScore = 100;
      } else {
        banner.className = "status-banner danger";
        const gap = reqYoe - userYoe;
        banner.innerText = `Experience Gap: Requires ${reqYoe} years, you have ${userYoe} (Gap of ${gap} year(s)).`;
        expScore = Math.max(10, (userYoe / reqYoe) * 100);
      }
    } else {
      document.getElementById("exp-required-val").innerText = "Not specified";
      banner.className = "status-banner success";
      banner.innerText = "No specific experience requirement found (Assuming Match).";
      expScore = 100;
    }

    const userSkillsList = userProfile.skills
      ? userProfile.skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [];

    const jdText = (scrapedJob.description || "").toLowerCase();

    const COMMON_SKILLS = [
      "React", "Angular", "Vue", "Svelte", "Next.js", "Vite", "Nuxt", "HTML", "CSS", "Tailwind", "Sass", "Redux",
      "TypeScript", "JavaScript", "Python", "Django", "Flask", "FastAPI", "Node.js", "Express", "NestJS",
      "Java", "Spring", "Kotlin", "Go", "Golang", "Rust", "C++", "C#", "PHP", "Laravel", "Ruby", "Rails",
      "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra", "GraphQL", "REST API", "gRPC",
      "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "CI/CD", "Git", "GitHub", "Jenkins",
      "Figma", "UI/UX", "Agile", "Scrum", "Jira", "Testing", "Jest", "Cypress"
    ];

    const jdSkills = new Set();
    const matchedSkills = new Set();
    const missingSkills = new Set();

    // 1. Identify all common dictionary skills mentioned in the JD
    for (const skill of COMMON_SKILLS) {
      const regex = new RegExp(`\\b${skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
      if (regex.test(jdText)) {
        jdSkills.add(skill);
      }
    }

    // 2. Check if the user has these required common skills
    for (const skill of jdSkills) {
      const lowerSkill = skill.toLowerCase();
      const userHasSkill = userSkillsList.some((s) => {
        const lowerUserSkill = s.toLowerCase();
        return lowerUserSkill === lowerSkill || lowerSkill.includes(lowerUserSkill) || lowerUserSkill.includes(lowerSkill);
      });

      if (userHasSkill) {
        matchedSkills.add(skill);
      } else {
        missingSkills.add(skill);
      }
    }

    // 3. Find unique custom skills the user listed that are directly mentioned in the JD
    for (const skill of userSkillsList) {
      const regex = new RegExp(`\\b${skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
      if (regex.test(jdText)) {
        matchedSkills.add(skill);
      }
    }

    const matchedArr = Array.from(matchedSkills);
    const missingArr = Array.from(missingSkills);
    
    // Total required is the common skills found + any custom ones the user matched
    const totalJdSkillsCount = jdSkills.size + matchedArr.filter(s => !jdSkills.has(s)).length;

    const matchedContainer = document.getElementById("skills-matched");
    const missingContainer = document.getElementById("skills-missing");

    if (matchedArr.length > 0) {
      matchedContainer.innerHTML = matchedArr
        .map((s) => `<span class="badge badge-matched">${s}</span>`)
        .join("");
    } else {
      matchedContainer.innerHTML = '<span style="font-size: 10px; color: var(--text-muted); font-style: italic;">None matched</span>';
    }

    if (missingArr.length > 0) {
      missingContainer.innerHTML = missingArr
        .map((s) => `<span class="badge badge-missing">${s}</span>`)
        .join("");
    } else {
      missingContainer.innerHTML = '<span style="font-size: 10px; color: var(--success); font-style: italic;">No missing skills detected!</span>';
    }

    let skillScore = 100;
    if (totalJdSkillsCount > 0) {
      skillScore = (matchedArr.length / totalJdSkillsCount) * 100;
    } else if (userSkillsList.length > 0) {
      skillScore = matchedArr.length > 0 ? 100 : 0;
    } else {
      skillScore = 0;
    }

    const blendScore = Math.round(skillScore * 0.7 + expScore * 0.3);

    let localVerdict = "Please configure your skills in Profile.";
    if (userSkillsList.length > 0 || userYoe > 0) {
      if (blendScore >= 85) localVerdict = "Excellent match! You possess key skills and experience.";
      else if (blendScore >= 70) localVerdict = "Good match. You meet experience levels and core skills.";
      else if (blendScore >= 50) localVerdict = "Fair match, but missing multiple critical skills or years.";
      else localVerdict = "Significant skill gaps and experience mismatch detected.";
    }

    updateScoreRing(blendScore, "Local Fit Match", localVerdict);
  }

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const targetViewId = btn.getAttribute("data-tab");
      document
        .querySelectorAll(".view-content")
        .forEach((v) => v.classList.remove("active"));
      document.getElementById(targetViewId).classList.add("active");
    });
  });

  btnRunMatch.addEventListener("click", () => {
    triggerJobScraping();
  });

  btnForceScrape.addEventListener("click", () => {
    triggerJobScraping();
  });

  const viewState = document.getElementById("profile-view-state");
  const editState = document.getElementById("profile-edit-state");
  const editBtn = document.getElementById("edit-profile-btn");
  const saveBtn = document.getElementById("save-profile-btn");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  const syncWebBtn = document.getElementById("sync-web-profile");

  function initProfileView() {
    document.getElementById("c-name").innerText =
      userProfile.name || "Not configured";
    document.getElementById("c-email").innerText =
      userProfile.email || "Not configured";
    document.getElementById("c-title").innerText =
      userProfile.title || "Not configured";
    document.getElementById("c-yoe").innerText =
      `${userProfile.yoe || 0} years`;

    const skillsContainer = document.getElementById("c-skills-list");
    if (userProfile.skills) {
      skillsContainer.innerHTML = userProfile.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s) => `<span class="badge badge-neutral">${s}</span>`)
        .join("");
    } else {
      skillsContainer.innerHTML =
        '<span class="badge badge-neutral">No skills added</span>';
    }

    const excerpt = document.getElementById("c-resume-excerpt");
    if (userProfile.resumeText) {
      excerpt.innerText =
        userProfile.resumeText.substring(0, 120) +
        (userProfile.resumeText.length > 120 ? "..." : "");
    } else {
      excerpt.innerText =
        "Empty resume text. Save a resume in Edit mode to use on-site.";
    }
  }

  editBtn.addEventListener("click", () => {
    document.getElementById("input-name").value = userProfile.name;
    document.getElementById("input-email").value = userProfile.email;
    document.getElementById("input-title").value = userProfile.title;
    document.getElementById("input-yoe").value = userProfile.yoe;
    document.getElementById("input-skills").value = userProfile.skills;
    document.getElementById("input-resume").value = userProfile.resumeText;

    viewState.style.display = "none";
    editState.style.display = "block";
  });

  cancelBtn.addEventListener("click", () => {
    editState.style.display = "none";
    viewState.style.display = "block";
  });

  saveBtn.addEventListener("click", () => {
    userProfile = {
      name: document.getElementById("input-name").value.trim(),
      email: document.getElementById("input-email").value.trim(),
      title: document.getElementById("input-title").value.trim(),
      yoe: parseFloat(document.getElementById("input-yoe").value) || 0,
      skills: document.getElementById("input-skills").value.trim(),
      resumeText: document.getElementById("input-resume").value.trim(),
    };

    chrome.storage.local.set({ profile: userProfile }, () => {
      initProfileView();
      editState.style.display = "none";
      viewState.style.display = "block";

      if (scrapedJob) {
        runLocalMatch();
      }
    });
  });

  syncWebBtn.addEventListener("click", () => {
    if (!currentTabId) {
      alert("No active web page tab found.");
      return;
    }

    chrome.tabs.sendMessage(
      currentTabId,
      { action: "scrapeWebProfile" },
      (response) => {
        if (response && response.success) {
          chrome.storage.local.get(["profile"], (result) => {
            const currentProfile = result.profile || {};
            const merged = {
              ...currentProfile,
              full_name:
                response.data.full_name || currentProfile.full_name || "",
              email: response.data.email || currentProfile.email || "",
              portfolio_url:
                response.data.portfolio_url ||
                currentProfile.portfolio_url ||
                "",
            };

            chrome.storage.local.set({ profile: merged }, () => {
              userProfile = normalizeProfile(merged);
              initProfileView();
              alert(
                "Profile metadata synced successfully from web application page!",
              );
              if (scrapedJob) {
                runLocalMatch();
              }
            });
          });
        } else {
          alert(
            "Make sure you are on the profile page in the web application to sync!",
          );
        }
      },
    );
  });

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (
      event.data &&
      event.data.type === "FROM_RESUME_ANALYZER" &&
      event.data.action === "SYNC_PROFILE"
    ) {
      chrome.storage.local.set({ profile: event.data.data }, () => {
        userProfile = normalizeProfile(event.data.data);
        initProfileView();
        if (scrapedJob) {
          runLocalMatch();
        }
      });
    }
  });
});
