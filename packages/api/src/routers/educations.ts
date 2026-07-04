import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db } from "@reurci/db";
import { education } from "@reurci/db/schema/educations";
import { eq } from "drizzle-orm";

const educationInput = z.object({
  institution: z.string().min(1),
  degree: z.string().optional(),
  field: z.string().optional(),
  yearStart: z.number().int().optional(),
  yearEnd: z.number().int().optional(),
});

export const educationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const p = await db.query.profile.findFirst({
      where: (p, { eq }) => eq(p.userId, userId),
    });
    if (!p) return [];
    return db.query.education.findMany({
      where: (e, { eq }) => eq(e.profileId, p.id),
      orderBy: (e, { desc }) => desc(e.yearStart),
    });
  }),

  create: protectedProcedure
    .input(educationInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const p = await db.query.profile.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (!p) throw new Error("Profile not found");

      const [created] = await db
        .insert(education)
        .values({
          id: crypto.randomUUID(),
          profileId: p.id,
          institution: input.institution,
          degree: input.degree,
          field: input.field,
          yearStart: input.yearStart,
          yearEnd: input.yearEnd,
        })
        .returning();

      return created!;
    }),

  update: protectedProcedure
    .input(educationInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const p = await db.query.profile.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (!p) throw new Error("Profile not found");

      const [updated] = await db
        .update(education)
        .set({
          institution: input.institution,
          degree: input.degree,
          field: input.field,
          yearStart: input.yearStart,
          yearEnd: input.yearEnd,
        })
        .where(eq(education.id, input.id))
        .returning();

      return updated!;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(education).where(eq(education.id, input.id));
      return { ok: true };
    }),
});
