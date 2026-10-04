import bcrypt from "bcryptjs";
import { AuditAction, DataScope, PermissionEffect, PrismaClient, UserStatus } from "../generated/panel";
import { enableModules, expandPatterns, loadPermissionCatalog, provisionCompanyRoles } from "../src/rbac/provision-company";
import { MODULES, ROLE_MASTERS } from "./seed-data";

const prisma = new PrismaClient();
const isProd = process.env.NODE_ENV === "production";
const BCRYPT_ROUNDS = 12;

const hash = (pw: string) => bcrypt.hash(pw, BCRYPT_ROUNDS);
const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

function requireStrongPassword(name: string, fallback: string) {
  const value = process.env[name] ?? (isProd ? undefined : fallback);
  if (!value) throw new Error(`${name} is required in production`);
  const strong = value.length >= 12 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
  if (isProd && !strong) throw new Error(`${name} must be 12+ chars with upper, lower, digit and symbol`);
  return value;
}

async function seedCatalog() {
  for (const [mi, mod] of MODULES.entries()) {
    const module = await prisma.module.upsert({
      where: { code: mod.code },
      update: { name: mod.name, icon: mod.icon, is_platform: !!mod.is_platform, is_core: !!mod.is_core, display_order: mi + 1 },
      create: { code: mod.code, name: mod.name, icon: mod.icon, is_platform: !!mod.is_platform, is_core: !!mod.is_core, display_order: mi + 1 },
    });
    for (const [i, m] of mod.menus.entries()) {
      const menu = await prisma.menu.upsert({
        where: { code: m.code },
        update: { module_id: module.id, name: m.name, path: m.path, icon: m.icon, display_order: i + 1 },
        create: { module_id: module.id, code: m.code, name: m.name, path: m.path, icon: m.icon, display_order: i + 1, platform: m.platform },
      });
      for (const action of m.actions) {
        const code = `${m.code}.${action.toLowerCase()}`;
        await prisma.permission.upsert({
          where: { code },
          update: { name: `${titleCase(action)} ${m.name}` },
          create: { code, menu_id: menu.id, action, name: `${titleCase(action)} ${m.name}` },
        });
      }
    }
  }
}

async function seedRoleMasters() {
  const catalog = await loadPermissionCatalog(prisma);
  for (const [i, rm] of ROLE_MASTERS.entries()) {
    const data = {
      name: rm.name, description: rm.description, scope: rm.scope,
      default_data_scope: rm.data_scope, is_system: !!rm.is_system, display_order: i + 1,
    };
    const master = await prisma.roleMaster.upsert({ where: { code: rm.code }, update: data, create: { code: rm.code, ...data } });
    const ids = expandPatterns(rm.permissions, catalog, rm.scope);
    await prisma.$transaction([
      prisma.roleMasterPermission.deleteMany({ where: { role_master_id: master.id } }),
      prisma.roleMasterPermission.createMany({ data: ids.map((permission_id) => ({ role_master_id: master.id, permission_id })) }),
    ]);
  }
}

async function seedSuperAdmin() {
  const username = (process.env.SUPER_ADMIN_USERNAME ?? "superadmin").toLowerCase();
  const email = (process.env.SUPER_ADMIN_EMAIL ?? "superadmin@panel.local").toLowerCase();
  const password = requireStrongPassword("SUPER_ADMIN_PASSWORD", "SuperAdmin@12345");
  const role = await prisma.roleMaster.findUniqueOrThrow({ where: { code: "SUPER_ADMIN" } });
  return prisma.user.upsert({
    where: { username },
    update: { platform_role_id: role.id }, // never overwrite password on re-seed
    create: {
      username, email, password_hash: await hash(password), first_name: "Super", last_name: "Admin",
      platform_role_id: role.id, status: UserStatus.ACTIVE, must_change_password: isProd, password_changed_at: new Date(),
    },
  });
}

async function upsertCompany(code: string, name: string, parentId: number | null, extra: { city: string; state: string; gstin?: string }) {
  return prisma.company.upsert({
    where: { code },
    update: { name, parent_company_id: parentId },
    create: { code, name, legal_name: `${name} Pvt. Ltd.`, parent_company_id: parentId, email: `info@${code.toLowerCase()}.local`, ...extra },
  });
}

async function upsertMember(username: string, first: string, last: string, password: string) {
  return prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username, email: `${username}@demo.local`, first_name: first, last_name: last,
      password_hash: await hash(password), password_changed_at: new Date(), email_verified_at: new Date(),
    },
  });
}

async function addMembership(opts: {
  userId: number; companyId: number; roleIds: number[]; employeeCode: string; designation: string;
  isDefault?: boolean; reportsToId?: number;
}) {
  const cu = await prisma.companyUser.upsert({
    where: { company_id_user_id: { company_id: opts.companyId, user_id: opts.userId } },
    update: { designation: opts.designation, reports_to_id: opts.reportsToId ?? null },
    create: {
      company_id: opts.companyId, user_id: opts.userId, employee_code: opts.employeeCode,
      designation: opts.designation, is_default: !!opts.isDefault, reports_to_id: opts.reportsToId,
    },
  });
  await prisma.companyUserRole.createMany({
    data: opts.roleIds.map((role_id) => ({ company_id: opts.companyId, company_user_id: cu.id, role_id })),
    skipDuplicates: true,
  });
  return cu;
}

async function seedDemo(superAdminId: number) {
  const pw = requireStrongPassword("DEMO_PASSWORD", "Demo@12345");

  // Group → two subsidiaries
  const group = await upsertCompany("SUNGRID", "SunGrid Energy", null, { city: "Lucknow", state: "Uttar Pradesh", gstin: "09AAAAA0000A1Z5" });
  const rooftop = await upsertCompany("SUNGRID-RT", "SunGrid Rooftop", group.id, { city: "Kanpur", state: "Uttar Pradesh" });
  const utility = await upsertCompany("SUNGRID-UT", "SunGrid Utility Projects", group.id, { city: "Noida", state: "Uttar Pradesh" });

  await enableModules(prisma, group.id, ["LEADS", "SALES", "INVENTORY", "PROJECTS", "REPORTS"]);
  await enableModules(prisma, rooftop.id, ["LEADS", "SALES", "INVENTORY", "PROJECTS", "REPORTS"]);
  await enableModules(prisma, utility.id, ["PROJECTS", "INVENTORY", "REPORTS"]); // no Leads/Sales → menus hidden

  const r = {
    group: await provisionCompanyRoles(prisma, group.id),
    rooftop: await provisionCompanyRoles(prisma, rooftop.id),
    utility: await provisionCompanyRoles(prisma, utility.id),
  };

  const admin = await upsertMember("admin", "Group", "Admin", pw);
  const salesMgr = await upsertMember("sales.manager", "Rohit", "Verma", pw);
  const salesExec = await upsertMember("sales.exec", "Anjali", "Singh", pw);
  const store = await upsertMember("store.manager", "Vikas", "Yadav", pw);
  const pm = await upsertMember("project.manager", "Neha", "Gupta", pw);
  const accounts = await upsertMember("accounts", "Amit", "Mishra", pw);
  const viewer = await upsertMember("viewer", "Read", "Only", pw);

  // admin: group admin (sees whole tree) + explicit membership in rooftop to switch into it
  await addMembership({ userId: admin.id, companyId: group.id, roleIds: [r.group.COMPANY_ADMIN], employeeCode: "SG-001", designation: "Director", isDefault: true });
  await addMembership({ userId: admin.id, companyId: rooftop.id, roleIds: [r.rooftop.COMPANY_ADMIN], employeeCode: "RT-001", designation: "Director" });
  await addMembership({ userId: admin.id, companyId: utility.id, roleIds: [r.utility.COMPANY_ADMIN], employeeCode: "UT-001", designation: "Director" });

  const mgrCu = await addMembership({ userId: salesMgr.id, companyId: rooftop.id, roleIds: [r.rooftop.SALES_MANAGER], employeeCode: "RT-010", designation: "Sales Manager", isDefault: true });
  const execCu = await addMembership({ userId: salesExec.id, companyId: rooftop.id, roleIds: [r.rooftop.SALES_EXECUTIVE], employeeCode: "RT-011", designation: "Sales Executive", isDefault: true, reportsToId: mgrCu.id });
  await addMembership({ userId: store.id, companyId: group.id, roleIds: [r.group.INVENTORY_MANAGER], employeeCode: "SG-020", designation: "Store In-charge", isDefault: true });
  await addMembership({ userId: pm.id, companyId: utility.id, roleIds: [r.utility.PROJECT_MANAGER], employeeCode: "UT-030", designation: "Project Manager", isDefault: true });
  // multi-role example: accountant + viewer in group
  await addMembership({ userId: accounts.id, companyId: group.id, roleIds: [r.group.ACCOUNTANT, r.group.VIEWER], employeeCode: "SG-040", designation: "Accounts Head", isDefault: true });
  await addMembership({ userId: viewer.id, companyId: rooftop.id, roleIds: [r.rooftop.VIEWER], employeeCode: "RT-099", designation: "Auditor", isDefault: true });

  // per-user overrides: exec may approve quotations for 30 days; exec cannot create customers
  const [approveQuote, createCustomer] = await Promise.all([
    prisma.permission.findUniqueOrThrow({ where: { code: "sales.quotations.approve" } }),
    prisma.permission.findUniqueOrThrow({ where: { code: "sales.customers.create" } }),
  ]);
  const until = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  for (const [permission_id, effect, reason, valid_until] of [
    [approveQuote.id, PermissionEffect.GRANT, "Covering manager leave", until],
    [createCustomer.id, PermissionEffect.REVOKE, "Customers created by manager only", null],
  ] as const) {
    await prisma.userPermissionOverride.upsert({
      where: { company_user_id_permission_id: { company_user_id: execCu.id, permission_id } },
      update: {},
      create: { company_id: rooftop.id, company_user_id: execCu.id, permission_id, effect, reason, valid_until, granted_by_id: mgrCu.id },
    });
  }

  // custom (non-template) role example
  const surveyor = await prisma.role.upsert({
    where: { company_id_code: { company_id: rooftop.id, code: "SITE_SURVEYOR" } },
    update: {},
    create: { company_id: rooftop.id, code: "SITE_SURVEYOR", name: "Site Surveyor", data_scope: DataScope.SELF, description: "Custom role created by company admin" },
  });
  const surveyPerms = await prisma.permission.findMany({ where: { code: { in: ["dashboard.overview.view", "leads.site_surveys.view", "leads.site_surveys.edit"] } } });
  await prisma.rolePermission.createMany({ data: surveyPerms.map((p) => ({ role_id: surveyor.id, permission_id: p.id })), skipDuplicates: true });

  await prisma.companyBankAccount.upsert({
    where: { id: (await prisma.companyBankAccount.findFirst({ where: { company_id: group.id, is_primary: true } }))?.id ?? 0 },
    update: {},
    create: { company_id: group.id, bank_name: "State Bank of India", branch_name: "Hazratganj", account_name: "SunGrid Energy Pvt. Ltd.", account_number: "XXXXXXXX1234", ifsc_code: "SBIN0000125", is_primary: true },
  });

  if (await prisma.auditLog.findFirst({ where: { entity_type: "seed" } })) return;
  await prisma.notification.create({
    data: { user_id: salesExec.id, company_id: rooftop.id, title: "Welcome", message: "Your panel account is ready.", type: "INFO" },
  });
  await prisma.auditLog.create({
    data: { user_id: superAdminId, action: AuditAction.CREATE, entity_type: "seed", description: "Demo tenants seeded", metadata: { companies: [group.code, rooftop.code, utility.code] } },
  });
}

async function main() {
  await seedCatalog();
  await seedRoleMasters();
  const superAdmin = await seedSuperAdmin();
  if (!isProd && process.env.SEED_DEMO !== "false") await seedDemo(superAdmin.id);
  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
