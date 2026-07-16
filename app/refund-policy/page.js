"use client";

import {
  APP_LANGUAGES,
  useAppLanguage
} from "../../lib/i18n";
import styles from "./legal.module.css";

const CONTENT = {
  "title": {
    "en": "Refund Policy",
    "ko": "환불 정책",
    "es": "Política de reembolso",
    "zh": "退款政策",
    "ja": "返金ポリシー",
    "pt": "Política de Reembolso",
    "fr": "Politique de remboursement",
    "de": "Rückerstattungsrichtlinie",
    "ar": "سياسة الاسترداد",
    "hi": "रिफंड नीति",
    "vi": "Chính sách hoàn tiền",
    "th": "นโยบายการคืนเงิน"
  },
  "body": {
    "en": "Submit refund requests within 7 days of purchase. Full refunds are generally reviewed when purchased credits remain unused, for duplicate charges, or when credits were not delivered. Approved refunds are returned to the original payment method through Stripe.",
    "ko": "환불 요청은 구매 후 7일 이내에 접수해 주세요. 구매 크레딧이 사용되지 않았거나 중복 결제 또는 크레딧 미지급이 발생한 경우 전액 환불을 우선 검토합니다. 승인된 환불은 Stripe를 통해 원래 결제수단으로 처리됩니다.",
    "es": "Solicita el reembolso dentro de los 7 días posteriores a la compra. Se revisan los reembolsos completos cuando los créditos no se han usado, existe un cargo duplicado o no se entregaron créditos.",
    "zh": "请在购买后 7 天内提交退款申请。若购买的额度尚未使用、发生重复扣款或额度未到账，我们通常会优先审核全额退款。"
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
