import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db, eq } from "@reurci/db";
import { achievement } from "@reurci/db/schema/achievements";

const achievementInput = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  year: z.number().int().optional(),
});

export const achievementRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const p = await db.query.profile.findFirst({
      where: (p, { eq }) => eq(p.userId, userId),
    });
    if (!p) return [];
    return db.query.achievement.findMany({
      where: (a, { eq }) => eq(a.profileId, p.id),
      orderBy: (a, { desc }) => desc(a.year),
    });
  }),

  create: protectedProcedure
    .input(achievementInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const p = await db.query.profile.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (!p) throw new Error("Profile not found");
      const [created] = await db
        .insert(achievement)
        .values({ id: crypto.randomUUID(), profileId: p.id, title: input.title, description: input.description, year: input.year })
        .returning();
      return created!;
    }),

  update: protectedProcedure
    .input(achievementInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const p = await db.query.profile.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (!p) throw new Error("Profile not found");
      const [updated] = await db
        .update(achievement)
        .set({ title: input.title, description: input.description, year: input.year })
        .where(eq(achievement.id, input.id))
        .returning();
      return updated!;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(achievement).where(eq(achievement.id, input.id));
      return { ok: true };
    }),
});
