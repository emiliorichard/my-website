/**
 * ICE REPORT - Citizen Reporting & Immigration Safety Portal
 * Front-end interactivity, form validation, multi-step report wizard,
 * and accessibility enhancements.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initQuickExit();
  initFAQAccordion();
  initCategoryPreselection();
  initReportWizard();
  initContactForm();
  initCopyButtons();
});

/**
 * Mobile Navigation Toggle
 */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', !isExpanded);
    navMenu.classList.toggle('open');
  });

  // Close nav on click outside
  document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target) && navMenu.classList.contains('open')) {
      navMenu.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

/**
 * Quick Exit (Safety Feature)
 * Instantly navigates to an innocuous website (weather.gov)
 */
function initQuickExit() {
  const quickExitBtns = document.querySelectorAll('.btn-quick-exit');
  quickExitBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Replace location immediately so Back button does not reveal reporting history
      window.location.replace('https://www.weather.gov');
    });
  });
}

/**
 * FAQ Accordion
 */
function initFAQAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      
      // Close other open items
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          const otherBtn = other.querySelector('.faq-question');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current
      item.classList.toggle('open', !isOpen);
      questionBtn.setAttribute('aria-expanded', !isOpen);
    });
  });
}

/**
 * Pre-select Category from URL parameters on report.html
 * e.g. report.html?category=trafficking
 */
function initCategoryPreselection() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');
  if (!categoryParam) return;

  const radioInput = document.querySelector(`input[name="category"][value="${categoryParam}"]`);
  if (radioInput) {
    radioInput.checked = true;
    updateRadioCards();
  }
}

function updateRadioCards() {
  document.querySelectorAll('.category-radio-card').forEach(card => {
    const radio = card.querySelector('input[type="radio"]');
    if (radio && radio.checked) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

/**
 * Multi-Step Report Wizard on report.html
 */
function initReportWizard() {
  const wizardForm = document.getElementById('iceReportWizard');
  if (!wizardForm) return;

  const steps = wizardForm.querySelectorAll('.form-step-content');
  const stepNodes = document.querySelectorAll('.wizard-step-node');
  const prevBtn = document.getElementById('wizardPrevBtn');
  const nextBtn = document.getElementById('wizardNextBtn');
  const submitBtn = document.getElementById('wizardSubmitBtn');
  let currentStep = 1;
  const totalSteps = 4;

  // Radio button styling toggle
  const radioCards = wizardForm.querySelectorAll('.category-radio-card');
  radioCards.forEach(card => {
    card.addEventListener('click', () => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        updateRadioCards();
      }
    });
  });

  // Anonymity Toggle
  const anonToggle = document.getElementById('anonymousToggle');
  const contactDetailsGroup = document.getElementById('tipsterContactDetails');
  if (anonToggle && contactDetailsGroup) {
    anonToggle.addEventListener('change', () => {
      if (anonToggle.checked) {
        contactDetailsGroup.style.display = 'none';
        contactDetailsGroup.querySelectorAll('input').forEach(input => {
          input.value = '';
          input.removeAttribute('required');
        });
      } else {
        contactDetailsGroup.style.display = 'block';
      }
    });
  }

  // File Upload simulation
  initFileUpload();

  // Navigation Button Handlers
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        if (currentStep < totalSteps) {
          goToStep(currentStep + 1);
        }
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        goToStep(currentStep - 1);
      }
    });
  }

  // Form Submission
  wizardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      handleReportSubmission();
    }
  });

  function goToStep(step) {
    currentStep = step;
    
    // Update step view
    steps.forEach((s, idx) => {
      s.classList.toggle('active', (idx + 1) === currentStep);
    });

    // Update progress indicator
    stepNodes.forEach((node, idx) => {
      const nodeStep = idx + 1;
      node.classList.remove('active', 'completed');
      if (nodeStep === currentStep) {
        node.classList.add('active');
      } else if (nodeStep < currentStep) {
        node.classList.add('completed');
      }
    });

    // Update buttons
    if (prevBtn) prevBtn.style.display = (currentStep > 1) ? 'inline-flex' : 'none';
    if (nextBtn) nextBtn.style.display = (currentStep < totalSteps) ? 'inline-flex' : 'none';
    if (submitBtn) submitBtn.style.display = (currentStep === totalSteps) ? 'inline-flex' : 'none';

    // Populate review summary on step 4
    if (currentStep === 4) {
      populateReviewSummary();
    }

    // Scroll to top of form
    wizardForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validateStep(step) {
    let isValid = true;
    const currentStepEl = wizardForm.querySelector(`.form-step-content[data-step="${step}"]`);
    if (!currentStepEl) return true;

    // Check required fields within this step
    const requiredInputs = currentStepEl.querySelectorAll('[required]');
    requiredInputs.forEach(input => {
      if (input.type === 'radio') {
        const name = input.name;
        const checked = currentStepEl.querySelector(`input[name="${name}"]:checked`);
        if (!checked) {
          isValid = false;
          highlightError(input.closest('.category-radio-group') || input, 'Please select a violation category.');
        } else {
          clearError(input.closest('.category-radio-group') || input);
        }
      } else if (!input.value.trim()) {
        isValid = false;
        highlightError(input, 'This field is required to submit a valid report.');
      } else {
        clearError(input);
      }
    });

    // Specific validation on step 4: Statute affirmation checkbox
    if (step === 4) {
      const legalAffirm = document.getElementById('legalAffirmation');
      if (legalAffirm && !legalAffirm.checked) {
        isValid = false;
        highlightError(legalAffirm.parentElement, 'You must affirm that this report is submitted in good faith under 18 U.S.C. § 1001.');
      } else if (legalAffirm) {
        clearError(legalAffirm.parentElement);
      }
    }

    return isValid;
  }

  function highlightError(element, message) {
    element.classList.add('input-error');
    let errorMsg = element.parentElement.querySelector('.error-hint');
    if (!errorMsg) {
      errorMsg = document.createElement('div');
      errorMsg.className = 'error-hint text-danger';
      errorMsg.style.fontSize = '0.8rem';
      errorMsg.style.marginTop = '4px';
      errorMsg.style.fontWeight = '600';
      element.parentElement.appendChild(errorMsg);
    }
    errorMsg.textContent = message;
  }

  function clearError(element) {
    element.classList.remove('input-error');
    const errorMsg = element.parentElement.querySelector('.error-hint');
    if (errorMsg) {
      errorMsg.remove();
    }
  }

  function populateReviewSummary() {
    const summaryContainer = document.getElementById('reviewSummaryContent');
    if (!summaryContainer) return;

    const selectedCategory = wizardForm.querySelector('input[name="category"]:checked')?.value || 'Not specified';
    const categoryName = {
      'immigration-violation': 'Immigration Violation (Unlawful Presence / Unauthorized Employment)',
      'human-trafficking': 'Human Trafficking (Labor or Commercial Sex Coercion)',
      'human-smuggling': 'Human Smuggling (Illicit Border Transport & Stash House)',
      'immigration-fraud': 'Immigration Fraud (Sham Marriage / Forged Documents)'
    }[selectedCategory] || selectedCategory;

    const location = document.getElementById('incidentLocation')?.value || 'N/A';
    const cityState = `${document.getElementById('incidentCity')?.value || ''}, ${document.getElementById('incidentState')?.value || ''}`;
    const date = document.getElementById('incidentDate')?.value || 'Ongoing / Recent';
    const description = document.getElementById('incidentDescription')?.value || 'N/A';
    const suspectName = document.getElementById('suspectName')?.value || 'Unknown / Not provided';
    const suspectEmployer = document.getElementById('suspectEmployer')?.value || 'None specified';
    const isAnonymous = document.getElementById('anonymousToggle')?.checked;

    summaryContainer.innerHTML = `
      <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 20px; font-size: 0.9rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid #E2E8F0;">
          <div><strong>Violation Category:</strong><br><span style="color: #0B2545; font-weight: 700;">${escapeHTML(categoryName)}</span></div>
          <div><strong>Reporting Identity:</strong><br><span style="color: ${isAnonymous ? '#059669' : '#1D4ED8'}; font-weight: 700;">${isAnonymous ? 'Strictly Anonymous (No PII Transmitted)' : 'Confidential Contact Provided'}</span></div>
          <div><strong>Location:</strong><br>${escapeHTML(location)} (${escapeHTML(cityState)})</div>
          <div><strong>Date Observed:</strong><br>${escapeHTML(date)}</div>
          <div><strong>Suspect / Entity:</strong><br>${escapeHTML(suspectName)}</div>
          <div><strong>Business / Employer:</strong><br>${escapeHTML(suspectEmployer)}</div>
        </div>
        <div>
          <strong>Detailed Narrative Summary:</strong>
          <p style="margin-top: 6px; color: #334155; line-height: 1.5; white-space: pre-wrap;">${escapeHTML(description)}</p>
        </div>
      </div>
    `;
  }

  function handleReportSubmission() {
    // Generate authentic tracking code: ICE-TIP-2026-[5 random digits]
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const trackingId = `ICE-TIP-2026-${randomCode}`;
    const timestamp = new Date().toLocaleString('en-US', { timeZoneName: 'short' });

    const confirmationBox = document.getElementById('reportConfirmationScreen');
    if (confirmationBox) {
      wizardForm.style.display = 'none';
      confirmationBox.style.display = 'block';
      
      const trackingSpan = confirmationBox.querySelector('.tracking-id-text');
      if (trackingSpan) trackingSpan.textContent = trackingId;

      const timeSpan = confirmationBox.querySelector('.submission-timestamp');
      if (timeSpan) timeSpan.textContent = timestamp;

      // Scroll to top
      confirmationBox.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

/**
 * File Upload Drag & Drop simulation
 */
function initFileUpload() {
  const dropzone = document.getElementById('evidenceDropzone');
  const fileInput = document.getElementById('evidenceFileInput');
  const fileList = document.getElementById('evidenceFileList');
  if (!dropzone || !fileInput || !fileList) return;

  dropzone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFiles(fileInput.files);
    }
  });

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      const li = document.createElement('li');
      li.className = 'file-list-item';
      li.innerHTML = `
        <span>📄 <strong>${escapeHTML(file.name)}</strong> (${(file.size / 1024).toFixed(1)} KB)</span>
        <button type="button" class="file-remove-btn" title="Remove file">&times;</button>
      `;
      li.querySelector('.file-remove-btn').addEventListener('click', () => {
        li.remove();
      });
      fileList.appendChild(li);
    });
  }
}

/**
 * Contact Form on contact.html
 */
function initContactForm() {
  const contactForm = document.getElementById('generalContactForm');
  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Transmitting Securely...';

    setTimeout(() => {
      contactForm.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <div style="width: 56px; height: 56px; background: #D1FAE5; color: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 28px;">✓</div>
          <h3 style="color: #0B2545; font-size: 1.4rem; font-weight: 800; margin-bottom: 8px;">Inquiry Successfully Received</h3>
          <p style="color: #475569; max-width: 480px; margin: 0 auto 20px; font-size: 0.95rem;">
            Thank you for contacting ICE REPORT. Your inquiry has been routed to the appropriate department. Inquiries are typically reviewed within 1-2 business days.
          </p>
          <div style="background: #F8FAFC; border: 1px solid #CBD5E1; padding: 12px; border-radius: 6px; display: inline-block; font-family: monospace; font-size: 0.9rem; font-weight: 700; color: #0B2545;">
            Reference ID: INQ-${Math.floor(100000 + Math.random() * 900000)}
          </div>
        </div>
      `;
    }, 900);
  });
}

/**
 * Copy Buttons (for Case IDs / Phone Numbers)
 */
function initCopyButtons() {
  document.querySelectorAll('.btn-copy-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSelector = btn.getAttribute('data-copy-target');
      const targetEl = document.querySelector(targetSelector);
      if (targetEl) {
        navigator.clipboard.writeText(targetEl.textContent.trim()).then(() => {
          showToast('Case Reference ID copied to clipboard.');
        }).catch(() => {
          showToast('Copied to clipboard.');
        });
      }
    });
  });
}

/**
 * Toast Notification Utility
 */
function showToast(message) {
  let toast = document.querySelector('.toast-notice');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3500);
}

/**
 * HTML Escape Helper
 */
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
