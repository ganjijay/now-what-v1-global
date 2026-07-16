import { FieldValue } from "firebase-admin/firestore";
import { requireUser, userErrorResponse } from "../../../lib/userAuth";
import { getAdminDb } from "../../../lib/firebaseAdmin";
import { sendNowWhatEmail } from "../../../lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = new Set([
  "payment_credit",
  "refund",
  "account_login",
  "feature_other"
]);

function timestampToIso(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return null;
}

export async function GET(request) {
  try {
    const user = await requireUser(request);

    const snapshot = await getAdminDb()
      .collection("supportTickets")
      .where("uid", "==", user.uid)
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();

    const tickets = snapshot.docs.map((document) => {
      const data = document.data();

      return {
        id: document.id,
        type: data.type || "feature_other",
        subject: data.subject || "",
        message: data.message || "",
        status: data.status || "new",
        adminReply: data.adminReply || "",
        createdAt: timestampToIso(data.createdAt),
        updatedAt: timestampToIso(data.updatedAt),
        repliedAt: timestampToIso(data.repliedAt)
      };
    });

    return Response.json({ tickets });
  } catch (error) {
    return userErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireUser(request);
    const body = await request.json();

    const type = String(body?.type || "").trim();
    const subject = String(body?.subject || "").trim().slice(0, 120);
    const message = String(body?.message || "").trim().slice(0, 5000);

    if (!TYPES.has(type)) {
      return Response.json(
        { error: "문의 유형을 선택해 주세요." },
        { status: 400 }
      );
    }

    if (subject.length < 3) {
      return Response.json(
        { error: "제목을 3자 이상 입력해 주세요." },
        { status: 400 }
      );
    }

    if (message.length < 10) {
      return Response.json(
        { error: "문의 내용을 10자 이상 입력해 주세요." },
        { status: 400 }
      );
    }

    const ticketRef = getAdminDb()
      .collection("supportTickets")
      .doc();

    await ticketRef.set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      type,
      subject,
      message,
      status: "new",
      adminReply: "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      repliedAt: null
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://now-what-v1-global.vercel.app";

    try {
      await sendNowWhatEmail({
        to: process.env.SUPPORT_EMAIL,
        subject: `[NowWhat 문의] ${subject}`,
        title: "새 고객 문의가 접수되었습니다",
        intro: `${user.displayName || "사용자"} (${user.email}) 님의 문의입니다.`,
        body:
          `문의 유형: ${type}\n` +
          `제목: ${subject}\n\n` +
          message,
        actionLabel: "관리자에서 문의 확인",
        actionUrl: `${appUrl}/admin`
      });
    } catch (emailError) {
      console.error("SUPPORT_ADMIN_EMAIL_ERROR", emailError);
    }

    return Response.json({
      success: true,
      ticketId: ticketRef.id
    });
  } catch (error) {
    return userErrorResponse(error);
  }
}
