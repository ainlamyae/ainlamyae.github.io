document.addEventListener('DOMContentLoaded', () => {
  includePartial('contact-placeholder', '/assets/html/contact.html').then(() => {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const status = document.getElementById('contact-status');

    // --- Google Form bridge ---
    const GOOGLE_FORM_ACTION = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLScmhmwLw_NkpyTvkQyFHUNCtKweFjVNQx_05wbfox0vsSlYAw/formResponse';
    const GOOGLE_FORM_FIELDS = {
      name: 'entry.948123892',
      email: 'entry.1594061230',
      subject: 'entry.1141855673',
      message: 'entry.2016710258'
    };

    // Best-effort IP lookup, kicked off early so it's usually ready by submit time.
    let visitorIp = null;
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => { visitorIp = data.ip; })
      .catch(() => {});

    function pad(n) { return String(n).padStart(2, '0'); }

    function timestamp() {
      const d = new Date();
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
        pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const data = new FormData();
      data.append(GOOGLE_FORM_FIELDS.name, form.name.value.trim());
      data.append(GOOGLE_FORM_FIELDS.email, form.email.value.trim());
      data.append(GOOGLE_FORM_FIELDS.subject, timestamp() + ' ' + (visitorIp || 'Unknown IP') + ' — ' + form.subject.value.trim());
      data.append(GOOGLE_FORM_FIELDS.message, form.message.value.trim());

      status.textContent = 'Sending…';
      status.classList.remove('error');

      // Google Forms doesn't send CORS headers, so the response is opaque
      // ("no-cors"): we can't confirm delivery, only that the request was sent.
      fetch(GOOGLE_FORM_ACTION, {
        method: 'POST',
        mode: 'no-cors',
        body: data
      })
        .then(() => {
          status.textContent = 'Thanks! Your message has been sent.';
          form.reset();
        })
        .catch(() => {
          status.textContent = 'Something went wrong. Please try again later.';
          status.classList.add('error');
        });
    });
  });
});
