import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import Stripe from "stripe";

// Initialize external services
const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

// 📌 PINTEREST CAPI VAULT (Server-Side)
// You will replace these placeholders with your actual Ad Account IDs and Tokens
const PINTEREST_ACCOUNTS = [
  { adAccountId: "AD_ACCOUNT_ID_1", token: process.env.PIN_TOKEN_1 },
  { adAccountId: "AD_ACCOUNT_ID_2", token: process.env.PIN_TOKEN_2 },
  // ... add all 10+ here
];

// Helper function to hash emails securely for Pinterest
const hashData = (data: string) => {
  return crypto.createHash("sha256").update(data.trim().toLowerCase()).digest("hex");
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentIntentId, email, name, eventId } = body;

    if (!paymentIntentId || !email) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    // 1. VERIFY THE PAYMENT SECURELY
    // We check Stripe to ensure the payment actually succeeded (preventing fake API calls from stealing the book)
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
    }

    // 2. FIRE THE EMAIL VIA RESEND
    // This happens asynchronously so it doesn't slow down the response
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

    // 3. FIRE PINTEREST SERVER-TO-SERVER TRACKING (CAPI)
    const hashedEmail = hashData(email);
    const eventTime = Math.floor(Date.now() / 1000); // Pinterest requires Unix timestamp in seconds

    const pinterestPromises = PINTEREST_ACCOUNTS.map((account) => {
      if (!account.token) return Promise.resolve();

      return fetch(`https://api.pinterest.com/v5/ad_accounts/${account.adAccountId}/events`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${account.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [{
            event_name: "checkout", // Pinterest uses 'checkout' for completed purchases
            action_source: "web",
            event_time: eventTime,
            event_id: eventId, // Used for deduplication with your frontend pixel
            user_data: {
              em: [hashedEmail],
            },
            custom_data: {
              currency: "USD",
              value: "47.77",
            }
          }]
        })
      }).catch(err => console.error(`Pinterest CAPI Failed for ${account.adAccountId}:`, err));
    });

    // Run Email and Pinterest tasks in parallel
    await Promise.all([emailPromise, ...pinterestPromises]);

    return NextResponse.json({ success: true, message: "Order processed flawlessly." });

  } catch (error: any) {
    console.error("Complete Order Route Failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}