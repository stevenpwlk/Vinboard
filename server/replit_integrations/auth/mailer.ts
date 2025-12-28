import nodemailer from "nodemailer";

type MailConfig = {
  from: string;
};

function getTransport() {
  if (process.env.SMTP_URL) {
    return nodemailer.createTransport(process.env.SMTP_URL);
  }

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
  }

  throw new Error("Missing SMTP configuration. Set SMTP_URL or SMTP_HOST.");
}

function getMailConfig(): MailConfig {
  const from = process.env.MAIL_FROM;
  if (!from) {
    throw new Error("MAIL_FROM must be set to send magic links.");
  }
  return { from };
}

export async function sendMagicLink(email: string, link: string) {
  const transport = getTransport();
  const { from } = getMailConfig();
  await transport.sendMail({
    from,
    to: email,
    subject: "Your Vinboard sign-in link",
    text: `Use this link to sign in: ${link}`,
    html: `<p>Use this link to sign in:</p><p><a href="${link}">${link}</a></p>`,
  });
}
