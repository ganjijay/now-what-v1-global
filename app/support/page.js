"use client";

import {
  onAuthStateChanged,
  signInWithPopup
} from "firebase/auth";
import { useEffect, useState } from "react";
import { APP_LANGUAGES, useAppLanguage } from "../../lib/i18n";
import { auth, googleProvider } from "../../lib/firebase";
import styles from "./support.module.css";

const SUPPORT_COPY = {
  "en": {
    "title": "How can we help?",
    "subtitle": "Send questions about payments, refunds, login, credits, or the service.",
    "new": "New request",
    "type": "Request type",
    "subject": "Subject",
    "message": "Message",
    "send": "Send request",
    "sending": "Sending...",
    "history": "My requests",
    "historySub": "You can view the status and administrator reply here.",
    "refresh": "Refresh",
    "empty": "No requests yet.",
    "loginTitle": "NowWhat Support",
    "loginText": "Google sign-in is required to send requests and view replies.",
    "google": "Continue with Google",
    "back": "{t.back}",
    "types": {
      "payment_credit": "Payment or credit issue",
      "refund": "Refund request",
      "account_login": "Account or login issue",
      "feature_other": "Feature suggestion or other"
    },
    "statuses": {
      "new": "New",
      "in_progress": "In progress",
      "answered": "Answered",
      "closed": "Closed"
    },
    "reply": "NowWhat reply",
    "subjectPh": "Example: I paid but did not receive credits",
    "messagePh": "Describe what happened in detail.",
    "success": "Your request has been submitted. You can check the reply on this page."
  },
  "ko": {
    "title": "{t.title}",
    "subtitle": "결제, 환불, 로그인, 크레딧 또는 서비스 이용 문제를 보내주세요.",
    "new": "{t.new}",
    "type": "{t.type}",
    "subject": "제목",
    "message": "{t.message}",
    "send": "{t.send}",
    "sending": "{t.sending}",
    "history": "{t.history}",
    "historySub": "문의 상태와 관리자 답변을 여기에서 확인할 수 있습니다.",
    "refresh": "{t.refresh}",
    "empty": "{t.empty}",
    "loginTitle": "{t.loginTitle}",
    "loginText": "{t.loginText}",
    "google": "Google로 로그인",
    "back": "{t.back}",
    "types": {
      "payment_credit": "결제·크레딧 문제",
      "refund": "환불 요청",
      "account_login": "계정·로그인 문제",
      "feature_other": "기능 제안·기타"
    },
    "statuses": {
      "new": "새 문의",
      "in_progress": "처리 중",
      "answered": "답변 완료",
      "closed": "종료"
    },
    "reply": "{t.reply}",
    "subjectPh": "{t.subjectPh}",
    "messagePh": "{t.messagePh}",
    "success": "{t.success}"
  },
  "es": {
    "title": "¿Cómo podemos ayudarte?",
    "subtitle": "Envía consultas sobre pagos, reembolsos, acceso, créditos o el servicio.",
    "new": "Nueva solicitud",
    "type": "Tipo de consulta",
    "subject": "Asunto",
    "message": "Mensaje",
    "send": "Enviar consulta",
    "sending": "Enviando...",
    "history": "Mis consultas",
    "historySub": "Consulta aquí el estado y la respuesta.",
    "refresh": "Actualizar",
    "empty": "Aún no hay consultas.",
    "loginTitle": "Soporte de NowWhat",
    "loginText": "Debes iniciar sesión con Google para enviar consultas y ver respuestas.",
    "google": "Continuar con Google",
    "back": "{t.back}",
    "types": {
      "payment_credit": "Payment or credit issue",
      "refund": "Refund request",
      "account_login": "Account or login issue",
      "feature_other": "Feature suggestion or other"
    },
    "statuses": {
      "new": "New",
      "in_progress": "In progress",
      "answered": "Answered",
      "closed": "Closed"
    },
    "reply": "Respuesta de NowWhat",
    "subjectPh": "Ejemplo: pagué pero no recibí créditos",
    "messagePh": "Describe detalladamente lo ocurrido.",
    "success": "Tu consulta fue enviada. Puedes revisar la respuesta aquí."
  },
  "zh": {
    "title": "我们能为您做什么？",
    "subtitle": "请提交有关付款、退款、登录、额度或服务的问题。",
    "new": "提交新问题",
    "type": "问题类型",
    "subject": "主题",
    "message": "内容",
    "send": "提交",
    "sending": "正在提交...",
    "history": "我的问题",
    "historySub": "您可以在此查看状态和管理员回复。",
    "refresh": "刷新",
    "empty": "暂无问题记录。",
    "loginTitle": "NowWhat 客户支持",
    "loginText": "请使用 Google 登录以提交问题并查看回复。",
    "google": "使用 Google 登录",
    "back": "{t.back}",
    "types": {
      "payment_credit": "Payment or credit issue",
      "refund": "Refund request",
      "account_login": "Account or login issue",
      "feature_other": "Feature suggestion or other"
    },
    "statuses": {
      "new": "New",
      "in_progress": "In progress",
      "answered": "Answered",
      "closed": "Closed"
    },
    "reply": "NowWhat 回复",
    "subjectPh": "例如：付款后没有收到额度",
    "messagePh": "请详细描述发生的问题。",
    "success": "问题已提交，您可以在此查看回复。"
  },
  "ja": {
    "title": "How can we help?",
    "subtitle": "Send questions about payments, refunds, login, credits, or the service.",
    "new": "New request",
    "type": "Request type",
    "subject": "Subject",
    "message": "Message",
    "send": "Send request",
    "sending": "Sending...",
    "history": "My requests",
    "historySub": "You can view the status and administrator reply here.",
    "refresh": "Refresh",
    "empty": "No requests yet.",
    "loginTitle": "NowWhat Support",
    "loginText": "Google sign-in is required to send requests and view replies.",
    "google": "Continue with Google",
    "back": "{t.back}",
    "types": {
      "payment_credit": "Payment or credit issue",
      "refund": "Refund request",
      "account_login": "Account or login issue",
      "feature_other": "Feature suggestion or other"
    },
    "statuses": {
      "new": "New",
      "in_progress": "In progress",
      "answered": "Answered",
      "closed": "Closed"
    },
    "reply": "NowWhat reply",
    "subjectPh": "Example: I paid but did not receive credits",
    "messagePh": "Describe what happened in detail.",
    "success": "Your request has been submitted. You can check the reply on this page."
  },
  "pt": {
    "title": "How can we help?",
    "subtitle": "Send questions about payments, refunds, login, credits, or the service.",
    "new": "New request",
    "type": "Request type",
    "subject": "Subject",
    "message": "Message",
    "send": "Send request",
    "sending": "Sending...",
    "history": "My requests",
    "historySub": "You can view the status and administrator reply here.",
    "refresh": "Refresh",
    "empty": "No requests yet.",
    "loginTitle": "NowWhat Support",
    "loginText": "Google sign-in is required to send requests and view replies.",
    "google": "Continue with Google",
    "back": "{t.back}",
    "types": {
      "payment_credit": "Payment or credit issue",
      "refund": "Refund request",
      "account_login": "Account or login issue",
      "feature_other": "Feature suggestion or other"
    },
    "statuses": {
      "new": "New",
      "in_progress": "In progress",
      "answered": "Answered",
      "closed": "Closed"
    },
    "reply": "NowWhat reply",
    "subjectPh": "Example: I paid but did not receive credits",
    "messagePh": "Describe what happened in detail.",
    "success": "Your request has been submitted. You can check the reply on this page."
  },
  "fr": {
    "title": "How can we help?",
    "subtitle": "Send questions about payments, refunds, login, credits, or the service.",
    "new": "New request",
    "type": "Request type",
    "subject": "Subject",
    "message": "Message",
    "send": "Send request",
    "sending": "Sending...",
    "history": "My requests",
    "historySub": "You can view the status and administrator reply here.",
    "refresh": "Refresh",
    "empty": "No requests yet.",
    "loginTitle": "NowWhat Support",
    "loginText": "Google sign-in is required to send requests and view replies.",
    "google": "Continue with Google",
    "back": "{t.back}",
    "types": {
      "payment_credit": "Payment or credit issue",
      "refund": "Refund request",
      "account_login": "Account or login issue",
      "feature_other": "Feature suggestion or other"
    },
    "statuses": {
      "new": "New",
      "in_progress": "In progress",
      "answered": "Answered",
      "closed": "Closed"
    },
    "reply": "NowWhat reply",
    "subjectPh": "Example: I paid but did not receive credits",
    "messagePh": "Describe what happened in detail.",
    "success": "Your request has been submitted. You can check the reply on this page."
  },
  "de": {
    "title": "How can we help?",
    "subtitle": "Send questions about payments, refunds, login, credits, or the service.",
    "new": "New request",
    "type": "Request type",
    "subject": "Subject",
    "message": "Message",
    "send": "Send request",
    "sending": "Sending...",
    "history": "My requests",
    "historySub": "You can view the status and administrator reply here.",
    "refresh": "Refresh",
    "empty": "No requests yet.",
    "loginTitle": "NowWhat Support",
    "loginText": "Google sign-in is required to send requests and view replies.",
    "google": "Continue with Google",
    "back": "{t.back}",
    "types": {
      "payment_credit": "Payment or credit issue",
      "refund": "Refund request",
      "account_login": "Account or login issue",
      "feature_other": "Feature suggestion or other"
    },
    "statuses": {
      "new": "New",
      "in_progress": "In progress",
      "answered": "Answered",
      "closed": "Closed"
    },
    "reply": "NowWhat reply",
    "subjectPh": "Example: I paid but did not receive credits",
    "messagePh": "Describe what happened in detail.",
    "success": "Your request has been submitted. You can check the reply on this page."
  },
  "ar": {
    "title": "How can we help?",
    "subtitle": "Send questions about payments, refunds, login, credits, or the service.",
    "new": "New request",
    "type": "Request type",
    "subject": "Subject",
    "message": "Message",
    "send": "Send request",
    "sending": "Sending...",
    "history": "My requests",
    "historySub": "You can view the status and administrator reply here.",
    "refresh": "Refresh",
    "empty": "No requests yet.",
    "loginTitle": "NowWhat Support",
    "loginText": "Google sign-in is required to send requests and view replies.",
    "google": "Continue with Google",
    "back": "{t.back}",
    "types": {
      "payment_credit": "Payment or credit issue",
      "refund": "Refund request",
      "account_login": "Account or login issue",
      "feature_other": "Feature suggestion or other"
    },
    "statuses": {
      "new": "New",
      "in_progress": "In progress",
      "answered": "Answered",
      "closed": "Closed"
    },
    "reply": "NowWhat reply",
    "subjectPh": "Example: I paid but did not receive credits",
    "messagePh": "Describe what happened in detail.",
    "success": "Your request has been submitted. You can check the reply on this page."
  },
  "hi": {
    "title": "How can we help?",
    "subtitle": "Send questions about payments, refunds, login, credits, or the service.",
    "new": "New request",
    "type": "Request type",
    "subject": "Subject",
    "message": "Message",
    "send": "Send request",
    "sending": "Sending...",
    "history": "My requests",
    "historySub": "You can view the status and administrator reply here.",
    "refresh": "Refresh",
    "empty": "No requests yet.",
    "loginTitle": "NowWhat Support",
    "loginText": "Google sign-in is required to send requests and view replies.",
    "google": "Continue with Google",
    "back": "{t.back}",
    "types": {
      "payment_credit": "Payment or credit issue",
      "refund": "Refund request",
      "account_login": "Account or login issue",
      "feature_other": "Feature suggestion or other"
    },
    "statuses": {
      "new": "New",
      "in_progress": "In progress",
      "answered": "Answered",
      "closed": "Closed"
    },
    "reply": "NowWhat reply",
    "subjectPh": "Example: I paid but did not receive credits",
    "messagePh": "Describe what happened in detail.",
    "success": "Your request has been submitted. You can check the reply on this page."
  },
  "vi": {
    "title": "How can we help?",
    "subtitle": "Send questions about payments, refunds, login, credits, or the service.",
    "new": "New request",
    "type": "Request type",
    "subject": "Subject",
    "message": "Message",
    "send": "Send request",
    "sending": "Sending...",
    "history": "My requests",
    "historySub": "You can view the status and administrator reply here.",
    "refresh": "Refresh",
    "empty": "No requests yet.",
    "loginTitle": "NowWhat Support",
    "loginText": "Google sign-in is required to send requests and view replies.",
    "google": "Continue with Google",
    "back": "{t.back}",
    "types": {
      "payment_credit": "Payment or credit issue",
      "refund": "Refund request",
      "account_login": "Account or login issue",
      "feature_other": "Feature suggestion or other"
    },
    "statuses": {
      "new": "New",
      "in_progress": "In progress",
      "answered": "Answered",
      "closed": "Closed"
    },
    "reply": "NowWhat reply",
    "subjectPh": "Example: I paid but did not receive credits",
    "messagePh": "Describe what happened in detail.",
    "success": "Your request has been submitted. You can check the reply on this page."
  },
  "th": {
    "title": "How can we help?",
    "subtitle": "Send questions about payments, refunds, login, credits, or the service.",
    "new": "New request",
    "type": "Request type",
    "subject": "Subject",
    "message": "Message",
    "send": "Send request",
    "sending": "Sending...",
    "history": "My requests",
    "historySub": "You can view the status and administrator reply here.",
    "refresh": "Refresh",
    "empty": "No requests yet.",
    "loginTitle": "NowWhat Support",
    "loginText": "Google sign-in is required to send requests and view replies.",
    "google": "Continue with Google",
    "back": "{t.back}",
    "types": {
      "payment_credit": "Payment or credit issue",
      "refund": "Refund request",
      "account_login": "Account or login issue",
      "feature_other": "Feature suggestion or other"
    },
    "statuses": {
      "new": "New",
      "in_progress": "In progress",
      "answered": "Answered",
      "closed": "Closed"
    },
    "reply": "NowWhat reply",
    "subjectPh": "Example: I paid but did not receive credits",
    "messagePh": "Describe what happened in detail.",
    "success": "Your request has been submitted. You can check the reply on this page."
  }
};


function dateTime(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function SupportPage() {
  const {
    appLanguage,
    setAppLanguage
  } = useAppLanguage();
  const t =
    SUPPORT_COPY[appLanguage] || SUPPORT_COPY.en;
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [type, setType] = useState("payment_credit");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user]);

  async function authorizedFetch(url, options = {}) {
    const token = await auth.currentUser.getIdToken();

    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });
  }

  async function login() {
    setError("");
    await signInWithPopup(auth, googleProvider);
  }

  async function loadTickets() {
    try {
      const response = await authorizedFetch("/api/support");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "문의 내역을 불러오지 못했습니다.");
      }

      setTickets(data.tickets || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function submitTicket(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await authorizedFetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type,
          subject,
          message
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "문의를 접수하지 못했습니다.");
      }

      setSubject("");
      setMessage("");
      setNotice("{t.success}");
      await loadTickets();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  if (!authReady) {
    return <main className={styles.center}>NowWhat Support</main>;
  }

  if (!user) {
    return (
      <main className={styles.loginPage}>
        <section className={styles.loginCard}>
          <div className={styles.logo}>💬</div>
          <h1>{t.loginTitle}</h1>
          <p>{t.loginText}</p>
          <button onClick={login}>G&nbsp;&nbsp;{t.google}</button>
          {error && <div className={styles.error}>{error}</div>}
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/">{t.back}</a>
        <label className={styles.languageSelect}>
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
        </label>
        <div>
          <p>SUPPORT CENTER</p>
          <h1>{t.title}</h1>
          <span>{user.email}</span>
        </div>
      </header>

      <div className={styles.layout}>
        <section className={styles.formCard}>
          <h2>{t.new}</h2>
          <p>{t.subtitle}</p>

          <form onSubmit={submitTicket}>
            <label>
              {t.type}
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {Object.entries(t.types).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.subject}
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="{t.subjectPh}"
                maxLength={120}
              />
            </label>

            <label>
              {t.message}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="{t.messagePh}"
                maxLength={5000}
              />
            </label>

            <button disabled={loading}>
              {loading ? "{t.sending}" : "{t.send}"}
            </button>
          </form>

          {notice && <div className={styles.success}>{notice}</div>}
          {error && <div className={styles.error}>{error}</div>}
        </section>

        <section className={styles.historyCard}>
          <div className={styles.historyHeading}>
            <div>
              <h2>{t.history}</h2>
              <p>{t.historySub}</p>
            </div>
            <button onClick={loadTickets}>{t.refresh}</button>
          </div>

          <div className={styles.ticketList}>
            {tickets.length === 0 && (
              <p className={styles.empty}>{t.empty}</p>
            )}

            {tickets.map((ticket) => (
              <article key={ticket.id}>
                <div className={styles.ticketTop}>
                  <span className={`${styles.status} ${styles[ticket.status]}`}>
                    {t.statuses[ticket.status] || ticket.status}
                  </span>
                  <small>{dateTime(ticket.createdAt)}</small>
                </div>
                <p className={styles.type}>{t.types[ticket.type] || ticket.type}</p>
                <h3>{ticket.subject}</h3>
                <div className={styles.message}>{ticket.message}</div>

                {ticket.adminReply && (
                  <div className={styles.reply}>
                    <b>{t.reply}</b>
                    <p>{ticket.adminReply}</p>
                    <small>{dateTime(ticket.repliedAt)}</small>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
