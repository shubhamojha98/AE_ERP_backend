import express from 'express';
import { create, getAll as getAllRoles, getById as getRoleById, update as updateRole, toggle } from "../../controller/panel/role.controller"
import { create as createPermission, getAll, getOne, update as updatePermission, toggle as togglePermission } from "../../controller/panel/permission.controller"
import { createUlb, createUlbType, getAllUlbs, getAllUlbType, getById, toggleUlb, toggleUlbType, update, updateUlbType } from '../../controller/panel/ulb.controller_global';
import { createMenuPanel, getAllMenu, getMenuById, toggleMenu, updateMenuById } from '../../controller/panel/menu.controller';
import { createAgency, getAgencyById, getAllAgency, toggleAgency, updateAgencyById } from '../../controller/panel/agency.controller';
import { createModule, getAllModule, getModuleById, toggleModule, updateModuleById } from '../../controller/panel/module.controller';
import { createZoneList, getAllZoneList, getZoneById, togglezone, updateZoneById } from '../../controller/panel/zone.controller_global';
import { createWardList,  getAllWard,  getWardById, getWardList, toggleWard, updateWardById } from '../../controller/panel/ward.controller_global';
import { createBank, getAllBank, getBankById, toggleBank, updateBankById } from '../../controller/panel/bank.controller';
import { connectUlb, createEmployeeWithUser, disconnectUlb, getAllEmployeeWithUser, getEmplyoeeWithUserId, getModuleByEmployeeId, mapPermissionToUser, mapWardsToUser, toggleUserStatus, updateEmployeeWithUser } from '../../controller/panel/employee.controller';
import { upload } from '../../middleware/upload.middleware';

import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../controller/panel/notification.controller';


const router = express.Router()

//Permission
router.post('/master/permission', createPermission)
router.get('/master/permission', getAll)
router.get('/master/permission/by-id', getOne)
router.put('/master/permission', updatePermission)
router.put('/master/permission/toggle', togglePermission)

//Role
router.post('/master/role', create)
router.get('/master/role', getAllRoles)
router.get('/master/role/by-id', getRoleById)
router.put('/master/role', updateRole)
router.put('/master/role/toggle', toggle)

// ***************ULB_Type*********************//
router.post('/master/ulbType', createUlbType)
router.get('/master/ulbType', getAllUlbType)
router.put('/master/ulbType', updateUlbType)
router.put('/master/ulbType/toggle', toggleUlbType)

// ***************ULB_Master *********************//
router.post('/master/ulb', createUlb)
router.get('/master/ulb', getAllUlbs)
router.get('/master/ulb/by-id', getById)
router.put('/master/ulb', update)
router.put('/master/ulb/toggle', toggleUlb)

// ***********Menu************//
router.post('/master/menu', createMenuPanel)
router.get('/master/menu', getAllMenu)
router.get('/master/menu/by-id', getMenuById)
router.put('/master/menu', updateMenuById)
router.put('/master/menu/toggle', toggleMenu)

// *******Agency***********//
router.post('/master/agency', createAgency)
router.get('/master/agency', getAllAgency)
router.get('/master/agency/by-id', getAgencyById)
router.put('/master/agency', updateAgencyById)
router.put('/master/agency/toggle', toggleAgency)

// **********Module***********//
router.post('/master/module', createModule)
router.get('/master/module', getAllModule)
router.get('/master/module/by-id', getModuleById)
router.put('/master/module', updateModuleById)
router.put('/master/module/toggle', toggleModule)

// ************Zone List************//
router.post('/master/zoneList', createZoneList)
router.get('/master/zoneList', getAllZoneList)
router.get('/master/zone/by-id', getZoneById)
router.put('/master/zoneList', updateZoneById)
router.put('/master/zone/toggle', togglezone)

// **********Ward List******************//
router.post('/master/wardList', createWardList)
router.get('/master/wardList', getWardList)
router.get('/master/allWards', getAllWard)
router.get('/master/wardList/by-id', getWardById)
router.put('/master/wardList', updateWardById)
router.put('/master/ward/toggle', toggleWard)
// router.get('/master/get-zone', getUniqueZone)


// **********Bank*********************//
router.post('/master/bank', createBank)
router.get('/master/bank', getAllBank)
router.get('/master/bank/by-id', getBankById)
router.put('/master/bank', updateBankById)
router.put('/master/bank/toggle', toggleBank)

// *********Employee******************//
router.post('/master/employee', upload.single('profile'), createEmployeeWithUser)
router.get('/master/employee', getAllEmployeeWithUser)
router.get('/master/employee/by-id', getEmplyoeeWithUserId)
router.put('/master/employee', upload.single('profile'), updateEmployeeWithUser)
router.put('/master/employee/toggle', toggleUserStatus)
router.put('/master/employee/connect-ulb', connectUlb)
router.put('/master/employee/disconnect-ulb', disconnectUlb)
router.put('/master/employee/map-wards', mapWardsToUser)
router.put('/master/employee/map-permission', mapPermissionToUser)
router.get('/master/employee/getMenuWithEmployee-id', getModuleByEmployeeId)


// ===================== Notification routes (minimal & non-breaking) =====================

router.get('/master/notifications', getNotifications)                 
router.patch('/master/notifications/read/:id', markNotificationRead) 
router.patch('/master/notifications/read-all', markAllNotificationsRead) 


export default router