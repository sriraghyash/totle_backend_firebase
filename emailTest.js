import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: "yourEmail@gmail.com",
  subject: "Test Email",
  text: "Hello from Nodemailer!",
})
.then(() => console.log("✅ Test Email Sent"))
.catch((err) => console.error("❌ Failed:", err));
