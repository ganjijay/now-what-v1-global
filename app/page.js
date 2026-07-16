"use client";

import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { auth, googleProvider } from "../lib/firebase";
import {
  consumeOneCredit,
  ensureUserProfile,
  watchCredits
} from "../lib/userService";

const LANGS = [
  ["ko", "한국어"],
  ["en", "English"],
  ["es", "Español"],
  ["zh", "中文"],
  ["ja", "日本語"],
  ["vi", "Tiếng Việt"],
  ["th", "ไทย"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["pt", "Português"],
  ["ar", "العربية"],
  ["hi", "हिन्दी"]
];

const COPY = {
  ko: {
    hero: "문서를 받았는데, 이제 뭘 해야 할지 모르겠나요?",
    intro:
      "사진, 스크린샷, PDF 또는 메시지를 올리세요. NowWhat이 내용을 쉽게 설명하고, 지금 해야 할 일과 답장까지 알려드립니다.",
    start: "내 문서 확인하기",
    free: "처음 가입하면 무료 크레딧 3회",
    examples: "실제 결과는 이렇게 보여요",
    examplesSub: "설명보다 예시를 보면 앱의 가치를 바로 알 수 있어요.",
    what: "이게 뭐야?",
    action: "지금 해야 할 일",
    deadline: "언제까지?",
    reply: "답장해야 돼?",
    loginTitle: "무료로 시작하세요",
    loginText:
      "Google 계정으로 시작하면 무료 크레딧 3회가 지급되고, 남은 크레딧이 안전하게 저장됩니다.",
    google: "Google로 무료 시작",
    back: "설명 화면으로 돌아가기",
    welcome: "안녕하세요",
    credits: "남은 크레딧",
    logout: "로그아웃",
    language: "결과 언어",
    camera: "사진 찍기",
    gallery: "스크린샷 선택",
    pdf: "PDF 첨부",
    direct: "내용 직접 입력",
    placeholder: "문자, 이메일, 편지 내용을 붙여넣으세요...",
    analyze: "그래서 뭐 해야 돼?",
    checking: "확인하고 있어요...",
    make: "답장 만들어줘",
    making: "답장 만드는 중...",
    suggested: "추천 답장",
    meaning: "이 답장의 뜻",
    copy: "보낼 답장 복사",
    copied: "복사했어요 ✓",
    again: "다른 내용 확인하기",
    required: "✅ 답장 필요",
    none: "❌ 답장 필요 없음",
    unclear: "⚠️ 확인 필요",
    noCredits: "남은 크레딧이 없습니다.",
    buyCredits: "크레딧 구매",
    choosePlan: "필요한 만큼 충전하세요",
    starter: "Starter",
    popular: "인기",
    pro: "Pro",
    analyses: "회 분석",
    buy: "구매하기",
    openingPayment: "결제창 여는 중...",
    paymentCancelled: "결제가 취소되었습니다.",
    paymentReturn:
      "결제 완료 페이지로 돌아왔습니다. 자동 크레딧 지급은 다음 단계에서 연결합니다.",
    need: "사진, PDF 또는 내용을 입력해 주세요.",
    max: "파일은 최대 6개까지 선택할 수 있어요.",
    disclaimer:
      "AI 설명은 공식 법률·의료·정부기관 결정이 아닙니다. 중요한 제출물과 기한은 원본을 다시 확인하세요."
  },
  en: {
    hero: "Got a document and don't know what to do next?",
    intro:
      "Upload a photo, screenshot, PDF, or message. NowWhat explains it simply, gives your next step, and writes a reply.",
    start: "Check my document",
    free: "New users receive 3 free credits",
    examples: "See exactly what the result looks like",
    examplesSub: "Real examples show what NowWhat does in seconds.",
    what: "What is this?",
    action: "What should I do now?",
    deadline: "By when?",
    reply: "Do I need to reply?",
    loginTitle: "Start for free",
    loginText:
      "Sign in with Google to receive 3 free credits and securely save your balance.",
    google: "Start free with Google",
    back: "Back to introduction",
    welcome: "Welcome",
    credits: "Credits left",
    logout: "Sign out",
    language: "Result language",
    camera: "Take a photo",
    gallery: "Choose screenshots",
    pdf: "Attach PDF",
    direct: "Enter text",
    placeholder: "Paste a message, email, or letter...",
    analyze: "What should I do?",
    checking: "Checking...",
    make: "Write a reply",
    making: "Writing reply...",
    suggested: "Suggested reply",
    meaning: "What this reply means",
    copy: "Copy sendable reply",
    copied: "Copied ✓",
    again: "Check something else",
    required: "✅ Reply needed",
    none: "❌ No reply needed",
    unclear: "⚠️ Needs checking",
    noCredits: "You have no credits left.",
    buyCredits: "Buy credits",
    choosePlan: "Choose the amount you need",
    starter: "Starter",
    popular: "Popular",
    pro: "Pro",
    analyses: "analyses",
    buy: "Buy",
    openingPayment: "Opening checkout...",
    paymentCancelled: "Payment was cancelled.",
    paymentReturn:
      "You returned from a completed payment. Automatic credit delivery will be connected next.",
    need: "Add a photo, PDF, or text.",
    max: "You can select up to 6 files.",
    disclaimer:
      "This AI explanation is not an official legal, medical, or government decision. Recheck important deadlines and submissions."
  }
};

const EXAMPLES = {
  ko: [
    {
      icon: "🏛️",
      title: "정부기관 편지",
      source: "Please submit a copy of your DD214 by August 10.",
      what: "군 복무 임금을 확인하기 위해 DD214를 요청하는 편지입니다.",
      action: "DD214 사본을 준비해서 제출하세요.",
      deadline: "8월 10일까지",
      reply: "제출 후 짧은 확인 답장을 보내는 것이 좋습니다."
    },
    {
      icon: "🏫",
      title: "학교 이메일",
      source: "We still need proof of residency and immunization records.",
      what: "학교 등록을 완료하려면 두 가지 서류가 더 필요하다는 이메일입니다.",
      action: "거주 증명과 예방접종 기록을 학교에 보내세요.",
      deadline: "원문에 정해진 날짜 없음",
      reply: "서류를 준비하겠다고 답장하는 것이 좋습니다."
    },
    {
      icon: "🏥",
      title: "병원 청구서",
      source: "Please wait until your insurance claim is processed.",
      what: "현재 금액이 최종 본인 부담금이 아닐 수 있다는 안내입니다.",
      action: "보험 처리가 끝날 때까지 바로 결제하지 말고 기다리세요.",
      deadline: "즉시 해야 할 기한 없음",
      reply: "답장은 필요하지 않습니다."
    }
  ],
  en: [
    {
      icon: "🏛️",
      title: "Government letter",
      source: "Please submit a copy of your DD214 by August 10.",
      what: "The agency is requesting a DD214 to verify military wages.",
      action: "Prepare and submit a copy of the DD214.",
      deadline: "By August 10",
      reply: "A short confirmation after submission is recommended."
    },
    {
      icon: "🏫",
      title: "School email",
      source: "We still need proof of residency and immunization records.",
      what: "Two documents are still needed to complete enrollment.",
      action: "Send proof of residency and immunization records.",
      deadline: "No deadline shown",
      reply: "Reply to confirm that you will prepare the documents."
    },
    {
      icon: "🏥",
      title: "Medical bill",
      source: "Please wait until your insurance claim is processed.",
      what: "The current amount may not be your final responsibility.",
      action: "Wait for insurance processing before paying.",
      deadline: "No immediate deadline",
      reply: "No reply is needed."
    }
  ]
};

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">💬</span>
      <div>
        <strong>NowWhat</strong>
        <small>Know what to do next.</small>
      </div>
    </div>
  );
}

function ResultCard({ title, children, accent = false }) {
  return (
    <section className={`result-card ${accent ? "accent" : ""}`}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function Home() {
  const [lang, setLang] = useState("ko");
  const [screen, setScreen] = useState("intro");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [credits, setCredits] = useState(null);
  const [files, setFiles] = useState([]);
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [replyData, setReplyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState("");

  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const pdfRef = useRef(null);

  const t = COPY[lang] || COPY.en;
  const examples = EXAMPLES[lang] || EXAMPLES.en;

  useEffect(() => {
    let stopCredits = null;

    const stopAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (stopCredits) {
        stopCredits();
        stopCredits = null;
      }

      setUser(currentUser);
      setCredits(null);

      if (currentUser) {
        try {
          await ensureUserProfile(currentUser);
          stopCredits = watchCredits(currentUser.uid, setCredits);
        } catch (authError) {
          console.error(authError);
          setError(
            lang === "ko"
              ? "사용자 정보를 불러오지 못했습니다. Firebase 설정을 확인해 주세요."
              : "We could not load your user profile."
          );
        }
      }

      setAuthReady(true);
    });

    return () => {
      stopAuth();
      if (stopCredits) stopCredits();
    };
  }, [lang]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");

    if (checkout === "success") {
      setError(t.paymentReturn);
      setScreen(user ? "app" : "login");
    }

    if (checkout === "cancelled") {
      setError(t.paymentCancelled);
      setScreen(user ? "app" : "login");
    }
  }, [user, t.paymentCancelled, t.paymentReturn]);

  async function login() {
    setError("");

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await ensureUserProfile(credential.user);
      setScreen("app");
    } catch (loginError) {
      console.error(loginError);
      setError(
        lang === "ko"
          ? "Google 로그인 중 문제가 발생했습니다. 다시 시도해 주세요."
          : "Google sign-in failed. Please try again."
      );
    }
  }

  async function logout() {
    await signOut(auth);
    reset();
    setScreen("intro");
  }

  function begin() {
    setError("");
    setScreen(user ? "app" : "login");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addFiles(fileList) {
    const merged = [...files, ...Array.from(fileList || [])];

    if (merged.length > 6) {
      setError(t.max);
      return;
    }

    setFiles(
      merged.filter(
        (file) =>
          file.type.startsWith("image/") ||
          file.type === "application/pdf"
      )
    );
    setError("");
  }

  function removeFile(index) {
    setFiles((current) => current.filter((_, i) => i !== index));
  }

  function reset() {
    setFiles([]);
    setText("");
    setResult(null);
    setReplyData(null);
    setError("");
    setCopied(false);
  }

  async function buyCredits(plan) {
    if (!user) {
      setScreen("login");
      return;
    }

    setPurchaseLoading(String(plan));
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          plan: String(plan),
          uid: user.uid,
          email: user.email || ""
        })
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(
          data.error || "Could not open checkout."
        );
      }

      window.location.href = data.url;
    } catch (purchaseError) {
      console.error(purchaseError);
      setError(
        purchaseError.message ||
          "Could not open checkout."
      );
      setPurchaseLoading("");
    }
  }

  async function analyze() {
    if (!user) {
      setScreen("login");
      return;
    }

    if (!files.length && !text.trim()) {
      setError(t.need);
      return;
    }

    if (credits === null) {
      setError(lang === "ko" ? "크레딧을 불러오는 중입니다." : "Loading credits.");
      return;
    }

    if (credits < 1) {
      setError(t.noCredits);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setReplyData(null);

    try {
      const formData = new FormData();
      formData.append("language", lang);
      formData.append("text", text.trim());
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed.");
      }

      await consumeOneCredit(user.uid);
      setResult(data);
    } catch (analysisError) {
      console.error(analysisError);
      setError(
        analysisError.message === "NO_CREDITS"
          ? t.noCredits
          : analysisError.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function makeReply() {
    if (!result) return;

    setReplyLoading(true);
    setError("");

    try {
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang,
          originalLanguage: result.original_language,
          summary: result.what_is_it,
          action: result.action,
          replyContext: result.reply_reason
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Reply generation failed.");
      }

      setReplyData(data);
    } catch (replyError) {
      setError(replyError.message);
    } finally {
      setReplyLoading(false);
    }
  }

  async function copyReply() {
    if (!replyData?.reply) return;
    await navigator.clipboard.writeText(replyData.reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!authReady) {
    return (
      <main className="loading-screen">
        <Brand />
        <div className="loading-dot" />
      </main>
    );
  }

  if (screen === "intro") {
    return (
      <main className="landing-page">
        <nav className="top-nav">
          <Brand />
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            {LANGS.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </nav>

        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">AI DOCUMENT & REPLY ASSISTANT</span>
            <h1>{t.hero}</h1>
            <p>{t.intro}</p>

            <div className="benefits">
              <span>💡 {t.what}</span>
              <span>✅ {t.action}</span>
              <span>📅 {t.deadline}</span>
              <span>✉️ {t.reply}</span>
            </div>

            <button className="primary-button" onClick={begin}>
              {t.start} →
            </button>
            <small className="free-note">🎁 {t.free}</small>
          </div>

          <div className="hero-demo">
            <div className="document-preview">
              <span>📄 Received document</span>
              <i />
              <i />
              <i />
            </div>
            <ResultCard title={`💡 ${t.what}`}>
              <p>{examples[1].what}</p>
            </ResultCard>
            <ResultCard title={`✅ ${t.action}`} accent>
              <p>{examples[1].action}</p>
            </ResultCard>
          </div>
        </section>

        <section className="examples-section">
          <div className="section-heading">
            <span>REAL EXAMPLES</span>
            <h2>{t.examples}</h2>
            <p>{t.examplesSub}</p>
          </div>

          <div className="example-grid">
            {examples.map((example) => (
              <article className="example-card" key={example.title}>
                <h3>
                  {example.icon} {example.title}
                </h3>
                <div className="source-box">
                  <small>RECEIVED CONTENT</small>
                  <p>{example.source}</p>
                </div>
                <div className="example-result">
                  <p>
                    <b>💡 {t.what}</b>
                    {example.what}
                  </p>
                  <p className="example-action">
                    <b>✅ {t.action}</b>
                    {example.action}
                  </p>
                  <p>
                    <b>📅 {t.deadline}</b>
                    {example.deadline}
                  </p>
                  <p>
                    <b>✉️ {t.reply}</b>
                    {example.reply}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="document-types">
          <h2>{lang === "ko" ? "이런 내용을 확인할 수 있어요" : "Works with the documents you receive"}</h2>
          <div>
            <span>🏛 Government</span>
            <span>🏫 School</span>
            <span>🏥 Medical</span>
            <span>🛡 Insurance</span>
            <span>🏦 Bank</span>
            <span>🚗 DMV</span>
            <span>⚖️ Court</span>
            <span>💼 Employment</span>
            <span>📧 Email</span>
            <span>📄 PDF</span>
            <span>🖼 Screenshot</span>
            <span>💬 Message</span>
          </div>
        </section>

        <section className="bottom-cta">
          <div>
            <small>NowWhat</small>
            <h2>Know what to do next.</h2>
            <p>🎁 {t.free}</p>
          </div>
          <button className="primary-button" onClick={begin}>
            {t.start} →
          </button>
        </section>

        <footer className="landing-footer">
          <Brand />
        </footer>
      </main>
    );
  }

  if (screen === "login") {
    return (
      <main className="login-page">
        <section className="login-card">
          <button className="back-button" onClick={() => setScreen("intro")}>←</button>
          <Brand />
          <h1>{t.loginTitle}</h1>
          <p>{t.loginText}</p>
          <button className="google-button" onClick={login}>
            <span>G</span>
            {t.google}
          </button>
          <small>🎁 {t.free}</small>
          {error && <p className="error-message">{error}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="app-page" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="app-shell">
        <header className="user-bar">
          <Brand />
          <div className="user-info">
            <div>
              <small>{t.welcome}</small>
              <strong>{user?.displayName || user?.email}</strong>
            </div>
            <span className="credit-pill">
              {t.credits}: <b>{credits ?? "..."}</b>
            </span>
            <button
              className="buy-credit-link"
              onClick={() =>
                document
                  .getElementById("pricing")
                  ?.scrollIntoView({
                    behavior: "smooth"
                  })
              }
            >
              💎 {t.buyCredits}
            </button>
            <button onClick={logout}>{t.logout}</button>
          </div>
        </header>

        <section className="app-heading">
          <h1>Know what to do next.</h1>
          <p>{t.intro}</p>
        </section>

        <section className="language-row">
          <label>{t.language}</label>
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            {LANGS.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </section>

        <section className="upload-grid">
          <button onClick={() => cameraRef.current?.click()}>
            <span>📸</span>
            <strong>{t.camera}</strong>
          </button>
          <button onClick={() => galleryRef.current?.click()}>
            <span>🖼️</span>
            <strong>{t.gallery}</strong>
          </button>
          <button onClick={() => pdfRef.current?.click()}>
            <span>📎</span>
            <strong>{t.pdf}</strong>
          </button>
        </section>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
        <input
          ref={pdfRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />

        {files.length > 0 && (
          <section className="selected-files">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`}>
                <span>{file.type === "application/pdf" ? "📄" : "🖼️"}</span>
                <strong>{file.name}</strong>
                <button onClick={() => removeFile(index)}>×</button>
              </div>
            ))}
          </section>
        )}

        <section className="text-input-card">
          <label>{t.direct}</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.placeholder}
            maxLength={12000}
          />
        </section>

        <button
          className="primary-button full-button"
          onClick={analyze}
          disabled={loading}
        >
          {loading ? t.checking : `✨ ${t.analyze}`}
        </button>

        {error && <p className="error-message">{error}</p>}

        {result && (
          <section className="results-section">
            <ResultCard title={`💡 ${t.what}`}>
              <p>{result.what_is_it}</p>
            </ResultCard>

            <ResultCard title={`✅ ${t.action}`} accent>
              {result.action_items?.length > 1 ? (
                <ol>
                  {result.action_items.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ol>
              ) : (
                <p>{result.action}</p>
              )}
            </ResultCard>

            <ResultCard title={`📅 ${t.deadline}`}>
              <p className="deadline-text">{result.deadline}</p>
            </ResultCard>

            <ResultCard title={`✉️ ${t.reply}`}>
              <span className={`reply-status ${result.reply_status}`}>
                {result.reply_status === "required"
                  ? t.required
                  : result.reply_status === "not_required"
                    ? t.none
                    : t.unclear}
              </span>
              <p>{result.reply_reason}</p>

              {result.reply_status === "required" && (
                <button
                  className="secondary-button"
                  onClick={makeReply}
                  disabled={replyLoading}
                >
                  {replyLoading ? t.making : t.make}
                </button>
              )}
            </ResultCard>

            {result.warning && (
              <div className="warning-box">⚠️ {result.warning}</div>
            )}

            {replyData && (
              <ResultCard title={`✉️ ${t.suggested}`}>
                <pre>{replyData.reply}</pre>
                <button className="secondary-button" onClick={copyReply}>
                  {copied ? t.copied : t.copy}
                </button>
                <div className="reply-divider" />
                <h3>🌐 {t.meaning}</h3>
                <div className="translation-box">{replyData.translation}</div>
              </ResultCard>
            )}

            <button className="reset-button" onClick={reset}>
              {t.again}
            </button>
          </section>
        )}

        <section className="pricing-section" id="pricing">
          <div className="pricing-heading">
            <span>NOWWHAT CREDITS</span>
            <h2>💎 {t.buyCredits}</h2>
            <p>{t.choosePlan}</p>
          </div>

          <div className="pricing-grid">
            <article className="price-card">
              <small>{t.starter}</small>
              <strong>10</strong>
              <span>{t.analyses}</span>
              <h3>$1.99</h3>
              <button
                onClick={() => buyCredits(10)}
                disabled={Boolean(purchaseLoading)}
              >
                {purchaseLoading === "10"
                  ? t.openingPayment
                  : t.buy}
              </button>
            </article>

            <article className="price-card featured">
              <div className="popular-badge">
                ⭐ {t.popular}
              </div>
              <small>Popular</small>
              <strong>30</strong>
              <span>{t.analyses}</span>
              <h3>$4.99</h3>
              <button
                onClick={() => buyCredits(30)}
                disabled={Boolean(purchaseLoading)}
              >
                {purchaseLoading === "30"
                  ? t.openingPayment
                  : t.buy}
              </button>
            </article>

            <article className="price-card">
              <small>{t.pro}</small>
              <strong>100</strong>
              <span>{t.analyses}</span>
              <h3>$9.99</h3>
              <button
                onClick={() => buyCredits(100)}
                disabled={Boolean(purchaseLoading)}
              >
                {purchaseLoading === "100"
                  ? t.openingPayment
                  : t.buy}
              </button>
            </article>
          </div>

          <p className="pricing-note">
            {lang === "ko"
              ? "분석 1회에 크레딧 1개가 사용되며 답장과 번역은 포함됩니다."
              : "One credit is used per analysis. Reply generation and translation are included."}
          </p>
        </section>

        <footer className="app-footer">{t.disclaimer}</footer>
      </div>
    </main>
  );
}
