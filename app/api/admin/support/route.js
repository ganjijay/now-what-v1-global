import { FieldValue } from "firebase-admin/firestore";
import {
  requireAdmin,
  adminErrorResponse
} from "../../../../lib/adminAuth";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { sendNowWhatEmail } from "../../../../lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["new", "in_progress", "answered", "closed"]);

function timestampToIso(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return null;
}

export async function GET(request) {
  try {
    await requireAdmin(request);

    const url = new URL(request.url);
    const status = String(url.searchParams.get("status") || "all");

    let query = getAdminDb()
      .collection("supportTickets")
      .orderBy("createdAt", "desc")
      .limit(100);

    const snapshot = await query.get();

    const tickets = snapshot.docs
      .map((document) => {
        const data = document.data();

        return {
          id: document.id,
          uid: data.uid || "",
          email: data.email || "",
          displayName: data.displayName || "",
          type: data.type || "feature_other",
          subject: data.subject || "",
          message: data.message || "",
          status: data.status || "new",
          adminReply: data.adminReply || "",
          createdAt: timestampToIso(data.createdAt),
          updatedAt: timestampToIso(data.updatedAt),
          repliedAt: timestampToIso(data.repliedAt),
          answeredBy: data.answeredBy || ""
        };
      })
      .filter((ticket) =>
        status === "all" ? true : ticket.status === status
      );

    return Response.json({ tickets });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    const ticketId = String(body?.ticketId || "").trim();
    const status = String(body?.status || "").trim();
    const adminReply = String(body?.adminReply || "")
      .trim()
      .slice(0, 5000);

    if (!ticketId) {
      return Response.json(
        { error: "문의 ID가 없습니다." },
        { status: 400 }
      );
    }

    if (!STATUSES.has(status)) {
      return Response.json(
        { error: "잘못된 문의 상태입니다." },
        { status: 400 }
      );
    }

    if (status === "answered" && adminReply.length < 2) {
      return Response.json(
        { error: "답변을 입력해 주세요." },
        { status: 400 }
      );
    }

    const ticketRef = getAdminDb()
      .collection("supportTickets")
      .doc(ticketId);

    const snapshot = await ticketRef.get();

    if (!snapshot.exists) {
      return Response.json(
        { error: "문의를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const update = {
      status,
      updatedAt: FieldValue.serverTimestamp(),
      answeredBy: admin.email
    };

    if (adminReply) {
      update.adminReply = adminReply;
    }

    if (status === "answered") {
      update.repliedAt = FieldValue.serverTimestamp();
    }

    await ticketRef.update(update);

    if (status === "answered" && adminReply) {
      const ticket = snapshot.data();
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://now-what-v1-global.vercel.app";

      if (ticket?.email) {
        try {
          await sendNowWhatEmail({
            to: ticket.email,
            subject: `[NowWhat 답변] ${ticket.subject || "문의 답변"}`,
            title: "문의하신 내용에 답변이 도착했습니다",
            intro: "NowWhat 고객지원에서 답변을 등록했습니다.",
            body: adminReply,
            actionLabel: "내 문의 확인",
            actionUrl: `${appUrl}/support`
          });
        } catch (emailError) {
          console.error("SUPPORT_USER_EMAIL_ERROR", emailError);
        }
      }
    }

    await getAdminDb().collection("adminActions").add({
      type: "support_ticket_update",
      ticketId,
      targetUid: snapshot.data()?.uid || "",
      status,
      adminReply,
      adminUid: admin.uid,
      adminEmail: admin.email,
      createdAt: FieldValue.serverTimestamp()
    });

    return Response.json({ success: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
