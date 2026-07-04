import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { DuckDBStore } from "@mastra/duckdb";
import { MastraCompositeStore } from "@mastra/core/storage";
import {
  Observability,
  MastraStorageExporter,
  MastraPlatformExporter,
  SensitiveDataFilter,
} from "@mastra/observability";
import { tailorAgent } from "./agents/tailor-agent";
import { tailorCvWorkflow } from "./workflows/tailor-cv";

export { generateEmbedding } from "./tools/embed";
export { parseCV } from "./tools/parse-cv";
export { generateSummaryVariants, generateExperienceVariants, scoreSkillsAgainstJd, regenerateVariants, analyzeRelevance, generateFromContext } from "./tools/tailor-steps";

export const mastra = new Mastra({
  agents: { tailorAgent },
  workflows: { tailorCvWorkflow },
  backgroundTasks: {
    enabled: true,
    globalConcurrency: 10,
    perAgentConcurrency: 3,
    defaultTimeoutMs: 300_000,
  },
  storage: new MastraCompositeStore({
    id: "composite-storage",
    default: new LibSQLStore({
      id: "mastra-storage",
      url: "file:./mastra.db",
    }),
    domains: {
      observability: await new DuckDBStore().getStore("observability"),
    },
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [
          new MastraStorageExporter(),
          new MastraPlatformExporter(),
        ],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});

