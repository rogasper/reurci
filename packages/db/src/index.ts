import { env } from "@reurci/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

export function createDb() {
  return drizzle(env.DATABASE_URL, { schema });
}
export const db = createDb();

export { eq, sql, and, or, desc, asc, like, inArray, isNull, isNotNull } from "drizzle-orm";
