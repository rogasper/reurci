import { customType } from "drizzle-orm/pg-core";

export const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimension: number };
  configRequired: true;
}>({
  dataType(config) {
    return `vector(${config.dimension})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});
