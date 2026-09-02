import { Prisma, PrismaClient, ActionType } from "../generated/panel";
// import { PrismaClient as SafPrisma } from "../generated/saf";
import { panel } from "../lib/globalprimsaclient";

const prisma = new PrismaClient();
// const saf = new SafPrisma()

//*********************************************************************// Permission Related DAL Functions *********************************************************************//
//*********************************************************************// Menu Action (Permission) DAL Functions *********************************************************************//
export const createMenuAction = async (dataArray: { menu_id: number, action: ActionType, label: string }[]) => {
    return await prisma.menu_action.createMany({
        data: dataArray
    });
}

export const getMenuAction = async (id: number) => {
    return await prisma.menu_action.findUnique({
        where: { id: id }
    });
}

export const getMenuActions = async (filters?: { label?: string }, pagination?: { page?: number; limit?: number }) => {
    const where: Prisma.menu_actionWhereInput = {
        AND: [
            filters?.label ? { label: { contains: filters.label, mode: 'insensitive' } } : {},
        ],
    };

    const page = pagination?.page && pagination.page > 0 ? pagination.page : 1;
    const limit = pagination?.limit && pagination.limit > 0 ? pagination.limit : 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        prisma.menu_action.findMany({
            where,
            orderBy: { id: 'desc' },
            skip,
            take: limit,
        }),
        prisma.menu_action.count({ where }),
    ]);

    return {
        data,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
}



//*********************************************************************// Role Related DAL Functions *********************************************************************//
export const createMenu = async (module_id: number, label: string, path: string, parent_id?: number, order?: number) => {
    return await prisma.menu.create({
        data: {
            module_id: module_id,
            label: label,
            path: path,
            ...(order && { order: order }),
            ...(parent_id && { parentId: parent_id })
        },
    });
}

export const createRole = async (roleName: string, ulb_id: number, actionIds: number[]) => {
    return await prisma.role.create({
        data: {
            name: roleName,
            ulb_id: ulb_id,
            role_menu_actions: {
                create: actionIds.map(id => ({
                    menu_action_id: id,
                    ulb_id: ulb_id
                }))
            }
        },
    });
}

export const getRoles = async (filters?: { name?: string; recstatus?: string }, pagination?: { page?: number; limit?: number }) => {
    const where: Prisma.roleWhereInput = {
        AND: [
            filters?.name ? { name: { contains: filters.name, mode: 'insensitive' } } : {},
            filters?.recstatus ? { recstatus: { equals: Number(filters.recstatus) } } : {}
        ],
    };

    const page = pagination?.page && pagination.page > 0 ? pagination.page : 1;
    const limit = pagination?.limit && pagination.limit > 0 ? pagination.limit : 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        prisma.role.findMany({
            where,
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
        }),
        prisma.role.count({ where }),
    ]);

    return {
        data,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
}

export const toggleRole = async (id: number) => {
    const prevStatus = await prisma.role.findUnique({
        where: { id: id },
        select: { recstatus: true }
    })

    const newStatus = prevStatus?.recstatus === 1 ? 0 : 1;

    return await prisma.role.update({
        where: { id: id },
        data: { recstatus: newStatus }
    });
}

/**
 * Enterprise Permission Discovery
 */
export async function getUserEffectivePermissions(user_id: number, ulb_id: number) {
    // 1. Check User Overrides
    const overrides = await prisma.user_permission.findMany({
        where: { user_id, ulb_id, is_active: true },
        include: { menu_action: true }
    });

    // 2. Fetch RBAC Role Mappings
    const mapping = await prisma.ulb_user_mapping.findUnique({
        where: { user_id_ulb_id: { user_id, ulb_id } },
        include: { role: { include: { role_menu_actions: { include: { menu_action: true } } } } }
    });

    const activePermissions = new Set<string>();

    // Add Role-based permissions
    mapping?.role.role_menu_actions.forEach(rma => {
        if (rma.is_active) activePermissions.add(`${rma.menu_action.menu_id}:${rma.menu_action.action}`);
    });

    // Apply User Overrides
    overrides.forEach(ov => {
        const key = `${ov.menu_action.menu_id}:${ov.menu_action.action}`;
        if (ov.effect === 'GRANT') {
            activePermissions.add(key);
        } else {
            activePermissions.delete(key);
        }
    });

    return Array.from(activePermissions);
}

export async function getAuthorizedMenus(user_id: number, ulb_id: number) {
    const effectivePerms = await getUserEffectivePermissions(user_id, ulb_id);
    const menuIds = new Set(effectivePerms.map(p => parseInt(p.split(':')[0])));

    return await prisma.menu.findMany({
        where: { id: { in: Array.from(menuIds) }, is_active: true },
        include: { children: true }
    });
}


export const getEmployeeNames = async (userIds: number[]) => {
  if (!userIds.length) return {};

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      employee: {
        select: {
          empFirstName: true,
          empLastName: true,
        },
      },
    },
  });

  const result: Record<number, string | null> = {};

  users.forEach((u) => {
    if (u.employee) {
      result[u.id] = `${u.employee.empFirstName} ${u.employee.empLastName}`;
    } else {
      result[u.id] = null;
    }
  });

  return result;
};


export const getUlbName = async(ulbId:number)=>{
    const data = await panel.ulb_master.findFirst({
        where:{id: ulbId},
        select:{
            name:true
        }
    })
    return data?.name;
}

export const getZoneName = async(zoneId:number)=>{
    const data = await panel.zone_master.findFirst({
        where:{id:zoneId},
        select:{
            name:true
        }

    })
    return data?.name
}
export const getWardName = async (wardId: number) => {
  const data = await panel.ward_master.findFirst({
    where: { id: wardId },
    select: {
      name: true, // ⚠️ change to ward_name if needed
    },
  });

  return data?.name;
};

