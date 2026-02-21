import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendOTP = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Reforge" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reforge - Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background: #000; color: #fff;">
          <h2 style="color: #fff;">Reforge Email Verification</h2>
          <p>Your OTP for email verification is:</p>
          <h1 style="background: linear-gradient(to right, #8b5cf6, #3b82f6); padding: 20px; text-align: center; letter-spacing: 10px; border-radius: 10px;">${otp}</h1>
          <p>This OTP will expire in 10 minutes.</p>
          <p style="color: #888; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};
