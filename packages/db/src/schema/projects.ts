import { pgTable, text, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { profile } from "./profiles";

export const project = pgTable("project", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  url: text("url"),
  techStack: jsonb("tech_stack").$type<string[]>().default([]),
  year: integer("year"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("project_profile_id_idx").on(table.profileId)]);
