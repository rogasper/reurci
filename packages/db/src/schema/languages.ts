import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { profile } from "./profiles";

export const language = pgTable("language", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  proficiency: text("proficiency"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("language_profile_id_idx").on(table.profileId)]);
