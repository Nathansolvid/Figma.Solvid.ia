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
    // No email key configured — still return 200 to not block signup
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

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #f9fafb; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #0A3B2E, #059669); padding: 24px; border-radius: 10px; margin-bottom: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Solvid<span style="color: #6ee7b7">.IA</span></h1>
        <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px;">Nouvelle inscription</p>
      </div>
      <h2 style="color: #111827; font-size: 18px; margin: 0 0 16px;">🎉 Nouveau compte créé</h2>
      <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 12px 16px; font-size: 12px; color: #6b7280; width: 120px;">Nom</td>
          <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #111827;">${name || '—'}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 12px 16px; font-size: 12px; color: #6b7280;">Email</td>
          <td style="padding: 12px 16px; font-size: 14px; color: #111827;">${email || '—'}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 12px 16px; font-size: 12px; color: #6b7280;">Organisation</td>
          <td style="padding: 12px 16px; font-size: 14px; color: #111827;">${org || '—'}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 12px; color: #6b7280;">Rôle demandé</td>
          <td style="padding: 12px 16px; font-size: 14px; color: #111827;">${roleLabels[role] || role || '—'}</td>
        </tr>
      </table>
      <div style="margin-top: 20px; padding: 12px 16px; background: #ecfdf5; border-radius: 8px; border-left: 3px solid #059669;">
        <p style="margin: 0; font-size: 12px; color: #065f46;">
          ⚠️ L'utilisateur doit confirmer son email avant de pouvoir se connecter.
          Tu peux gérer les accès depuis le <a href="https://app.supabase.com" style="color: #059669;">dashboard Supabase</a>.
        </p>
      </div>
      <p style="margin-top: 20px; font-size: 11px; color: #9ca3af; text-align: center;">
        ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })} · Solvid.IA
      </p>
    </div>
  `;

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
        subject: `🆕 Nouvelle inscription — ${name || email}`,
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
