import { protectedProcedure, publicProcedure, router } from "../index";
import { profileRouter } from "./profile";
import { experienceRouter } from "./experiences";
import { skillRouter } from "./skills";
import { educationRouter } from "./educations";
import { cvVersionRouter } from "./cv-versions";
import { certificateRouter } from "./certificates";
import { languageRouter } from "./languages";
import { achievementRouter } from "./achievements";
import { projectRouter } from "./projects";

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
  certificate: certificateRouter,
  language: languageRouter,
  achievement: achievementRouter,
  project: projectRouter,
});
export type AppRouter = typeof appRouter;
