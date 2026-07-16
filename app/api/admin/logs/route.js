import {
  requireAdmin,
  adminErrorResponse
} from "../../../../lib/adminAuth";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const snapshot = await getAdminDb()
      .collection("adminActions")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const actions = snapshot.docs.map((document) => {
      const data = document.data();

      return {
        id: document.id,
        type: data.type || "unknown",
        adminEmail: data.adminEmail || "",
        targetUid: data.targetUid || "",
        paymentId: data.paymentId || "",
        ticketId: data.ticketId || "",
        delta:
          typeof data.delta === "number"
            ? data.delta
            : null,
        creditsRemoved:
          typeof data.creditsRemoved === "number"
            ? data.creditsRemoved
            : null,
        previousCredits:
          typeof data.previousCredits === "number"
            ? data.previousCredits
            : null,
        nextCredits:
          typeof data.nextCredits === "number"
            ? data.nextCredits
            : null,
        reason: data.reason || "",
        status: data.status || "",
        createdAt: timestampToIso(data.createdAt)
      };
    });

    return Response.json({ actions });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
