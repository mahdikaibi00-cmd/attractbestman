import { NextResponse } from "next/server";
import { Resend } from "resend";
import Stripe from "stripe";

// Initialize external services
const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentIntentId, email, name } = body;

    if (!paymentIntentId || !email) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    // 1. VERIFY THE PAYMENT SECURELY
    // We check Stripe to ensure the payment actually succeeded (preventing fake API calls)
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
    }

    // 2. FIRE THE EMAIL VIA RESEND (Automatic Delivery)
    const emailPromise = resend.emails.send({
      from: "Attract Best Man <support@yourdomain.com>", // Update with your verified Resend domain
      to: [email],
      subject: "Here is your access: Understand Men Ebook",
      html: `
        <div style="font-family: sans-serif; color: #1D1D1F; max-w-2xl; margin: 0 auto;">
          <h2>Hi ${name.split(' ')[0]},</h2>
          <p>Your payment was successful. Here is your private access link to the system:</p>
          <a href="https://yourdomain.com/secret-download-link" style="display: inline-block; padding: 12px 24px; background: #f43f5e; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Download Ebook Now</a>
          <p>If you have any questions, reply directly to this email.</p>
        </div>
      `,
    }).catch(err => console.error("Resend Email Failed:", err));

    // 3. ADD TO MARKETING LIST (Automatic Email Marketing)
    const listPromise = process.env.RESEND_AUDIENCE_ID ? resend.contacts.create({
      email: email,
      firstName: name.split(' ')[0], 
      unsubscribed: false,
      audienceId: process.env.RESEND_AUDIENCE_ID,
    }).catch(err => console.error("Resend List Addition Failed:", err)) : Promise.resolve();

    // Run Delivery and Marketing operations at the exact same time
    await Promise.all([emailPromise, listPromise]);

    return NextResponse.json({ success: true, message: "Order processed flawlessly." });

  } catch (error: any) {
    console.error("Complete Order Route Failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}