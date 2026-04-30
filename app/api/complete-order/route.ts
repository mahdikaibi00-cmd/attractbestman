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

    // 2. READ THE PDF SECURELY (Checks both naming formats)
    let pdfBuffer: Buffer;
    try {
      const hyphenPath = path.join(process.cwd(), "public", "the-pattern-you-never-saw.pdf");
      const spacePath = path.join(process.cwd(), "public", "The Pattern You Never Saw.pdf");
      
      if (fs.existsSync(hyphenPath)) {
        pdfBuffer = fs.readFileSync(hyphenPath);
      } else if (fs.existsSync(spacePath)) {
        pdfBuffer = fs.readFileSync(spacePath);
      } else {
        throw new Error("PDF file not found in the public folder.");
      }
    } catch (fsError: any) {
      console.error("PDF Read Error:", fsError);
      return NextResponse.json({ error: "Ebook file missing on server. Rename your PDF to the-pattern-you-never-saw.pdf" }, { status: 500 });
    }

    // 3. SEND THE EMAIL WITH STRICT ERROR CHECKING
    const emailResult = await resend.emails.send({
      from: "Attract Best Man <attractbestman@vireva.agency>", 
      to: [email],
      subject: "Your Access: The Pattern You Never Saw",
      react: DeliveryEmail({ customerName: firstName }),
      attachments: [
        {
          filename: "The Pattern You Never Saw.pdf",
          content: pdfBuffer,
        },
      ],
    });

    if (emailResult.error) {
      console.error("Resend Email Error:", emailResult.error);
      return NextResponse.json({ error: `Email Delivery Failed: ${emailResult.error.message}` }, { status: 500 });
    }

    // 4. ADD TO MARKETING AUDIENCE
    if (process.env.RESEND_AUDIENCE_ID) {
      const contactResult = await resend.contacts.create({
        email: email,
        firstName: firstName, 
        unsubscribed: false,
        audienceId: process.env.RESEND_AUDIENCE_ID,
      });
      
      if (contactResult.error) {
         console.error("Resend Contact Error:", contactResult.error);
         // We do not fail the whole order just because the marketing list failed
      }
    }

    return NextResponse.json({ success: true, message: "Order processed and email sent." });

  } catch (error: any) {
    console.error("Complete Order Route Failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}