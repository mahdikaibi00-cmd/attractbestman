import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-04-22.dahlia" as any, 
});

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("FATAL: STRIPE_SECRET_KEY is missing.");
      return NextResponse.json(
        { error: "Server Configuration Error" },
        { status: 500 }
      );
    }

    const body = await request.json();
    
    // 🔥 GOD LEVEL: Extracting the UTMs passed from our highly-tuned frontend
    const { 
      email, 
      name, 
      utm_source = "direct", 
      utm_campaign = "none", 
      utm_content = "none" 
    } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Missing required fields (email or name)." },
        { status: 400 }
      );
    }

    const amountInCents = 4777; // $47.77

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: email, 
      metadata: {
        customer_name: name,
        customer_email: email,
        product: "The Pattern You Never Saw",
        product_type: "Digital PDF",
        
        // 🔥 STRIPE DASHBOARD GOD-VIEW
        // This permanently brands the transaction with the exact ad that generated it.
        // The .substring(0, 500) protects against Stripe crashing from malformed/overly long URLs.
        utm_source: String(utm_source).substring(0, 500),
        utm_campaign: String(utm_campaign).substring(0, 500),
        utm_content: String(utm_content).substring(0, 500),
        
        // Timestamp for forensic tracking
        intent_created_at: new Date().toISOString()
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error: any) {
    console.error("Stripe PaymentIntent Creation Failed:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during checkout setup." },
      { status: 500 }
    );
  }
}