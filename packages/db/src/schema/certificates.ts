import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { profile } from "./profiles";

export const certificate = pgTable("certificate", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  profileId: text("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  issuer: text("issuer"),
  year: integer("year"),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("certificate_profile_id_idx").on(table.profileId)]);
