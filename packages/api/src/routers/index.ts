import { protectedProcedure, publicProcedure, router } from "../index";
import { profileRouter } from "./profile";
import { experienceRouter } from "./experiences";
import { skillRouter } from "./skills";
import { educationRouter } from "./educations";
import { cvVersionRouter } from "./cv-versions";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  profile: profileRouter,
  experience: experienceRouter,
  skill: skillRouter,
  education: educationRouter,
  cvVersion: cvVersionRouter,
});
export type AppRouter = typeof appRouter;
