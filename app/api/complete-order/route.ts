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
    let pdfBuffer: Buffer;
    try {
      const hyphenPath = path.join(process.cwd(), "public", "the-pattern-you-never-saw.pdf");
      const spacePath = path.join(process.cwd(), "public", "The Pattern You Never Saw.pdf");

      if (fs.existsSync(hyphenPath)) {
        pdfBuffer = fs.readFileSync(hyphenPath);
      } else if (fs.existsSync(spacePath)) {
        pdfBuffer = fs.readFileSync(spacePath);
      } else {
        throw new Error("PDF file not found in the public folder. Check the exact filename.");
      }
    } catch (fsError: any) {
      console.error("PDF Read Error:", fsError);
      return NextResponse.json({ error: `File Error: ${fsError.message}` }, { status: 500 });
    }

    // 3. SEND THE EMAIL (Using the official React component pattern)
    const { data: emailData, error: emailError } = await resend.emails.send({
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

    if (emailError) {
      console.error("Resend Email Error:", emailError);
      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    // 4. ADD TO MARKETING AUDIENCE
    if (process.env.RESEND_AUDIENCE_ID) {
      const { error: contactError } = await resend.contacts.create({
        email: email,
        firstName: firstName, 
        unsubscribed: false,
        audienceId: process.env.RESEND_AUDIENCE_ID,
      });
      
      if (contactError) {
         console.error("Resend Contact Error:", contactError);
      }
    }

    return NextResponse.json({ success: true, message: "Order processed successfully.", data: emailData });

  } catch (error: any) {
    console.error("Complete Order Route Failed:", error);
    return NextResponse.json({ error: error.message || "Unknown Server Error" }, { status: 500 });
  }
}