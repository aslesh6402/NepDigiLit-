import nodemailer from "nodemailer";

export async function sendPasswordEmail(email: string, code: string) {
  // Configure your SMTP transport (use environment variables in production)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: "Your new password ",
    text: `Your new password is: ${code}`,
    html: `<p>Your password is: <b>${code}</b></p>`,
  };

  await transporter.sendMail(mailOptions);
}
