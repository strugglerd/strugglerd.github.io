// Theme toggle handling
const themeBtn = document.getElementById('theme-btn');
const sunIcon = document.getElementById('theme-icon-sun');
const moonIcon = document.getElementById('theme-icon-moon');

function updateThemeUI(theme) {
  if (!sunIcon || !moonIcon) return;
  if (theme === 'dark') {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  } else {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  }
}

// Meta theme-color synchronization
const metaThemeColors = document.querySelectorAll('meta[name="theme-color"]');
function updateMetaThemeColor(theme) {
  const color = theme === 'dark' ? '#09090b' : '#ffffff';
  metaThemeColors.forEach((meta) => meta.setAttribute('content', color));
}

const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
updateThemeUI(currentTheme);

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const active = document.documentElement.getAttribute('data-theme');
    const next = active === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeUI(next);
    updateMetaThemeColor(next);
  });
}

// Dynamic OS theme change listener
if (window.matchMedia) {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const handleOSChange = (e) => {
    if (!localStorage.getItem('theme')) {
      const next = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      updateThemeUI(next);
      updateMetaThemeColor(next);
    }
  };
  if (mql.addEventListener) {
    mql.addEventListener('change', handleOSChange);
  } else if (mql.addListener) {
    mql.addListener(handleOSChange);
  }
}

// Year auto-update
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Scroll below indicator
const scrollIndicator = document.getElementById('scroll-indicator');
if (scrollIndicator) {
  const checkScroll = () => {
    const hasScroll = document.documentElement.scrollHeight > window.innerHeight + 80;
    if (!hasScroll || window.scrollY > 120) {
      scrollIndicator.classList.add('is-hidden');
    } else {
      scrollIndicator.classList.remove('is-hidden');
    }
  };

  scrollIndicator.addEventListener('click', () => {
    window.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' });
  });

  window.addEventListener('scroll', checkScroll, { passive: true });
  window.addEventListener('resize', checkScroll, { passive: true });
  checkScroll();
}

// Email verification integration
const emailInput = document.getElementById('email-input');
const emailHint = document.getElementById('email-hint');

if (window.EmailValidator && emailInput) {
  window.EmailValidator.setup(emailInput, emailHint);
}

// Async contact form submission
const form = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

if (form) {
  // Clear any previous status message when user resumes typing
  form.addEventListener('input', () => {
    if (formStatus && formStatus.textContent) {
      formStatus.textContent = '';
      formStatus.className = 'form-status';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Silent honeypot drop (if filled by bot, fake success without sending)
    const gotcha = form.elements['_gotcha'];
    if (gotcha && gotcha.value) {
      form.reset();
      if (formStatus) {
        formStatus.textContent = 'Message sent.';
        formStatus.classList.add('success');
      }
      return;
    }

    // 2. Verify email trustworthiness
    if (window.EmailValidator) {
      const isEmailOk = await window.EmailValidator.validate(emailInput, emailHint, true);
      if (!isEmailOk) {
        if (emailInput) emailInput.focus();
        return;
      }
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : 'Send message';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }
    if (formStatus) {
      formStatus.textContent = '';
      formStatus.className = 'form-status';
    }

    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        form.reset();
        if (emailHint) {
          emailHint.textContent = '';
          emailHint.className = 'field-hint';
        }
        if (emailInput) {
          emailInput.classList.remove('is-invalid');
        }
        if (formStatus) {
          formStatus.textContent = 'Message sent.';
          formStatus.classList.add('success');
        }
      } else {
        const data = await response.json();
        if (formStatus) {
          formStatus.textContent = data?.errors?.map(err => err.message).join(', ') || 'Failed to send. Please email me directly.';
          formStatus.classList.add('error');
        }
      }
    } catch (err) {
      if (formStatus) {
        formStatus.textContent = 'Network error. Please email me directly.';
        formStatus.classList.add('error');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
}
