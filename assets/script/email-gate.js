document.addEventListener('DOMContentLoaded', () => {
  if (!document.documentElement.classList.contains('gate-active')) return;

  const form = document.getElementById('gate-form');
  const emailInput = document.getElementById('gate-email');
  const status = document.getElementById('gate-status');
  const submitBtn = document.getElementById('gate-submit');
  const submitLabel = document.getElementById('gate-submit-label');
  if (!form || !emailInput || !status || !submitBtn || !submitLabel) return;

  const GOOGLE_FORM_ACTION = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLScmhmwLw_NkpyTvkQyFHUNCtKweFjVNQx_05wbfox0vsSlYAw/formResponse';
  const GOOGLE_FORM_FIELDS = {
    name: 'entry.948123892',
    email: 'entry.1594061230',
    subject: 'entry.1141855673',
    message: 'entry.2016710258'
  };

  const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

  const VERIFY_DELAY_MS = 700;
  const SUCCESS_DELAY_MS = 500;

  function reveal() {
    document.documentElement.classList.remove('gate-active');
    try { localStorage.setItem('gateVerified', '1'); } catch (e) {}
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (form.dataset.submitting) return;

    const email = emailInput.value.trim();
    if (!EMAIL_PATTERN.test(email)) {
      status.textContent = 'Please enter a valid email address.';
      status.classList.add('error');
      return;
    }

    status.textContent = '';
    status.classList.remove('error');
    form.dataset.submitting = 'true';
    submitBtn.disabled = true;
    submitBtn.classList.add('is-verifying');
    submitLabel.textContent = 'Verifying…';

    const data = new FormData();
    data.append(GOOGLE_FORM_FIELDS.name, 'Visitor');
    data.append(GOOGLE_FORM_FIELDS.email, email);
    data.append(GOOGLE_FORM_FIELDS.subject, 'Visitor at ' + new Date().toLocaleString());
    data.append(GOOGLE_FORM_FIELDS.message, 'Automatic submission from the homepage gate.');

    // Google Forms doesn't send CORS headers, so the response is opaque
    // ("no-cors"): we can't confirm delivery, so we don't block the
    // verify/success animation or the reveal on the request settling.
    fetch(GOOGLE_FORM_ACTION, {
      method: 'POST',
      mode: 'no-cors',
      body: data
    }).catch(() => {});

    setTimeout(() => {
      submitBtn.classList.remove('is-verifying');
      submitBtn.classList.add('is-success');
      submitLabel.textContent = 'Success!';

      setTimeout(reveal, SUCCESS_DELAY_MS);
    }, VERIFY_DELAY_MS);
  });
});
