import { pgTable, text, integer, index } from "drizzle-orm/pg-core";
import { profile } from "./profiles";
import { vector } from "./vector";

export const skill = pgTable(
  "skill",
  {
    id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category"),
    proficiency: integer("proficiency"),
    embedding: vector("embedding", { dimension: 384 }),
  },
  (table) => [
    index("skill_profile_id_idx").on(table.profileId),
  ],
);
