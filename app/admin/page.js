"use client";

import {
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { auth, googleProvider } from "../../lib/firebase";
import styles from "./admin.module.css";

function money(cents, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency || "usd").toUpperCase()
  }).format(Number(cents || 0) / 100);
}

function dateTime(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketFilter, setTicketFilter] = useState("all");
  const [answeringTicket, setAnsweringTicket] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [adjustingUid, setAdjustingUid] = useState("");
  const [statusChangingUid, setStatusChangingUid] = useState("");
  const [refundingPayment, setRefundingPayment] = useState("");
  const [adminActions, setAdminActions] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const adminEmail =
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

  const isExpectedAdmin = useMemo(() => {
    if (!user?.email || !adminEmail) return false;

    return (
      user.email.trim().toLowerCase() ===
      adminEmail.trim().toLowerCase()
    );
  }, [user, adminEmail]);

  async function authorizedFetch(url, options = {}) {
    if (!auth.currentUser) {
      throw new Error("Google 로그인이 필요합니다.");
    }

    const token = await auth.currentUser.getIdToken();

    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });
  }

  const loadOverview = useCallback(async () => {
    const response = await authorizedFetch(
      "/api/admin/overview"
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "대시보드를 불러오지 못했습니다.");
    }

    setOverview(data);
  }, []);

  const loadUsers = useCallback(async (search = "") => {
    const response = await authorizedFetch(
      `/api/admin/users?q=${encodeURIComponent(search)}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "사용자를 불러오지 못했습니다.");
    }

    setUsers(data.users || []);
  }, []);


  const loadAdminActions = useCallback(async () => {
    const response = await authorizedFetch("/api/admin/logs");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "관리자 로그를 불러오지 못했습니다.");
    }

    setAdminActions(data.actions || []);
  }, []);


  const loadTickets = useCallback(async (status = "all") => {
    const response = await authorizedFetch(
      `/api/admin/support?status=${encodeURIComponent(status)}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "문의를 불러오지 못했습니다.");
    }

    setTickets(data.tickets || []);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        loadOverview(),
        loadUsers(query),
        loadTickets(ticketFilter),
        loadAdminActions()
      ]);
    } catch (refreshError) {
      console.error(refreshError);
      setError(refreshError.message);
    } finally {
      setLoading(false);
    }
  }, [loadOverview, loadUsers, loadTickets, loadAdminActions, query, ticketFilter]);

  useEffect(() => {
    const stop = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });

    return stop;
  }, []);

  useEffect(() => {
    if (authReady && user) {
      refresh();
    }
  }, [authReady, user, refresh]);

  async function login() {
    setError("");
    await signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    await signOut(auth);
    setOverview(null);
    setUsers([]);
  }

  async function searchUsers(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await loadUsers(query);
    } catch (searchError) {
      setError(searchError.message);
    } finally {
      setLoading(false);
    }
  }

  async function adjustCredits(uid, delta) {
    const reason =
      window.prompt(
        `${delta > 0 ? "+" : ""}${delta} 크레딧 변경 사유를 입력하세요.`,
        delta > 0
          ? "Customer support credit"
          : "Refund or correction"
      ) || "";

    if (!reason.trim()) return;

    setAdjustingUid(uid);
    setError("");
    setMessage("");

    try {
      const response = await authorizedFetch(
        "/api/admin/credits",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            uid,
            delta,
            reason
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "크레딧 변경에 실패했습니다."
        );
      }

      setMessage(
        `완료: ${delta > 0 ? "+" : ""}${delta} 크레딧, 현재 ${data.credits}`
      );

      await Promise.all([
        loadUsers(query),
        loadOverview()
      ]);
    } catch (adjustError) {
      setError(adjustError.message);
    } finally {
      setAdjustingUid("");
    }
  }




  async function refundPayment(payment) {
    if (payment.refunded || payment.refundStatus === "succeeded") {
      setError("이미 환불된 결제입니다.");
      return;
    }

    const reason =
      window.prompt(
        "전액 환불 사유를 입력하세요.",
        "Customer requested refund"
      ) || "";

    if (!reason.trim()) return;

    const confirmed = window.confirm(
      `${payment.customerEmail || payment.firebaseUid}\n` +
        `${money(payment.amountTotal, payment.currency)} / ${payment.credits} Credits\n\n` +
        "Stripe 전액 환불과 크레딧 회수를 진행할까요?"
    );

    if (!confirmed) return;

    setRefundingPayment(payment.id);
    setError("");
    setMessage("");

    try {
      const response = await authorizedFetch(
        "/api/admin/refund",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            paymentId: payment.id,
            reason
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "환불 처리에 실패했습니다."
        );
      }

      setMessage(
        `환불 완료: ${money(data.amount, data.currency)}, ` +
          `${data.creditsRemoved} 크레딧 회수`
      );

      await Promise.all([
        loadOverview(),
        loadUsers(query)
      ]);
    } catch (refundError) {
      setError(refundError.message);
    } finally {
      setRefundingPayment("");
    }
  }

  async function changeAccountStatus(account) {
    const nextDisabled = !account.disabled;

    const reason =
      window.prompt(
        nextDisabled
          ? "계정 정지 사유를 입력하세요."
          : "계정 정지 해제 사유를 입력하세요.",
        nextDisabled
          ? "Terms or abuse review"
          : "Account restored by support"
      ) || "";

    if (!reason.trim()) return;

    const confirmed = window.confirm(
      nextDisabled
        ? `${account.email || account.uid} 계정을 정지할까요?`
        : `${account.email || account.uid} 계정 정지를 해제할까요?`
    );

    if (!confirmed) return;

    setStatusChangingUid(account.uid);
    setError("");
    setMessage("");

    try {
      const response = await authorizedFetch(
        "/api/admin/users",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            uid: account.uid,
            disabled: nextDisabled,
            reason
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "계정 상태 변경에 실패했습니다."
        );
      }

      setMessage(
        nextDisabled
          ? "사용자 계정이 정지되었습니다."
          : "사용자 계정 정지가 해제되었습니다."
      );

      await loadUsers(query);
    } catch (statusError) {
      setError(statusError.message);
    } finally {
      setStatusChangingUid("");
    }
  }

  async function updateTicket(ticket, nextStatus) {
    let reply = ticket.adminReply || "";

    if (nextStatus === "answered") {
      reply =
        window.prompt(
          "고객에게 보낼 답변을 입력하세요.",
          reply ||
            "안녕하세요. NowWhat 고객지원입니다.\n\n문의하신 내용을 확인했습니다."
        ) || "";

      if (!reply.trim()) return;
    }

    setAnsweringTicket(ticket.id);
    setError("");
    setMessage("");

    try {
      const response = await authorizedFetch(
        "/api/admin/support",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ticketId: ticket.id,
            status: nextStatus,
            adminReply: reply
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "문의 업데이트에 실패했습니다.");
      }

      setMessage("문의 상태와 답변이 저장되었습니다.");
      await loadTickets(ticketFilter);
    } catch (ticketError) {
      setError(ticketError.message);
    } finally {
      setAnsweringTicket("");
    }
  }

  if (!authReady) {
    return (
      <main className={styles.center}>
        <div className={styles.loader}>NowWhat Admin</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.loginPage}>
        <section className={styles.loginCard}>
          <div className={styles.logo}>💬</div>
          <p className={styles.eyebrow}>NOWWHAT OPERATIONS</p>
          <h1>관리자 로그인</h1>
          <p>
            등록된 관리자 Google 계정으로만 접근할 수 있습니다.
          </p>
          <button onClick={login}>
            G&nbsp;&nbsp;Google로 관리자 로그인
          </button>
          {error && <div className={styles.error}>{error}</div>}
        </section>
      </main>
    );
  }

  if (!isExpectedAdmin) {
    return (
      <main className={styles.loginPage}>
        <section className={styles.loginCard}>
          <div className={styles.logo}>🔒</div>
          <h1>접근할 수 없습니다</h1>
          <p>
            현재 로그인: <b>{user.email}</b>
          </p>
          <button onClick={logout}>다른 계정으로 로그인</button>
        </section>
      </main>
    );
  }

  const metrics = overview?.metrics || {};
  const payments = overview?.recentPayments || [];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>NOWWHAT OPERATIONS</p>
          <h1>관리자 대시보드</h1>
          <p>사용자·크레딧·결제를 한곳에서 관리합니다.</p>
        </div>

        <div className={styles.headerActions}>
          <span>{user.email}</span>
          <a href="/" target="_blank" rel="noreferrer">
            앱 열기
          </a>
          <button onClick={refresh} disabled={loading}>
            {loading ? "새로고침 중..." : "새로고침"}
          </button>
          <button className={styles.ghost} onClick={logout}>
            로그아웃
          </button>
        </div>
      </header>

      {message && <div className={styles.success}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.metrics}>
        <article>
          <span>총 사용자</span>
          <strong>{metrics.totalUsers ?? "-"}</strong>
          <small>오늘 +{metrics.todayUsers ?? 0}</small>
        </article>
        <article>
          <span>최근 결제 매출</span>
          <strong>
            {money(metrics.totalRevenueCents, "usd")}
          </strong>
          <small>{metrics.totalPayments ?? 0}건 기준</small>
        </article>
        <article>
          <span>판매 크레딧</span>
          <strong>{metrics.totalCreditsSold ?? 0}</strong>
          <small>최근 결제 기준</small>
        </article>
        <article>
          <span>사용자 보유 크레딧</span>
          <strong>{metrics.totalCreditsInAccounts ?? 0}</strong>
          <small>전체 사용자 합계</small>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.eyebrow}>USER MANAGEMENT</p>
            <h2>사용자 및 크레딧 관리</h2>
          </div>

          <form onSubmit={searchUsers}>
            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="이름, 이메일 또는 UID 검색"
            />
            <button type="submit">검색</button>
          </form>
        </div>

        <div className={styles.userList}>
          {users.length === 0 && (
            <p className={styles.empty}>검색된 사용자가 없습니다.</p>
          )}

          {users.map((account) => (
            <article
              className={`${styles.userCard} ${
                account.disabled ? styles.disabledUser : ""
              }`}
              key={account.uid}
            >
              <div className={styles.userIdentity}>
                <div className={styles.avatar}>
                  {account.photoURL ? (
                    <img src={account.photoURL} alt="" />
                  ) : (
                    "👤"
                  )}
                </div>

                <div className={styles.userMainInfo}>
                  <div className={styles.userNameRow}>
                    <strong>
                      {account.displayName || "이름 없음"}
                    </strong>

                    <span
                      className={
                        account.disabled
                          ? styles.accountDisabled
                          : styles.accountActive
                      }
                    >
                      {account.disabled ? "정지됨" : "정상"}
                    </span>

                    {account.firstPurchaseCompleted && (
                      <span className={styles.paidUser}>
                        유료 사용자
                      </span>
                    )}
                  </div>

                  <span>{account.email || account.uid}</span>

                  <div className={styles.userMeta}>
                    <small>
                      가입{" "}
                      {dateTime(
                        account.authCreatedAt ||
                          account.createdAt
                      )}
                    </small>
                    <small>
                      최근 로그인{" "}
                      {dateTime(account.lastSignInAt)}
                    </small>
                    <small>
                      로그인 방식{" "}
                      {account.providerIds?.join(", ") ||
                        "확인 불가"}
                    </small>
                  </div>
                </div>
              </div>

              <div className={styles.creditBalance}>
                <span>현재 크레딧</span>
                <strong>{account.credits}</strong>
              </div>

              <div className={styles.userActions}>
                <div className={styles.creditButtons}>
                  {[10, 30, 100, -10].map((delta) => (
                    <button
                      key={delta}
                      disabled={
                        adjustingUid === account.uid ||
                        account.disabled
                      }
                      className={
                        delta < 0 ? styles.minus : ""
                      }
                      onClick={() =>
                        adjustCredits(account.uid, delta)
                      }
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>

                <button
                  className={
                    account.disabled
                      ? styles.enableButton
                      : styles.disableButton
                  }
                  disabled={
                    statusChangingUid === account.uid
                  }
                  onClick={() =>
                    changeAccountStatus(account)
                  }
                >
                  {statusChangingUid === account.uid
                    ? "처리 중..."
                    : account.disabled
                      ? "정지 해제"
                      : "계정 정지"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.eyebrow}>CUSTOMER SUPPORT</p>
            <h2>고객 문의</h2>
          </div>

          <select
            className={styles.ticketFilter}
            value={ticketFilter}
            onChange={async (event) => {
              const value = event.target.value;
              setTicketFilter(value);
              await loadTickets(value);
            }}
          >
            <option value="all">전체 문의</option>
            <option value="new">새 문의</option>
            <option value="in_progress">처리 중</option>
            <option value="answered">답변 완료</option>
            <option value="closed">종료</option>
          </select>
        </div>

        <div className={styles.supportList}>
          {tickets.length === 0 && (
            <p className={styles.empty}>해당 상태의 문의가 없습니다.</p>
          )}

          {tickets.map((ticket) => (
            <article key={ticket.id} className={styles.supportCard}>
              <div className={styles.supportTop}>
                <span className={`${styles.ticketStatus} ${styles[ticket.status]}`}>
                  {ticket.status === "new"
                    ? "새 문의"
                    : ticket.status === "in_progress"
                      ? "처리 중"
                      : ticket.status === "answered"
                        ? "답변 완료"
                        : "종료"}
                </span>
                <small>{dateTime(ticket.createdAt)}</small>
              </div>

              <p className={styles.supportEmail}>
                {ticket.displayName || "이름 없음"} · {ticket.email}
              </p>
              <h3>{ticket.subject}</h3>
              <div className={styles.supportMessage}>{ticket.message}</div>

              {ticket.adminReply && (
                <div className={styles.adminReply}>
                  <b>관리자 답변</b>
                  <p>{ticket.adminReply}</p>
                </div>
              )}

              <div className={styles.supportActions}>
                <button
                  disabled={answeringTicket === ticket.id}
                  onClick={() => updateTicket(ticket, "in_progress")}
                >
                  처리 중
                </button>
                <button
                  disabled={answeringTicket === ticket.id}
                  className={styles.answerButton}
                  onClick={() => updateTicket(ticket, "answered")}
                >
                  답변 작성
                </button>
                <button
                  disabled={answeringTicket === ticket.id}
                  className={styles.closeButton}
                  onClick={() => updateTicket(ticket, "closed")}
                >
                  종료
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.eyebrow}>PAYMENTS</p>
            <h2>최근 결제</h2>
          </div>

          <a
            className={styles.stripeLink}
            href="https://dashboard.stripe.com/payments"
            target="_blank"
            rel="noreferrer"
          >
            Stripe에서 환불·상세보기 ↗
          </a>
        </div>

        <div className={styles.paymentList}>
          {payments.length === 0 && (
            <p className={styles.empty}>결제 내역이 없습니다.</p>
          )}

          {payments.map((payment) => {
            const isRefunded =
              payment.refunded ||
              payment.refundStatus === "succeeded";

            return (
              <article
                key={payment.id}
                className={
                  isRefunded ? styles.refundedPayment : ""
                }
              >
                <div>
                  <strong>
                    {payment.customerEmail ||
                      payment.firebaseUid}
                  </strong>
                  <span>{dateTime(payment.processedAt)}</span>
                  {payment.refundedAt && (
                    <span>
                      환불 {dateTime(payment.refundedAt)}
                    </span>
                  )}
                </div>

                <div>
                  <b>
                    {isRefunded ? "-" : "+"}
                    {payment.credits} credits
                  </b>
                  <strong>
                    {money(
                      payment.amountTotal,
                      payment.currency
                    )}
                  </strong>
                </div>

                <span
                  className={
                    isRefunded
                      ? styles.refundedBadge
                      : styles.paid
                  }
                >
                  {isRefunded
                    ? "Refunded"
                    : payment.refundStatus === "processing"
                      ? "Refunding"
                      : payment.paymentStatus || "paid"}
                </span>

                <div className={styles.paymentActions}>
                  {payment.stripePaymentIntent ? (
                    <a
                      href={`https://dashboard.stripe.com/payments/${payment.stripePaymentIntent}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Stripe ↗
                    </a>
                  ) : (
                    <span>-</span>
                  )}

                  <button
                    className={styles.refundButton}
                    disabled={
                      isRefunded ||
                      refundingPayment === payment.id
                    }
                    onClick={() =>
                      refundPayment(payment)
                    }
                  >
                    {isRefunded
                      ? "환불 완료"
                      : refundingPayment === payment.id
                        ? "환불 중..."
                        : "전액 환불"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.eyebrow}>AUDIT LOG</p>
            <h2>최근 관리자 작업</h2>
          </div>
        </div>

        <div className={styles.auditList}>
          {adminActions.length === 0 && (
            <p className={styles.empty}>관리자 작업 기록이 없습니다.</p>
          )}

          {adminActions.map((action) => (
            <article key={action.id}>
              <div>
                <strong>
                  {action.type === "credit_adjustment"
                    ? "크레딧 변경"
                    : action.type === "payment_refund"
                      ? "결제 환불"
                      : action.type === "user_disabled"
                        ? "계정 정지"
                        : action.type === "user_enabled"
                          ? "계정 정지 해제"
                          : action.type === "support_ticket_update"
                            ? "문의 업데이트"
                            : action.type}
                </strong>
                <span>{dateTime(action.createdAt)}</span>
              </div>

              <div>
                <span>관리자</span>
                <b>{action.adminEmail || "-"}</b>
              </div>

              <div>
                <span>대상</span>
                <b>
                  {action.targetUid ||
                    action.paymentId ||
                    action.ticketId ||
                    "-"}
                </b>
              </div>

              <div>
                <span>변경</span>
                <b>
                  {action.delta !== null
                    ? `${action.delta > 0 ? "+" : ""}${action.delta}`
                    : action.creditsRemoved !== null
                      ? `-${action.creditsRemoved} credits`
                      : action.status || "-"}
                </b>
              </div>

              <div className={styles.auditReason}>
                {action.reason || "사유 기록 없음"}
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        크레딧 변경 내역은 Firestore의
        <code> adminActions </code>
        컬렉션에 자동 기록됩니다.
      </footer>
    </main>
  );
}
