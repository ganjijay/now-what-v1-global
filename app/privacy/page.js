"use client";

import {
  APP_LANGUAGES,
  useAppLanguage
} from "../../lib/i18n";
import styles from "./legal.module.css";

const CONTENT = {
  "title": {
    "en": "Privacy Policy",
    "ko": "개인정보처리방침",
    "es": "Política de privacidad",
    "zh": "隐私政策",
    "ja": "プライバシーポリシー",
    "pt": "Política de Privacidade",
    "fr": "Politique de confidentialité",
    "de": "Datenschutzrichtlinie",
    "ar": "سياسة الخصوصية",
    "hi": "गोपनीयता नीति",
    "vi": "Chính sách quyền riêng tư",
    "th": "นโยบายความเป็นส่วนตัว"
  },
  "body": {
    "en": "NowWhat collects only the information needed for account login, AI document analysis, credits, payments, refunds, and customer support. Google/Firebase, OpenAI, Stripe, Vercel, and Resend may process data needed to provide these services. Do not upload unnecessary sensitive information.",
    "ko": "NowWhat는 로그인, AI 문서 분석, 크레딧, 결제, 환불 및 고객지원에 필요한 정보만 수집합니다. 서비스 제공을 위해 Google/Firebase, OpenAI, Stripe, Vercel 및 Resend가 필요한 데이터를 처리할 수 있습니다. 불필요한 민감정보는 업로드하지 마세요.",
    "es": "NowWhat recopila únicamente la información necesaria para el inicio de sesión, el análisis con IA, los créditos, pagos, reembolsos y la atención al cliente. No subas información sensible innecesaria.",
    "zh": "NowWhat 仅收集账户登录、AI 文件分析、额度、付款、退款和客户支持所需的信息。请勿上传不必要的敏感信息。"
  }
};

export default function LegalPage() {
  const {
    appLanguage,
    setAppLanguage,
    languageReady
  } = useAppLanguage();

  const title =
    CONTENT.title[appLanguage] || CONTENT.title.en;
  const body =
    CONTENT.body[appLanguage] || CONTENT.body.en;

  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
    "support@nowwhatai.net";

  if (!languageReady) {
    return <main className={styles.page} />;
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.legalTop}>
          <a className={styles.back} href="/">
            ← NowWhat
          </a>

          <select
            value={appLanguage}
            onChange={(event) =>
              setAppLanguage(event.target.value)
            }
            aria-label="Language"
          >
            {APP_LANGUAGES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <article className={styles.card}>
          <p className={styles.eyebrow}>NOWWHAT</p>
          <h1>{title}</h1>
          <p className={styles.updated}>
            Updated: July 15, 2026
          </p>

          <div className={styles.notice}>
            {body}
          </div>

          <h2>Support</h2>
          <p>
            <a href="/support">
              NowWhat Support Center
            </a>
            <br />
            <a href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
          </p>

          <div className={styles.links}>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/refund-policy">Refunds</a>
            <a href="/contact">Contact</a>
          </div>
        </article>
      </div>
    </main>
  );
}
