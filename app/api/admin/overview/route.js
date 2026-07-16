import { requireAdmin, adminErrorResponse } from "../../../../lib/adminAuth";
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

    const db = getAdminDb();

    const [usersSnapshot, paymentsSnapshot] = await Promise.all([
      db.collection("users").get(),
      db
        .collection("payments")
        .orderBy("processedAt", "desc")
        .limit(20)
        .get()
    ]);

    let totalCreditsInAccounts = 0;
    let todayUsers = 0;
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    usersSnapshot.forEach((document) => {
      const data = document.data();
      totalCreditsInAccounts += Number(data.credits || 0);

      const createdAt = data.createdAt?.toDate?.();
      if (createdAt && createdAt >= todayStart) {
        todayUsers += 1;
      }
    });

    let totalRevenueCents = 0;
    let totalCreditsSold = 0;

    const recentPayments = paymentsSnapshot.docs.map((document) => {
      const data = document.data();
      totalRevenueCents += Number(data.amountTotal || 0);
      totalCreditsSold += Number(data.credits || 0);

      return {
        id: document.id,
        firebaseUid: data.firebaseUid || "",
        customerEmail: data.customerEmail || "",
        credits: Number(data.credits || 0),
        amountTotal: Number(data.amountTotal || 0),
        currency: data.currency || "usd",
        paymentStatus: data.paymentStatus || "",
        stripePaymentIntent: data.stripePaymentIntent || "",
        refunded: Boolean(data.refunded),
        refundStatus: data.refundStatus || "",
        refundId: data.refundId || "",
        refundAmount: Number(data.refundAmount || 0),
        refundedCredits: Number(data.refundedCredits || 0),
        refundedAt: timestampToIso(data.refundedAt),
        processedAt: timestampToIso(data.processedAt)
      };
    });

    return Response.json({
      metrics: {
        totalUsers: usersSnapshot.size,
        todayUsers,
        totalPayments: paymentsSnapshot.size,
        totalRevenueCents,
        totalCreditsSold,
        totalCreditsInAccounts
      },
      recentPayments
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
