const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sendEmailOtp = async (toEmail, otp) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error('EMAIL_USER or EMAIL_PASS not configured in .env file');
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  const mailOptions = {
    from: `"AgriWise" <${emailUser}>`,
    to: toEmail,
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
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email OTP sent to ${toEmail}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email to ${toEmail}:`, error);
    throw error;
  }
};

module.exports = {
  sendEmailOtp
};
