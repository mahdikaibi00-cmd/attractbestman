import { NextResponse } from "next/server";
import { Resend } from "resend";
import Stripe from "stripe";
import fs from "fs";
import path from "path";

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
      // Checking both possible file names to prevent Vercel crashes
      const hyphenPath = path.join(process.cwd(), "public", "the-pattern-you-never-saw.pdf");
      const spacePath = path.join(process.cwd(), "public", "The Pattern You Never Saw.pdf");

      if (fs.existsSync(hyphenPath)) {
        pdfBuffer = fs.readFileSync(hyphenPath);
      } else if (fs.existsSync(spacePath)) {
        pdfBuffer = fs.readFileSync(spacePath);
      } else {
        throw new Error("PDF file not found in the public folder. Make sure it is uploaded and named correctly.");
      }
    } catch (fsError: any) {
      console.error("PDF Read Error:", fsError);
      return NextResponse.json({ error: `File Error: ${fsError.message}` }, { status: 500 });
    }

    // 3. SEND THE EMAIL (Using pure HTML to avoid Vercel React rendering bugs)
    const emailResult = await resend.emails.send({
      from: "Attract Best Man <attractbestman@vireva.agency>",
      to: [email],
      subject: "Your Access: The Pattern You Never Saw",
      attachments: [
        {
          filename: "The Pattern You Never Saw.pdf",
          content: pdfBuffer,
        },
      ],
      html: `
        <div style="background-color: #FDF8F9; padding: 40px 20px; font-family: '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif';">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #fce7f3; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(244,63,94,0.05);">
            <div style="background-color: #1D1D1F; padding: 32px 0; text-align: center;">
              <p style="color: #ffffff; font-size: 14px; font-weight: 800; letter-spacing: 4px; margin: 0;">ATTRACT BEST MAN</p>
            </div>
            <div style="padding: 48px 40px;">
              <h1 style="color: #1D1D1F; font-size: 32px; font-weight: 800; margin: 0 0 24px; letter-spacing: -1px;">The blindfold is off.</h1>
              <p style="color: #4b5563; font-size: 16px; line-height: 26px; margin: 0 0 20px; font-weight: 500;">Hi ${firstName},</p>
              <p style="color: #4b5563; font-size: 16px; line-height: 26px; margin: 0 0 20px; font-weight: 500;">Your purchase is complete. Welcome to the other side.</p>
              <p style="color: #4b5563; font-size: 16px; line-height: 26px; margin: 0 0 20px; font-weight: 500;">Remember the rule before you open this: Read one chapter at a time. Do not rush to the scripts. Your nervous system needs time to regulate the truth.</p>
              <div style="margin: 32px 0; padding: 24px; background-color: #FDF8F9; border-radius: 16px; border: 1px solid #fce7f3; text-align: center;">
                <p style="color: #e11d48; font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">Your ebook is attached to this email.</p>
                <p style="color: #9ca3af; font-size: 14px; margin: 0;">Please download and save the PDF to your files or iBooks immediately.</p>
              </div>
              <p style="color: #1D1D1F; font-size: 16px; font-weight: bold; line-height: 24px; margin: 0;">Stay grounded,<br>The ABM Team</p>
            </div>
            <div style="background-color: #FFF5F7; padding: 32px 40px; text-align: center; border-top: 1px solid #fce7f3;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 0 0 8px; font-weight: 600;">© 2026 Attract Best Man. All rights reserved.</p>
              <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 0; font-weight: 600;">If you have any issues with your attachment, reply directly to this email.</p>
            </div>
          </div>
        </div>
      `
    });

    // Check if Resend failed silently
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
      }
    }

    return NextResponse.json({ success: true, message: "Order processed and email sent." });

  } catch (error: any) {
    console.error("Complete Order Route Failed:", error);
    // CRITICAL: This will push the exact error to your screen instead of a generic message
    return NextResponse.json({ error: error.message || "Unknown Server Error" }, { status: 500 });
  }
}