import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { profile } from "./profiles";

export const achievement = pgTable("achievement", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  year: integer("year"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("achievement_profile_id_idx").on(table.profileId)]);
