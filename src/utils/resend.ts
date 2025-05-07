import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const MAILER_API = process.env.MAILER_API as string;

const resend = new Resend(MAILER_API);
export const sendEmail = async (username: string, email: string) => {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: `${email}`,
      subject: `Welcome, ${username}!`,
      html: `<p>Hi ${username},</p><p>Welcome to our platform! We're excited to have you on board. If you have any questions, feel free to reach out to us.</p><p>Best regards,<br>Big Wealth</p>`,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
};
