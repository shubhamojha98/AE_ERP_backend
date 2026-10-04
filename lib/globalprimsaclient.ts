import { PrismaClient as panelClient } from "../generated/panel";
import { PrismaClient as dbLogClient } from "../generated/db-log";
import { PrismaClient as inventoryClient } from "../generated/inventory";
import { PrismaClient as projectClient } from "../generated/project";
import { PrismaClient as leadClient } from "../generated/lead";

const globalForPrisma = global as any;

export type PanelPrisma = panelClient;
export type DbLogPrisma = dbLogClient;
export type InventoryPrisma = inventoryClient;
export type ProjectPrisma = projectClient;

export const panel: PanelPrisma =
  globalForPrisma.panel ?? new panelClient({ log: ["warn", "error"] });

export const dblog: DbLogPrisma =
  globalForPrisma.dblog ?? new dbLogClient({ log: ["warn", "error"] });

export const inventory: InventoryPrisma =
  globalForPrisma.inventory ?? new inventoryClient({ log: ["warn", "error"] });

export const project: ProjectPrisma =
  globalForPrisma.project ?? new projectClient({ log: ["warn", "error"] });

export const lead: leadClient =
  globalForPrisma.lead ?? new leadClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.panel = panel;
  globalForPrisma.dblog = dblog;
  globalForPrisma.inventory = inventory;
  globalForPrisma.project = project;
  globalForPrisma.lead = lead;
}
