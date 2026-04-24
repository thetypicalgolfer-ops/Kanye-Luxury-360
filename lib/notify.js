// Email (Resend) + SMS (Twilio) notifications for new leads.
//
// Both senders no-op gracefully if their env vars are missing so the rest of
// the stack keeps working during initial deployment. They also never throw:
// a failure to notify must not block saving the lead.
//
// Required env vars (see SETUP.md):
//   RESEND_API_KEY        — from resend.com
//   RESEND_FROM           — e.g. "Kanye Concierge 360 Leads <onboarding@resend.dev>"
//   AGENT_NOTIFY_EMAIL    — where new-lead alerts are sent
//   TWILIO_ACCOUNT_SID    — from twilio.com
//   TWILIO_AUTH_TOKEN
//   TWILIO_FROM_NUMBER    — E.164, the Twilio number that's been A2P-registered
//   AGENT_NOTIFY_PHONE    — E.164 phone that receives the SMS alert
//   AUTO_REPLY_DISABLED   — set to "1" to skip the prospect auto-acknowledgement
//                           (Resend sandbox only sends to the signup email)
//
// NOTE: We're sending from `onboarding@resend.dev` because Wix's DNS panel
// won't allow the MX record Resend requires for full domain verification.
// Once the domain is moved off Wix DNS (Cloudflare Registrar transfer is the
// recommended path), switch RESEND_FROM to a verified `@kanyeconcierge360.com`
// address and unset AUTO_REPLY_DISABLED to enable prospect auto-replies.

function escapeHtml(s) {
    return String(s || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── EMAIL VIA RESEND ─────────────────────────────────────────
async function resendSend({ to, subject, html, text, replyTo }) {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    if (!key || !from || !to) return { skipped: true, reason: 'resend not configured' };

    try {
        const body = { from, to: Array.isArray(to) ? to : [to], subject, html, text };
        if (replyTo) body.reply_to = replyTo;
        const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!r.ok) {
            const err = await r.text().catch(() => '');
            return { ok: false, status: r.status, error: err };
        }
        const data = await r.json();
        return { ok: true, id: data.id };
    } catch (err) {
        return { ok: false, error: err && err.message ? err.message : String(err) };
    }
}

// ── SMS VIA TWILIO ───────────────────────────────────────────
async function twilioSend({ to, body }) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    if (!sid || !token || !from || !to) return { skipped: true, reason: 'twilio not configured' };

    try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`;
        const auth = Buffer.from(`${sid}:${token}`).toString('base64');
        const form = new URLSearchParams({ To: to, From: from, Body: body });
        const r = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: form.toString(),
        });
        if (!r.ok) {
            const err = await r.text().catch(() => '');
            return { ok: false, status: r.status, error: err };
        }
        const data = await r.json();
        return { ok: true, sid: data.sid };
    } catch (err) {
        return { ok: false, error: err && err.message ? err.message : String(err) };
    }
}

// ── AGENT ALERT — "New Lead" ─────────────────────────────────
export async function notifyAgentNewLead(lead) {
    const agentEmail = process.env.AGENT_NOTIFY_EMAIL;
    const agentPhone = process.env.AGENT_NOTIFY_PHONE;

    const summary = [
        `New lead from ${lead.name || 'Unknown'}`,
        lead.intent ? `Intent: ${lead.intent}` : null,
        lead.budget ? `Budget: ${lead.budget}` : null,
        lead.timeline ? `Timeline: ${lead.timeline}` : null,
    ].filter(Boolean).join(' · ');

    const emailHtml = `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#181817">
          <h2 style="font-family:Georgia,serif;font-weight:300;font-size:22px;margin:0 0 8px">New Lead — Kanye Concierge 360</h2>
          <p style="color:#6b6b6b;font-size:13px;margin:0 0 24px">${escapeHtml(summary)}</p>
          <table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;border-collapse:collapse">
            ${row('Name',    lead.name)}
            ${row('Email',   lead.email)}
            ${row('Phone',   lead.phone)}
            ${row('Intent',  lead.intent)}
            ${row('Budget',  lead.budget)}
            ${row('Timeline',lead.timeline)}
            ${row('Source',  lead.source)}
            ${row('Page',    lead.source_page)}
          </table>
          ${lead.message ? `
            <div style="margin-top:24px;padding:16px;background:#f5f2ec;border-left:3px solid #A47C48">
              <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#A47C48;margin-bottom:6px">Message</div>
              <div style="font-size:14px;line-height:1.6;color:#181817;white-space:pre-wrap">${escapeHtml(lead.message)}</div>
            </div>` : ''}
          <p style="margin-top:32px;font-size:12px;color:#888">
            Open the inbox: <a href="${escapeHtml(process.env.SITE_URL || 'https://kanyeconcierge360.com')}/admin/inbox.html" style="color:#A47C48">agent portal</a>
          </p>
        </div>
    `;
    const emailText = [
        `New lead from ${lead.name || 'Unknown'}`,
        lead.email ? `Email: ${lead.email}` : null,
        lead.phone ? `Phone: ${lead.phone}` : null,
        lead.intent ? `Intent: ${lead.intent}` : null,
        lead.budget ? `Budget: ${lead.budget}` : null,
        lead.timeline ? `Timeline: ${lead.timeline}` : null,
        lead.message ? `\nMessage:\n${lead.message}` : null,
    ].filter(Boolean).join('\n');

    const sms = [
        `🏡 New ${lead.intent || 'inquiry'} lead: ${lead.name || 'Unknown'}`,
        lead.phone ? lead.phone : null,
        lead.email ? lead.email : null,
        lead.budget ? `Budget ${lead.budget}` : null,
    ].filter(Boolean).join(' · ').slice(0, 320);

    const [emailRes, smsRes] = await Promise.all([
        agentEmail
            ? resendSend({
                to: agentEmail,
                subject: `New Lead — ${lead.name || 'Unknown'}${lead.intent ? ' · ' + lead.intent : ''}`,
                html: emailHtml,
                text: emailText,
                replyTo: lead.email || undefined,
            })
            : Promise.resolve({ skipped: true }),
        agentPhone ? twilioSend({ to: agentPhone, body: sms }) : Promise.resolve({ skipped: true }),
    ]);
    return { email: emailRes, sms: smsRes };
}

// ── VISITOR AUTO-ACKNOWLEDGEMENT ─────────────────────────────
export async function sendAutoAcknowledgement(lead, agentSettings) {
    if (!lead.email) return { skipped: true, reason: 'no lead email' };
    // While we're on Resend's onboarding sandbox we can only send to the signup
    // address. Setting AUTO_REPLY_DISABLED=1 prevents spamming 403s for every
    // prospect. Remove that env var once the sending domain is verified.
    if (process.env.AUTO_REPLY_DISABLED === '1') {
        return { skipped: true, reason: 'auto-reply disabled (sandbox mode)' };
    }

    const agentName  = (agentSettings && agentSettings.agent_name)  || 'Kanye Concierge 360';
    const agentPhone = (agentSettings && agentSettings.agent_phone) || '830-699-6542';
    const subject    = (agentSettings && agentSettings.auto_reply_subject) || `Thank you for reaching out — ${agentName}`;
    const customBody = (agentSettings && agentSettings.auto_reply_body) || '';

    const firstName = (lead.name || '').split(' ')[0] || 'there';

    const html = `
        <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#181817;line-height:1.7">
          <div style="padding:32px 0;border-bottom:1px solid #e8e3d9">
            <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#A47C48;margin-bottom:8px">Kanye Concierge 360°</div>
            <h1 style="font-weight:300;font-size:28px;margin:0">Thank you, ${escapeHtml(firstName)}.</h1>
          </div>
          <div style="padding:24px 0;font-size:15px">
            ${customBody
                ? `<p style="margin:0 0 16px">${escapeHtml(customBody).replace(/\n/g,'<br>')}</p>`
                : `<p style="margin:0 0 16px">Your inquiry has been received. A member of our team will reach out personally within a few hours to schedule a confidential conversation about your goals.</p>
                   <p style="margin:0 0 16px">In the meantime, if anything is time-sensitive, please feel free to call us directly at <strong>${escapeHtml(agentPhone)}</strong>.</p>
                   <p style="margin:0 0 16px">We look forward to serving you.</p>`}
            <p style="margin:32px 0 0;font-style:italic;color:#6b6b6b">— ${escapeHtml(agentName)}</p>
          </div>
          <div style="padding:16px 0;border-top:1px solid #e8e3d9;font-family:system-ui,sans-serif;font-size:11px;color:#888">
            Greater San Antonio · Texas Hill Country · Boerne · New Braunfels · Fredericksburg
          </div>
        </div>
    `;
    const text = `Thank you, ${firstName}.

${customBody || 'Your inquiry has been received. A member of our team will reach out personally within a few hours to schedule a confidential conversation about your goals.\n\nIn the meantime, if anything is time-sensitive, please feel free to call us directly at ' + agentPhone + '.\n\nWe look forward to serving you.'}

— ${agentName}
`;

    return resendSend({ to: lead.email, subject, html, text, replyTo: process.env.AGENT_NOTIFY_EMAIL });
}

function row(label, value) {
    if (!value) return '';
    return `<tr>
        <td style="padding:8px 12px 8px 0;color:#888;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;width:90px;vertical-align:top">${label}</td>
        <td style="padding:8px 0;font-size:14px;color:#181817">${escapeHtml(value)}</td>
    </tr>`;
}
