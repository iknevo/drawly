import "server-only";

import { render } from "@react-email/render";
import nodemailer from "nodemailer";

import { env } from "@/env";
import { PasswordResetEmail } from "@/modules/auth/ui/components/password-reset";
import { VerificationEmail } from "@/modules/auth/ui/components/verification-email";

type Options = {
  email: string;
  subject: string;
  html: string;
};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
});

export const sendEmail = async ({ email, subject, html }: Options) => {
  await transporter.sendMail({
    from: `"Drawly" <${env.GMAIL_USER}>`,
    to: email,
    subject,
    html,
  });
};

export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  const html = await render(<PasswordResetEmail resetUrl={resetUrl} />);
  await sendEmail({
    email,
    subject: "Reset your password - Drawly",
    html,
  });
};

export const sendVerificationEmail = async (email: string, verifyUrl: string) => {
  const html = await render(<VerificationEmail verifyUrl={verifyUrl} />);
  await sendEmail({
    email,
    subject: "Verify your email - Drawly",
    html,
  });
};
