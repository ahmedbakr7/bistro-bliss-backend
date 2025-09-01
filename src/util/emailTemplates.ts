// Reusable email HTML templates
// Focus on maximum client compatibility (tables, inline styles)
// Usage: sendMail({ to: user.email, subject: 'Verify your email', html: buildVerificationEmail({...}) })

interface VerificationEmailParams {
    appName?: string;
    userName?: string;
    code: string; // short code (e.g. 6 chars)
    verifyUrl: string; // full clickable link
    expiresInMinutes?: number; // e.g. 30
}

export function buildVerificationEmail({
    appName = "Bistro Bliss",
    userName,
    code,
    verifyUrl,
    expiresInMinutes = 30,
}: VerificationEmailParams): string {
    const safeName = userName ? escapeHtml(userName) : "there";
    const safeApp = escapeHtml(appName);
    const safeCode = escapeHtml(code);
    const safeUrl = escapeHtml(verifyUrl);
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charSet="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${safeApp} – Verify your email</title>
<style>
  /* Dark mode preference */
  @media (prefers-color-scheme: dark) {
    body { background:#0f1115 !important; color:#e6e6e6 !important; }
    .card { background:#1b1f24 !important; }
    .btn { background:#4f8bff !important; }
  }
  a { color:#2563eb; }
</style>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111">
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background:#f4f6f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)" class="card">
          <tr>
            <td style="padding:32px 40px 24px;font-size:24px;font-weight:600;letter-spacing:-0.5px;">
              ${safeApp}
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 8px;font-size:16px;">
              Hi ${safeName},
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px;font-size:16px;">
              Thanks for creating an account with <strong>${safeApp}</strong>.<br />
              Please confirm your email address using the verification code below or by clicking the button.
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;" align="center">
              <table role="presentation" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:16px 12px;background:#111827;color:#ffffff;font-size:32px;font-weight:700;letter-spacing:6px;border-radius:8px;font-family:SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;">
                    ${safeCode}
                  </td>
                </tr>
              </table>
              <div style="font-size:13px;color:#555;margin-top:12px;">Code expires in ${expiresInMinutes} minutes.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;" align="center">
              <a href="${safeUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:8px;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(37,99,235,0.35)" class="btn">Verify Email</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 28px;font-size:14px;color:#444;">
              If the button doesn't work, copy & paste this link into your browser:<br />
              <span style="word-break:break-all;color:#2563eb">${safeUrl}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 28px;font-size:13px;color:#666;">
              If you did not request this, you can safely ignore this email.
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 40px;font-size:12px;color:#9ca3af;">
              &copy; ${new Date().getFullYear()} ${safeApp}. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Basic HTML escaper to prevent injection inside template
function escapeHtml(input: string): string {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
