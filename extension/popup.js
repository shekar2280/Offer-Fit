document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const tabSync = document.getElementById('tab-sync');
  const tabProfile = document.getElementById('tab-profile');
  const viewSync = document.getElementById('view-sync');
  const viewProfile = document.getElementById('view-profile');

  tabSync.addEventListener('click', () => {
    tabSync.style.color = '#F2AA4C';
    tabProfile.style.color = 'rgba(255,255,255,0.4)';
    viewSync.style.display = 'block';
    viewProfile.style.display = 'none';
  });

  tabProfile.addEventListener('click', () => {
    tabProfile.style.color = '#F2AA4C';
    tabSync.style.color = 'rgba(255,255,255,0.4)';
    viewSync.style.display = 'none';
    viewProfile.style.display = 'block';
  });

  chrome.storage.local.get(['profile'], (result) => {
    if (result.profile) {
      document.getElementById('p-name').value = result.profile.name || '';
      document.getElementById('p-email').value = result.profile.email || '';
      document.getElementById('p-phone').value = result.profile.phone || '';
      document.getElementById('p-githubLink').value = result.profile.githubLink || '';
    }
  });

  document.getElementById('save-profile').addEventListener('click', () => {
    const profile = {
      name: document.getElementById('p-name').value,
      email: document.getElementById('p-email').value,
      phone: document.getElementById('p-phone').value,
      githubLink: document.getElementById('p-githubLink').value,
    };
    chrome.storage.local.set({ profile }, () => {
      alert('Profile saved!');
      tabSync.click();
    });
  });

  document.getElementById('sync-web-profile').addEventListener('click', () => {
    chrome.tabs.sendMessage(tab.id, { action: "scrapeWebProfile" }, (response) => {
      if (response && response.success) {
        chrome.storage.local.get(['profile'], (result) => {
          const currentProfile = result.profile || {};

          const updatedProfile = {
            name: response.data.full_name || currentProfile.name || '',
            email: response.data.email || currentProfile.email || '',
            phone: response.data.phone_number || currentProfile.phone || '',
            githubLink: response.data.portfolio_url || currentProfile.githubLink || ''
          };

          document.getElementById('p-name').value = updatedProfile.name;
          document.getElementById('p-email').value = updatedProfile.email;
          document.getElementById('p-phone').value = updatedProfile.phone;
          document.getElementById('p-githubLink').value = updatedProfile.githubLink;

          chrome.storage.local.set({ profile: updatedProfile }, () => {
            alert('Intelligence Sync: Partial data merged successfully!');
          });
        });
      } else {
        alert('Could not find profile data. Make sure you are on your website profile page!');
      }
    });
  });

  document.getElementById('no-job').style.display = 'none';
  document.getElementById('job-info').style.display = 'block';

  chrome.tabs.sendMessage(tab.id, { action: "extractJobData" }, (response) => {
    if (chrome.runtime.lastError) {
      document.getElementById('no-job').style.display = 'block';
      document.getElementById('job-info').style.display = 'none';
      return;
    }

    if (response && response.role) {
      document.getElementById('company').innerText = response.company || "Unknown Company";
      document.getElementById('role').innerText = response.role || "Unknown Position";
      
      document.getElementById('sync-btn').onclick = () => {
        const baseUrl = "http://localhost:3000/analyze"; 
        const params = new URLSearchParams({
          company: response.company || "",
          role: response.role || "",
          jd: response.description || ""
        });
        chrome.tabs.create({ url: `${baseUrl}?${params.toString()}` });
      };
    } else {
      document.getElementById('no-job').style.display = 'block';
      document.getElementById('job-info').style.display = 'none';
    }
  });

  document.getElementById('autofill-btn').addEventListener('click', () => {
    chrome.storage.local.get(['profile'], (result) => {
      if (!result.profile) {
        alert('Please fill out your profile first!');
        tabProfile.click();
        return;
      }
      chrome.tabs.sendMessage(tab.id, { 
        action: "performAutofill", 
        profile: result.profile 
      });
    });
  });
});
