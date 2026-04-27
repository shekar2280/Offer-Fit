chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractJobData") {
    const jobData = ScraperEngine.extract();
    sendResponse({
      ...jobData,
      url: window.location.href
    });
  } else if (request.action === "performAutofill") {
    autofillForm(request.profile);
    sendResponse({ success: true });
  } else if (request.action === "scrapeWebProfile") {
    const data = scrapeProfileData();
    sendResponse({ success: true, data });
  }
  return true; 
});

function scrapeProfileData() {
  const data = {};
  const inputs = document.querySelectorAll('input, textarea, select');
  
  inputs.forEach(input => {
    const id = (input.id || '').toLowerCase();
    const label = findLabel(input).toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();
    
    if (id === 'full_name' || label.includes('full name') || placeholder.includes('john doe')) {
      data.full_name = input.value;
    } else if (id === 'email' || label.includes('email address')) {
      data.email = input.value;
    } else if (id === 'phone_number' || label.includes('phone number') || placeholder.includes('+91')) {
      data.phone_number = input.value;
    } else if (id === 'portfolio_url' || label.includes('portfolio') || placeholder.includes('https://')) {
      data.portfolio_url = input.value;
    }
  });
  return data;
}

function autofillForm(profile) {
  const inputs = document.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    const label = findLabel(input).toLowerCase();
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();
    const context = `${label} ${name} ${id} ${placeholder}`;

    if (matches(context, ['name', 'full name', 'first name', 'last name'])) {
      fill(input, profile.name);
    } else if (matches(context, ['email', 'e-mail', 'address'])) {
      fill(input, profile.email);
    } else if (matches(context, ['phone', 'mobile', 'cell', 'contact'])) {
      fill(input, profile.phone);
    } else if (matches(context, ['linkedin', 'social', 'profile'])) {
      fill(input, profile.linkedin);
    }
  });
}

function findLabel(input) {
  if (input.labels && input.labels.length > 0) return input.labels[0].innerText;
  const id = input.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.innerText;
  }
  return '';
}

function matches(text, keywords) {
  return keywords.some(kw => text.includes(kw));
}

function fill(input, value) {
  if (!value) return;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}
