// Email trustworthiness & similarity detection
(function (global) {
  'use strict';

  let MailChecker = null;
  let mailCheckerPromise = null;

  function loadMailChecker() {
    if (!mailCheckerPromise) {
      mailCheckerPromise = import('https://cdn.jsdelivr.net/npm/mailchecker/+esm')
        .then((mod) => {
          MailChecker = mod.default || mod;
          return MailChecker;
        })
        .catch((err) => {
          console.warn('Mailchecker library unavailable:', err);
          return null;
        });
    }
    return mailCheckerPromise;
  }

  // Prefetch in background during idle time
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => loadMailChecker(), { timeout: 3500 });
  } else {
    window.addEventListener('load', () => setTimeout(loadMailChecker, 1500));
  }

  const popularDomains = [
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'yahoo.com',
    'icloud.com',
    'proton.me',
    'protonmail.com'
  ];

  // Legitimate domains that are within 1 edit of popular ones (e.g. mail.com, email.com vs gmail.com)
  const legitimateExceptions = new Set(['mail.com', 'email.com', 'me.com']);

  // Damerau-Levenshtein distance (handles insertions, deletions, substitutions, and transpositions)
  function damerauLevenshtein(a, b) {
    const al = a.length, bl = b.length;
    if (!al) return bl;
    if (!bl) return al;
    const m = [];
    for (let i = 0; i <= al; i++) m[i] = [i];
    for (let j = 0; j <= bl; j++) m[0][j] = j;

    for (let i = 1; i <= al; i++) {
      for (let j = 1; j <= bl; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        m[i][j] = Math.min(
          m[i - 1][j] + 1,       // deletion
          m[i][j - 1] + 1,       // insertion
          m[i - 1][j - 1] + cost // substitution
        );
        // Transposition (e.g., gmial -> gmail)
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          m[i][j] = Math.min(m[i][j], m[i - 2][j - 2] + cost);
        }
      }
    }
    return m[al][bl];
  }

  function findSimilarDomain(domain) {
    if (legitimateExceptions.has(domain)) return null;

    let closest = null;
    let minDistance = Infinity;

    for (const popular of popularDomains) {
      if (domain === popular) return null; // exact match
      const dist = damerauLevenshtein(domain, popular);
      const threshold = popular.length > 8 ? 2 : 1;
      if (dist <= threshold && dist < minDistance) {
        minDistance = dist;
        closest = popular;
      }
    }
    return closest;
  }

  async function validate(emailInput, emailHint, showAlert = false) {
    if (!emailInput || !emailHint) return true;
    const value = emailInput.value.trim();

    if (!value) {
      emailHint.textContent = '';
      emailHint.className = 'field-hint';
      emailInput.classList.remove('is-invalid');
      return !showAlert;
    }

    const lastAt = value.lastIndexOf('@');
    if (lastAt > 0 && lastAt < value.length - 1) {
      const localPart = value.slice(0, lastAt);
      const domain = value.slice(lastAt + 1).toLowerCase();

      // 1. Check for typos using string similarity
      const suggestion = findSimilarDomain(domain);
      if (suggestion) {
        const prefix = showAlert ? 'Please verify your email: did you mean ' : 'Did you mean ';
        emailHint.innerHTML = `${prefix}<button type="button" class="suggestion-link">@${suggestion}</button>?`;
        emailHint.className = showAlert ? 'field-hint error' : 'field-hint info';

        if (showAlert) {
          emailInput.classList.add('is-invalid');
        } else {
          emailInput.classList.remove('is-invalid');
        }

        const btn = emailHint.querySelector('.suggestion-link');
        if (btn) {
          btn.addEventListener('click', () => {
            emailInput.value = `${localPart}@${suggestion}`;
            validate(emailInput, emailHint, false);
          });
        }

        // On submit, halt so user can correct the obvious typo; on blur, just advise gently
        if (showAlert) {
          return false;
        }
        return true;
      }

      // 2. Ensure MailChecker is loaded
      const checker = MailChecker || await loadMailChecker();

      // 3. Check against MailChecker's 56,000+ domain dataset
      if (checker) {
        const isBlacklisted = checker.blacklist ? checker.blacklist().has(domain) : !checker.isValid(value);
        if (isBlacklisted) {
          emailHint.textContent = 'Temporary/disposable email addresses are blocked. Please use a permanent email.';
          emailHint.className = 'field-hint error';
          emailInput.classList.add('is-invalid');
          return false;
        }
      }
    }

    // Clear errors when valid
    emailHint.textContent = '';
    emailHint.className = 'field-hint';
    emailInput.classList.remove('is-invalid');
    return true;
  }

  function setup(emailInput, emailHint) {
    if (!emailInput) return;
    emailInput.addEventListener('focus', () => loadMailChecker(), { once: true });
    emailInput.addEventListener('blur', () => validate(emailInput, emailHint));
    emailInput.addEventListener('input', () => {
      if (emailInput.classList.contains('is-invalid') || emailHint?.classList.contains('info')) {
        validate(emailInput, emailHint);
      }
    });
  }

  global.EmailValidator = {
    load: loadMailChecker,
    validate: validate,
    setup: setup,
    findSimilarDomain: findSimilarDomain
  };
})(window);
