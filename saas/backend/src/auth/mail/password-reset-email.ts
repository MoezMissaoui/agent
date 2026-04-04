/** Contenu HTML + texte brut pour l’e-mail « mot de passe oublié » (compatible clients mail classiques). */

export type PasswordResetEmailParams = {
  resetUrl: string;
  /** Nom produit affiché (ex. variable MAIL_APP_NAME). */
  appName: string;
  /** Durée de validité du lien, en minutes. */
  ttlMinutes: number;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildPasswordResetEmail(params: PasswordResetEmailParams): {
  html: string;
  text: string;
} {
  const { resetUrl, appName, ttlMinutes } = params;
  const safeName = escapeHtml(appName);
  const pageTitle = `Reset your password — ${appName}`;

  const text = [
    `Hello,`,
    ``,
    `We received a request to reset the password for your ${appName} account.`,
    ``,
    `Use the link below to choose a new password. This link expires in ${ttlMinutes} minute${ttlMinutes === 1 ? '' : 's'}.`,
    ``,
    resetUrl,
    ``,
    `If you did not request a password reset, you can safely ignore this email. Your password will stay the same.`,
    ``,
    `— ${appName}`,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(pageTitle)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#1e293b;">
  <div style="display:none;max-height:0;overflow:hidden;">Reset your password — link expires in ${ttlMinutes} min.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f5f7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background-color:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(15,23,42,0.08);overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">${safeName}</p>
              <h1 style="margin:12px 0 0 0;font-size:20px;font-weight:600;color:#0f172a;letter-spacing:-0.02em;">Reset your password</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 24px 28px;font-size:15px;color:#475569;">
              <p style="margin:0 0 16px 0;">We received a request to reset the password for your account. Click the button below to choose a new password.</p>
              <p style="margin:0 0 20px 0;font-size:13px;color:#64748b;">This link expires in <strong style="color:#334155;">${ttlMinutes} minute${ttlMinutes === 1 ? '' : 's'}</strong>.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 20px 0;">
                <tr>
                  <td style="border-radius:10px;background-color:#007aff;">
                    <a href="${escapeHtml(resetUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Choose a new password</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">If the button doesn’t work, copy and paste this link into your browser:</p>
              <p style="margin:0;word-break:break-all;font-size:12px;color:#007aff;">${escapeHtml(resetUrl)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px 28px;border-top:1px solid #f1f5f9;background-color:#fafbfc;font-size:13px;color:#64748b;">
              <p style="margin:0;">If you did not request a password reset, you can ignore this email — your password will not change.</p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;">This message was sent by ${safeName}.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text };
}
