// Vercel serverless function: POST /api/contact
// Required env vars (Vercel > Project > Settings > Environment Variables):
//   RESEND_API_KEY  - API key from resend.com
//   CONTACT_TO      - inbox that receives inquiries (e.g. info@bokintegrated.com)
//   CONTACT_FROM    - verified sender address, e.g. "noreply@yourdomain.com"
//                     (use "onboarding@resend.dev" for testing only).
//                     Sent as "BOK Website <address>"; reply_to is the visitor's email.

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const clean = (v, max) => String(v ?? "").trim().slice(0, max);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const b = req.body && typeof req.body === "object" ? req.body : {};

  // Honeypot: bots fill this hidden field. Pretend success.
  if (b.website) return res.status(200).json({ ok: true });

  const data = {
    fullName: clean(b.fullName, 100),
    company: clean(b.company, 100),
    email: clean(b.email, 150),
    phone: clean(b.phone, 40),
    service: clean(b.service, 100),
    location: clean(b.location, 150),
    message: clean(b.message, 5000),
  };

  if (!data.fullName || !data.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return res.status(400).json({ error: "Please provide a valid name, email and message." });
  }

  const { RESEND_API_KEY, CONTACT_TO, CONTACT_FROM } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO || !CONTACT_FROM) {
    console.error("Missing RESEND_API_KEY / CONTACT_TO / CONTACT_FROM");
    return res.status(500).json({ error: "Server is not configured." });
  }

  // CONTACT_FROM may be "Name <addr>" or just "addr"; keep only the address.
  const senderAddress = (CONTACT_FROM.match(/<([^>]+)>/) || [, CONTACT_FROM])[1].trim();

  const rows = [
    ["Name", data.fullName],
    ["Company", data.company],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Service", data.service],
    ["Location", data.location],
  ];
  const html =
    `<h2>New project inquiry</h2><table cellpadding="6">` +
    rows.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v) || "-"}</td></tr>`).join("") +
    `</table><p><b>Message</b></p><p>${esc(data.message).replace(/\n/g, "<br>")}</p>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `BOK Website <${senderAddress}>`,
        to: [CONTACT_TO],
        reply_to: data.email,
        subject: `Project inquiry from ${data.fullName}`,
        html,
      }),
    });
    if (!r.ok) {
      console.error("Resend error", r.status, await r.text());
      return res.status(502).json({ error: "Could not send message. Please try again later." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: "Could not send message. Please try again later." });
  }
};
