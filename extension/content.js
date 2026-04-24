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
  }
  return true; 
});

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
