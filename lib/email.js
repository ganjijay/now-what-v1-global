import { Resend } from "resend";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function emailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY &&
      process.env.RESEND_FROM_EMAIL &&
      process.env.SUPPORT_EMAIL
  );
}

export async function sendNowWhatEmail({
  to,
  subject,
  title,
  intro,
  body,
  actionLabel,
  actionUrl
}) {
  if (!emailConfigured()) {
    console.warn(
      "EMAIL_SKIPPED: RESEND_API_KEY, RESEND_FROM_EMAIL, or SUPPORT_EMAIL is missing."
    );
    return {
      skipped: true
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const safeBody = escapeHtml(body).replaceAll("\n", "<br />");

  const action =
    actionLabel && actionUrl
      ? `
        <div style="margin:28px 0;">
          <a href="${escapeHtml(actionUrl)}"
             style="display:inline-block;padding:13px 18px;border-radius:12px;background:#f05b2a;color:#fff;text-decoration:none;font-weight:800;">
            ${escapeHtml(actionLabel)}
          </a>
        </div>
      `
      : "";

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to,
    replyTo: process.env.SUPPORT_EMAIL,
    subject,
    html: `
      <div style="margin:0;background:#f6f7f4;padding:30px 15px;font-family:Arial,sans-serif;color:#17231d;">
        <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e2e7e3;border-radius:22px;overflow:hidden;">
          <div style="padding:24px 28px;background:linear-gradient(135deg,#fff2e7,#eaf8ef);">
            <div style="font-size:13px;font-weight:900;letter-spacing:1.5px;color:#f05b2a;">NOWWHAT</div>
            <h1 style="margin:8px 0 0;font-size:28px;">${escapeHtml(title)}</h1>
          </div>
          <div style="padding:28px;">
            <p style="font-size:16px;line-height:1.7;color:#59635d;">${escapeHtml(intro)}</p>
            <div style="margin-top:18px;padding:18px;border-radius:14px;background:#f7f9f7;line-height:1.7;">
              ${safeBody}
            </div>
            ${action}
            <p style="margin-top:28px;font-size:12px;line-height:1.6;color:#818984;">
              이 이메일은 NowWhat 고객지원 시스템에서 자동 발송되었습니다.
              회신하면 ${escapeHtml(process.env.SUPPORT_EMAIL)}로 전달됩니다.
            </p>
          </div>
        </div>
      </div>
    `
  });
}
