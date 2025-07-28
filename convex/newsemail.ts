"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";
import { api } from "@/convex/_generated/api";

export const sendNewsEmail = internalAction({
  args: {
    newsId: v.id("news"),
    newsUrl: v.optional(v.string()), // Optional: link to the news on the site
  },
  handler: async (ctx, { newsId, newsUrl }) => {
    // Fetch the news item
    const news = await ctx.runQuery(api.news.getNewsById, { id: newsId });
    if (!news) throw new Error("News not found");

    // Fetch all subscribers
    const subscribers = await ctx.runQuery(api.subscribers.getAllSubscribers, {});
    if (!subscribers.length) return;

    // Set up transporter (use env variables for credentials)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email content
    const subject = `New Update: ${news.title}`;
    const html = `
      <div style="font-family: 'Lexend', 'Noto Sans', Arial, sans-serif; color: #1c140d;">
        <h2>${news.title}</h2>
        <p><strong>Category:</strong> ${news.category}</p>
        <p><strong>Summary:</strong> ${news.summary}</p>
        <div style="margin: 16px 0;">${news.content}</div>
        ${news.images && news.images.length > 0 ? `<img src="${news.images[0]}" alt="News Image" style="max-width: 100%; border-radius: 8px; margin-bottom: 16px;" />` : ""}
        ${newsUrl ? `<a href="${newsUrl}" style="display:inline-block; margin-top:16px; background:#f37c1b; color:#fff; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:700;">Read More</a>` : ""}
        <p style="margin-top: 32px; font-size: 13px; color: #888;">You are receiving this because you subscribed to Boost Health Initiative news updates.</p>
      </div>
    `;

    // Send to all subscribers (Bcc)
    const mailOptions = {
      from: `"Boost Health Initiative" <${process.env.EMAIL}>`,
      to: process.env.EMAIL, // org email as "to"
      bcc: subscribers.map((s: any) => s.email),
      subject,
      html,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending news email:", error);
    }
  },
});
