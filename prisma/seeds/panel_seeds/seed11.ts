import bcrypt from "bcryptjs";
import {
  AuditAction,
  DataScope,
  PermissionAction as A,
  PermissionEffect,
  PlatformType,
  Prisma,
  PrismaClient,
  RoleScope,
  UserStatus,
} from "../../generated/panel";

/**
 * Seed: run with `npx prisma db seed` (package.json → "prisma": { "seed": "tsx prisma/seed.ts" })
 * Safe to re-run. Env: SUPER_ADMIN_USERNAME, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, DEMO_PASSWORD, SEED_DEMO=false
 */

// ============================================================
// CATALOG — modules, menus, actions, role master templates
// ============================================================
const CRUD = [A.VIEW, A.CREATE, A.EDIT, A.DELETE];

type MenuDef = {
  code: string;
  name: string;
  path: string;
  icon?: string;
  actions: A[];
  platform?: PlatformType;
};
type ModuleDef = {
  code: string;
  name: string;
  icon: string;
  is_platform?: boolean;
  is_core?: boolean;
  menus: MenuDef[];
};

const MODULES: ModuleDef[] = [
  {
    code: "PLATFORM",
    name: "Platform Console",
    icon: "shield",
    is_platform: true,
    menus: [
      {
        code: "platform.companies",
        name: "Companies",
        path: "/platform/companies",
        actions: [...CRUD, A.EXPORT],
      },
      {
        code: "platform.role_masters",
        name: "Role Master",
        path: "/platform/role-masters",
        actions: CRUD,
      },
      {
        code: "platform.modules",
        name: "Modules & Menus",
        path: "/platform/modules",
        actions: [A.VIEW, A.EDIT],
      },
      {
        code: "platform.users",
        name: "All Users",
        path: "/platform/users",
        actions: [A.VIEW, A.EDIT, A.EXPORT],
      },
    ],
  },
  {
    code: "DASHBOARD",
    name: "Dashboard",
    icon: "layout-dashboard",
    is_core: true,
    menus: [
      {
        code: "dashboard.overview",
        name: "Overview",
        path: "/dashboard",
        actions: [A.VIEW],
      },
    ],
  },
  {
    code: "LEADS",
    name: "Leads",
    icon: "target",
    menus: [
      {
        code: "leads.leads",
        name: "Leads",
        path: "/leads",
        actions: [...CRUD, A.ASSIGN, A.IMPORT, A.EXPORT],
      },
      {
        code: "leads.followups",
        name: "Follow-ups",
        path: "/leads/follow-ups",
        actions: CRUD,
      },
      {
        code: "leads.site_surveys",
        name: "Site Surveys",
        path: "/leads/site-surveys",
        actions: [...CRUD, A.APPROVE, A.ASSIGN],
      },
    ],
  },
  {
    code: "SALES",
    name: "Sales",
    icon: "indian-rupee",
    menus: [
      {
        code: "sales.customers",
        name: "Customers",
        path: "/sales/customers",
        actions: [...CRUD, A.EXPORT, A.IMPORT],
      },
      {
        code: "sales.quotations",
        name: "Quotations",
        path: "/sales/quotations",
        actions: [...CRUD, A.APPROVE, A.PRINT, A.EXPORT],
      },
      {
        code: "sales.orders",
        name: "Sales Orders",
        path: "/sales/orders",
        actions: [...CRUD, A.APPROVE, A.PRINT, A.EXPORT],
      },
      {
        code: "sales.invoices",
        name: "Invoices",
        path: "/sales/invoices",
        actions: [...CRUD, A.APPROVE, A.PRINT, A.EXPORT],
      },
      {
        code: "sales.payments",
        name: "Payments",
        path: "/sales/payments",
        actions: [...CRUD, A.APPROVE, A.EXPORT],
      },
    ],
  },
  {
    code: "INVENTORY",
    name: "Inventory",
    icon: "package",
    menus: [
      {
        code: "inventory.products",
        name: "Products",
        path: "/inventory/products",
        actions: [...CRUD, A.IMPORT, A.EXPORT],
      },
      {
        code: "inventory.warehouses",
        name: "Warehouses",
        path: "/inventory/warehouses",
        actions: CRUD,
      },
      {
        code: "inventory.stock",
        name: "Stock",
        path: "/inventory/stock",
        actions: [A.VIEW, A.EDIT, A.EXPORT],
      },
      {
        code: "inventory.vendors",
        name: "Vendors",
        path: "/inventory/vendors",
        actions: [...CRUD, A.EXPORT],
      },
      {
        code: "inventory.purchase_orders",
        name: "Purchase Orders",
        path: "/inventory/purchase-orders",
        actions: [...CRUD, A.APPROVE, A.PRINT, A.EXPORT],
      },
      {
        code: "inventory.transfers",
        name: "Stock Transfers",
        path: "/inventory/transfers",
        actions: [...CRUD, A.APPROVE],
      },
    ],
  },
  {
    code: "PROJECTS",
    name: "Projects",
    icon: "sun",
    menus: [
      {
        code: "projects.projects",
        name: "Projects",
        path: "/projects",
        actions: [...CRUD, A.ASSIGN, A.EXPORT],
      },
      {
        code: "projects.installations",
        name: "Installations",
        path: "/projects/installations",
        actions: [...CRUD, A.ASSIGN],
      },
      {
        code: "projects.subsidy",
        name: "Subsidy & Net Metering",
        path: "/projects/subsidy",
        actions: [...CRUD, A.APPROVE],
      },
      {
        code: "projects.commissioning",
        name: "Commissioning",
        path: "/projects/commissioning",
        actions: [A.VIEW, A.CREATE, A.EDIT, A.APPROVE, A.PRINT],
      },
      {
        code: "projects.service",
        name: "Service & AMC",
        path: "/projects/service",
        actions: [...CRUD, A.ASSIGN],
      },
    ],
  },
  {
    code: "REPORTS",
    name: "Reports",
    icon: "bar-chart-3",
    menus: [
      {
        code: "reports.sales",
        name: "Sales Reports",
        path: "/reports/sales",
        actions: [A.VIEW, A.EXPORT, A.PRINT],
      },
      {
        code: "reports.inventory",
        name: "Inventory Reports",
        path: "/reports/inventory",
        actions: [A.VIEW, A.EXPORT, A.PRINT],
      },
      {
        code: "reports.projects",
        name: "Project Reports",
        path: "/reports/projects",
        actions: [A.VIEW, A.EXPORT, A.PRINT],
      },
    ],
  },
  {
    code: "ADMIN",
    name: "Administration",
    icon: "settings",
    is_core: true,
    menus: [
      {
        code: "admin.company",
        name: "Company Profile",
        path: "/admin/company",
        actions: [A.VIEW, A.EDIT],
      },
      {
        code: "admin.sub_companies",
        name: "Sub Companies",
        path: "/admin/sub-companies",
        actions: [A.VIEW, A.CREATE, A.EDIT],
      },
      {
        code: "admin.users",
        name: "Users",
        path: "/admin/users",
        actions: [...CRUD, A.EXPORT],
      },
      {
        code: "admin.roles",
        name: "Roles & Permissions",
        path: "/admin/roles",
        actions: CRUD,
      },
      {
        code: "admin.audit_logs",
        name: "Audit Logs",
        path: "/admin/audit-logs",
        actions: [A.VIEW, A.EXPORT],
      },
    ],
  },
];

/**
 * Permission patterns:
 *   "*"                      all company (non-platform) permissions
 *   "SALES"                  every permission of a module (uppercase = module code)
 *   "sales.quotations"       every action of a menu
 *   "sales.quotations:VIEW,CREATE"
 *   "SALES:VIEW"             one action across a module
 */
type RoleMasterDef = {
  code: string;
  name: string;
  description: string;
  scope: RoleScope;
  data_scope: DataScope;
  is_system?: boolean;
  permissions: string[];
};

const ROLE_MASTERS: RoleMasterDef[] = [
  {
    code: "SUPER_ADMIN",
    name: "Super Admin",
    scope: RoleScope.PLATFORM,
    data_scope: DataScope.COMPANY_TREE,
    is_system: true,
    description: "Developer-managed platform owner. Bypasses company RBAC.",
    permissions: [],
  },
  {
    code: "COMPANY_ADMIN",
    name: "Company Admin",
    scope: RoleScope.COMPANY,
    data_scope: DataScope.COMPANY_TREE,
    is_system: true,
    description: "Full access inside the company and its sub-companies.",
    permissions: ["*"],
  },
  {
    code: "SALES_MANAGER",
    name: "Sales Manager",
    scope: RoleScope.COMPANY,
    data_scope: DataScope.TEAM,
    description: "Owns leads and sales pipeline for the team.",
    permissions: [
      "dashboard.overview",
      "LEADS",
      "SALES",
      "reports.sales",
      "inventory.products:VIEW",
      "inventory.stock:VIEW",
      "projects.projects:VIEW",
    ],
  },
  {
    code: "SALES_EXECUTIVE",
    name: "Sales Executive",
    scope: RoleScope.COMPANY,
    data_scope: DataScope.SELF,
    description: "Works own leads, surveys and quotations.",
    permissions: [
      "dashboard.overview",
      "leads.leads:VIEW,CREATE,EDIT",
      "leads.followups:VIEW,CREATE,EDIT",
      "leads.site_surveys:VIEW,CREATE,EDIT",
      "sales.customers:VIEW,CREATE,EDIT",
      "sales.quotations:VIEW,CREATE,EDIT,PRINT",
      "inventory.products:VIEW",
    ],
  },
  {
    code: "INVENTORY_MANAGER",
    name: "Inventory Manager",
    scope: RoleScope.COMPANY,
    data_scope: DataScope.COMPANY,
    description: "Products, stock, vendors and purchase.",
    permissions: [
      "dashboard.overview",
      "INVENTORY",
      "reports.inventory",
      "sales.orders:VIEW",
      "projects.projects:VIEW",
    ],
  },
  {
    code: "PROJECT_MANAGER",
    name: "Project Manager",
    scope: RoleScope.COMPANY,
    data_scope: DataScope.COMPANY,
    description: "Installation, subsidy, commissioning and service.",
    permissions: [
      "dashboard.overview",
      "PROJECTS",
      "reports.projects",
      "sales.customers:VIEW",
      "sales.orders:VIEW",
      "inventory.stock:VIEW",
      "inventory.transfers:VIEW,CREATE",
    ],
  },
  {
    code: "ACCOUNTANT",
    name: "Accountant",
    scope: RoleScope.COMPANY,
    data_scope: DataScope.COMPANY,
    description: "Invoices, payments and financial reports.",
    permissions: [
      "dashboard.overview",
      "sales.invoices",
      "sales.payments",
      "sales.orders:VIEW,PRINT,EXPORT",
      "sales.customers:VIEW",
      "inventory.purchase_orders:VIEW,APPROVE,PRINT",
      "inventory.vendors:VIEW",
      "reports.sales",
      "reports.inventory",
    ],
  },
  {
    code: "VIEWER",
    name: "Viewer",
    scope: RoleScope.COMPANY,
    data_scope: DataScope.COMPANY,
    description: "Read-only access to business modules.",
    permissions: [
      "DASHBOARD",
      "LEADS:VIEW",
      "SALES:VIEW",
      "INVENTORY:VIEW",
      "PROJECTS:VIEW",
      "REPORTS:VIEW",
    ],
  },
];

// ============================================================
// HELPERS
// ============================================================
type Db = PrismaClient | Prisma.TransactionClient;
type PermRow = {
  id: number;
  code: string;
  action: string;
  menu_code: string;
  module_code: string;
  is_platform: boolean;
};

async function loadPermissionCatalog(db: Db): Promise<PermRow[]> {
  const rows = await db.permission.findMany({
    where: {
      is_active: true,
      menu: { is_active: true, module: { is_active: true } },
    },
    select: {
      id: true,
      code: true,
      action: true,
      menu: {
        select: {
          code: true,
          module: { select: { code: true, is_platform: true } },
        },
      },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    code: p.code,
    action: p.action,
    menu_code: p.menu.code,
    module_code: p.menu.module.code,
    is_platform: p.menu.module.is_platform,
  }));
}

/** Expands patterns ("*", "SALES", "SALES:VIEW", "sales.quotations", "sales.quotations:VIEW,EDIT") to permission ids. */
function expandPatterns(
  patterns: string[],
  catalog: PermRow[],
  scope: RoleScope = RoleScope.COMPANY,
): number[] {
  const pool =
    scope === RoleScope.COMPANY
      ? catalog.filter((p) => !p.is_platform)
      : catalog;
  const ids = new Set<number>();
  for (const pattern of patterns) {
    const [target, actionList] = pattern.split(":");
    const actions = actionList
      ? new Set(actionList.split(",").map((a) => a.trim()))
      : null;
    const isModule = target === target.toUpperCase();
    const matched = pool.filter(
      (p) =>
        (target === "*" ||
          (isModule ? p.module_code === target : p.menu_code === target)) &&
        (!actions || actions.has(p.action)),
    );
    if (!matched.length)
      throw new Error(`Permission pattern "${pattern}" matched nothing`);
    matched.forEach((p) => ids.add(p.id));
  }
  return [...ids];
}

/**
 * Creates missing company roles from every active COMPANY role master and copies template permissions.
 * Existing roles are left untouched so company-level customisations survive re-runs.
 */
async function provisionCompanyRoles(db: Db, companyId: number) {
  const masters = await db.roleMaster.findMany({
    where: { scope: RoleScope.COMPANY, is_active: true },
    include: { permissions: { select: { permission_id: true } } },
  });
  const roles: Record<string, number> = {};
  for (const m of masters) {
    const existing = await db.role.findUnique({
      where: { company_id_code: { company_id: companyId, code: m.code } },
    });
    if (existing) {
      roles[m.code] = existing.id;
      continue;
    }
    const role = await db.role.create({
      data: {
        company_id: companyId,
        role_master_id: m.id,
        code: m.code,
        name: m.name,
        description: m.description,
        data_scope: m.default_data_scope,
        is_system: m.is_system,
      },
    });
    if (m.permissions.length) {
      await db.rolePermission.createMany({
        data: m.permissions.map((p) => ({
          role_id: role.id,
          permission_id: p.permission_id,
        })),
        skipDuplicates: true,
      });
    }
    roles[m.code] = role.id;
  }
  return roles;
}

/** Enables modules for a company (core modules are always on and need no row). */
async function enableModules(db: Db, companyId: number, moduleCodes: string[]) {
  const modules = await db.module.findMany({
    where: { code: { in: moduleCodes }, is_platform: false },
  });
  for (const m of modules) {
    await db.companyModule.upsert({
      where: {
        company_id_module_id: { company_id: companyId, module_id: m.id },
      },
      update: { is_active: true },
      create: { company_id: companyId, module_id: m.id },
    });
  }
}

// ============================================================
// SEED
// ============================================================
const prisma = new PrismaClient();
const isProd = process.env.NODE_ENV === "production";
const BCRYPT_ROUNDS = 12;

const hash = (pw: string) => bcrypt.hash(pw, BCRYPT_ROUNDS);
const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

function requireStrongPassword(name: string, fallback: string) {
  const value = process.env[name] ?? (isProd ? undefined : fallback);
  if (!value) throw new Error(`${name} is required in production`);
  const strong =
    value.length >= 12 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value);
  if (isProd && !strong)
    throw new Error(
      `${name} must be 12+ chars with upper, lower, digit and symbol`,
    );
  return value;
}

async function seedCatalog() {
  for (const [mi, mod] of MODULES.entries()) {
    const module = await prisma.module.upsert({
      where: { code: mod.code },
      update: {
        name: mod.name,
        icon: mod.icon,
        is_platform: !!mod.is_platform,
        is_core: !!mod.is_core,
        display_order: mi + 1,
      },
      create: {
        code: mod.code,
        name: mod.name,
        icon: mod.icon,
        is_platform: !!mod.is_platform,
        is_core: !!mod.is_core,
        display_order: mi + 1,
      },
    });
    for (const [i, m] of mod.menus.entries()) {
      const menu = await prisma.menu.upsert({
        where: { code: m.code },
        update: {
          module_id: module.id,
          name: m.name,
          path: m.path,
          icon: m.icon,
          display_order: i + 1,
        },
        create: {
          module_id: module.id,
          code: m.code,
          name: m.name,
          path: m.path,
          icon: m.icon,
          display_order: i + 1,
          platform: m.platform,
        },
      });
      for (const action of m.actions) {
        const code = `${m.code}.${action.toLowerCase()}`;
        await prisma.permission.upsert({
          where: { code },
          update: { name: `${titleCase(action)} ${m.name}` },
          create: {
            code,
            menu_id: menu.id,
            action,
            name: `${titleCase(action)} ${m.name}`,
          },
        });
      }
    }
  }
}

async function seedRoleMasters() {
  const catalog = await loadPermissionCatalog(prisma);
  for (const [i, rm] of ROLE_MASTERS.entries()) {
    const data = {
      name: rm.name,
      description: rm.description,
      scope: rm.scope,
      default_data_scope: rm.data_scope,
      is_system: !!rm.is_system,
      display_order: i + 1,
    };
    const master = await prisma.roleMaster.upsert({
      where: { code: rm.code },
      update: data,
      create: { code: rm.code, ...data },
    });
    const ids = expandPatterns(rm.permissions, catalog, rm.scope);
    await prisma.$transaction([
      prisma.roleMasterPermission.deleteMany({
        where: { role_master_id: master.id },
      }),
      prisma.roleMasterPermission.createMany({
        data: ids.map((permission_id) => ({
          role_master_id: master.id,
          permission_id,
        })),
      }),
    ]);
  }
}

async function seedSuperAdmin() {
  const username = (
    process.env.SUPER_ADMIN_USERNAME ?? "superadmin"
  ).toLowerCase();
  const email = (
    process.env.SUPER_ADMIN_EMAIL ?? "superadmin@panel.local"
  ).toLowerCase();
  const password = requireStrongPassword("SUPER_ADMIN_PASSWORD", "sp@12345");
  const role = await prisma.roleMaster.findUniqueOrThrow({
    where: { code: "SUPER_ADMIN" },
  });
  return prisma.user.upsert({
    where: { username },
    update: { platform_role_id: role.id }, // never overwrite password on re-seed
    create: {
      username,
      email,
      password_hash: await hash(password),
      first_name: "Super",
      last_name: "Admin",
      platform_role_id: role.id,
      status: UserStatus.ACTIVE,
      must_change_password: isProd,
      password_changed_at: new Date(),
    },
  });
}

type CompanyRow = {
  id: number;
  tenant_id: number;
  hierarchy_path: string;
  depth: number;
};

async function upsertTenant(code: string, name: string) {
  return prisma.tenant.upsert({
    where: { code },
    update: { name },
    create: { code, name },
  });
}

async function upsertCompany(
  tenantId: number,
  code: string,
  name: string,
  parent: CompanyRow | null,
  extra: { city: string; state: string; gstin?: string },
) {
  if (parent && parent.tenant_id !== tenantId)
    throw new Error("Sub-company must be in the same tenant as its parent");
  const company = await prisma.company.upsert({
    where: { code },
    update: { name },
    create: {
      tenant_id: tenantId,
      code,
      name,
      legal_name: `${name} Pvt. Ltd.`,
      parent_company_id: parent?.id,
      email: `info@${code.toLowerCase()}.local`,
      ...extra,
    },
  });
  return prisma.company.update({
    where: { id: company.id },
    data: {
      hierarchy_path: `${parent?.hierarchy_path ?? "/"}${company.id}/`,
      depth: parent ? parent.depth + 1 : 0,
    },
  });
}

/** Company user: always tied to one tenant and one home company. */
async function upsertMember(
  home: CompanyRow,
  username: string,
  first: string,
  last: string,
  password: string,
) {
  return prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      email: `${username}@demo.local`,
      first_name: first,
      last_name: last,
      tenant_id: home.tenant_id,
      home_company_id: home.id,
      password_hash: await hash(password),
      password_changed_at: new Date(),
      email_verified_at: new Date(),
    },
  });
}

/** Rule: user may get access only to his home company or its sub-companies. Use the same check in the API. */
async function assertCompanyAccessAllowed(userId: number, companyId: number) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { home_company: true },
  });
  const target = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
  });
  if (
    !user.home_company ||
    user.tenant_id !== target.tenant_id ||
    !target.hierarchy_path.startsWith(user.home_company.hierarchy_path)
  ) {
    throw new Error(
      `User ${user.username} cannot access company ${target.code}: only home company and its sub-companies allowed`,
    );
  }
  return target;
}

async function addMembership(opts: {
  userId: number;
  companyId: number;
  roleIds: number[];
  employeeCode?: string;
  designation: string;
  isDefault?: boolean;
  reportsToId?: number;
}) {
  const company = await assertCompanyAccessAllowed(opts.userId, opts.companyId);
  const cu = await prisma.companyUser.upsert({
    where: {
      company_id_user_id: { company_id: opts.companyId, user_id: opts.userId },
    },
    update: {
      designation: opts.designation,
      reports_to_id: opts.reportsToId ?? null,
    },
    create: {
      tenant_id: company.tenant_id,
      company_id: opts.companyId,
      user_id: opts.userId,
      employee_code: opts.employeeCode,
      designation: opts.designation,
      is_default: !!opts.isDefault,
      reports_to_id: opts.reportsToId,
    },
  });
  await prisma.companyUserRole.createMany({
    data: opts.roleIds.map((role_id) => ({
      company_id: opts.companyId,
      company_user_id: cu.id,
      role_id,
    })),
    skipDuplicates: true,
  });
  return cu;
}

/** Effective permission check for one user in one company (roles + GRANT − REVOKE). */
async function hasPermission(userId: number, companyId: number, code: string) {
  const now = new Date();
  const active = {
    AND: [
      { OR: [{ valid_from: null }, { valid_from: { lte: now } }] },
      { OR: [{ valid_until: null }, { valid_until: { gt: now } }] },
    ],
  };
  const cu = await prisma.companyUser.findFirst({
    where: { user_id: userId, company_id: companyId, is_active: true },
    select: {
      roles: {
        where: {
          role: {
            is_active: true,
            deleted_at: null,
            permissions: { some: { permission: { code } } },
          },
        },
        select: { role_id: true },
      },
      permission_overrides: {
        where: { permission: { code }, ...active },
        select: { effect: true },
      },
    },
  });
  if (!cu) return false;
  if (cu.permission_overrides.some((o) => o.effect === PermissionEffect.REVOKE))
    return false;
  return (
    cu.roles.length > 0 ||
    cu.permission_overrides.some((o) => o.effect === PermissionEffect.GRANT)
  );
}

/**
 * Create a sub-company. Same function for the API.
 * - SUPER_ADMIN: under any company, any modules.
 * - Company user: needs "admin.sub_companies.create" in the parent company, parent must be his home company
 *   or below it, and the child can only get modules the parent already has.
 *   Creator automatically becomes COMPANY_ADMIN of the new sub-company.
 * In the API wrap this in prisma.$transaction.
 */
async function createSubCompany(
  actorUserId: number,
  parentId: number,
  input: {
    code: string;
    name: string;
    city: string;
    state: string;
    modules: string[];
  },
) {
  const actor = await prisma.user.findUniqueOrThrow({
    where: { id: actorUserId },
    include: { platform_role: true, home_company: true },
  });
  const parent = await prisma.company.findUniqueOrThrow({
    where: { id: parentId },
    include: {
      tenant: true,
      modules: {
        where: { is_active: true },
        select: { module: { select: { code: true } } },
      },
    },
  });
  const isSuper = actor.platform_role?.code === "SUPER_ADMIN";

  if (!isSuper) {
    if (
      !actor.home_company ||
      actor.tenant_id !== parent.tenant_id ||
      !parent.hierarchy_path.startsWith(actor.home_company.hierarchy_path)
    ) {
      throw new Error(
        `${actor.username} can create sub-companies only under his own company tree`,
      );
    }
    if (
      !(await hasPermission(actor.id, parent.id, "admin.sub_companies.create"))
    ) {
      throw new Error(
        `${actor.username} has no permission admin.sub_companies.create in ${parent.code}`,
      );
    }
    const parentModules = new Set(parent.modules.map((m) => m.module.code));
    const notAllowed = input.modules.filter((m) => !parentModules.has(m));
    if (notAllowed.length)
      throw new Error(
        `Modules not enabled for parent ${parent.code}: ${notAllowed.join(", ")}`,
      );
  }

  const existing = await prisma.company.findUnique({
    where: { code: input.code },
  });
  if (existing) {
    if (
      existing.tenant_id !== parent.tenant_id ||
      existing.parent_company_id !== parent.id
    )
      throw new Error(`Company code ${input.code} already used`);
    return {
      company: existing,
      roles: await provisionCompanyRoles(prisma, existing.id),
    };
  }

  if (parent.tenant.max_companies) {
    const count = await prisma.company.count({
      where: { tenant_id: parent.tenant_id, deleted_at: null },
    });
    if (count >= parent.tenant.max_companies)
      throw new Error(
        `Company limit (${parent.tenant.max_companies}) reached for tenant ${parent.tenant.code}`,
      );
  }

  const child = await upsertCompany(
    parent.tenant_id,
    input.code,
    input.name,
    parent,
    { city: input.city, state: input.state },
  );
  await prisma.company.update({
    where: { id: child.id },
    data: { created_by_id: actor.id },
  });
  await enableModules(prisma, child.id, input.modules);
  const roles = await provisionCompanyRoles(prisma, child.id);

  if (!isSuper) {
    await addMembership({
      userId: actor.id,
      companyId: child.id,
      roleIds: [roles.COMPANY_ADMIN],
      designation: "Admin",
    });
  }
  await prisma.auditLog.create({
    data: {
      user_id: actor.id,
      company_id: parent.id,
      action: AuditAction.CREATE,
      module_code: "ADMIN",
      permission_code: "admin.sub_companies.create",
      entity_type: "company",
      entity_id: String(child.id),
      description: `Sub-company ${child.code} created under ${parent.code}`,
    },
  });
  return { company: child, roles };
}

async function seedDemo(superAdminId: number) {
  const pw = requireStrongPassword("DEMO_PASSWORD", "Demo@12345");

  // Tenant 1 — SUPER ADMIN creates tenant + main company + its admin
  const sungrid = await upsertTenant("SUNGRID", "SunGrid Energy");
  const group = await upsertCompany(
    sungrid.id,
    "SUNGRID",
    "SunGrid Energy",
    null,
    { city: "Lucknow", state: "Uttar Pradesh", gstin: "09AAAAA0000A1Z5" },
  );
  await prisma.company.update({
    where: { id: group.id },
    data: { created_by_id: superAdminId },
  });
  await enableModules(prisma, group.id, [
    "LEADS",
    "SALES",
    "INVENTORY",
    "PROJECTS",
    "REPORTS",
  ]);
  const groupRoles = await provisionCompanyRoles(prisma, group.id);
  const admin = await upsertMember(group, "admin", "Group", "Admin", pw);
  await addMembership({
    userId: admin.id,
    companyId: group.id,
    roleIds: [groupRoles.COMPANY_ADMIN],
    employeeCode: "SG-001",
    designation: "Director",
    isDefault: true,
  });

  // Sub-company created by SUPER ADMIN
  const rt = await createSubCompany(superAdminId, group.id, {
    code: "SUNGRID-RT",
    name: "SunGrid Rooftop",
    city: "Kanpur",
    state: "Uttar Pradesh",
    modules: ["LEADS", "SALES", "INVENTORY", "PROJECTS", "REPORTS"],
  });
  // Sub-company created by COMPANY ADMIN (gets COMPANY_ADMIN there automatically)
  const ut = await createSubCompany(admin.id, group.id, {
    code: "SUNGRID-UT",
    name: "SunGrid Utility Projects",
    city: "Noida",
    state: "Uttar Pradesh",
    modules: ["PROJECTS", "INVENTORY", "REPORTS"],
  });
  const rooftop = rt.company;
  const utility = ut.company;
  const r = { group: groupRoles, rooftop: rt.roles, utility: ut.roles };

  const salesMgr = await upsertMember(
    rooftop,
    "sales.manager",
    "Rohit",
    "Verma",
    pw,
  );
  const salesExec = await upsertMember(
    rooftop,
    "sales.exec",
    "Anjali",
    "Singh",
    pw,
  );
  const store = await upsertMember(
    group,
    "store.manager",
    "Vikas",
    "Yadav",
    pw,
  );
  const pm = await upsertMember(
    utility,
    "project.manager",
    "Neha",
    "Gupta",
    pw,
  );
  const accounts = await upsertMember(group, "accounts", "Amit", "Mishra", pw);
  const viewer = await upsertMember(rooftop, "viewer", "Read", "Only", pw);

  // admin: home = main company → super admin's sub-company access given explicitly (utility came automatically)
  // (sales.manager, home = Rooftop, could NOT be added to the main company or Utility)
  await addMembership({
    userId: admin.id,
    companyId: rooftop.id,
    roleIds: [r.rooftop.COMPANY_ADMIN],
    employeeCode: "RT-001",
    designation: "Director",
  });

  const mgrCu = await addMembership({
    userId: salesMgr.id,
    companyId: rooftop.id,
    roleIds: [r.rooftop.SALES_MANAGER],
    employeeCode: "RT-010",
    designation: "Sales Manager",
    isDefault: true,
  });
  const execCu = await addMembership({
    userId: salesExec.id,
    companyId: rooftop.id,
    roleIds: [r.rooftop.SALES_EXECUTIVE],
    employeeCode: "RT-011",
    designation: "Sales Executive",
    isDefault: true,
    reportsToId: mgrCu.id,
  });
  await addMembership({
    userId: store.id,
    companyId: group.id,
    roleIds: [r.group.INVENTORY_MANAGER],
    employeeCode: "SG-020",
    designation: "Store In-charge",
    isDefault: true,
  });
  await addMembership({
    userId: pm.id,
    companyId: utility.id,
    roleIds: [r.utility.PROJECT_MANAGER],
    employeeCode: "UT-030",
    designation: "Project Manager",
    isDefault: true,
  });
  // multi-role example: accountant + viewer in group
  await addMembership({
    userId: accounts.id,
    companyId: group.id,
    roleIds: [r.group.ACCOUNTANT, r.group.VIEWER],
    employeeCode: "SG-040",
    designation: "Accounts Head",
    isDefault: true,
  });
  await addMembership({
    userId: viewer.id,
    companyId: rooftop.id,
    roleIds: [r.rooftop.VIEWER],
    employeeCode: "RT-099",
    designation: "Auditor",
    isDefault: true,
  });

  // per-user overrides: exec may approve quotations for 30 days; exec cannot create customers
  const [approveQuote, createCustomer] = await Promise.all([
    prisma.permission.findUniqueOrThrow({
      where: { code: "sales.quotations.approve" },
    }),
    prisma.permission.findUniqueOrThrow({
      where: { code: "sales.customers.create" },
    }),
  ]);
  const until = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  for (const [permission_id, effect, reason, valid_until] of [
    [approveQuote.id, PermissionEffect.GRANT, "Covering manager leave", until],
    [
      createCustomer.id,
      PermissionEffect.REVOKE,
      "Customers created by manager only",
      null,
    ],
  ] as const) {
    await prisma.userPermissionOverride.upsert({
      where: {
        company_user_id_permission_id: {
          company_user_id: execCu.id,
          permission_id,
        },
      },
      update: {},
      create: {
        company_id: rooftop.id,
        company_user_id: execCu.id,
        permission_id,
        effect,
        reason,
        valid_until,
        granted_by_id: mgrCu.id,
      },
    });
  }

  // custom (non-template) role example
  const surveyor = await prisma.role.upsert({
    where: {
      company_id_code: { company_id: rooftop.id, code: "SITE_SURVEYOR" },
    },
    update: {},
    create: {
      company_id: rooftop.id,
      code: "SITE_SURVEYOR",
      name: "Site Surveyor",
      data_scope: DataScope.SELF,
      description: "Custom role created by company admin",
    },
  });
  const surveyPerms = await prisma.permission.findMany({
    where: {
      code: {
        in: [
          "dashboard.overview.view",
          "leads.site_surveys.view",
          "leads.site_surveys.edit",
        ],
      },
    },
  });
  await prisma.rolePermission.createMany({
    data: surveyPerms.map((p) => ({
      role_id: surveyor.id,
      permission_id: p.id,
    })),
    skipDuplicates: true,
  });

  await prisma.companyBankAccount.upsert({
    where: {
      id:
        (
          await prisma.companyBankAccount.findFirst({
            where: { company_id: group.id, is_primary: true },
          })
        )?.id ?? 0,
    },
    update: {},
    create: {
      company_id: group.id,
      bank_name: "State Bank of India",
      branch_name: "Hazratganj",
      account_name: "SunGrid Energy Pvt. Ltd.",
      account_number: "XXXXXXXX1234",
      ifsc_code: "SBIN0000125",
      is_primary: true,
    },
  });

  // Tenant 2: completely separate customer — its users can never see or join SunGrid companies
  const brightvolt = await upsertTenant("BRIGHTVOLT", "BrightVolt Solar");
  const bv = await upsertCompany(
    brightvolt.id,
    "BRIGHTVOLT",
    "BrightVolt Solar",
    null,
    { city: "Indore", state: "Madhya Pradesh" },
  );
  await prisma.company.update({
    where: { id: bv.id },
    data: { created_by_id: superAdminId },
  });
  await enableModules(prisma, bv.id, ["LEADS", "SALES", "PROJECTS"]);
  const bvRoles = await provisionCompanyRoles(prisma, bv.id);
  const bvAdmin = await upsertMember(bv, "bv.admin", "BrightVolt", "Admin", pw);
  await addMembership({
    userId: bvAdmin.id,
    companyId: bv.id,
    roleIds: [bvRoles.COMPANY_ADMIN],
    employeeCode: "BV-001",
    designation: "Owner",
    isDefault: true,
  });

  if (await prisma.auditLog.findFirst({ where: { entity_type: "seed" } }))
    return;
  await prisma.notification.create({
    data: {
      user_id: salesExec.id,
      company_id: rooftop.id,
      title: "Welcome",
      message: "Your panel account is ready.",
      type: "INFO",
    },
  });
  await prisma.auditLog.create({
    data: {
      user_id: superAdminId,
      action: AuditAction.CREATE,
      entity_type: "seed",
      description: "Demo tenants seeded",
      metadata: { tenants: [sungrid.code, brightvolt.code] },
    },
  });
}

async function main() {
  await seedCatalog();
  await seedRoleMasters();
  const superAdmin = await seedSuperAdmin();
  if (!isProd && process.env.SEED_DEMO !== "false")
    await seedDemo(superAdmin.id);
  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
