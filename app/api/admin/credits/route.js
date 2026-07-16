import {
  FieldValue
} from "firebase-admin/firestore";
import { requireAdmin, adminErrorResponse } from "../../../../lib/adminAuth";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_DELTAS = new Set([-100, -30, -10, -1, 1, 10, 30, 100]);

export async function POST(request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    const uid = String(body?.uid || "").trim();
    const delta = Number(body?.delta);
    const reason = String(body?.reason || "Manual admin adjustment")
      .trim()
      .slice(0, 300);

    if (!uid) {
      return Response.json(
        { error: "사용자 UID가 없습니다." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(delta) || !ALLOWED_DELTAS.has(delta)) {
      return Response.json(
        { error: "허용되지 않은 크레딧 변경값입니다." },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    const actionRef = db.collection("adminActions").doc();

    let nextCredits = 0;

    await db.runTransaction(async (transaction) => {
      const userSnapshot = await transaction.get(userRef);

      if (!userSnapshot.exists) {
        throw new Error("사용자를 찾을 수 없습니다.");
      }

      const currentCredits = Number(
        userSnapshot.data()?.credits || 0
      );
      nextCredits = currentCredits + delta;

      if (nextCredits < 0) {
        const error = new Error(
          "사용자의 크레딧을 0보다 작게 만들 수 없습니다."
        );
        error.status = 400;
        throw error;
      }

      transaction.update(userRef, {
        credits: nextCredits,
        updatedAt: FieldValue.serverTimestamp()
      });

      transaction.set(actionRef, {
        type: "credit_adjustment",
        targetUid: uid,
        delta,
        previousCredits: currentCredits,
        nextCredits,
        reason,
        adminUid: admin.uid,
        adminEmail: admin.email,
        createdAt: FieldValue.serverTimestamp()
      });
    });

    return Response.json({
      success: true,
      uid,
      delta,
      credits: nextCredits
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
