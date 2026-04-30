import { NextResponse } from "next/server";
import { Resend } from "resend";
import Stripe from "stripe";
import fs from "fs";
import path from "path";
import { DeliveryEmail } from "@/components/emails/DeliveryEmail";

const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-04-22.dahlia" as any,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentIntentId, email, name } = body;

    if (!paymentIntentId || !email) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    // 1. VERIFY THE PAYMENT
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
    }

    const firstName = name ? name.split(" ")[0] : "There";

    // 2. READ THE PDF SECURELY
    const pdfPath = path.join(process.cwd(), "public", "the-pattern-you-never-saw.pdf");
    let pdfBuffer: Buffer;
    
    try {
      pdfBuffer = fs.readFileSync(pdfPath);
    } catch (fsError) {
      console.error("Failed to read PDF file from public folder:", fsError);
      return NextResponse.json({ error: "File delivery error on server." }, { status: 500 });
    }

    // 3. SEND THE EMAIL WITH THE ATTACHMENT
    const emailPromise = resend.emails.send({
      from: "Attract Best Man <support@attractbestman.com>", 
      to: [email],
      subject: "Your Access: The Pattern You Never Saw",
      react: DeliveryEmail({ customerName: firstName }),
      attachments: [
        {
          filename: "The Pattern You Never Saw.pdf",
          content: pdfBuffer,
        },
      ],
    }).catch(err => console.error("Resend Email Failed:", err));

    // 4. ADD CONTACT TO YOUR MARKETING AUDIENCE
    const listPromise = process.env.RESEND_AUDIENCE_ID ? resend.contacts.create({
      email: email,
      firstName: firstName, 
      unsubscribed: false,
      audienceId: process.env.RESEND_AUDIENCE_ID,
    }).catch(err => console.error("Resend List Addition Failed:", err)) : Promise.resolve();

    // Run both operations concurrently
    await Promise.all([emailPromise, listPromise]);

    return NextResponse.json({ success: true, message: "Order processed, email sent, and contact added." });

  } catch (error: any) {
    console.error("Complete Order Route Failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}