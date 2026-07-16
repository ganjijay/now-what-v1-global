"use client";

import {
  APP_LANGUAGES,
  useAppLanguage
} from "../../lib/i18n";
import styles from "./legal.module.css";

const CONTENT = {
  "title": {
    "en": "Contact",
    "ko": "문의하기",
    "es": "Contacto",
    "zh": "联系我们",
    "ja": "お問い合わせ",
    "pt": "Contato",
    "fr": "Contact",
    "de": "Kontakt",
    "ar": "اتصل بنا",
    "hi": "संपर्क",
    "vi": "Liên hệ",
    "th": "ติดต่อ"
  },
  "body": {
    "en": "For payment, refund, login, credit, or service questions, use the in-app Support Center for the fastest response. Include your login email, the time of the issue, and a screenshot with sensitive information hidden.",
    "ko": "결제, 환불, 로그인, 크레딧 또는 서비스 이용 문제는 앱 내 고객지원에서 문의하는 것이 가장 빠릅니다. 로그인 이메일, 문제 발생 시간 및 민감정보를 가린 스크린샷을 포함해 주세요.",
    "es": "Para consultas sobre pagos, reembolsos, acceso, créditos o el servicio, utiliza el Centro de ayuda de la aplicación. Incluye tu correo de acceso, la hora del problema y una captura sin datos sensibles.",
    "zh": "有关付款、退款、登录、额度或服务的问题，请优先使用应用内客户支持。请提供登录邮箱、问题发生时间以及隐藏敏感信息的截图。"
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
    "jayb.lee0403@gmail.com";

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
