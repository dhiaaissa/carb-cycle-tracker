/**
 * WhatsApp messaging via Twilio API.
 *
 * Required environment variables:
 *   TWILIO_ACCOUNT_SID  — your Twilio Account SID
 *   TWILIO_AUTH_TOKEN   — your Twilio Auth Token
 *   TWILIO_WHATSAPP_FROM — Twilio WhatsApp sender (e.g. "whatsapp:+14155238886")
 *   MY_WHATSAPP_NUMBER  — your phone number (e.g. "whatsapp:+216XXXXXXXX")
 */

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM         = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
const TO           = process.env.MY_WHATSAPP_NUMBER;

/**
 * Sends a WhatsApp message via Twilio REST API (no SDK needed).
 * @param {string} message — the text to send
 */
export const isWhatsAppEnabled = Boolean(TWILIO_SID && TWILIO_TOKEN && TO);

export async function sendWhatsApp(message) {
  if (!isWhatsAppEnabled) {
    console.log('[WhatsApp] Skipped — Twilio not configured (demo deployment).');
    return { disabled: true };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;

  const body = new URLSearchParams({
    From: FROM,
    To: TO,
    Body: message,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio error (${res.status}): ${err}`);
  }

  const data = await res.json();
  console.log(`[WhatsApp] Message sent: SID=${data.sid}`);
  return data;
}
