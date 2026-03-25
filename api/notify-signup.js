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
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

        <!-- Header -->
        <tr><td style="padding-bottom:28px;text-align:center;">
          <div style="display:inline-block;background:linear-gradient(135deg,#0A3B2E 0%,#065f46 50%,#059669 100%);padding:20px 40px;border-radius:14px;box-shadow:0 4px 24px rgba(5,150,105,0.3);">
            <span style="font-size:26px;font-weight:800;color:white;letter-spacing:-0.5px;">Solvid<span style="color:#6ee7b7">.IA</span></span>
            <div style="margin-top:4px;font-size:11px;color:rgba(255,255,255,0.55);letter-spacing:2px;text-transform:uppercase;">Plateforme ESG</div>
          </div>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4);">

          <!-- Card header -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:28px 32px 24px;border-bottom:1px solid #334155;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:16px;">
                    <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#059669,#0A3B2E);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:white;text-align:center;line-height:48px;">${initials}</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-size:18px;font-weight:700;color:#f1f5f9;margin-bottom:4px;">Nouvelle inscription</div>
                    <div style="font-size:13px;color:#64748b;">${timestamp}</div>
                  </td>
                </tr>
              </table>
            </td></tr>

            <!-- Fields -->
            <tr><td style="padding:0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr style="border-bottom:1px solid #1e293b;">
                  <td style="padding:16px 0 16px;width:110px;font-size:12px;font-weight:500;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #334155;">Nom</td>
                  <td style="padding:16px 0 16px;font-size:15px;font-weight:600;color:#f1f5f9;border-bottom:1px solid #334155;">${name || '—'}</td>
                </tr>
                <tr>
                  <td style="padding:16px 0;width:110px;font-size:12px;font-weight:500;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #334155;">Email</td>
                  <td style="padding:16px 0;font-size:15px;color:#38bdf8;border-bottom:1px solid #334155;"><a href="mailto:${email}" style="color:#38bdf8;text-decoration:none;">${email || '—'}</a></td>
                </tr>
                <tr>
                  <td style="padding:16px 0;width:110px;font-size:12px;font-weight:500;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #334155;">Organisation</td>
                  <td style="padding:16px 0;font-size:15px;color:#f1f5f9;border-bottom:1px solid #334155;">${org || '—'}</td>
                </tr>
                <tr>
                  <td style="padding:16px 0;width:110px;font-size:12px;font-weight:500;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Rôle</td>
                  <td style="padding:16px 0;">
                    <span style="display:inline-block;padding:4px 12px;background:${roleColor}22;color:${roleColor};border-radius:20px;font-size:13px;font-weight:600;border:1px solid ${roleColor}44;">${roleLabel}</span>
                  </td>
                </tr>
              </table>
            </td></tr>

            <!-- CTA -->
            <tr><td style="padding:24px 32px 28px;">
              <a href="https://supabase.com/dashboard/project/juoeblhhbarzsqcyqrkq/auth/users" style="display:block;text-align:center;padding:14px 24px;background:linear-gradient(135deg,#059669,#0A3B2E);color:white;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;letter-spacing:0.3px;">
                Gérer les accès dans Supabase →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Note -->
        <tr><td style="padding:20px 0 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">L'utilisateur doit confirmer son email avant de se connecter.</p>
          <p style="margin:6px 0 0;font-size:11px;color:#334155;">Solvid.IA · Plateforme ESG &amp; CSRD</p>
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
