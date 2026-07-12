import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const skillCategory = pgTable("skill_category", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  confidence: integer("confidence").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});
