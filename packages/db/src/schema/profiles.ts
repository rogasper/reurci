import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const profile = pgTable("profile", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  nickname: text("nickname").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
