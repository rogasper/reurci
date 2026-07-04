import { pgTable, text, jsonb, integer, timestamp, index } from "drizzle-orm/pg-core";
import { profile } from "./profiles";
import { vector } from "./vector";

export const cvVersion = pgTable(
  "cv_version",
  {
    id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    jobTitle: text("job_title"),
    companyName: text("company_name"),
    jobDescription: text("job_description"),
    jobDescriptionEmbedding: vector("job_description_embedding", { dimension: 384 }),
    cvSnapshot: jsonb("cv_snapshot").notNull(),
    selectedStrategy: jsonb("selected_strategy"),
    atsScore: integer("ats_score"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("cv_version_profile_id_idx").on(table.profileId),
  ],
);
