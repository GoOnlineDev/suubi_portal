import { cronJobs } from "convex/server";
import { internalAction, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const crons = cronJobs();

crons.interval(
  "check for new news and programs and send emails",
  { minutes: 120 },
  internal.crons.processNewContent,
  {}
);

export default crons;

// Internal action to be called by the cron job
export const processNewContent = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get last counts from cron_state table
    const lastCounts = await ctx.runQuery(internal.crons.getLastCounts, {});

    // Count news and programs
    const newsCount = await ctx.runQuery(internal.crons.countNews, {});
    const programsCount = await ctx.runQuery(internal.crons.countPrograms, {});

    // If new news, get the most recent and send email
    if (newsCount > lastCounts.news) {
      const recentNews = await ctx.runQuery(internal.crons.getMostRecentNews, {});
      if (recentNews) {
        await ctx.runAction(internal.newsemail.sendNewsEmail, { newsId: recentNews._id });
      }
    }
    // If new program, get the most recent and send email
    if (programsCount > lastCounts.programs) {
      const recentProgram = await ctx.runQuery(internal.crons.getMostRecentProgram, {});
      if (recentProgram) {
        await ctx.runAction(internal.programemail.sendProgramEmail, { programId: recentProgram._id });
      }
    }
    // Update last counts in cron_state table
    await ctx.runMutation(internal.crons.setLastCounts, { news: newsCount, programs: programsCount });
  },
});

export const getLastCounts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const state = await ctx.db
      .query("cron_state")
      .withIndex("by_key", (q) => q.eq("key", "lastCounts"))
      .unique();
    return state?.value || { news: 0, programs: 0 };
  },
});

export const setLastCounts = internalMutation({
  args: { news: v.number(), programs: v.number() },
  handler: async (ctx, { news, programs }) => {
    const state = await ctx.db
      .query("cron_state")
      .withIndex("by_key", (q) => q.eq("key", "lastCounts"))
      .unique();
    if (state) {
      await ctx.db.patch(state._id, { 
        value: { news, programs },
        updatedAt: Date.now()
      });
    } else {
      await ctx.db.insert("cron_state", { 
        key: "lastCounts", 
        value: { news, programs },
        createdAt: Date.now()
      });
    }
  },
});

export const countNews = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("news").collect().then(arr => arr.length);
  },
});

export const countPrograms = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("programs").collect().then(arr => arr.length);
  },
});

export const getMostRecentNews = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("news").order("desc").first();
  },
});

export const getMostRecentProgram = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("programs").order("desc").first();
  },
});

/**
 * Migration function to add createdAt field to existing cron_state records
 * Run this once after schema update to fix existing data
 */
export const migrateCronStateRecords = internalMutation({
  args: {},
  returns: v.object({
    migratedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const errors: string[] = [];
    let migratedCount = 0;

    try {
      // Get all cron_state records
      const cronStates = await ctx.db.query("cron_state").collect();

      for (const record of cronStates) {
        try {
          // Add createdAt if missing
          if (!record.createdAt) {
            await ctx.db.patch(record._id, {
              createdAt: record._creationTime,
            });
            migratedCount++;
          }
        } catch (error) {
          errors.push(`Failed to migrate cron_state record ${record._id}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Migration failed: ${error}`);
    }

    return {
      migratedCount,
      errors,
    };
  },
});
