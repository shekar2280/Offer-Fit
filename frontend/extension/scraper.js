const ScraperEngine = {
  extract() {
    return (
      this.fromLinkedIn() ||
      this.fromJSONLD() ||
      this.fromMetaTags() ||
      this.fromHeuristics()
    );
  },

  fromLinkedIn() {
    const isLinkedIn = window.location.hostname.includes("linkedin.com");
    if (!isLinkedIn) return null;

    const roleSelectors = [
      "h1.job-details-jobs-unified-top-card__job-title",
      ".jobs-unified-top-card__job-title h1",
      ".jobs-unified-top-card__job-title",
      "h1.t-24",
      ".job-details-jobs-unified-top-card__job-title-link",
      "h1[class*='job-title']",
      ".jobs-details__main-content h1",
      ".job-details-jobs-unified-top-card__job-title a",
      "h1.t-24.t-bold.inline",
      "div[class*='job-details-jobs-unified-top-card'] h1",
      "h1",
    ];

    let role = "";
    for (const sel of roleSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = (el.innerText || el.textContent || "").trim();
        if (text.length > 0) {
          role = text;
          break;
        }
      }
    }

    const companySelectors = [
      ".job-details-jobs-unified-top-card__company-name",
      ".jobs-unified-top-card__company-name",
      ".job-details-jobs-unified-top-card__company-name a",
      ".jobs-unified-top-card__company-name a",
      "div[class*='company-name']",
      ".job-details-jobs-unified-top-card__primary-description a",
      "a[data-tracking-control-name='public_jobs_topcard-org-name']",
      ".topcard__org-name-link",
      "span[class*='company']",
    ];

    let company = "";
    for (const sel of companySelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = (el.innerText || el.textContent || "").trim();
        if (text.length > 0) {
          company = text;
          break;
        }
      }
    }

    const descSelectors = [
      ".jobs-description-content__text",
      ".jobs-box__html-content",
      ".description__text",
      ".jobs-description__content",
      "#job-details",
      ".jobs-description",
      "div[class*='jobs-description']",
      "section[class*='description']",
      ".job-view-layout",
      "article",
    ];

    let description = "";
    for (const sel of descSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = (el.innerText || el.textContent || "").trim();
        if (text.length > 50) {
          description = this.cleanText(text);
          break;
        }
      }
    }

    const locationContainerSelectors = [
      ".job-details-jobs-unified-top-card__primary-description-container",
      ".jobs-unified-top-card__primary-description",
      ".topcard__flavor-row",
      ".job-details-jobs-unified-top-card__primary-description",
    ];

    let location = "";
    for (const sel of locationContainerSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const fullText = (el.innerText || el.textContent || "").trim();
        if (fullText.length > 0) {
          const segment = fullText.split("·")[0].trim();
          if (segment.length > 2 && segment.length < 120 && !/^\d+$/.test(segment)) {
            location = segment;
            break;
          }
        }
      }
    }

    const EXACT_JOB_TERMS = [
      "Remote", "Hybrid", "On-site", "On-Site", "In-person",
      "Full-time", "Part-time", "Contract", "Internship",
      "Temporary", "Freelance", "Volunteer",
      "remote", "hybrid", "on-site", "full-time", "part-time",
      "contract", "internship", "temporary"
    ];
    const EXACT_JOB_SET = new Set(EXACT_JOB_TERMS);

    const directText = (el) =>
      [...el.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent.trim())
        .join("")
        .trim();

    const jobTypeParts = new Set();

    const topCard =
      document.querySelector(".job-details-jobs-unified-top-card") ||
      document.querySelector(".jobs-unified-top-card") ||
      document.querySelector(".scaffold-layout__detail");

    const scanRoot = topCard || document.body;

    const walker = document.createTreeWalker(scanRoot, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    while (node) {
      const txt = directText(node);
      if (EXACT_JOB_SET.has(txt)) {
        jobTypeParts.add(txt);
      }
      const aria = (node.getAttribute && node.getAttribute("aria-label")) || "";
      if (aria && EXACT_JOB_SET.has(aria.trim())) {
        jobTypeParts.add(aria.trim());
      }
      node = walker.nextNode();
    }

    if (jobTypeParts.size === 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const wt = urlParams.get("f_WT");
      if (wt) {
        const wtMap = { "1": "On-site", "2": "Remote", "3": "Hybrid" };
        wt.split(",").forEach((v) => {
          if (wtMap[v.trim()]) jobTypeParts.add(wtMap[v.trim()]);
        });
      }
    }

    const jobType = [...jobTypeParts].join(" | ");

    if (!role && !company) return null;

    return { company, role, location, jobType, description, source: "LinkedIn" };
  },

  fromJSONLD() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.innerText || script.textContent);
        const job = this.findJobObject(data);
        if (job) {
          return {
            company: job.hiringOrganization?.name || job.hiringOrganization || "",
            role: job.title || "",
            location:
              job.jobLocation?.address?.addressLocality ||
              job.jobLocation?.address?.addressRegion ||
              (Array.isArray(job.jobLocation)
                ? job.jobLocation[0]?.address?.addressLocality || ""
                : "") ||
              "",
            jobType: Array.isArray(job.employmentType)
              ? job.employmentType.join(", ")
              : job.employmentType || "",
            description: this.cleanDescription(job.description || ""),
            source: "JSON-LD",
          };
        }
      } catch (_) {
      }
    }
    return null;
  },

  findJobObject(obj) {
    if (!obj || typeof obj !== "object") return null;
    if (obj["@type"] === "JobPosting") return obj;
    if (Array.isArray(obj["@graph"])) {
      return obj["@graph"].find((item) => item["@type"] === "JobPosting") || null;
    }
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = this.findJobObject(item);
        if (found) return found;
      }
    }
    return null;
  },

  fromMetaTags() {
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
    const ogDesc = document.querySelector('meta[property="og:description"]')?.content;
    const company = document.querySelector('meta[property="og:site_name"]')?.content;

    if (ogTitle && ogDesc) {
      return {
        company: company || "",
        role: ogTitle.split("|")[0].split("-")[0].trim(),
        location: "",
        jobType: "",
        description: ogDesc,
        source: "Meta",
      };
    }
    return null;
  },

  fromHeuristics() {
    const role =
      document.querySelector("h1")?.innerText?.trim() ||
      document.title.split("|")[0].trim();
    const company =
      document.querySelector('[class*="company"], [class*="employer"], [class*="organization"]')
        ?.innerText || "";
    const description =
      document.querySelector(
        'article, #job-description, .description, [class*="job-details"]'
      )?.innerText || "";

    return {
      company: company.split("\n")[0].trim(),
      role: role.trim(),
      location: "",
      jobType: "",
      description: this.cleanText(description.trim()),
      source: "Heuristic",
    };
  },

  cleanText(text) {
    const noisePatterns = [
      /^(Share|Show more options|Save|Apply|Easy Apply|Follow|Message|I'm interested|Show more|show more)\s*$/gim,
      /^Save .+ at .+$/gim,
      /^How your profile and resume fit this job$/gim,
      /^Get AI-powered advice.*$/gim,
      /^Show match details$/gim,
      /^Tailor my resume$/gim,
      /^Help me stand out$/gim,
      /^People you can reach out to$/gim,
      /^Meet the hiring team$/gim,
      /^Job search faster with Premium.*$/gim,
      /^Access company insights.*$/gim,
      /^.+ and millions of other members use Premium.*$/gim,
      /^Try Premium for.*$/gim,
      /^1-month free trial.*$/gim,
      /^About the company$/gim,
      /^[\d,]+ followers$/gim,
      /^(IT Services|Software Development|Staffing).*employees.*on LinkedIn$/gim,
      /^Interested in working with us.*$/gim,
      /^Members who share.*$/gim,
      /^Learn more.*$/gim,
      /^Page \d+ of \d+$/gim,
      /^(Previous|Next)$/gim,
      /^Trending employee content$/gim,
      /^Promoted by hirer.*$/gim,
      /^Matches your job preferences.*$/gim,
      /^\(3rd\)|^3rd$/gim,
      /^Report this job$/gim,
      /^Set alert$/gim,
    ];

    let cleaned = text;
    for (const pattern of noisePatterns) {
      cleaned = cleaned.replace(pattern, "");
    }

    return cleaned
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n")
      .trim();
  },

  cleanDescription(html) {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return this.cleanText(tmp.textContent || tmp.innerText || "");
  },
};
