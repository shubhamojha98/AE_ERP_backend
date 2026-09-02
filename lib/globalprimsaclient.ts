import { PrismaClient as panelClient } from "../generated/panel";
import { PrismaClient as dbLogClient } from "../generated/db-log";
import { PrismaClient as inventoryClient } from "../generated/inventory";

const globalForPrisma = global as any;

export type PanelPrisma = panelClient;
export type DbLogPrisma = dbLogClient;
export type InventoryPrisma = inventoryClient;

export const panel: PanelPrisma =
  globalForPrisma.panel ??
  new panelClient({ log: ["warn", "error"] });

export const dblog: DbLogPrisma =
  globalForPrisma.dblog ??
  new dbLogClient({ log: ["warn", "error"] });

export const inventory: InventoryPrisma =
  globalForPrisma.inventory ??
  new inventoryClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.panel = panel;
  globalForPrisma.dblog = dblog;
  globalForPrisma.inventory = inventory;
}
