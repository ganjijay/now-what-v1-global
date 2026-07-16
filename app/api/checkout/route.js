import Stripe from "stripe";

export const runtime = "nodejs";

const PLANS = {
  "10": {
    credits: 10,
    priceId: process.env.STRIPE_PRICE_10
  },
  "30": {
    credits: 30,
    priceId: process.env.STRIPE_PRICE_30
  },
  "100": {
    credits: 100,
    priceId: process.env.STRIPE_PRICE_100
  }
};

export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json(
        { error: "STRIPE_SECRET_KEY is not configured." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = await request.json();

    const planKey = String(body?.plan || "");
    const uid = String(body?.uid || "").trim();
    const email = String(body?.email || "").trim();

    const plan = PLANS[planKey];

    if (!plan || !plan.priceId) {
      return Response.json(
        { error: "Invalid or unconfigured credit plan." },
        { status: 400 }
      );
    }

    if (!uid) {
      return Response.json(
        { error: "Google sign-in is required." },
        { status: 401 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: plan.priceId,
          quantity: 1
        }
      ],
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
      customer_email: email || undefined,
      client_reference_id: uid,
      metadata: {
        firebaseUid: uid,
        credits: String(plan.credits),
        plan: planKey
      },
      payment_intent_data: {
        metadata: {
          firebaseUid: uid,
          credits: String(plan.credits),
          plan: planKey
        }
      },
      allow_promotion_codes: true
    });

    return Response.json({
      url: session.url
    });
  } catch (error) {
    console.error("CHECKOUT_ERROR", error);

    return Response.json(
      {
        error:
          "We could not open the payment page right now."
      },
      {
        status: 500
      }
    );
  }
}
