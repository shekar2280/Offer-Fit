const ScraperEngine = {
  extract() {
    let data =
      this.fromLinkedIn() ||
      this.fromWellfound() ||
      this.fromYC() ||
      this.fromJSONLD() ||
      this.fromMetaTags() ||
      this.fromHeuristics();

    if (data) {
      if (!data.description || data.description.trim().length < 50) {
        const jsonLdData = this.fromJSONLD();
        if (jsonLdData && jsonLdData.description && jsonLdData.description.trim().length >= 50) {
          data.description = jsonLdData.description;
        } else {
          const heuristicData = this.fromHeuristics();
          if (heuristicData && heuristicData.description && heuristicData.description.trim().length >= 50) {
            data.description = heuristicData.description;
          }
        }
      }

      if (data.yoeRequired === undefined || data.yoeRequired === null) {
        data.yoeRequired = this.extractYOEFromText(
          (data.description || "") + "\n" + (document.body.innerText || ""),
          data.role
        );
      }
    }
    return data;
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
      ".top-card-layout__title",
      ".topcard__title",
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
      ".topcard__flavor-row a",
      "a[href*='/company/']",
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
      ".show-more-less-html__markup",
      ".show-more-less-html__markup--collapsed-height",
      "div[class*='jobs-description']",
      "section[class*='description']",
      "div[class*='show-more-less-html']",
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

    const yoeRequired = this.extractYOEFromPage() || this.extractYOEFromText(description, role);

    return { company, role, location, jobType, description, yoeRequired, source: "LinkedIn" };
  },

  fromWellfound() {
    const isWellfound = window.location.hostname.includes("wellfound.com") || window.location.hostname.includes("angel.co");
    if (!isWellfound) return null;

    const roleSelectors = [
      "h1.cl-job-title",
      "h1[class*='jobTitle']",
      "h1",
      ".job-header h1",
      "title"
    ];
    let role = this.getTextBySelectors(roleSelectors);
    if (role && role.includes(" | ")) {
      role = role.split(" | ")[0].trim();
    }

    const companySelectors = [
      "h1[class*='companyName']",
      ".cl-company-name",
      "a[class*='companyLink']",
      "h2[class*='company']",
      ".job-header h2"
    ];
    let company = this.getTextBySelectors(companySelectors);
    if (company && company.includes(" at ")) {
      company = company.split(" at ")[1].trim();
    }

    const descSelectors = [
      ".cl-job-description",
      "[class*='jobDescription']",
      "[class*='description']",
      ".job-description",
      "article"
    ];
    let description = "";
    for (const sel of descSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        description = this.cleanText(el.innerText || el.textContent || "");
        if (description.length > 50) break;
      }
    }

    const locSelectors = [
      ".cl-job-location",
      "[class*='location']",
      "[class*='jobLoc']",
      "[class*='metadata'] span"
    ];
    let location = this.getTextBySelectors(locSelectors) || "Remote / Hybrid";

    let yoeRequired = this.extractYOEFromPage() || this.extractYOEFromText(description + "\n" + document.body.innerText, role);

    return {
      company: company || "Wellfound Startup",
      role: role || "Software Developer",
      location,
      jobType: "Full-time",
      description,
      yoeRequired,
      source: "Wellfound"
    };
  },

  fromYC() {
    const isYC = window.location.hostname.includes("workatastartup.com") || window.location.hostname.includes("ycombinator.com");
    if (!isYC) return null;

    const roleSelectors = [
      "h1.job-title",
      "h1.text-3xl",
      "h1",
      ".job-header h1"
    ];
    let role = this.getTextBySelectors(roleSelectors);

    const companySelectors = [
      ".company-name",
      "h2.company-title",
      "a[href*='/companies/'] h1",
      "a[href*='/companies/'] h2",
      "div.company-title a",
      "h1.company-title"
    ];
    let company = this.getTextBySelectors(companySelectors);

    const descSelectors = [
      ".job-description",
      ".company-description",
      "div.description",
      "article"
    ];
    let description = "";
    for (const sel of descSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        description = this.cleanText(el.innerText || el.textContent || "");
        if (description.length > 50) break;
      }
    }

    const locSelectors = [
      ".job-location",
      ".location-text",
      "span[class*='location']",
      ".job-metadata"
    ];
    let location = this.getTextBySelectors(locSelectors) || "Remote";
    if (location && location.includes("·")) {
      location = location.split("·")[0].trim();
    }

    let yoeRequired = this.extractYOEFromPage() || this.extractYOEFromText(description + "\n" + document.body.innerText, role);

    return {
      company: company || "YC Startup",
      role: role || "Software Engineer",
      location,
      jobType: "Full-time",
      description,
      yoeRequired,
      source: "YC Work at a Startup"
    };
  },

  fromJSONLD() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.innerText || script.textContent);
        const job = this.findJobObject(data);
        if (job) {
          let yoeRequired = null;

          if (job.experienceRequirements) {
            if (typeof job.experienceRequirements === 'string') {
              yoeRequired = this.extractYOEFromText(job.experienceRequirements, job.title);
            } else if (job.experienceRequirements.monthsOfExperience) {
              yoeRequired = Math.round(parseFloat(job.experienceRequirements.monthsOfExperience) / 12);
            }
          }

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
            yoeRequired,
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
        'article, #job-description, .description, [class*="job-details"], #jobDescriptionText, [class*="jobsearch-JobComponent-description"], .show-more-less-html__markup'
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

  getTextBySelectors(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = (el.innerText || el.textContent || "").trim();
        if (text.length > 0) return text;
      }
    }
    return "";
  },

  extractYOEFromPage() {
    const tags = document.querySelectorAll('span, div, p, li, td');
    const badgePattern = /^(\d+)\s*(?:-|–|to)?\s*(\d+)?\s*(?:years?|yrs?)(?:\s+of)?\s*(?:experience|exp)?\s*\+?$/i;

    for (const el of tags) {
      if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
        const text = el.innerText.trim();
        if (badgePattern.test(text)) {
          const match = text.match(badgePattern);
          if (match) {
            return parseFloat(match[1]); 
          }
        }
      }
    }
    return null;
  },

  extractYOEFromText(text, title) {
    if (!text) return null;

    const yoePatterns = [
      /(\d+)\s*(?:-|–|to)\s*(\d+)\s*(?:years?|yrs?)(?:\s+of)?\s*(?:relevant|professional|work|industry)?\s*experience/i,
      /(\d+)\s*\+\s*(?:years?|yrs?)(?:\s+of)?\s*(?:relevant|professional|work|industry)?\s*experience/i,
      /(?:minimum\s+of|at\s+least|required|need|prefer|minimum)?\s*(\d+)\s*(?:years?|yrs?)(?:\s+of)?\s*(?:relevant|professional|work|industry)?\s*experience/i,
      /(\d+)\s*(?:-|–|to)\s*(\d+)\s*(?:years?|yrs?)/i,
      /(\d+)\s*\+\s*(?:years?|yrs?)/i,
      /\b(one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:years?|yrs?)(?:\s+of)?\s*(?:relevant|professional|work|industry)?\s*experience/i,
      /(\d+)\s*(?:years?|yrs?)\s+(?:required|preferred|experience)/i
    ];

    if (title) {
      for (const pattern of yoePatterns) {
        const match = title.match(pattern);
        if (match) {
          return this.parseNumber(match[1]);
        }
      }
    }

    const sentences = text.split(/[\n.]/);
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (
        trimmed.toLowerCase().includes("experience") ||
        trimmed.toLowerCase().includes("yoe") ||
        trimmed.toLowerCase().includes("year") ||
        trimmed.toLowerCase().includes("yrs")
      ) {
        for (const pattern of yoePatterns) {
          const match = trimmed.match(pattern);
          if (match) {
            return this.parseNumber(match[1]);
          }
        }
      }
    }

    for (const pattern of yoePatterns) {
      const match = text.match(pattern);
      if (match) {
        return this.parseNumber(match[1]);
      }
    }

    return null;
  },

  parseNumber(str) {
    const wordMap = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10
    };
    const val = str.toLowerCase().trim();
    if (wordMap[val]) return wordMap[val];
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
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
