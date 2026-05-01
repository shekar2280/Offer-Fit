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

    const role =
      document.querySelector(".job-details-jobs-unified-top-card__job-title h1")?.innerText?.trim() ||
      document.querySelector("h1.t-24")?.innerText?.trim() ||
      document.querySelector("h1")?.innerText?.trim() ||
      "";

    const company =
      document.querySelector(".job-details-jobs-unified-top-card__company-name a")?.innerText?.trim() ||
      document.querySelector(".job-details-jobs-unified-top-card__company-name")?.innerText?.trim() ||
      document.querySelector(".topcard__org-name-link")?.innerText?.trim() ||
      document.querySelector(".topcard__flavor a")?.innerText?.trim() ||
      "";

    const descriptionEl =
      document.querySelector(".jobs-description__content .jobs-box__html-content") ||
      document.querySelector(".jobs-description-content__text") ||
      document.querySelector(".description__text") ||
      document.querySelector("[class*='jobs-description']");

    const description = descriptionEl
      ? this.cleanText(descriptionEl.innerText)
      : "";

    if (!role && !company) return null;

    return { company, role, description, source: "LinkedIn" };
  },

  fromJSONLD() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.innerText);
        const job = this.findJobObject(data);
        if (job) {
          return {
            company: job.hiringOrganization?.name || job.hiringOrganization || "",
            role: job.title || "",
            description: this.cleanDescription(job.description || ""),
            source: "JSON-LD"
          };
        }
      } catch (e) {}
    }
    return null;
  },

  findJobObject(obj) {
    if (obj["@type"] === "JobPosting") return obj;
    if (obj["@graph"]) return obj["@graph"].find(item => item["@type"] === "JobPosting");
    return null;
  },

  fromMetaTags() {
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
    const ogDesc = document.querySelector('meta[property="og:description"]')?.content;
    const company = document.querySelector('meta[property="og:site_name"]')?.content;

    if (ogTitle && ogDesc) {
      return {
        company: company || "",
        role: ogTitle.split('|')[0].split('-')[0].trim(),
        description: ogDesc,
        source: "Meta"
      };
    }
    return null;
  },

  fromHeuristics() {
    const role = document.querySelector('h1')?.innerText || document.title.split('|')[0].trim();
    const company = document.querySelector('[class*="company"], [class*="employer"], [class*="organization"]')?.innerText || "";
    const description = document.querySelector('article, #job-description, .description, [class*="job-details"]')?.innerText || "";

    return {
      company: company.split('\n')[0].trim(),
      role: role.trim(),
      description: this.cleanText(description.trim()),
      source: "Heuristic"
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
    ];

    let cleaned = text;
    for (const pattern of noisePatterns) {
      cleaned = cleaned.replace(pattern, "");
    }

    return cleaned
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .trim();
  },

  cleanDescription(html) {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return this.cleanText(tmp.textContent || tmp.innerText || "");
  }
};
