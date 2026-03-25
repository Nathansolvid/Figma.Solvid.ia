/**
 * Vercel Serverless Function — notify-signup
 * Called after each new user signup to email the admin.
 * Requires env var: RESEND_API_KEY, ADMIN_NOTIFY_EMAIL
 */

// In-memory dedup: prevent duplicate notifications for same email within 2 min
const recentNotifs = new Map(); // email → timestamp

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, org, role } = req.body || {};
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || 'nathan.glatt@icloud.com';

  // Dedup: skip if same email notified in last 2 minutes
  if (email) {
    const last = recentNotifs.get(email);
    if (last && Date.now() - last < 2 * 60 * 1000) {
      return res.status(200).json({ ok: true, skipped: 'dedup' });
    }
    recentNotifs.set(email, Date.now());
    // Cleanup old entries
    for (const [k, t] of recentNotifs) {
      if (Date.now() - t > 5 * 60 * 1000) recentNotifs.delete(k);
    }
  }

  if (!apiKey) {
    console.warn('[notify-signup] RESEND_API_KEY not set');
    return res.status(200).json({ ok: true, sent: false });
  }

  const roleLabels = {
    ADMIN: 'Administrateur',
    CONSULTANT: 'Consultant ESG',
    CLIENT_OWNER: 'Directeur ESG',
    CLIENT_CONTRIBUTOR: 'Analyste données',
    AUDITOR: 'Auditeur',
    VIEWER: 'Observateur',
  };

  const roleColors = {
    ADMIN: '#7c3aed',
    CONSULTANT: '#0369a1',
    CLIENT_OWNER: '#059669',
    CLIENT_CONTRIBUTOR: '#0891b2',
    AUDITOR: '#b45309',
    VIEWER: '#6b7280',
  };

  const roleColor = roleColors[role] || '#059669';
  const roleLabel = roleLabels[role] || role || '—';
  const timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'long', timeStyle: 'short' });
  const initials = (name || email || '?').slice(0, 2).toUpperCase();

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nouvelle inscription Solvid.IA</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

        <!-- Logo header -->
        <tr><td align="center" style="padding-bottom:24px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background:linear-gradient(135deg,#064e3b 0%,#059669 100%);border-radius:12px;padding:16px 32px;text-align:center;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Solvid<span style="color:#6ee7b7">.IA</span></span>
              <div style="font-size:10px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;margin-top:3px;">Plateforme ESG</div>
            </td></tr>
          </table>
        </td></tr>

        <!-- Main card -->
        <tr><td style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Card top bar -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background:linear-gradient(135deg,#064e3b 0%,#059669 100%);padding:20px 28px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:14px;">
                    <div style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.2);text-align:center;line-height:44px;font-size:16px;font-weight:700;color:#ffffff;">${initials}</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-size:17px;font-weight:700;color:#ffffff;margin-bottom:2px;">Nouvelle inscription</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.7);">${timestamp}</div>
                  </td>
                </tr>
              </table>
            </td></tr>

            <!-- Fields -->
            <tr><td style="padding:8px 28px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:16px 0;width:120px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #f1f5f9;vertical-align:middle;">NOM</td>
                  <td style="padding:16px 0;font-size:15px;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9;vertical-align:middle;">${name || '—'}</td>
                </tr>
                <tr>
                  <td style="padding:16px 0;width:120px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #f1f5f9;vertical-align:middle;">EMAIL</td>
                  <td style="padding:16px 0;font-size:15px;border-bottom:1px solid #f1f5f9;vertical-align:middle;"><a href="mailto:${email}" style="color:#0369a1;text-decoration:none;font-weight:500;">${email || '—'}</a></td>
                </tr>
                <tr>
                  <td style="padding:16px 0;width:120px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #f1f5f9;vertical-align:middle;">ORGANISATION</td>
                  <td style="padding:16px 0;font-size:15px;color:#0f172a;border-bottom:1px solid #f1f5f9;vertical-align:middle;">${org || '—'}</td>
                </tr>
                <tr>
                  <td style="padding:16px 0;width:120px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;vertical-align:middle;">RÔLE</td>
                  <td style="padding:16px 0;vertical-align:middle;">
                    <span style="display:inline-block;padding:4px 14px;background-color:${roleColor}18;color:${roleColor};border-radius:20px;font-size:13px;font-weight:600;border:1px solid ${roleColor}30;">${roleLabel}</span>
                  </td>
                </tr>
              </table>
            </td></tr>

            <!-- CTA -->
            <tr><td style="padding:24px 28px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td align="center">
                  <a href="https://supabase.com/dashboard/project/juoeblhhbarzsqcyqrkq/auth/users"
                    style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#059669 0%,#064e3b 100%);color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;letter-spacing:0.2px;">
                    Gérer les accès dans Supabase →
                  </a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0 0;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#64748b;">L'utilisateur peut se connecter immédiatement — email confirmé automatiquement.</p>
          <p style="margin:0;font-size:11px;color:#94a3b8;">Solvid.IA · Plateforme ESG &amp; CSRD</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const welcomeHtml = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
        <tr><td align="center" style="padding-bottom:24px;">
          <span style="font-size:22px;font-weight:800;color:#0F4C3A;">Solvid<span style="color:#059669">.IA</span></span>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:16px;padding:36px 32px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <div style="background:linear-gradient(135deg,#064e3b,#059669);border-radius:10px;padding:20px 24px;margin-bottom:24px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">🌿</div>
            <div style="font-size:18px;font-weight:700;color:#fff;">Bienvenue sur Solvid.IA</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Ton compte est prêt</div>
          </div>
          <p style="font-size:15px;color:#1e293b;margin:0 0 12px;">Bonjour <strong>${name || 'là'}</strong>,</p>
          <p style="font-size:14px;color:#475569;margin:0 0 20px;line-height:1.6;">
            Ton compte Solvid.IA a bien été créé. Tu peux te connecter dès maintenant avec ton email et ton mot de passe.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#94a3b8;width:100px;">Email</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:#0f172a;">${email}</td></tr>
            <tr><td style="padding:10px 0;font-size:13px;color:#94a3b8;">Rôle</td><td style="padding:10px 0;font-size:13px;font-weight:600;color:#059669;">${roleLabels[role] || role || '—'}</td></tr>
          </table>
          <div style="text-align:center;">
            <a href="https://solvid-ia.vercel.app" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#059669,#064e3b);color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
              Accéder à Solvid.IA →
            </a>
          </div>
        </td></tr>
        <tr><td style="text-align:center;padding-top:20px;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">Solvid.IA · Plateforme ESG &amp; CSRD</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    // 1. Admin notification
    const adminRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Solvid.IA <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `Nouvelle inscription — ${name || email}`,
        html,
      }),
    });
    if (!adminRes.ok) {
      const err = await adminRes.text();
      console.error('[notify-signup] Admin email error:', err);
    }

    // 2. Welcome email to the new user (best-effort)
    if (email) {
      const welcomeRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Solvid.IA <onboarding@resend.dev>',
          to: [email],
          subject: 'Bienvenue sur Solvid.IA — ton compte est prêt',
          html: welcomeHtml,
        }),
      });
      if (!welcomeRes.ok) {
        const err = await welcomeRes.text();
        console.warn('[notify-signup] Welcome email skipped (Resend free plan limit):', err);
      }
    }
  } catch (err) {
    console.error('[notify-signup] fetch error:', err);
  }

  return res.status(200).json({ ok: true });
}
