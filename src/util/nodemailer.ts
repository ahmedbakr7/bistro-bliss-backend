import { log } from "console";
import nodemailer from "nodemailer";
import { logEvent } from "../middlewares/logger";
import env from "./env";

export interface MailMessageOptions {
    from?: string;
    to: string;
    cc?: string;
    bcc?: string;
    subject?: string;
    text?: string;
    html?: string;
}

// Create a transporter for SMTP
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

transporter
    .verify()
    .then((value) => {
        console.log("nodemailer connected to SMTP server!");
    })
    .catch((reason) => {
        console.error("nodemailer failed to connect to SMTP server!");
    });

export function sendMail({ from = env.SMTP_USER, ...options }: MailMessageOptions) {
    return transporter.sendMail({
        from,
        ...options,
    });
}
