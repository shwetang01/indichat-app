const axios = require("axios");
require("dotenv").config();

const sendOtpToEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #075e54;">🔐 INDICHAT App Web Verification</h2>
      <p>Hi there,</p>
      <p>Your one-time password (OTP) to verify your Indichat Web account is:</p>
      <h1 style="background: #e0f7fa; color: #000; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 2px;">
        ${otp}
      </h1>
      <p><strong>This OTP is valid for the next 5 minutes.</strong> Please do not share this code with anyone.</p>
      <p>If you didn’t request this OTP, please ignore this email.</p>
      <p style="margin-top: 20px;">Thanks & Regards,<br/>IndiChat Web Security Team</p>
      <hr style="margin: 30px 0;" />
      <small style="color: #777;">This is an automated message. Please do not reply.</small>
    </div>
  `;

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "IndiChat App",
          email: process.env.BREVO_VERIFIED_SENDER, // Must be a verified sender in Brevo
        },
        to: [{ email }],
        subject: "Indichat App Verification Code",
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ OTP email sent to ${email}`);
    return { success: true, response: response.data };
  } catch (error) {
    console.error("❌ Failed to send OTP via Brevo:", error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

module.exports = sendOtpToEmail;
