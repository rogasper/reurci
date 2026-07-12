import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db } from "@reurci/db";
import { cvVersion } from "@reurci/db/schema/cv_versions";
import { eq, desc } from "@reurci/db";

export const cvVersionRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const p = await db.query.profile.findFirst({
      where: (p, { eq }) => eq(p.userId, userId),
    });
    if (!p) return [];
    return db.query.cvVersion.findMany({
      where: (v, { eq }) => eq(v.profileId, p.id),
      orderBy: desc(cvVersion.createdAt),
    });
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const p = await db.query.profile.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (!p) return null;
      return db.query.cvVersion.findFirst({
        where: (v, { and, eq }) =>
          and(eq(v.id, input.id), eq(v.profileId, p.id)),
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        jobTitle: z.string().optional(),
        companyName: z.string().optional(),
        jobDescription: z.string().optional(),
        cvSnapshot: z.any(),
        selectedStrategy: z.any().optional(),
        atsScore: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const p = await db.query.profile.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (!p) throw new Error("Profile not found");

      const [created] = await db
        .insert(cvVersion)
        .values({
          id: crypto.randomUUID(),
          profileId: p.id,
          jobTitle: input.jobTitle,
          companyName: input.companyName,
          jobDescription: input.jobDescription,
          cvSnapshot: input.cvSnapshot,
          selectedStrategy: input.selectedStrategy,
          atsScore: input.atsScore,
        })
        .returning();

      return created!;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(cvVersion).where(eq(cvVersion.id, input.id));
      return { ok: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        jobTitle: z.string().optional(),
        companyName: z.string().optional(),
        jobDescription: z.string().optional(),
        cvSnapshot: z.any(),
        atsScore: z.number().int().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(cvVersion)
        .set({
          jobTitle: input.jobTitle,
          companyName: input.companyName,
          jobDescription: input.jobDescription,
          cvSnapshot: input.cvSnapshot,
          atsScore: input.atsScore,
        })
        .where(eq(cvVersion.id, input.id))
        .returning();
      return updated!;
    }),
});
