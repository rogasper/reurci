import { pgTable, text, date, jsonb, index } from "drizzle-orm/pg-core";
import { profile } from "./profiles";
import { vector } from "./vector";

export const experience = pgTable(
  "experience",
  {
    id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    role: text("role").notNull(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end"),
    description: text("description"),
    achievements: jsonb("achievements").$type<string[]>().default([]),
    embedding: vector("embedding", { dimension: 384 }),
  },
  (table) => [
    index("experience_profile_id_idx").on(table.profileId),
  ],
);
