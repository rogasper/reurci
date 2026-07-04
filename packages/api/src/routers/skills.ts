import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db } from "@reurci/db";
import { skill } from "@reurci/db/schema/skills";
import { generateEmbedding } from "@reurci/mastra";
import { eq } from "@reurci/db";

const skillInput = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  proficiency: z.number().int().min(1).max(5).optional(),
});

export const skillRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const p = await db.query.profile.findFirst({
      where: (p, { eq }) => eq(p.userId, userId),
    });
    if (!p) return [];
    return db.query.skill.findMany({
      where: (s, { eq }) => eq(s.profileId, p.id),
      orderBy: (s) => s.name,
    });
  }),

  create: protectedProcedure
    .input(skillInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const p = await db.query.profile.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (!p) throw new Error("Profile not found");

      const embeddingText = `${input.name} ${input.category ?? ""}`;
      const embedding = await generateEmbedding(embeddingText);

      const [created] = await db
        .insert(skill)
        .values({
          id: crypto.randomUUID(),
          profileId: p.id,
          name: input.name,
          category: input.category,
          proficiency: input.proficiency,
          embedding,
        })
        .returning();

      return created!;
    }),

  update: protectedProcedure
    .input(skillInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const p = await db.query.profile.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (!p) throw new Error("Profile not found");

      const embeddingText = `${input.name} ${input.category ?? ""}`;
      const embedding = await generateEmbedding(embeddingText);

      const [updated] = await db
        .update(skill)
        .set({
          name: input.name,
          category: input.category,
          proficiency: input.proficiency,
          embedding,
        })
        .where(eq(skill.id, input.id))
        .returning();

      return updated!;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(skill).where(eq(skill.id, input.id));
      return { ok: true };
    }),
});
