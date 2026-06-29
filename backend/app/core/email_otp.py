"""
Email OTP Service — RoadBuddy
------------------------------
Sends real OTP emails using Resend API.
"""

import httpx
from datetime import datetime, timedelta
from app.core.config import settings

# ── In-memory OTP store ─────────────────────────────────────────────────────────
_otp_store = {}


def generate_otp(email: str) -> str:
    import secrets
    if email in _otp_store:
        record = _otp_store[email]
        if "last_requested_at" in record:
            time_since_last = datetime.now() - record["last_requested_at"]
            if time_since_last.total_seconds() < 60:
                raise ValueError("Please wait 60 seconds before requesting a new OTP.")

    otp = str(secrets.randbelow(900000) + 100000)
    existing_record = _otp_store.get(email, {})
    name = existing_record.get("name")
    password = existing_record.get("password")

    _otp_store[email] = {
        "otp": otp,
        "expires_at": datetime.now() + timedelta(minutes=10),
        "last_requested_at": datetime.now(),
        "name": name,
        "password": password
    }
    return otp


def verify_otp(email: str, otp: str) -> bool:
    record = _otp_store.get(email)
    if not record:
        return False
    if record["otp"] != otp:
        return False
    if datetime.now() > record["expires_at"]:
        del _otp_store[email]
        return False
    return True


def clear_otp(email: str):
    if email in _otp_store:
        del _otp_store[email]


def send_otp_email(email: str, name: str, otp: str) -> bool:
    """Send OTP email via Resend API."""
    if not settings.resend_api_key:
        print("WARNING: RESEND_API_KEY not set. OTP is:", otp)
        return False

    try:
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json"
        }
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style=\"margin:0;padding:0;background:#f5f5f0;font-family:sans-serif;\">
          <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding:40px 20px;\">
            <tr>
              <td align=\"center\">
                <table width=\"480\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#fff;border-radius:12px;border:1px solid #e5e5e5;overflow:hidden;\">
                  <tr>
                    <td style=\"background:#1D9E75;padding:28px 32px;text-align:center;\">
                      <h1 style=\"margin:0;color:#fff;font-size:22px;\">🚗 RoadBuddy</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style=\"padding:32px;\">
                      <p>Hi <strong>{name}</strong>,</p>
                      <p>Use the code below to complete your registration:</p>
                      <div style=\"background:#f0faf6;border:2px dashed #1D9E75;border-radius:10px;padding:20px;text-align:center;font-size:40px;font-weight:700;color:#1D9E75;letter-spacing:12px;\">
                        {otp}
                      </div>
                      <p style=\"margin-top:20px;font-size:12px;color:#888;\">Expires in 10 minutes.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """

        payload = {
            "from": "RoadBuddy <onboarding@resend.dev>",
            "to": [email],
            "subject": f"{otp} is your RoadBuddy verification code",
            "html": html_content
        }

        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            return True

    except Exception as e:
        print(f"Resend API failed: {e}")
        return False


def generate_and_send_otp(email: str, name: str) -> bool:    otp = generate_otp(email)
    return send_otp_email(email, name, otp)