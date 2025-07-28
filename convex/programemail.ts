"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";
import { api } from "@/convex/_generated/api";

export const sendProgramEmail = internalAction({
  args: {
    programId: v.id("programs"),
    programUrl: v.optional(v.string()), // Optional: link to the program on the site
  },
  handler: async (ctx, { programId, programUrl }) => {
    // Fetch the program item
    const program = await ctx.runQuery(api.programs.getProgramById, { id: programId });
    if (!program) throw new Error("Program not found");

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
    const subject = `New Program: ${program.name}`;
    const html = `
      <div style="font-family: 'Lexend', 'Noto Sans', Arial, sans-serif; color: #1c140d;">
        <h2>${program.name}</h2>
        <p><strong>Status:</strong> ${program.status}</p>
        <p><strong>Description:</strong> ${program.description}</p>
        ${program.goal ? `<p><strong>Goal:</strong> ${program.goal}</p>` : ""}
        <p><strong>Start:</strong> ${program.startDate ? new Date(program.startDate).toLocaleString() : "N/A"}</p>
        ${program.endDate ? `<p><strong>End:</strong> ${new Date(program.endDate).toLocaleString()}</p>` : ""}
        ${program.location ? `<p><strong>Location:</strong> ${program.location}</p>` : ""}
        ${program.images && program.images.length > 0 ? `<img src="${program.images[0]}" alt="Program Image" style="max-width: 100%; border-radius: 8px; margin-bottom: 16px;" />` : ""}
        ${programUrl ? `<a href="${programUrl}" style="display:inline-block; margin-top:16px; background:#1b7cf3; color:#fff; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:700;">Learn More</a>` : ""}
        <p style="margin-top: 32px; font-size: 13px; color: #888;">You are receiving this because you subscribed to Boost Health Initiative program updates.</p>
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
      console.error("Error sending program email:", error);
    }
  },
});
