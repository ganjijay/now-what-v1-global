"use client";

import {
  APP_LANGUAGES,
  useAppLanguage
} from "../../lib/i18n";
import styles from "./legal.module.css";

const CONTENT = {
  "title": {
    "en": "Terms of Service",
    "ko": "이용약관",
    "es": "Términos del servicio",
    "zh": "服务条款",
    "ja": "利用規約",
    "pt": "Termos de Serviço",
    "fr": "Conditions d’utilisation",
    "de": "Nutzungsbedingungen",
    "ar": "شروط الخدمة",
    "hi": "सेवा की शर्तें",
    "vi": "Điều khoản dịch vụ",
    "th": "ข้อกำหนดการใช้บริการ"
  },
  "body": {
    "en": "NowWhat is an AI tool that helps explain documents and organize next steps. AI output may be incomplete or incorrect and does not replace professional legal, medical, financial, tax, insurance, immigration, or government advice. Verify important details using the original document or an official source.",
    "ko": "NowWhat는 문서를 설명하고 다음 행동을 정리하도록 돕는 AI 도구입니다. AI 결과는 불완전하거나 틀릴 수 있으며 전문 법률, 의료, 금융, 세무, 보험, 이민 또는 정부기관 자문을 대신하지 않습니다. 중요한 내용은 원문 또는 공식 기관에서 다시 확인하세요.",
    "es": "NowWhat es una herramienta de IA para explicar documentos y organizar los próximos pasos. El resultado puede ser incompleto o incorrecto y no sustituye el asesoramiento profesional. Verifica la información importante en el documento original o una fuente oficial.",
    "zh": "NowWhat 是帮助解释文件并整理下一步行动的 AI 工具。AI 结果可能不完整或不准确，不能替代专业建议。请通过原始文件或官方来源核实重要信息。"
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
