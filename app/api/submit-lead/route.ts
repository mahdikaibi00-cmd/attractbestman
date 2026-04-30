import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb'; // Make sure this path points to your new lib folder
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    // 1. SAFE PARSING
    const rawPayload = await request.json().catch(() => null);
    if (!rawPayload) {
      return NextResponse.json({ error: "Invalid JSON received" }, { status: 400 });
    }
    
    // 🔥 Stop the "PARTIAL" leads right here.
    if (rawPayload.lead_status === "PARTIAL") {
      console.log("Partial lead detected. Ignoring.");
      return NextResponse.json({ success: true, message: "Partial lead ignored" }, { status: 200 });
    }
    
    // 2. THE "SMART" BULLETPROOFING
    const payload = {
      ...rawPayload, 
      phone: rawPayload.phone ? String(rawPayload.phone).replace(/\s/g, '') : "",
      lead_status: rawPayload.lead_status || "COMPLETE",
      localHour: Number(rawPayload.localHour ?? 12),
    };

    // 3. 🛡️ ENTERPRISE SECURE VAULT LOGIC 🛡️
    const leadId = uuidv4();
    const client = await clientPromise;
    const db = client.db("Vireva-EU-Vault"); // Your DB Name
    
    // Save the RAW data securely to MongoDB
    await db.collection("patients").insertOne({
      lead_id: leadId,
      ...payload,
      timestamp: new Date().toISOString(),
      region: "EU-Frankfurt"
    });

    // 🚨 THIS IS WHAT GOES TO MAKE.COM AND QSTASH (ZERO PATIENT DATA)
    const securePayload = { lead_id: leadId };
    
    // 4. Grab your URLs and Tokens
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;
    let qstashUrl = process.env.QSTASH_URL;
    const qstashToken = process.env.QSTASH_TOKEN;

    if (!webhookUrl || !qstashUrl || !qstashToken) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    qstashUrl = qstashUrl.replace(/\/v2\/publish\/?$/, ''); 

    // 5. THE BOUNCER LOGIC
    if (payload.localHour >= 8 && payload.localHour <= 19) {
      
      // ☀️ DAYTIME: Send POINTER to Make.com instantly
      const makeResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(securePayload), // ONLY SENDS { lead_id: "xyz" }
      });

      if (!makeResponse.ok) throw new Error("Make webhook failed");
      return NextResponse.json({ success: true, message: "Triggered Make.com" }, { status: 200 });

    } else {
      
      // 🌙 NIGHTTIME: Delay POINTER via QStash
      const hoursUntil2PM = (14 - payload.localHour + 24) % 24;
      const finalQstashEndpoint = `${qstashUrl}/v2/publish/${webhookUrl}`;

      const qstashResponse = await fetch(finalQstashEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${qstashToken}`,
          'Content-Type': 'application/json',
          'Upstash-Forward-Content-Type': 'application/json', 
          'Upstash-Delay': `${hoursUntil2PM}h` 
        },
        body: JSON.stringify(securePayload), // ONLY SENDS { lead_id: "xyz" }
      });

      if (!qstashResponse.ok) return NextResponse.json({ error: "QStash failed" }, { status: 500 });
      return NextResponse.json({ success: true, message: `Queued for ${hoursUntil2PM}h` }, { status: 200 });
    }

  } catch (error) {
    console.error("Webhook forwarding failed:", error);
    return NextResponse.json({ error: "Failed to process lead" }, { status: 500 });
  }
}