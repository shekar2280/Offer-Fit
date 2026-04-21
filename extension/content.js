chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractJobData") {
    const jobData = extractJobInfo();
    sendResponse(jobData);
  }
  return true; 
});

function extractJobInfo() {
  const url = window.location.href;
  let company = "";
  let role = "";
  let description = "";

  if (url.includes("linkedin.com")) {
    role = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.innerText || 
           document.querySelector('.jobs-unified-top-card__job-title')?.innerText || 
           document.querySelector('h1')?.innerText || 
           document.querySelector('h2.t-24')?.innerText || "";

    company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.innerText || 
              document.querySelector('.jobs-unified-top-card__company-name')?.innerText || 
              document.querySelector('.app-indicator-card__title')?.innerText || 
              document.querySelector('.company-name')?.innerText || "";

    description = document.querySelector('#job-details')?.innerText || 
                  document.querySelector('.jobs-description-content__text')?.innerText || 
                  document.querySelector('.jobs-box__html-content')?.innerText || "";
                  
  } else if (url.includes("indeed.com")) {
    role = document.querySelector('.jobsearch-JobInfoHeader-title')?.innerText || 
           document.querySelector('h1')?.innerText || "";
    company = document.querySelector('.jobsearch-CompanyReview--heading')?.innerText || 
              document.querySelector('[data-company-name="true"]')?.innerText || "";
    description = document.querySelector('#jobDescriptionText')?.innerText || "";
  }

  return {
    company: company.trim().split('\n')[0], 
    role: role.trim(),
    description: description.trim(),
    url: url
  };
}
