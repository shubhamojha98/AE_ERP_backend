import express from 'express'
import { dynamicCheckPermission } from '../../middleware/dynamicPermission'

const router = express.Router()

// router.get('/getAllProperty', dynamicCheckPermission(), totalProperty)
// router.get('/getAllTotalDemand', dynamicCheckPermission(), totalDemand)
// router.get('/getAllTransaction', dynamicCheckPermission(), totalTransaction)
// router.get('/property/month-wise', dynamicCheckPermission(), getPropertyMonthWise)


// // collection record
// router.get('/collection', dynamicCheckPermission(), collectionDashboard)

export default router
