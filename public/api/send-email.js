'use strict';

const express  = require('express');
const nodemailer = require('nodemailer');
const router   = express.Router();

// ─── Service label map (whitelist) ──────────────────────────────────────────
const SERVICE_LABELS = {
  'house-cleaning':      'House Cleaning',
  'deep-cleaning':       'Deep Cleaning',
  'move-cleaning':       'Move-In / Move-Out Cleaning',
  'commercial-cleaning': 'Commercial Cleaning',
  'home-care':           'In-Home Care Assistance',
  'dementia-care':       "Dementia / Alzheimer's Support",
  'both':                'Both Care & Cleaning',
  'other':               'Not Sure / Other',
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

// ─── Shared email wrapper ────────────────────────────────────────────────────
function emailWrapper(bodyContent) {
  const siteUrl = (process.env.SITE_URL || 'https://evercarehomeservice.com').replace(/\/$/, '');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>EverCare Home Services</title>
</head>
<body style="margin:0;padding:0;background:#f4f8fc;font-family:'Inter',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f8fc;padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d1e2e 0%,#0e2a3d 55%,#0a1f18 100%);border-radius:20px 20px 0 0;padding:40px 40px 32px;text-align:center;">
            <!-- Logo image with text fallback -->
            <img
              src="${siteUrl}/assets/logo.svg"
              alt="EverCare Home Services"
              width="84"
              style="width:84px;height:84px;display:inline-block;margin-bottom:0;border-radius:14px;"
              onerror="this.style.display='none'"
            >
            <!-- Fallback text logo (hidden if image loads) -->
            <div style="margin-top:8px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;letter-spacing:-0.5px;">
                <span style="color:#ffffff;">EverCare</span>
              </span>
              <div style="color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-top:4px;font-weight:600;">Home Services</div>
            </div>
            <!-- Divider line -->
            <div style="width:48px;height:3px;background:linear-gradient(90deg,#4487bf,#52b788);border-radius:3px;margin:20px auto 0;"></div>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#ffffff;padding:40px 40px 32px;border-left:1px solid rgba(68,135,191,0.1);border-right:1px solid rgba(68,135,191,0.1);">
            ${bodyContent}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#0d1e2e;border-radius:0 0 20px 20px;padding:28px 40px;text-align:center;">
            <p style="margin:0 0 10px;color:rgba(255,255,255,0.5);font-size:12px;line-height:1.7;">
              EverCare Home Services &nbsp;·&nbsp; Worcester, Massachusetts
            </p>
            <p style="margin:0 0 16px;color:rgba(255,255,255,0.3);font-size:11px;line-height:1.7;">
              Serving Worcester, Shrewsbury, Auburn, Holden, Leicester, Millbury &amp; Central MA
            </p>
            <div style="margin-bottom:14px;">
              <a href="tel:+15087361263" style="color:#a8d8ea;text-decoration:none;font-size:12px;font-weight:600;margin:0 12px;">&#128222; (508) 736-1263</a>
              <a href="mailto:info@evercarehomeservice.com" style="color:#a8d8bc;text-decoration:none;font-size:12px;font-weight:600;margin:0 12px;">&#9993; info@evercarehomeservice.com</a>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:14px;margin-top:6px;">
              <a href="${siteUrl}/privacy" style="color:rgba(255,255,255,0.25);font-size:11px;text-decoration:none;margin:0 8px;">Privacy Policy</a>
              <span style="color:rgba(255,255,255,0.15);font-size:11px;">&nbsp;·&nbsp;</span>
              <a href="${siteUrl}/terms" style="color:rgba(255,255,255,0.25);font-size:11px;text-decoration:none;margin:0 8px;">Terms of Service</a>
              <span style="color:rgba(255,255,255,0.15);font-size:11px;">&nbsp;·&nbsp;</span>
              <a href="${siteUrl}" style="color:rgba(255,255,255,0.25);font-size:11px;text-decoration:none;margin:0 8px;">evercarehomeservice.com</a>
            </div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ─── Business notification email ─────────────────────────────────────────────
function buildBusinessEmail(d) {
  const siteUrl = (process.env.SITE_URL || 'https://evercarehomeservice.com').replace(/\/$/, '');
  const rows = [
    ['First Name',   d.first_name],
    ['Last Name',    d.last_name],
    ['Email',        `<a href="mailto:${esc(d.email)}" style="color:#4487bf;text-decoration:none;">${esc(d.email)}</a>`],
    ['Phone',        d.phone ? `<a href="tel:${esc(d.phone.replace(/\D/g,''))}" style="color:#4487bf;text-decoration:none;">${esc(d.phone)}</a>` : '<span style="color:#a0aec0;font-style:italic;">Not provided</span>'],
    ['City / Town',  d.city    || '<span style="color:#a0aec0;font-style:italic;">Not specified</span>'],
    ['Service',      d.service || '<span style="color:#a0aec0;font-style:italic;">Not specified</span>'],
  ].map(([label, value]) => `
    <tr>
      <td style="padding:12px 16px;background:#f4f8fc;border-radius:8px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#4a6070;width:36%;vertical-align:top;">${esc(label)}</td>
      <td style="padding:12px 16px;background:#f4f8fc;border-radius:8px;font-size:14px;color:#1a2e3d;vertical-align:top;">${value}</td>
    </tr>
    <tr><td colspan="2" style="height:6px;"></td></tr>
  `).join('');

  const body = `
    <!-- Alert badge -->
    <div style="background:linear-gradient(135deg,rgba(68,135,191,0.1),rgba(82,183,136,0.07));border:1.5px solid rgba(68,135,191,0.2);border-radius:12px;padding:14px 20px;margin-bottom:28px;display:flex;align-items:center;gap:10px;">
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#4ade80;margin-right:10px;vertical-align:middle;"></span>
      <span style="font-size:13px;font-weight:700;color:#2a5f8f;vertical-align:middle;">New Contact Form Submission</span>
    </div>

    <h2 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#0d1e2e;line-height:1.2;">
      ${esc(d.first_name)} ${esc(d.last_name)} wants to connect
    </h2>
    <p style="margin:0 0 28px;font-size:14px;color:#4a6070;line-height:1.7;">
      A new message was submitted through the EverCare contact form. Review the details below and follow up promptly.
    </p>

    <!-- Details table -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:0;">
      ${rows}
    </table>

    <!-- Message -->
    <div style="margin-top:24px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#4a6070;margin-bottom:10px;">Message</div>
      <div style="background:#f4f8fc;border-left:3px solid #4487bf;border-radius:0 10px 10px 0;padding:18px 20px;font-size:14px;color:#1a2e3d;line-height:1.75;white-space:pre-wrap;">${esc(d.message)}</div>
    </div>

    <!-- Reply CTA -->
    <div style="margin-top:32px;text-align:center;background:linear-gradient(135deg,#0d1e2e,#0e2a3d);border-radius:14px;padding:28px;">
      <p style="margin:0 0 18px;font-size:13px;color:rgba(255,255,255,0.6);">Quick reply options</p>
      <div>
        <a href="mailto:${esc(d.email)}" style="display:inline-block;background:linear-gradient(135deg,#4487bf,#52b788);color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:12px 24px;border-radius:10px;margin:4px 6px;">&#9993; Reply by Email</a>
        ${d.phone ? `<a href="tel:${esc(d.phone.replace(/\D/g,''))}" style="display:inline-block;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);text-decoration:none;font-weight:700;font-size:13px;padding:12px 24px;border-radius:10px;margin:4px 6px;">&#128222; Call Back</a>` : ''}
      </div>
    </div>

    <p style="margin:24px 0 0;font-size:12px;color:#a0aec0;text-align:center;line-height:1.6;">
      This notification was generated automatically by the EverCare website contact form.<br>
      Submitted on ${new Date().toLocaleString('en-US', { timeZone:'America/New_York', dateStyle:'full', timeStyle:'short' })} (Eastern Time)
    </p>
  `;
  return emailWrapper(body);
}

// ─── User confirmation email ─────────────────────────────────────────────────
function buildUserEmail(d) {
  const siteUrl = (process.env.SITE_URL || 'https://evercarehomeservice.com').replace(/\/$/, '');

  const summaryRows = [
    d.city    && ['City / Town', esc(d.city)],
    d.service && ['Service',     esc(d.service)],
    d.phone   && ['Phone',       esc(d.phone)],
  ].filter(Boolean).map(([label, value]) => `
    <tr>
      <td style="padding:10px 14px;background:#f4f8fc;border-radius:8px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#4a6070;width:38%;vertical-align:middle;">${label}</td>
      <td style="padding:10px 14px;background:#f4f8fc;border-radius:8px;font-size:13px;color:#1a2e3d;vertical-align:middle;">${value}</td>
    </tr>
    <tr><td colspan="2" style="height:5px;"></td></tr>
  `).join('');

  const body = `
    <!-- Greeting -->
    <div style="background:linear-gradient(135deg,rgba(68,135,191,0.07),rgba(82,183,136,0.05));border:1.5px solid rgba(68,135,191,0.15);border-radius:16px;padding:22px 24px;margin:0 0 24px;">
      <p style="margin:0 0 10px;font-size:15px;color:#1a2e3d;line-height:1.7;font-weight:600;">Hi ${esc(d.first_name)},</p>
      <p style="margin:0 0 10px;font-size:15px;color:#4a6070;line-height:1.75;">Thanks for reaching out! We received your message and someone from our team will be in touch with you very soon.</p>
      <p style="margin:0 0 10px;font-size:15px;color:#4a6070;line-height:1.75;">Can't wait? Just text us at <a href="sms:+15087361263" style="color:#4487bf;text-decoration:none;font-weight:700;">(508) 736-1263</a> — we're always quick to respond.</p>
      <p style="margin:0;font-size:15px;color:#4a6070;line-height:1.75;">Talk soon,<br>The EverCare Team</p>
    </div>

    <!-- Confirmation box -->
    <div style="background:linear-gradient(135deg,rgba(68,135,191,0.07),rgba(82,183,136,0.05));border:1.5px solid rgba(68,135,191,0.15);border-radius:16px;padding:24px;margin-bottom:28px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4487bf;margin-bottom:16px;">&#10003;&nbsp; Your Request Summary</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:0;">
        ${summaryRows}
      </table>
      ${d.message ? `
      <div style="margin-top:16px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#4a6070;margin-bottom:8px;">Your Message</div>
        <div style="background:#ffffff;border-left:3px solid #52b788;border-radius:0 8px 8px 0;padding:14px 16px;font-size:13px;color:#1a2e3d;line-height:1.75;white-space:pre-wrap;">${esc(d.message)}</div>
      </div>` : ''}
    </div>

    <!-- What's next -->
    <h3 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#0d1e2e;">What happens next?</h3>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="44" valign="top" style="padding-right:14px;">
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td width="36" height="36" align="center" valign="middle" style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#2a5f8f,#4487bf);color:#fff;font-weight:700;font-size:14px;font-family:'Inter',Arial,sans-serif;text-align:center;vertical-align:middle;">1</td></tr></table>
        </td>
        <td valign="top" style="padding-bottom:16px;">
          <strong style="display:block;font-size:14px;color:#0d1e2e;margin-bottom:3px;">We review your request</strong>
          <span style="font-size:13px;color:#4a6070;line-height:1.65;">Our team reads every message personally and prepares a tailored response for your needs.</span>
        </td>
      </tr>
      <tr>
        <td width="44" valign="top" style="padding-right:14px;">
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td width="36" height="36" align="center" valign="middle" style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#2f7a57,#52b788);color:#fff;font-weight:700;font-size:14px;font-family:'Inter',Arial,sans-serif;text-align:center;vertical-align:middle;">2</td></tr></table>
        </td>
        <td valign="top" style="padding-bottom:16px;">
          <strong style="display:block;font-size:14px;color:#0d1e2e;margin-bottom:3px;">We reach out to you</strong>
          <span style="font-size:13px;color:#4a6070;line-height:1.65;">Expect a reply by email or phone within 1–2 hours on business days (Mon–Sat, 8am–7pm).</span>
        </td>
      </tr>
      <tr>
        <td width="44" valign="top" style="padding-right:14px;">
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td width="36" height="36" align="center" valign="middle" style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#4487bf,#56c2c1);color:#fff;font-weight:700;font-size:14px;font-family:'Inter',Arial,sans-serif;text-align:center;vertical-align:middle;">3</td></tr></table>
        </td>
        <td valign="top">
          <strong style="display:block;font-size:14px;color:#0d1e2e;margin-bottom:3px;">Free estimate — no obligation</strong>
          <span style="font-size:13px;color:#4a6070;line-height:1.65;">We'll discuss your situation, answer your questions, and provide a clear estimate with no pressure.</span>
        </td>
      </tr>
    </table>

    <!-- Need faster? -->
    <div style="margin-top:28px;background:linear-gradient(135deg,#0d1e2e,#0e2a3d);border-radius:14px;padding:28px;text-align:center;">
      <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#ffffff;">Need a faster response?</p>
      <p style="margin:0 0 20px;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.65;">Text us directly — most messages are answered within the hour.</p>
      <a href="sms:+15087361263" style="display:inline-block;background:linear-gradient(135deg,#4487bf,#52b788);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 30px;border-radius:12px;margin:4px 6px;">&#128172; Text Us Now</a>
      <a href="tel:+15087361263" style="display:inline-block;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.85);text-decoration:none;font-weight:700;font-size:14px;padding:14px 30px;border-radius:12px;margin:4px 6px;">&#128222; (508) 736-1263</a>
    </div>

    <p style="margin:24px 0 0;font-size:12px;color:#a0aec0;text-align:center;line-height:1.6;">
      You're receiving this email because you submitted a form at <a href="${siteUrl}" style="color:#4487bf;text-decoration:none;">${siteUrl.replace('https://','')}</a>.<br>
      If this wasn't you, please disregard this message.
    </p>
  `;
  return emailWrapper(body);
}

// ─── POST /api/send-email ────────────────────────────────────────────────────
router.post('/', express.json({ limit: '16kb' }), async (req, res) => {
  const { first_name, last_name, phone, email, city, service, message } = req.body || {};

  // Validate required fields
  if (!first_name || typeof first_name !== 'string' ||
      !last_name  || typeof last_name  !== 'string' ||
      !email      || typeof email      !== 'string' ||
      !message    || typeof message    !== 'string') {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // Sanitize and cap field lengths
  const data = {
    first_name: first_name.trim().slice(0, 100),
    last_name:  last_name.trim().slice(0, 100),
    email:      email.trim().slice(0, 200),
    phone:      phone   ? String(phone).trim().slice(0, 30)   : '',
    city:       city    ? String(city).trim().slice(0, 100)   : '',
    service:    SERVICE_LABELS[service] || '',
    message:    message.trim().slice(0, 2000),
  };

  try {
    const transporter = createTransporter();

    await Promise.all([
      // Notification to business
      transporter.sendMail({
        from:    `"EverCare Home Services" <${process.env.EMAIL_FROM}>`,
        to:      process.env.EMAIL_TO,
        subject: `New Contact Request — ${data.first_name} ${data.last_name}${data.city ? ' from ' + data.city : ''}`,
        html:    buildBusinessEmail(data),
      }),
      // Confirmation to user
      transporter.sendMail({
        from:    `"EverCare Home Services" <${process.env.EMAIL_FROM}>`,
        to:      data.email,
        subject: `Got your message — someone from our team will reach out shortly!`,
        html:    buildUserEmail(data),
      }),
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('[send-email] error:', err.message);
    res.status(500).json({ error: 'Could not send your message. Please try again or text us at (508) 736-1263.' });
  }
});

module.exports = router;
