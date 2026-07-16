import Stripe from "stripe";
import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAdminDatabase() {
  if (!process.env.FIREBASE_ADMIN_BASE64) {
    throw new Error("FIREBASE_ADMIN_BASE64 is missing.");
  }

  if (!getApps().length) {
    const serviceAccountJson = Buffer.from(
      process.env.FIREBASE_ADMIN_BASE64,
      "base64"
    ).toString("utf8");

    const serviceAccount = JSON.parse(serviceAccountJson);

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return getFirestore();
}

export async function POST(request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
      console.error("Stripe environment variables are missing.");

      return new Response(
        "Server configuration is incomplete.",
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    // Stripe 서명 검증에는 수정되지 않은 원본 요청 내용이 필요합니다.
    const rawBody = await request.text();
    const signature = request.headers.get(
      "stripe-signature"
    );

    if (!signature) {
      return new Response("Missing Stripe signature.", {
        status: 400,
      });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (error) {
      console.error(
        "Webhook signature verification failed:",
        error.message
      );

      return new Response("Invalid Stripe signature.", {
        status: 400,
      });
    }

    if (event.type !== "checkout.session.completed") {
      return Response.json({ received: true });
    }

    const session = event.data.object;

    // 실제 결제 완료 상태에서만 크레딧을 지급합니다.
    if (session.payment_status !== "paid") {
      console.log(
        "Checkout completed but payment is not paid:",
        session.id
      );

      return Response.json({
        received: true,
        credited: false,
      });
    }

    const uid =
      session.metadata?.firebaseUid ||
      session.client_reference_id;

    const credits = Number(session.metadata?.credits);

    if (!uid) {
      console.error(
        "Firebase UID is missing from Stripe session:",
        session.id
      );

      return new Response("Missing Firebase UID.", {
        status: 400,
      });
    }

    if (![10, 30, 100].includes(credits)) {
      console.error(
        "Invalid credit amount:",
        credits,
        session.id
      );

      return new Response("Invalid credit amount.", {
        status: 400,
      });
    }

    const db = getAdminDatabase();
    const userRef = db.collection("users").doc(uid);

    // Stripe가 같은 이벤트를 여러 번 보내도 한 번만 지급되도록
    // Checkout Session ID를 결제 기록 문서 ID로 사용합니다.
    const paymentRef = db
      .collection("payments")
      .doc(session.id);

    await db.runTransaction(async (transaction) => {
      const paymentSnapshot =
        await transaction.get(paymentRef);

      if (paymentSnapshot.exists) {
        console.log(
          "Credits already granted for session:",
          session.id
        );
        return;
      }

      const userSnapshot =
        await transaction.get(userRef);

      if (!userSnapshot.exists) {
        throw new Error(
          `Firebase user was not found: ${uid}`
        );
      }

      transaction.update(userRef, {
        credits: FieldValue.increment(credits),
        updatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(paymentRef, {
        stripeSessionId: session.id,
        stripePaymentIntent:
          session.payment_intent || null,
        firebaseUid: uid,
        credits,
        amountTotal: session.amount_total || 0,
        currency: session.currency || "usd",
        customerEmail:
          session.customer_details?.email ||
          session.customer_email ||
          "",
        paymentStatus: session.payment_status,
        processedAt: FieldValue.serverTimestamp(),
      });
    });

    console.log(
      `Granted ${credits} credits to ${uid}.`
    );

    return Response.json({
      received: true,
      credited: true,
      credits,
    });
  } catch (error) {
    console.error("WEBHOOK_ERROR:", error);

    // 처리 실패 시 Stripe가 다시 전달할 수 있도록 500을 반환합니다.
    return new Response("Webhook processing failed.", {
      status: 500,
    });
  }
}