// Email Service — powered by Resend
// All transactional emails are sent from noreply@fitverse.co.in

const { Resend } = require('resend');
const config = require('../config/env');
const logger = require('../config/logger');

const resend = new Resend(config.email.resendApiKey);
const FROM = config.email.from;
const FRONT = process.env.FRONTEND_URL || 'http://localhost:5173';

const resolveLogoUrl = (logoUrl) => {
  if (!logoUrl) return `${FRONT}/logo_white.png`;
  if (/^https?:\/\//i.test(logoUrl) || logoUrl.startsWith('data:')) return logoUrl;
  if (logoUrl.startsWith('/')) return `${FRONT}${logoUrl}`;
  return `${FRONT}/${logoUrl}`;
};

const EMAIL_LOGO_SRC_LIGHT = resolveLogoUrl(config.email.logoUrl);
const EMAIL_LOGO_SRC_DARK = resolveLogoUrl(config.email.logoUrlBlack);

// ─────────────────────────────────────────────
// Shared layout wrapper
// ─────────────────────────────────────────────
function layout(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Fitverse</title>
  <style>
    .fitverse-header { background-color: #f3f4f6 !important; }
    .fitverse-brand { color: #111827 !important; }
    .fitverse-logo-light { display: none !important; }
    .fitverse-logo-dark { display: block !important; }

    @media (prefers-color-scheme: dark) {
      .fitverse-header { background-color: #18181b !important; }
      .fitverse-brand { color: #ffffff !important; }
      .fitverse-logo-light { display: block !important; }
      .fitverse-logo-dark { display: none !important; }
    }

    [data-ogsc] .fitverse-header { background-color: #18181b !important; }
    [data-ogsc] .fitverse-brand { color: #ffffff !important; }
    [data-ogsc] .fitverse-logo-light { display: block !important; }
    [data-ogsc] .fitverse-logo-dark { display: none !important; }
  </style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- Header -->
          <tr>
            <td class="fitverse-header" bgcolor="#f3f4f6" style="background:#f3f4f6;border-radius:16px 16px 0 0;padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">
                      <tr>
                        <td style="vertical-align:middle;padding-right:10px;">
                          <img src="${EMAIL_LOGO_SRC_LIGHT}" alt="Fitverse Logo" width="26" height="26" class="fitverse-logo-light" style="display:none;border:0;outline:none;text-decoration:none;" />
                          <img src="${EMAIL_LOGO_SRC_DARK}" alt="Fitverse Logo" width="26" height="26" class="fitverse-logo-dark" style="display:block;border:0;outline:none;text-decoration:none;" />
                        </td>
                        <td style="vertical-align:middle;">
                          <span class="fitverse-brand" style="font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.5px;">Fitverse</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;padding:20px 40px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                You received this email because you have an account with Fitverse.<br/>
                &copy; ${new Date().getFullYear()} Fitverse. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// Button helper
// ─────────────────────────────────────────────
function btn(text, href) {
  return `<a href="${href}" style="display:inline-block;background:#18181b;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;letter-spacing:0.3px;">${text}</a>`;
}

// ─────────────────────────────────────────────
// OTP box helper
// ─────────────────────────────────────────────
function otpBox(otp) {
  return `
<div style="margin:28px 0;text-align:center;">
  <div style="display:inline-block;background:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:20px 40px;">
    <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#18181b;font-variant-numeric:tabular-nums;">${otp}</span>
  </div>
  <p style="margin:12px 0 0;font-size:13px;color:#94a3b8;">This code expires in <strong>5 minutes</strong></p>
</div>`;
}

// ─────────────────────────────────────────────
// 1. Email Verification OTP
// ─────────────────────────────────────────────
async function sendOTPEmail(to, name, otp) {
  const firstName = (name || 'there').split(' ')[0];
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">Verify your email</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${firstName}, welcome to Fitverse! Use the code below to verify your email address and complete your signup.
    </p>

    ${otpBox(otp)}

    <p style="margin:24px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
      If you didn't create a Fitverse account, you can safely ignore this email.
    </p>
  `);

  return send(to, 'Verify your Fitverse account', html);
}

// ─────────────────────────────────────────────
// 2. Resend / New OTP
// ─────────────────────────────────────────────
async function sendResendOTPEmail(to, name, otp) {
  const firstName = (name || 'there').split(' ')[0];
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">New verification code</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${firstName}, here's your new verification code. The previous one has been invalidated.
    </p>

    ${otpBox(otp)}

    <p style="margin:24px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
      If you didn't request this, please ignore this email or contact our support team.
    </p>
  `);

  return send(to, 'Your new Fitverse verification code', html);
}

// ─────────────────────────────────────────────
// 3. Welcome Email (sent after email verification)
// ─────────────────────────────────────────────
async function sendWelcomeEmail(to, name) {
  const firstName = (name || 'there').split(' ')[0];
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">Welcome to Fitverse, ${firstName}! 🎉</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Your account is now verified and ready to go. Discover the latest fitness fashion, experience our AI-powered virtual try-on, and find amazing pre-loved pieces in our Thrift marketplace.
    </p>

    <!-- Feature cards -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td style="padding-right:8px;vertical-align:top;width:50%;">
          <div style="background:#f8fafc;border-radius:10px;padding:16px;">
            <div style="font-size:22px;margin-bottom:6px;">👗</div>
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f172a;">Shop Collection</p>
            <p style="margin:0;font-size:12px;color:#64748b;">Latest activewear &amp; fashion drops</p>
          </div>
        </td>
        <td style="padding-left:8px;vertical-align:top;width:50%;">
          <div style="background:#f8fafc;border-radius:10px;padding:16px;">
            <div style="font-size:22px;margin-bottom:6px;">✨</div>
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f172a;">AI Try-On</p>
            <p style="margin:0;font-size:12px;color:#64748b;">See how clothes look on you</p>
          </div>
        </td>
      </tr>
      <tr><td colspan="2" height="12"></td></tr>
      <tr>
        <td style="padding-right:8px;vertical-align:top;width:50%;">
          <div style="background:#f0fdf4;border-radius:10px;padding:16px;">
            <div style="font-size:22px;margin-bottom:6px;">♻️</div>
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f172a;">Thrift Marketplace</p>
            <p style="margin:0;font-size:12px;color:#64748b;">Buy &amp; sell pre-loved fashion</p>
          </div>
        </td>
        <td style="padding-left:8px;vertical-align:top;width:50%;">
          <div style="background:#f0f7ff;border-radius:10px;padding:16px;">
            <div style="font-size:22px;margin-bottom:6px;">🚚</div>
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f172a;">Fast Delivery</p>
            <p style="margin:0;font-size:12px;color:#64748b;">Swift dispatch across India</p>
          </div>
        </td>
      </tr>
    </table>

    <div style="text-align:center;">
      ${btn('Start Shopping →', `${FRONT}/shop`)}
    </div>
  `);

  return send(to, `Welcome to Fitverse, ${firstName}!`, html);
}

// ─────────────────────────────────────────────
// 4. Order Confirmation
// ─────────────────────────────────────────────
async function sendOrderConfirmationEmail(to, name, order) {
  const firstName = (name || 'there').split(' ')[0];

  const payMethodLabel = {
    COD: 'Cash on Delivery',
    CARD: 'Card',
    WALLET: 'Wallet',
  }[order.paymentMethod] || order.paymentMethod;

  // Build items rows
  const itemRows = (order.items || []).map(item => {
    const imageUrl = item.productImage
      ? (item.productImage.startsWith('http') ? item.productImage : `${FRONT.replace('5173', '5000')}/${item.productImage}`)
      : '';
    return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;vertical-align:middle;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="width:48px;padding-right:12px;vertical-align:middle;">
              ${imageUrl ? `<img src="${imageUrl}" width="48" height="48" style="border-radius:8px;object-fit:cover;display:block;" />` : '<div style="width:48px;height:48px;background:#f1f5f9;border-radius:8px;"></div>'}
            </td>
            <td style="vertical-align:middle;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${item.productName}</p>
              <p style="margin:2px 0 0;font-size:13px;color:#64748b;">Qty: ${item.quantity}</p>
            </td>
            <td style="vertical-align:middle;text-align:right;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">₹${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }).join('');

  const addr = order.address;
  const addressBlock = addr
    ? `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}, ${addr.state} ${addr.zipCode}`
    : '—';

  const html = layout(`
    <!-- Checkmark badge -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:#f0fdf4;border-radius:50%;font-size:28px;">✅</div>
    </div>

    <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#0f172a;text-align:center;">Order confirmed!</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;text-align:center;">
      Hi ${firstName}, thanks for your order. We've received it and will keep you updated on its progress.
    </p>

    <!-- Order meta -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
      <tr>
        <td style="width:50%;padding-bottom:12px;">
          <p style="margin:0;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:0.8px;text-transform:uppercase;">Order Number</p>
          <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#0f172a;">${order.orderNumber}</p>
        </td>
        <td style="width:50%;padding-bottom:12px;text-align:right;">
          <p style="margin:0;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:0.8px;text-transform:uppercase;">Payment</p>
          <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#0f172a;">${payMethodLabel}</p>
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <p style="margin:0;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:0.8px;text-transform:uppercase;">Delivery Address</p>
          <p style="margin:4px 0 0;font-size:13px;color:#475569;">${addressBlock}</p>
        </td>
      </tr>
    </table>

    <!-- Items list -->
    <h3 style="margin:0 0 4px;font-size:13px;font-weight:600;color:#94a3b8;letter-spacing:0.8px;text-transform:uppercase;">Items Ordered</h3>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${itemRows}
    </table>

    <!-- Totals -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#64748b;">Subtotal</td>
        <td style="padding:6px 0;font-size:13px;color:#64748b;text-align:right;">₹${parseFloat(order.subtotal || 0).toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#64748b;">Shipping</td>
        <td style="padding:6px 0;font-size:13px;color:#64748b;text-align:right;">₹${parseFloat(order.shipping || 0).toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;border-top:2px solid #e2e8f0;font-size:16px;font-weight:700;color:#0f172a;">Total</td>
        <td style="padding:12px 0 0;border-top:2px solid #e2e8f0;font-size:16px;font-weight:700;color:#0f172a;text-align:right;">₹${parseFloat(order.total || 0).toFixed(2)}</td>
      </tr>
    </table>

    <div style="text-align:center;margin-top:32px;">
      ${btn('View Order Details →', `${FRONT}/orders/${order.id}`)}
    </div>

    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;text-align:center;">
      Need help? Reply to this email or visit our <a href="${FRONT}/contact" style="color:#3b82f6;text-decoration:none;">support page</a>.
    </p>
  `);

  return send(to, `Order confirmed — ${order.orderNumber}`, html);
}

// ─────────────────────────────────────────────
// Internal send helper
// ─────────────────────────────────────────────
async function send(to, subject, html) {
  try {
    const result = await resend.emails.send({
      from: FROM,
      to: [to],
      subject,
      html,
    });

    logger.info(`Email sent to ${to} | subject: "${subject}" | id: ${result?.data?.id || 'N/A'}`);
    return true;
  } catch (error) {
    logger.error(`Email send failed to ${to} | subject: "${subject}" | error: ${error.message}`);
    // Don't throw — email failures should never break core flows
    return false;
  }
}

module.exports = {
  sendOTPEmail,
  sendResendOTPEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
};
