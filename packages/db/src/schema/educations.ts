import { pgTable, text, integer, index } from "drizzle-orm/pg-core";
import { profile } from "./profiles";

export const education = pgTable(
  "education",
  {
    id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    institution: text("institution").notNull(),
    degree: text("degree"),
    field: text("field"),
    yearStart: integer("year_start"),
    yearEnd: integer("year_end"),
  },
  (table) => [
    index("education_profile_id_idx").on(table.profileId),
  ],
);
