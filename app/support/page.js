"use client";

import {
  onAuthStateChanged,
  signInWithPopup
} from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import {
  APP_LANGUAGES,
  useAppLanguage
} from "../../lib/i18n";
import { auth, googleProvider } from "../../lib/firebase";
import styles from "./support.module.css";

const COPY = {
  en: {
    title: "How can we help?",
    subtitle:
      "Send questions about payments, refunds, login, credits, or the service.",
    newRequest: "New request",
    requestType: "Request type",
    subject: "Subject",
    message: "Message",
    send: "Send request",
    sending: "Sending...",
    history: "My requests",
    historySub:
      "You can view the status and administrator reply here.",
    refresh: "Refresh",
    empty: "No requests yet.",
    loginTitle: "NowWhat Support",
    loginText:
      "Google sign-in is required to send requests and view replies.",
    google: "Continue with Google",
    back: "← NowWhat",
    reply: "NowWhat reply",
    subjectPlaceholder:
      "Example: I paid but did not receive credits",
    messagePlaceholder:
      "Describe what happened in detail.",
    success:
      "Your request has been submitted. You can check the reply on this page.",
    loadingError:
      "We could not load your requests.",
    submitError:
      "We could not submit your request.",
    serverError:
      "The support server returned an unexpected response. Please try again shortly.",
    types: {
      payment_credit: "Payment or credit issue",
      refund: "Refund request",
      account_login: "Account or login issue",
      feature_other: "Feature suggestion or other"
    },
    statuses: {
      new: "New",
      in_progress: "In progress",
      answered: "Answered",
      closed: "Closed"
    }
  },
  ko: {
    title: "무엇을 도와드릴까요?",
    subtitle:
      "결제, 환불, 로그인, 크레딧 또는 서비스 이용 문제를 보내주세요.",
    newRequest: "새 문의 접수",
    requestType: "문의 유형",
    subject: "제목",
    message: "문의 내용",
    send: "문의 보내기",
    sending: "접수 중...",
    history: "내 문의 내역",
    historySub:
      "문의 상태와 관리자 답변을 여기에서 확인할 수 있습니다.",
    refresh: "새로고침",
    empty: "아직 문의 내역이 없습니다.",
    loginTitle: "NowWhat 고객지원",
    loginText:
      "문의 접수와 답변 확인을 위해 Google 로그인이 필요합니다.",
    google: "Google로 로그인",
    back: "← NowWhat",
    reply: "NowWhat 답변",
    subjectPlaceholder:
      "예: 결제했는데 크레딧이 안 들어왔어요",
    messagePlaceholder:
      "문제가 발생한 상황을 자세히 적어주세요.",
    success:
      "문의가 접수되었습니다. 관리자 답변은 이 화면에서 확인할 수 있습니다.",
    loadingError:
      "문의 내역을 불러오지 못했습니다.",
    submitError:
      "문의를 접수하지 못했습니다.",
    serverError:
      "고객지원 서버에서 예상하지 못한 응답이 왔습니다. 잠시 후 다시 시도해 주세요.",
    types: {
      payment_credit: "결제·크레딧 문제",
      refund: "환불 요청",
      account_login: "계정·로그인 문제",
      feature_other: "기능 제안·기타"
    },
    statuses: {
      new: "새 문의",
      in_progress: "처리 중",
      answered: "답변 완료",
      closed: "종료"
    }
  },
  es: {
    title: "¿Cómo podemos ayudarte?",
    subtitle:
      "Envía consultas sobre pagos, reembolsos, acceso, créditos o el servicio.",
    newRequest: "Nueva solicitud",
    requestType: "Tipo de consulta",
    subject: "Asunto",
    message: "Mensaje",
    send: "Enviar consulta",
    sending: "Enviando...",
    history: "Mis consultas",
    historySub:
      "Consulta aquí el estado y la respuesta del administrador.",
    refresh: "Actualizar",
    empty: "Aún no hay consultas.",
    loginTitle: "Soporte de NowWhat",
    loginText:
      "Debes iniciar sesión con Google para enviar consultas y ver respuestas.",
    google: "Continuar con Google",
    back: "← NowWhat",
    reply: "Respuesta de NowWhat",
    subjectPlaceholder:
      "Ejemplo: pagué pero no recibí créditos",
    messagePlaceholder:
      "Describe detalladamente lo ocurrido.",
    success:
      "Tu consulta fue enviada. Puedes revisar la respuesta aquí.",
    loadingError:
      "No se pudieron cargar tus consultas.",
    submitError:
      "No se pudo enviar tu consulta.",
    serverError:
      "El servidor de soporte devolvió una respuesta inesperada. Inténtalo de nuevo en unos minutos.",
    types: {
      payment_credit: "Problema de pago o créditos",
      refund: "Solicitud de reembolso",
      account_login: "Problema de cuenta o acceso",
      feature_other: "Sugerencia u otro"
    },
    statuses: {
      new: "Nueva",
      in_progress: "En proceso",
      answered: "Respondida",
      closed: "Cerrada"
    }
  },
  zh: {
    title: "我们能为您做什么？",
    subtitle:
      "请提交有关付款、退款、登录、额度或服务的问题。",
    newRequest: "提交新问题",
    requestType: "问题类型",
    subject: "主题",
    message: "内容",
    send: "提交",
    sending: "正在提交...",
    history: "我的问题",
    historySub:
      "您可以在此查看状态和管理员回复。",
    refresh: "刷新",
    empty: "暂无问题记录。",
    loginTitle: "NowWhat 客户支持",
    loginText:
      "请使用 Google 登录以提交问题并查看回复。",
    google: "使用 Google 登录",
    back: "← NowWhat",
    reply: "NowWhat 回复",
    subjectPlaceholder:
      "例如：付款后没有收到额度",
    messagePlaceholder:
      "请详细描述发生的问题。",
    success:
      "问题已提交，您可以在此查看回复。",
    loadingError:
      "无法加载您的问题记录。",
    submitError:
      "无法提交您的问题。",
    serverError:
      "客户支持服务器返回了异常响应，请稍后重试。",
    types: {
      payment_credit: "付款或额度问题",
      refund: "退款申请",
      account_login: "账户或登录问题",
      feature_other: "功能建议或其他"
    },
    statuses: {
      new: "新问题",
      in_progress: "处理中",
      answered: "已回复",
      closed: "已关闭"
    }
  }
};

function dateTime(value, language) {
  if (!value) return "-";

  const locales = {
    ko: "ko-KR",
    en: "en-US",
    es: "es-ES",
    zh: "zh-CN"
  };

  return new Intl.DateTimeFormat(
    locales[language] || "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(new Date(value));
}

async function readJsonResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    console.error(
      "SUPPORT_NON_JSON_RESPONSE",
      response.status,
      text.slice(0, 500)
    );

    throw new Error("NON_JSON_RESPONSE");
  }

  return response.json();
}

export default function SupportPage() {
  const {
    appLanguage,
    setAppLanguage
  } = useAppLanguage();

  const t = useMemo(
    () => COPY[appLanguage] || COPY.en,
    [appLanguage]
  );

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [type, setType] =
    useState("payment_credit");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthReady(true);
      }
    );
  }, []);

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user, appLanguage]);

  async function authorizedFetch(
    url,
    options = {}
  ) {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error(t.loginText);
    }

    const token =
      await currentUser.getIdToken();

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

    try {
      await signInWithPopup(
        auth,
        googleProvider
      );
    } catch (loginError) {
      setError(
        loginError.message ||
          "Google login failed."
      );
    }
  }

  async function loadTickets() {
    try {
      setError("");

      const response =
        await authorizedFetch(
          "/api/support"
        );

      const data =
        await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || t.loadingError
        );
      }

      setTickets(data.tickets || []);
    } catch (loadError) {
      setError(
        loadError.message ===
          "NON_JSON_RESPONSE"
          ? t.serverError
          : loadError.message ||
              t.loadingError
      );
    }
  }

  async function submitTicket(event) {
    event.preventDefault();

    if (!subject.trim() || !message.trim()) {
      setError(
        appLanguage === "ko"
          ? "제목과 문의 내용을 입력해 주세요."
          : "Please enter a subject and message."
      );
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response =
        await authorizedFetch(
          "/api/support",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              type,
              subject: subject.trim(),
              message: message.trim()
            })
          }
        );

      const data =
        await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || t.submitError
        );
      }

      setSubject("");
      setMessage("");
      setNotice(t.success);
      await loadTickets();
    } catch (submitError) {
      setError(
        submitError.message ===
          "NON_JSON_RESPONSE"
          ? t.serverError
          : submitError.message ||
              t.submitError
      );
    } finally {
      setLoading(false);
    }
  }

  if (!authReady) {
    return (
      <main className={styles.center}>
        NowWhat Support
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.loginPage}>
        <section className={styles.loginCard}>
          <label
            className={styles.languageSelect}
          >
            <select
              value={appLanguage}
              onChange={(event) =>
                setAppLanguage(
                  event.target.value
                )
              }
              aria-label="Language"
            >
              {APP_LANGUAGES.map(
                ([code, name]) => (
                  <option
                    key={code}
                    value={code}
                  >
                    {name}
                  </option>
                )
              )}
            </select>
          </label>

          <div className={styles.logo}>
            💬
          </div>
          <h1>{t.loginTitle}</h1>
          <p>{t.loginText}</p>
          <button onClick={login}>
            G&nbsp;&nbsp;{t.google}
          </button>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/">{t.back}</a>

        <div>
          <p>SUPPORT CENTER</p>
          <h1>{t.title}</h1>
          <span>{user.email}</span>
        </div>

        <label
          className={styles.languageSelect}
        >
          <select
            value={appLanguage}
            onChange={(event) =>
              setAppLanguage(
                event.target.value
              )
            }
            aria-label="Language"
          >
            {APP_LANGUAGES.map(
              ([code, name]) => (
                <option
                  key={code}
                  value={code}
                >
                  {name}
                </option>
              )
            )}
          </select>
        </label>
      </header>

      <div className={styles.layout}>
        <section
          className={styles.formCard}
        >
          <h2>{t.newRequest}</h2>
          <p>{t.subtitle}</p>

          <form onSubmit={submitTicket}>
            <label>
              {t.requestType}
              <select
                value={type}
                onChange={(event) =>
                  setType(
                    event.target.value
                  )
                }
              >
                {Object.entries(
                  t.types
                ).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              {t.subject}
              <input
                value={subject}
                onChange={(event) =>
                  setSubject(
                    event.target.value
                  )
                }
                placeholder={
                  t.subjectPlaceholder
                }
                maxLength={120}
              />
            </label>

            <label>
              {t.message}
              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
                placeholder={
                  t.messagePlaceholder
                }
                maxLength={5000}
              />
            </label>

            <button disabled={loading}>
              {loading
                ? t.sending
                : t.send}
            </button>
          </form>

          {notice && (
            <div
              className={styles.success}
            >
              {notice}
            </div>
          )}

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
        </section>

        <section
          className={styles.historyCard}
        >
          <div
            className={
              styles.historyHeading
            }
          >
            <div>
              <h2>{t.history}</h2>
              <p>{t.historySub}</p>
            </div>

            <button onClick={loadTickets}>
              {t.refresh}
            </button>
          </div>

          <div
            className={styles.ticketList}
          >
            {tickets.length === 0 && (
              <p className={styles.empty}>
                {t.empty}
              </p>
            )}

            {tickets.map((ticket) => (
              <article key={ticket.id}>
                <div
                  className={
                    styles.ticketTop
                  }
                >
                  <span
                    className={`${styles.status} ${
                      styles[ticket.status]
                    }`}
                  >
                    {t.statuses[
                      ticket.status
                    ] || ticket.status}
                  </span>

                  <small>
                    {dateTime(
                      ticket.createdAt,
                      appLanguage
                    )}
                  </small>
                </div>

                <p className={styles.type}>
                  {t.types[ticket.type] ||
                    ticket.type}
                </p>

                <h3>{ticket.subject}</h3>

                <div
                  className={styles.message}
                >
                  {ticket.message}
                </div>

                {ticket.adminReply && (
                  <div
                    className={styles.reply}
                  >
                    <b>{t.reply}</b>
                    <p>
                      {ticket.adminReply}
                    </p>
                    <small>
                      {dateTime(
                        ticket.repliedAt,
                        appLanguage
                      )}
                    </small>
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
