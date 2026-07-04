import { protectedProcedure, router } from "../index";
import { db } from "@reurci/db";
import { profile } from "@reurci/db/schema/profiles";

export const profileRouter = router({
  getOrCreate: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const existing = await db.query.profile.findFirst({
      where: (p, { eq }) => eq(p.userId, userId),
    });

    if (existing) return existing;

    const { name } = ctx.session.user;
    const [created] = await db
      .insert(profile)
      .values({
        id: crypto.randomUUID(),
        userId,
        nickname: name ?? "User",
      })
      .returning();

    return created!;
  }),
});
