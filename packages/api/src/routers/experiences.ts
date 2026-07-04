import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db } from "@reurci/db";
import { experience } from "@reurci/db/schema/experiences";
import { generateEmbedding } from "@reurci/mastra";
import { eq, sql } from "@reurci/db";

function normalizeDate(d: string | undefined | null): string | undefined {
  if (!d) return undefined;
  const s = String(d);
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  return s;
}

const experienceInput = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  periodStart: z.string().optional(),
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

      const result = await db.execute<{
        id: string; profile_id: string; company: string; role: string;
        period_start: string; period_end: string | null; description: string | null;
        achievements: string[]; embedding: string;
      }>(sql`
        INSERT INTO experience (id, profile_id, company, role, period_start, period_end, description, achievements, embedding)
        VALUES (
          ${crypto.randomUUID()},
          ${p.id},
          ${input.company},
          ${input.role},
          ${normalizeDate(input.periodStart) ?? "2000-01-01"},
          ${normalizeDate(input.periodEnd) ?? null},
          ${input.description ?? null},
          ${JSON.stringify(input.achievements ?? [])},
          ${embedding.length > 0 ? `[${embedding.join(",")}]` : null}::vector(384)
        )
        RETURNING *
      `);

      return result.rows[0];
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

      await db.execute(sql`
        UPDATE experience SET
          company = ${input.company},
          role = ${input.role},
          period_start = ${normalizeDate(input.periodStart) ?? "2000-01-01"},
          period_end = ${normalizeDate(input.periodEnd) ?? null},
          description = ${input.description ?? null},
          achievements = ${JSON.stringify(input.achievements ?? [])},
          embedding = ${embedding.length > 0 ? `[${embedding.join(",")}]` : null}::vector(384)
        WHERE id = ${input.id}
      `);

      return { ok: true };
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
