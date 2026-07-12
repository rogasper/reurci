import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db, eq } from "@reurci/db";
import { project } from "@reurci/db/schema/projects";

const projectInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  url: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  year: z.number().int().optional(),
});

export const projectRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const p = await db.query.profile.findFirst({
      where: (p, { eq }) => eq(p.userId, userId),
    });
    if (!p) return [];
    return db.query.project.findMany({
      where: (pr, { eq }) => eq(pr.profileId, p.id),
      orderBy: (pr, { desc }) => desc(pr.year),
    });
  }),

  create: protectedProcedure
    .input(projectInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const p = await db.query.profile.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (!p) throw new Error("Profile not found");
      const [created] = await db
        .insert(project)
        .values({
          id: crypto.randomUUID(),
          profileId: p.id,
          name: input.name,
          description: input.description,
          url: input.url,
          techStack: input.techStack ?? [],
          year: input.year,
        })
        .returning();
      return created!;
    }),

  update: protectedProcedure
    .input(projectInput.extend({ id: z.string() }))
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(project)
        .set({
          name: input.name,
          description: input.description,
          url: input.url,
          techStack: input.techStack ?? [],
          year: input.year,
        })
        .where(eq(project.id, input.id))
        .returning();
      return updated!;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(project).where(eq(project.id, input.id));
      return { ok: true };
    }),
});
