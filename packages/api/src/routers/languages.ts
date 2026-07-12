import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db, eq } from "@reurci/db";
import { language } from "@reurci/db/schema/languages";

const languageInput = z.object({
  name: z.string().min(1),
  proficiency: z.string().optional(),
});

export const languageRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const p = await db.query.profile.findFirst({
      where: (p, { eq }) => eq(p.userId, userId),
    });
    if (!p) return [];
    return db.query.language.findMany({
      where: (l, { eq }) => eq(l.profileId, p.id),
    });
  }),

  create: protectedProcedure
    .input(languageInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const p = await db.query.profile.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (!p) throw new Error("Profile not found");
      const [created] = await db
        .insert(language)
        .values({ id: crypto.randomUUID(), profileId: p.id, name: input.name, proficiency: input.proficiency })
        .returning();
      return created!;
    }),

  update: protectedProcedure
    .input(languageInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const p = await db.query.profile.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (!p) throw new Error("Profile not found");
      const [updated] = await db
        .update(language)
        .set({ name: input.name, proficiency: input.proficiency })
        .where(eq(language.id, input.id))
        .returning();
      return updated!;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(language).where(eq(language.id, input.id));
      return { ok: true };
    }),
});
