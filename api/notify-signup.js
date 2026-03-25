/**
 * Vercel Serverless Function — notify-signup
 * Called after each new user signup to email the admin.
 * Requires env var: RESEND_API_KEY, ADMIN_NOTIFY_EMAIL
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, org, role } = req.body || {};
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || 'nathan.glatt@icloud.com';

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
          <p style="margin:0 0 4px;font-size:12px;color:#64748b;">L'utilisateur doit confirmer son email avant de se connecter.</p>
          <p style="margin:0;font-size:11px;color:#94a3b8;">Solvid.IA · Plateforme ESG &amp; CSRD</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Solvid.IA <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `Nouvelle inscription — ${name || email}`,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[notify-signup] Resend error:', err);
    }
  } catch (err) {
    console.error('[notify-signup] fetch error:', err);
  }

  return res.status(200).json({ ok: true });
}
