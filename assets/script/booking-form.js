/**
 * booking-form.js
 * Booking page: picks date/time/duration, computes the fee from the rate
 * schedule, records the booking in the Google Form (same one as the contact
 * page), then sends the visitor to PayPal to pay.
 */
document.addEventListener('DOMContentLoaded', () => {
  includePartial('booking-placeholder', '/assets/html/booking.html').then(() => {
    const form = document.getElementById('booking-form');
    if (!form) return;

    // ── Configuration ─────────────────────────────────────────
    // PayPal.me handle: the part after paypal.me/ (e.g. "AliNasr").
    const PAYPAL_ME_USERNAME = 'ainlamyae';
    const CURRENCY = 'USD';

    const TIME_ZONE = 'America/Toronto';
    const DAY_START = 8 * 60;    // first bookable minute (08:00)
    const DAY_END = 22 * 60;     // meetings must end by 22:00
    const SLOT = 30;             // minutes; also the billing block size
    const MAX_DAYS_AHEAD = 90;

    // Hourly rates. Core weekday hours are PEAK; everything else
    // (lunch, evenings, early morning, weekends) is OFF_PEAK.
    const PEAK = 200;
    const OFF_PEAK = 150;
    const PEAK_WINDOWS = [[8 * 60, 12 * 60], [13 * 60, 17 * 60]];

    // Same Google Form as the contact page; booking details go in subject/message.
    const GOOGLE_FORM_ACTION = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLScmhmwLw_NkpyTvkQyFHUNCtKweFjVNQx_05wbfox0vsSlYAw/formResponse';
    const GOOGLE_FORM_FIELDS = {
      name: 'entry.948123892',
      email: 'entry.1594061230',
      subject: 'entry.1141855673',
      message: 'entry.2016710258'
    };

    // ── Elements ──────────────────────────────────────────────
    const dateEl = document.getElementById('booking-date');
    const timeEl = document.getElementById('booking-time');
    const durEl = document.getElementById('booking-duration');
    const feeEl = document.getElementById('booking-fee');
    const feeDetailEl = document.getElementById('booking-fee-detail');
    const status = document.getElementById('booking-status');
    const submitBtn = document.getElementById('booking-submit');

    let visitorIp = null;
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => { visitorIp = data.ip; })
      .catch(() => {});

    // ── Helpers ───────────────────────────────────────────────
    const pad = n => String(n).padStart(2, '0');
    const fmtTime = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
    const money = n => '$' + (Number.isInteger(n) ? n : n.toFixed(2));

    // Current date and minute-of-day in Toronto, regardless of visitor's zone.
    function torontoNow() {
      const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', {
          timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
        }).formatToParts(new Date()).map(p => [p.type, p.value])
      );
      return {
        date: `${parts.year}-${parts.month}-${parts.day}`,
        minutes: Number(parts.hour) * 60 + Number(parts.minute)
      };
    }

    function addDays(isoDate, days) {
      const [y, m, d] = isoDate.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d + days));
      return dt.toISOString().slice(0, 10);
    }

    function isWeekend(isoDate) {
      const [y, m, d] = isoDate.split('-').map(Number);
      const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      return day === 0 || day === 6;
    }

    function rateAt(isoDate, minute) {
      if (isWeekend(isoDate)) return OFF_PEAK;
      return PEAK_WINDOWS.some(([a, b]) => minute >= a && minute < b) ? PEAK : OFF_PEAK;
    }

    // Price each 30-min block at the rate in effect when it starts.
    function quote(isoDate, start, duration) {
      let total = 0;
      const byRate = {};
      for (let m = start; m < start + duration; m += SLOT) {
        const rate = rateAt(isoDate, m);
        total += rate * SLOT / 60;
        byRate[rate] = (byRate[rate] || 0) + SLOT;
      }
      return { total, byRate };
    }

    function describe(byRate) {
      return Object.keys(byRate)
        .sort((a, b) => b - a)
        .map(rate => `${byRate[rate] / 60} h × $${rate}/h`)
        .join(' + ');
    }

    // ── Date / time pickers ───────────────────────────────────
    const now = torontoNow();
    dateEl.min = now.date;
    dateEl.max = addDays(now.date, MAX_DAYS_AHEAD);

    function rebuildTimes() {
      const date = dateEl.value;
      const duration = Number(durEl.value);
      const previous = timeEl.value;
      timeEl.innerHTML = '';

      if (!date || date < dateEl.min || date > dateEl.max) {
        timeEl.disabled = true;
        timeEl.add(new Option(date ? 'Date not available' : 'Pick a date first', ''));
        updateFee();
        return;
      }

      const current = torontoNow();
      // Need at least an hour of notice for same-day bookings.
      const earliest = date === current.date ? current.minutes + 60 : 0;

      for (let m = DAY_START; m + duration <= DAY_END; m += SLOT) {
        if (m < earliest) continue;
        const { total } = quote(date, m, duration);
        const label = `${fmtTime(m)} – ${fmtTime(m + duration)}  (${money(total)})`;
        timeEl.add(new Option(label, String(m)));
      }

      if (!timeEl.options.length) {
        timeEl.disabled = true;
        timeEl.add(new Option('No times left this day', ''));
      } else {
        timeEl.disabled = false;
        if ([...timeEl.options].some(o => o.value === previous)) timeEl.value = previous;
      }
      updateFee();
    }

    function currentQuote() {
      if (!dateEl.value || timeEl.disabled || timeEl.value === '') return null;
      return quote(dateEl.value, Number(timeEl.value), Number(durEl.value));
    }

    function updateFee() {
      const q = currentQuote();
      if (!q) {
        feeEl.textContent = '—';
        feeDetailEl.textContent = 'Select a date, start time and duration to see the fee.';
        return;
      }
      feeEl.textContent = `${money(q.total)} ${CURRENCY}`;
      feeDetailEl.textContent = describe(q.byRate);
    }

    dateEl.addEventListener('change', rebuildTimes);
    durEl.addEventListener('change', rebuildTimes);
    timeEl.addEventListener('change', updateFee);

    // ── Submit ────────────────────────────────────────────────
    function timestamp() {
      const d = new Date();
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
        pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function setStatus(text, isError) {
      status.textContent = text;
      status.classList.toggle('error', !!isError);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const q = currentQuote();
      if (!q) {
        setStatus('Please choose an available date and start time.', true);
        return;
      }

      const start = Number(timeEl.value);
      const duration = Number(durEl.value);
      const ref = 'BK-' + Date.now().toString(36).toUpperCase();
      const when = `${dateEl.value} ${fmtTime(start)}–${fmtTime(start + duration)} ET`;

      const message = [
        `Booking reference: ${ref}`,
        `Type: ${form.type.value}`,
        `Title: ${form.title.value.trim()}`,
        `When: ${when} (${duration} min)`,
        `Fee: ${money(q.total)} ${CURRENCY} (${describe(q.byRate)})`,
        `Visitor time zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown'}`,
        '',
        'Notes:',
        form.notes.value.trim() || '(none)'
      ].join('\n');

      const data = new FormData();
      data.append(GOOGLE_FORM_FIELDS.name, form.name.value.trim());
      data.append(GOOGLE_FORM_FIELDS.email, form.email.value.trim());
      data.append(GOOGLE_FORM_FIELDS.subject,
        `${timestamp()} ${visitorIp || 'Unknown IP'} — [BOOKING ${ref}] ${when} — ${form.title.value.trim()}`);
      data.append(GOOGLE_FORM_FIELDS.message, message);

      submitBtn.disabled = true;
      setStatus('Sending…');

      // Google Forms sends no CORS headers, so the response is opaque:
      // we only know the request went out, not that it was stored.
      fetch(GOOGLE_FORM_ACTION, { method: 'POST', mode: 'no-cors', body: data })
        .then(() => {
          // Booking is recorded; go straight to PayPal with the fee filled in.
          setStatus('');
          window.location.href = `https://www.paypal.com/paypalme/${encodeURIComponent(PAYPAL_ME_USERNAME)}/${q.total}${CURRENCY}`;
        })
        .catch(() => {
          setStatus('Something went wrong. Please try again later.', true);
          submitBtn.disabled = false;
        });
    });

    rebuildTimes();
  });
});
