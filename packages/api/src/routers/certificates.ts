import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db, eq } from "@reurci/db";
import { certificate } from "@reurci/db/schema/certificates";

const certificateInput = z.object({
  name: z.string().min(1),
  issuer: z.string().optional(),
  year: z.number().int().optional(),
  url: z.string().optional(),
});

export const certificateRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const p = await db.query.profile.findFirst({
      where: (p, { eq }) => eq(p.userId, userId),
    });
    if (!p) return [];
    return db.query.certificate.findMany({
      where: (c, { eq }) => eq(c.profileId, p.id),
      orderBy: (c, { desc }) => desc(c.year),
    });
  }),

  create: protectedProcedure
    .input(certificateInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const p = await db.query.profile.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (!p) throw new Error("Profile not found");

      const [created] = await db
        .insert(certificate)
        .values({
          id: crypto.randomUUID(),
          profileId: p.id,
          name: input.name,
          issuer: input.issuer,
          year: input.year,
          url: input.url,
        })
        .returning();

      return created!;
    }),

  update: protectedProcedure
    .input(certificateInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const p = await db.query.profile.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      });
      if (!p) throw new Error("Profile not found");

      const [updated] = await db
        .update(certificate)
        .set({
          name: input.name,
          issuer: input.issuer,
          year: input.year,
          url: input.url,
        })
        .where(eq(certificate.id, input.id))
        .returning();

      return updated!;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(certificate).where(eq(certificate.id, input.id));
      return { ok: true };
    }),
});
