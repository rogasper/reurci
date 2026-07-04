import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db } from "@reurci/db";
import { experience } from "@reurci/db/schema/experiences";
import { generateEmbedding } from "@reurci/mastra";
import { eq } from "drizzle-orm";

const experienceInput = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  periodStart: z.string(),
  periodEnd: z.string().optional(),
  description: z.string().optional(),
  achievements: z.array(z.string()).optional(),
});

export const experienceRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const p = await db.query.profile.findFirst({
      where: (p, { eq }) => eq(p.userId, userId),
    });
    if (!p) return [];
    return db.query.experience.findMany({
      where: (e, { eq }) => eq(e.profileId, p.id),
      orderBy: (e, { desc }) => desc(e.periodStart),
    });
  }),

  create: protectedProcedure
    .input(experienceInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const p = await db.query.profile.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (!p) throw new Error("Profile not found");

      const embeddingText = `${input.role} ${input.company} ${input.description ?? ""} ${(input.achievements ?? []).join(" ")}`;
      const embedding = await generateEmbedding(embeddingText);

      const [created] = await db
        .insert(experience)
        .values({
          id: crypto.randomUUID(),
          profileId: p.id,
          company: input.company,
          role: input.role,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          description: input.description,
          achievements: input.achievements ?? [],
          embedding,
        })
        .returning();

      return created!;
    }),

  update: protectedProcedure
    .input(experienceInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const p = await db.query.profile.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (!p) throw new Error("Profile not found");

      const existing = await db.query.experience.findFirst({
        where: (e, { and, eq }) =>
          and(eq(e.id, input.id), eq(e.profileId, p.id)),
      });
      if (!existing) throw new Error("Experience not found");

      const embeddingText = `${input.role} ${input.company} ${input.description ?? ""} ${(input.achievements ?? []).join(" ")}`;
      const embedding = await generateEmbedding(embeddingText);

      const [updated] = await db
        .update(experience)
        .set({
          company: input.company,
          role: input.role,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          description: input.description,
          achievements: input.achievements ?? [],
          embedding,
        })
        .where(eq(experience.id, input.id))
        .returning();

      return updated!;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const p = await db.query.profile.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (!p) throw new Error("Profile not found");

      await db
        .delete(experience)
        .where(eq(experience.id, input.id));

      return { ok: true };
    }),
});
