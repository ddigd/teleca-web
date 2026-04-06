import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body; // type: "contact" | "order"
    
    const RESEND_KEY = process.env.RESEND_API_KEY;
    const TO_EMAIL = "sales@break.co.kr";
    
    if (!RESEND_KEY) {
      console.warn("RESEND_API_KEY not set — skipping email");
      return NextResponse.json({ ok: true, skipped: true });
    }

    let subject = "";
    let html = "";

    if (type === "contact") {
      subject = `[TELECA] New Contact Inquiry from ${data.name}`;
      html = `
        <h2>New Contact Inquiry</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;">
          <tr><td style="padding:8px;font-weight:bold;">Name</td><td style="padding:8px;">${data.name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${data.email}</td></tr>
          ${data.company ? `<tr><td style="padding:8px;font-weight:bold;">Company</td><td style="padding:8px;">${data.company}</td></tr>` : ""}
          ${data.subject ? `<tr><td style="padding:8px;font-weight:bold;">Subject</td><td style="padding:8px;">${data.subject}</td></tr>` : ""}
          <tr><td style="padding:8px;font-weight:bold;vertical-align:top;">Message</td><td style="padding:8px;">${data.message}</td></tr>
        </table>
      `;
    } else if (type === "order") {
      subject = `[TELECA] New Order Inquiry — ${data.inquiry_type} | ${data.name}`;
      html = `
        <h2>New Order Inquiry (${data.inquiry_type})</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;">
          <tr><td style="padding:8px;font-weight:bold;">Name</td><td style="padding:8px;">${data.name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${data.email}</td></tr>
          ${data.phone ? `<tr><td style="padding:8px;font-weight:bold;">Phone</td><td style="padding:8px;">${data.phone}</td></tr>` : ""}
          <tr><td style="padding:8px;font-weight:bold;">Org Type</td><td style="padding:8px;">${data.org_type}</td></tr>
          ${data.org_name ? `<tr><td style="padding:8px;font-weight:bold;">Company</td><td style="padding:8px;">${data.org_name}</td></tr>` : ""}
          <tr><td style="padding:8px;font-weight:bold;">Region</td><td style="padding:8px;">${data.region} ${data.region_other || ""}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Quantity</td><td style="padding:8px;">${data.quantity} Cases</td></tr>
          ${data.message ? `<tr><td style="padding:8px;font-weight:bold;vertical-align:top;">Message</td><td style="padding:8px;">${data.message}</td></tr>` : ""}
        </table>
      `;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: "TELECA <onboarding@resend.dev>",
        to: [TO_EMAIL],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Notify error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
