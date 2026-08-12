// --- CONFIG ---
// Replace these with your real endpoints before launch.
const GOOGLE_REVIEW_URL = "https://g.page/r/REPLACE_WITH_YOUR_GOOGLE_MAPS_LINK/review";
// Optional: point this at a form backend (Formspree, Netlify Forms, your own API, etc).
// If left empty, reservations are only confirmed in the browser and are NOT sent anywhere.
const RESERVATION_ENDPOINT = "";

// --- MOBILE MENU ---
const menuBtn   = document.getElementById('mobile-menu-btn');
const mobileNav = document.getElementById('mobile-menu');
const iconOpen  = document.getElementById('icon-open');
const iconClose = document.getElementById('icon-close');

if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    const isOpen = !mobileNav.classList.contains('hidden');
    mobileNav.classList.toggle('hidden');
    iconOpen.classList.toggle('hidden');
    iconClose.classList.toggle('hidden');
    menuBtn.setAttribute('aria-expanded', String(!isOpen));
  });
}

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.add('hidden');
    iconOpen.classList.remove('hidden');
    iconClose.classList.add('hidden');
    menuBtn.setAttribute('aria-expanded', 'false');
  });
});

// --- LIGHT / DARK MODE TOGGLE ---
// NOTE: the initial theme (dark/light) is now set as early as possible by an
// inline script in <head> to avoid a flash of the wrong theme on load. This
// block only needs to wire up the toggle buttons.
const themeToggleBtn = document.getElementById('theme-toggle');
const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
const htmlElement = document.documentElement;

function toggleTheme() {
  if (htmlElement.classList.contains('dark')) {
    htmlElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    htmlElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
}

if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
if (mobileThemeToggle) mobileThemeToggle.addEventListener('click', toggleTheme);

// --- HEADER SCROLL EFFECT ---
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    header.classList.add('bg-cream/95', 'dark:bg-char/95', 'backdrop-blur-sm', 'border-b', 'border-char/10', 'dark:border-charline');
  } else {
    header.classList.remove('bg-cream/95', 'dark:bg-char/95', 'backdrop-blur-sm', 'border-b', 'border-char/10', 'dark:border-charline');
  }
});

// --- MENU TABS ---
const tabButtons = document.querySelectorAll('.tab-btn');
const menuPanels = document.querySelectorAll('.menu-panel');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetCategory = btn.getAttribute('data-category');
    tabButtons.forEach(b => {
      b.removeAttribute('data-active');
      b.setAttribute('aria-selected', 'false');
      b.setAttribute('tabindex', '-1');
    });
    btn.setAttribute('data-active', 'true');
    btn.setAttribute('aria-selected', 'true');
    btn.setAttribute('tabindex', '0');

    menuPanels.forEach(panel => {
      if (panel.getAttribute('data-category') === targetCategory) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });
  });
});

// --- GOOGLE REVIEWS HANDOFF ---
const reviewForm = document.getElementById('review-form');

if (reviewForm) {
  reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('review-name').value;
    const text = document.getElementById('review-text').value;

    if (name.trim() === '' || text.trim() === '') return;

    // Let the visitor know they're being redirected, then send them to Google.
    alert("Thanks for your feedback! We'll now redirect you to Google to publish your review.");

    window.open(GOOGLE_REVIEW_URL, '_blank', 'noopener,noreferrer');

    reviewForm.reset();
  });
}

// --- RESERVATION VALIDATION & LOGIC ---
const reservationForm = document.getElementById('reservation-form');
const formSuccess = document.getElementById('form-success');
const formError = document.getElementById('form-error');

const nameInput = document.getElementById('name');
const nameError = document.getElementById('name-error');

const emailInput = document.getElementById('email');
const emailError = document.getElementById('email-error');

const phoneInput = document.getElementById('phone');
const phoneError = document.getElementById('phone-error');

const dateInput = document.getElementById('date');
const dateError = document.getElementById('date-error');

// Returns today's date as a "YYYY-MM-DD" string in the visitor's LOCAL
// timezone (avoids the UTC-offset bug that new Date().toISOString() has).
function todayLocalISO() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now - offsetMs).toISOString().split('T')[0];
}

// Set today as the minimum selectable date.
if (dateInput) {
  dateInput.setAttribute('min', todayLocalISO());
}

if (reservationForm) {
  reservationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let isValid = true;

    // 1. Name validation — letters (incl. accented/Unicode), spaces, hyphens, apostrophes.
    const nameRegex = /^[\p{L}][\p{L}\s'-]*$/u;
    if (!nameRegex.test(nameInput.value.trim())) {
      nameError.classList.remove('hidden');
      isValid = false;
    } else {
      nameError.classList.add('hidden');
    }

    // 2. Email validation
    if (!emailInput.checkValidity()) {
      emailError.classList.remove('hidden');
      isValid = false;
    } else {
      emailError.classList.add('hidden');
    }

    // 3. Phone validation — digits plus common formatting characters (+, -, spaces, parens),
    //    at least 8 digits total.
    const rawPhone = phoneInput.value.trim();
    const digitsOnly = rawPhone.replace(/\D/g, '');
    const allowedCharsRegex = /^[0-9+\-\s()]+$/;

    if (!allowedCharsRegex.test(rawPhone) || digitsOnly.length < 8) {
      phoneError.textContent = "Please enter a valid phone number (min. 8 digits).";
      phoneError.classList.remove('hidden');
      isValid = false;
    } else {
      phoneError.classList.add('hidden');
    }

    // 4. Date validation — compare local calendar dates as strings, not Date
    //    objects, so timezone offsets can't push "today" into the past.
    if (!dateInput.value || dateInput.value < todayLocalISO()) {
      dateError.classList.remove('hidden');
      isValid = false;
    } else {
      dateError.classList.add('hidden');
    }

    if (!isValid) return;

    // Send to a backend if one is configured; otherwise this is a front-end-only demo.
    if (RESERVATION_ENDPOINT) {
      try {
        const response = await fetch(RESERVATION_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(reservationForm)))
        });
        if (!response.ok) throw new Error('Request failed');
      } catch (err) {
        if (formError) formError.classList.remove('hidden');
        return;
      }
    }

    // Success
    if (formError) formError.classList.add('hidden');
    formSuccess.classList.remove('hidden');
    reservationForm.reset();
    dateInput.setAttribute('min', todayLocalISO());

    setTimeout(() => {
      formSuccess.classList.add('hidden');
    }, 6000);
  });
}

// --- SCROLL REVEAL OBSERVER ---
const revealElements = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealElements.forEach(el => observer.observe(el));

// Footer year
const yearSpan = document.getElementById('year');
if (yearSpan) yearSpan.textContent = new Date().getFullYear();