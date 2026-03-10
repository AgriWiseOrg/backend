const { Resend } = require('resend');

const sendEmailOtp = async (toEmail, otp) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured in .env file');
  }

  const resend = new Resend(apiKey);

  const fromEmail = process.env.EMAIL_FROM || 'AgriWise <onboarding@resend.dev>';

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [toEmail],
    subject: 'AgriWise Registration - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #16a34a;">AgriWise</h2>
        <p>Thank you for registering! Please use the following OTP to verify your email address:</p>
        <div style="background-color: #fff; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px solid #ddd;">
          <h1 style="letter-spacing: 5px; color: #333; margin: 0;">${otp}</h1>
        </div>
        <p>This code is valid for 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `
  });

  if (error) {
    console.error(`❌ Error sending email to ${toEmail}:`, error);
    throw new Error(error.message);
  }

  console.log(`✉️ Email OTP sent to ${toEmail}. Message ID: ${data.id}`);
  return true;
};

module.exports = {
  sendEmailOtp
};
