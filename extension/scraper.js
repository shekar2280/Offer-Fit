const ScraperEngine = {
  extract() {
    return (
      this.fromJSONLD() || 
      this.fromMetaTags() || 
      this.fromHeuristics()
    );
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
      description: description.trim(),
      source: "Heuristic"
    };
  },

  cleanDescription(html) {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }
};
