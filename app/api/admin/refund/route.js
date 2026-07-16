import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import {
  requireAdmin,
  adminErrorResponse
} from "../../../../lib/adminAuth";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    const paymentId = String(body?.paymentId || "").trim();
    const reason = String(
      body?.reason || "Customer requested refund"
    )
      .trim()
      .slice(0, 300);

    if (!paymentId) {
      return Response.json(
        { error: "결제 ID가 없습니다." },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json(
        { error: "STRIPE_SECRET_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const db = getAdminDb();
    const paymentRef = db.collection("payments").doc(paymentId);
    const paymentSnapshot = await paymentRef.get();

    if (!paymentSnapshot.exists) {
      return Response.json(
        { error: "결제 기록을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const payment = paymentSnapshot.data();
    const uid = String(payment.firebaseUid || "");
    const credits = Number(payment.credits || 0);
    const paymentIntent = String(
      payment.stripePaymentIntent || ""
    );

    if (!uid || !paymentIntent || credits < 1) {
      return Response.json(
        { error: "환불에 필요한 결제 정보가 부족합니다." },
        { status: 400 }
      );
    }

    if (
      payment.refundStatus === "succeeded" ||
      payment.refunded === true
    ) {
      return Response.json(
        { error: "이미 환불된 결제입니다." },
        { status: 409 }
      );
    }

    const userRef = db.collection("users").doc(uid);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      return Response.json(
        { error: "결제 사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const currentCredits = Number(
      userSnapshot.data()?.credits || 0
    );

    // 구매한 크레딧을 이미 사용했다면 자동 환불을 막습니다.
    // 운영자는 Stripe Dashboard에서 예외 환불 후 크레딧을 수동 조정할 수 있습니다.
    if (currentCredits < credits) {
      return Response.json(
        {
          error:
            `자동 환불 불가: 구매 크레딧 ${credits}개 중 일부가 이미 사용되었습니다. ` +
            `현재 잔액은 ${currentCredits}개입니다. Stripe에서 직접 환불 여부를 결정한 뒤 ` +
            `관리자 크레딧 버튼으로 조정해 주세요.`,
          code: "INSUFFICIENT_CREDITS",
          currentCredits,
          purchasedCredits: credits
        },
        { status: 409 }
      );
    }

    // 환불 요청 상태를 먼저 기록합니다.
    await paymentRef.set(
      {
        refundStatus: "processing",
        refundRequestedAt: FieldValue.serverTimestamp(),
        refundRequestedBy: admin.email,
        refundReason: reason,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // 같은 결제에 대해 재시도되어도 Stripe에서 중복 환불되지 않도록
    // 고정된 idempotency key를 사용합니다.
    const refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntent,
        reason: "requested_by_customer",
        metadata: {
          nowwhatPaymentId: paymentId,
          firebaseUid: uid,
          credits: String(credits),
          adminEmail: admin.email,
          internalReason: reason
        }
      },
      {
        idempotencyKey: `nowwhat-full-refund-${paymentId}`
      }
    );

    let nextCredits = 0;

    await db.runTransaction(async (transaction) => {
      const [freshPayment, freshUser] = await Promise.all([
        transaction.get(paymentRef),
        transaction.get(userRef)
      ]);

      if (!freshPayment.exists || !freshUser.exists) {
        throw new Error(
          "환불 후 내부 기록을 업데이트하지 못했습니다."
        );
      }

      const freshPaymentData = freshPayment.data();

      if (
        freshPaymentData.refundStatus === "succeeded" ||
        freshPaymentData.refunded === true
      ) {
        nextCredits = Number(
          freshUser.data()?.credits || 0
        );
        return;
      }

      const freshCredits = Number(
        freshUser.data()?.credits || 0
      );

      if (freshCredits < credits) {
        throw new Error(
          "Stripe 환불은 생성되었지만 크레딧 잔액이 변경되어 자동 회수하지 못했습니다. 관리자 로그를 확인하세요."
        );
      }

      nextCredits = freshCredits - credits;

      transaction.update(userRef, {
        credits: nextCredits,
        updatedAt: FieldValue.serverTimestamp()
      });

      transaction.set(
        paymentRef,
        {
          refunded: true,
          refundStatus: refund.status || "succeeded",
          refundId: refund.id,
          refundAmount: Number(refund.amount || 0),
          refundedCredits: credits,
          refundedAt: FieldValue.serverTimestamp(),
          refundedBy: admin.email,
          updatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      const actionRef = db.collection("adminActions").doc();

      transaction.set(actionRef, {
        type: "payment_refund",
        paymentId,
        stripeRefundId: refund.id,
        stripePaymentIntent: paymentIntent,
        targetUid: uid,
        amount: Number(refund.amount || 0),
        currency: payment.currency || "usd",
        creditsRemoved: credits,
        previousCredits: freshCredits,
        nextCredits,
        reason,
        adminUid: admin.uid,
        adminEmail: admin.email,
        createdAt: FieldValue.serverTimestamp()
      });
    });

    return Response.json({
      success: true,
      paymentId,
      refundId: refund.id,
      refundStatus: refund.status,
      creditsRemoved: credits,
      credits: nextCredits,
      amount: Number(refund.amount || 0),
      currency: payment.currency || "usd"
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
