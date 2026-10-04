import { DataScope, PermissionAction as A, PlatformType, RoleScope } from "../generated/panel";

const CRUD = [A.VIEW, A.CREATE, A.EDIT, A.DELETE];

export type MenuDef = { code: string; name: string; path: string; icon?: string; actions: A[]; platform?: PlatformType };
export type ModuleDef = { code: string; name: string; icon: string; is_platform?: boolean; is_core?: boolean; menus: MenuDef[] };

export const MODULES: ModuleDef[] = [
  {
    code: "PLATFORM", name: "Platform Console", icon: "shield", is_platform: true,
    menus: [
      { code: "platform.companies", name: "Companies", path: "/platform/companies", actions: [...CRUD, A.EXPORT] },
      { code: "platform.role_masters", name: "Role Master", path: "/platform/role-masters", actions: CRUD },
      { code: "platform.modules", name: "Modules & Menus", path: "/platform/modules", actions: [A.VIEW, A.EDIT] },
      { code: "platform.users", name: "All Users", path: "/platform/users", actions: [A.VIEW, A.EDIT, A.EXPORT] },
    ],
  },
  {
    code: "DASHBOARD", name: "Dashboard", icon: "layout-dashboard", is_core: true,
    menus: [{ code: "dashboard.overview", name: "Overview", path: "/dashboard", actions: [A.VIEW] }],
  },
  {
    code: "LEADS", name: "Leads", icon: "target",
    menus: [
      { code: "leads.leads", name: "Leads", path: "/leads", actions: [...CRUD, A.ASSIGN, A.IMPORT, A.EXPORT] },
      { code: "leads.followups", name: "Follow-ups", path: "/leads/follow-ups", actions: CRUD },
      { code: "leads.site_surveys", name: "Site Surveys", path: "/leads/site-surveys", actions: [...CRUD, A.APPROVE, A.ASSIGN] },
    ],
  },
  {
    code: "SALES", name: "Sales", icon: "indian-rupee",
    menus: [
      { code: "sales.customers", name: "Customers", path: "/sales/customers", actions: [...CRUD, A.EXPORT, A.IMPORT] },
      { code: "sales.quotations", name: "Quotations", path: "/sales/quotations", actions: [...CRUD, A.APPROVE, A.PRINT, A.EXPORT] },
      { code: "sales.orders", name: "Sales Orders", path: "/sales/orders", actions: [...CRUD, A.APPROVE, A.PRINT, A.EXPORT] },
      { code: "sales.invoices", name: "Invoices", path: "/sales/invoices", actions: [...CRUD, A.APPROVE, A.PRINT, A.EXPORT] },
      { code: "sales.payments", name: "Payments", path: "/sales/payments", actions: [...CRUD, A.APPROVE, A.EXPORT] },
    ],
  },
  {
    code: "INVENTORY", name: "Inventory", icon: "package",
    menus: [
      { code: "inventory.products", name: "Products", path: "/inventory/products", actions: [...CRUD, A.IMPORT, A.EXPORT] },
      { code: "inventory.warehouses", name: "Warehouses", path: "/inventory/warehouses", actions: CRUD },
      { code: "inventory.stock", name: "Stock", path: "/inventory/stock", actions: [A.VIEW, A.EDIT, A.EXPORT] },
      { code: "inventory.vendors", name: "Vendors", path: "/inventory/vendors", actions: [...CRUD, A.EXPORT] },
      { code: "inventory.purchase_orders", name: "Purchase Orders", path: "/inventory/purchase-orders", actions: [...CRUD, A.APPROVE, A.PRINT, A.EXPORT] },
      { code: "inventory.transfers", name: "Stock Transfers", path: "/inventory/transfers", actions: [...CRUD, A.APPROVE] },
    ],
  },
  {
    code: "PROJECTS", name: "Projects", icon: "sun",
    menus: [
      { code: "projects.projects", name: "Projects", path: "/projects", actions: [...CRUD, A.ASSIGN, A.EXPORT] },
      { code: "projects.installations", name: "Installations", path: "/projects/installations", actions: [...CRUD, A.ASSIGN] },
      { code: "projects.subsidy", name: "Subsidy & Net Metering", path: "/projects/subsidy", actions: [...CRUD, A.APPROVE] },
      { code: "projects.commissioning", name: "Commissioning", path: "/projects/commissioning", actions: [A.VIEW, A.CREATE, A.EDIT, A.APPROVE, A.PRINT] },
      { code: "projects.service", name: "Service & AMC", path: "/projects/service", actions: [...CRUD, A.ASSIGN] },
    ],
  },
  {
    code: "REPORTS", name: "Reports", icon: "bar-chart-3",
    menus: [
      { code: "reports.sales", name: "Sales Reports", path: "/reports/sales", actions: [A.VIEW, A.EXPORT, A.PRINT] },
      { code: "reports.inventory", name: "Inventory Reports", path: "/reports/inventory", actions: [A.VIEW, A.EXPORT, A.PRINT] },
      { code: "reports.projects", name: "Project Reports", path: "/reports/projects", actions: [A.VIEW, A.EXPORT, A.PRINT] },
    ],
  },
  {
    code: "ADMIN", name: "Administration", icon: "settings", is_core: true,
    menus: [
      { code: "admin.company", name: "Company Profile", path: "/admin/company", actions: [A.VIEW, A.EDIT] },
      { code: "admin.sub_companies", name: "Sub Companies", path: "/admin/sub-companies", actions: [A.VIEW, A.CREATE, A.EDIT] },
      { code: "admin.users", name: "Users", path: "/admin/users", actions: [...CRUD, A.EXPORT] },
      { code: "admin.roles", name: "Roles & Permissions", path: "/admin/roles", actions: CRUD },
      { code: "admin.audit_logs", name: "Audit Logs", path: "/admin/audit-logs", actions: [A.VIEW, A.EXPORT] },
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
export type RoleMasterDef = {
  code: string; name: string; description: string; scope: RoleScope;
  data_scope: DataScope; is_system?: boolean; permissions: string[];
};

export const ROLE_MASTERS: RoleMasterDef[] = [
  {
    code: "SUPER_ADMIN", name: "Super Admin", scope: RoleScope.PLATFORM, data_scope: DataScope.COMPANY_TREE, is_system: true,
    description: "Developer-managed platform owner. Bypasses company RBAC.", permissions: [],
  },
  {
    code: "COMPANY_ADMIN", name: "Company Admin", scope: RoleScope.COMPANY, data_scope: DataScope.COMPANY_TREE, is_system: true,
    description: "Full access inside the company and its sub-companies.", permissions: ["*"],
  },
  {
    code: "SALES_MANAGER", name: "Sales Manager", scope: RoleScope.COMPANY, data_scope: DataScope.TEAM,
    description: "Owns leads and sales pipeline for the team.",
    permissions: ["dashboard.overview", "LEADS", "SALES", "reports.sales", "inventory.products:VIEW", "inventory.stock:VIEW", "projects.projects:VIEW"],
  },
  {
    code: "SALES_EXECUTIVE", name: "Sales Executive", scope: RoleScope.COMPANY, data_scope: DataScope.SELF,
    description: "Works own leads, surveys and quotations.",
    permissions: [
      "dashboard.overview", "leads.leads:VIEW,CREATE,EDIT", "leads.followups:VIEW,CREATE,EDIT",
      "leads.site_surveys:VIEW,CREATE,EDIT", "sales.customers:VIEW,CREATE,EDIT",
      "sales.quotations:VIEW,CREATE,EDIT,PRINT", "inventory.products:VIEW",
    ],
  },
  {
    code: "INVENTORY_MANAGER", name: "Inventory Manager", scope: RoleScope.COMPANY, data_scope: DataScope.COMPANY,
    description: "Products, stock, vendors and purchase.",
    permissions: ["dashboard.overview", "INVENTORY", "reports.inventory", "sales.orders:VIEW", "projects.projects:VIEW"],
  },
  {
    code: "PROJECT_MANAGER", name: "Project Manager", scope: RoleScope.COMPANY, data_scope: DataScope.COMPANY,
    description: "Installation, subsidy, commissioning and service.",
    permissions: [
      "dashboard.overview", "PROJECTS", "reports.projects", "sales.customers:VIEW", "sales.orders:VIEW",
      "inventory.stock:VIEW", "inventory.transfers:VIEW,CREATE",
    ],
  },
  {
    code: "ACCOUNTANT", name: "Accountant", scope: RoleScope.COMPANY, data_scope: DataScope.COMPANY,
    description: "Invoices, payments and financial reports.",
    permissions: [
      "dashboard.overview", "sales.invoices", "sales.payments", "sales.orders:VIEW,PRINT,EXPORT",
      "sales.customers:VIEW", "inventory.purchase_orders:VIEW,APPROVE,PRINT", "inventory.vendors:VIEW",
      "reports.sales", "reports.inventory",
    ],
  },
  {
    code: "VIEWER", name: "Viewer", scope: RoleScope.COMPANY, data_scope: DataScope.COMPANY,
    description: "Read-only access to business modules.", permissions: ["DASHBOARD", "LEADS:VIEW", "SALES:VIEW", "INVENTORY:VIEW", "PROJECTS:VIEW", "REPORTS:VIEW"],
  },
];
