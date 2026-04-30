import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key (which MUST be in your .env file)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16", // Use the latest stable API version
});

export async function POST(request: Request) {
  try {
    // 1. Check if the secret key is actually configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("FATAL: STRIPE_SECRET_KEY is missing from environment variables.");
      return NextResponse.json(
        { error: "Internal Server Configuration Error" },
        { status: 500 }
      );
    }

    // 2. Parse the incoming request securely
    const body = await request.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Missing required fields (email or name)." },
        { status: 400 }
      );
    }

    // 3. Create the PaymentIntent
    // Stripe requires the amount to be in the smallest currency unit (cents).
    // $47.77 = 4777 cents.
    const amountInCents = 4777;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      // Automatic payment methods enable Apple Pay, Google Pay, and standard cards automatically based on the user's browser
      automatic_payment_methods: {
        enabled: true,
      },
      // Adding metadata is crucial for tracking orders in your Stripe Dashboard later
      receipt_email: email, // Stripe will auto-send a basic receipt to this email
      metadata: {
        customer_name: name,
        customer_email: email,
        product: "Understand Men Ebook",
        product_type: "Digital Download"
      },
    });

    // 4. Return the client secret to the frontend
    // This is the "key" the frontend uses to securely complete the transaction without touching your backend again
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error: any) {
    // 5. Bulletproof error catching
    console.error("Stripe PaymentIntent Creation Failed:", error);
    
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during checkout setup." },
      { status: 500 }
    );
  }
}