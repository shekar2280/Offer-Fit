document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('linkedin.com') && !tab.url.includes('indeed.com')) {
    document.getElementById('no-job').style.display = 'block';
    document.getElementById('job-info').style.display = 'none';
    return;
  }

  document.getElementById('no-job').style.display = 'none';
  document.getElementById('job-info').style.display = 'block';

  chrome.tabs.sendMessage(tab.id, { action: "extractJobData" }, (response) => {
    if (response) {
      document.getElementById('company').innerText = response.company || "Unknown Company";
      document.getElementById('role').innerText = response.role || "Unknown Role";
      
      const syncBtn = document.getElementById('sync-btn');
      syncBtn.addEventListener('click', () => {
        const baseUrl = "http://localhost:3000"; 
        const params = new URLSearchParams({
          company: response.company,
          role: response.role,
          jd: response.description
        });
        
        chrome.tabs.create({ url: `${baseUrl}?${params.toString()}` });
      });
    }
  });
});
