import { AuthenticatedRequest } from "../../src/core/types";

import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { Request, Response } from "express";
import { getFYDateRange } from "../../lib/getFinancialYear";
import { decryptData } from "../../lib/apiCryptography";
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";
// import { property } from "../../lib/globalprimsaclient";

// const prop = property;

const getUlbIdOrVerifyGlobalAccess = (
  req: AuthenticatedRequest | Request,
  res: Response,
): number | null | undefined => {
  const user = (req as any).user as any;
  const currentUserType = (user?.userType || "").toUpperCase();
  // console.log(currentUserType, "curr");

  const isPrivileged =
    currentUserType === "SUPER_ADMIN" ||
    currentUserType === "PROJECT_MANAGER" ||
    user?.isPrivilegedUser;
  //  console.log(isPrivileged, "oo");

  const { iv, ed } = req.query;

  if (iv && ed) {
    const data = decryptData({ encryptedData: ed as string, iv: iv as string });
    console.log(data, "data");

    const ulbId = Number(data.ulbId);
    if (!ulbId) {
      genrateResponse(
        res,
        HttpStatus.BadRequest,
        "ulb_id is required in payload",
      );
      return undefined; // signals error was sent
    }
    return ulbId;
  } else {
    if (!isPrivileged) {
      genrateResponse(
        res,
        HttpStatus.Forbidden,
        "Access Denied: ulb_id payload is required for your role",
      );
      return undefined; // signals error was sent
    }
    return null; // Global access (All ULBs)
  }
};

// Total Property
// export const totalProperty = async (
//   req: AuthenticatedRequest,
//   res: Response,
// ) => {
//   try {
//     const ulbId = getUlbIdOrVerifyGlobalAccess(req, res);

//     if (ulbId === undefined) return;

//     const count = await prop.tbl_property_master.count({
//       where: {
//         ...(ulbId ? { ulb_id: ulbId } : {}),
//         recstatus: 1,
//       },
//     });

//     genrateResponse(res, HttpStatus.OK, "Property count fetched", {
//       ulb_id: ulbId,
//       totalProperty: count,
//     });
//   } catch (err: any) {
//     console.error(`[${new Date().toISOString()}]`, err);

//     genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
//   }
// };

// Total Demand
// export const totalDemand = async (req: Request, res: Response) => {
//   try {
//     const ulbId = getUlbIdOrVerifyGlobalAccess(req, res);

//     if (ulbId === undefined) return;

//     const demand = await prop.tbl_property_demand.aggregate({
//       where: {
//         propertyMaster: {
//           ...(ulbId ? { ulb_id: ulbId } : {}),
//           recstatus: 1,
//         },
//       },

//       _sum: {
//         total_tax: true,
//       },
//     });

//     const totalDemand = demand._sum.total_tax ?? 0;

//     genrateResponse(res, HttpStatus.OK, "Total demand fetched", {
//       ulb_id: ulbId,
//       totalDemand,
//     });
//   } catch (err: any) {
//     console.error(`[${new Date().toISOString()}]`, err);

//     genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
//   }
// };

// Total Transaction
// export const totalTransaction = async (req: Request, res: Response) => {
//   try {
//     const ulbId = getUlbIdOrVerifyGlobalAccess(req, res);

//     if (ulbId === undefined) return;

//     const totalTransaction = await prop.tbl_transaction_master.count({
//       where: {
//         propertyMaster: {
//           ...(ulbId ? { ulb_id: ulbId } : {}),
//           recstatus: 1,
//         },
//       },
//     });

//     genrateResponse(res, HttpStatus.OK, "Transaction count fetched", {
//       ulb_id: ulbId,
//       totalTransaction,
//     });
//   } catch (err: any) {
//     console.error(`[${new Date().toISOString()}]`, err);

//     genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
//   }
// };


// export const getPropertyMonthWise = async (req: Request, res: Response) => {
//   try {
//     const ulbId = getUlbIdOrVerifyGlobalAccess(req, res);
//     if (ulbId === undefined) return;

//     const { startDate } = getFYDateRange();

//     const properties = await prop.tbl_property_master.findMany({
//       where: {
//         ...(ulbId ? { ulb_id: ulbId } : {}),
//         recstatus: 1,
//         created_at: {
//           gte: startDate,
//           lte: new Date(),
//         },
//       },
//       select: {
//         created_at: true,
//       },
//     });

//     // Financial year month order
//     const fyMonths = [
//       "Apr",
//       "May",
//       "Jun",
//       "Jul",
//       "Aug",
//       "Sep",
//       "Oct",
//       "Nov",
//       "Dec",
//       "Jan",
//       "Feb",
//       "Mar",
//     ];

//     const monthMap = [
//       "Jan",
//       "Feb",
//       "Mar",
//       "Apr",
//       "May",
//       "Jun",
//       "Jul",
//       "Aug",
//       "Sep",
//       "Oct",
//       "Nov",
//       "Dec",
//     ];

//     const monthCount: Record<string, number> = {};
//     fyMonths.forEach((m) => (monthCount[m] = 0));

//     properties.forEach((p:any) => {
//       const monthName = monthMap[p.created_at.getMonth()];
//       if (monthCount[monthName] !== undefined) {
//         monthCount[monthName]++;
//       }
//     });

//     const graphData = fyMonths.map((month) => ({
//       month,
//       count: monthCount[month],
//     }));

//     return genrateResponse(
//       res,
//       HttpStatus.OK,
//       "Month-wise property data fetched",
//       {
//         ulb_id: ulbId,
//         data: graphData,
//       },
//     );
//   } catch (err: any) {
//     console.error(`[${new Date().toISOString()}]`, err);
//     genrateResponse(
//       res,
//       err?.status || HttpStatus.BadRequest,
//       err?.message || "Something went wrong",
//     );
//   }
// };

// const getCollectionData = async (
//   db: any,
//   tableName: string,
//   ulbId: number | null,
//   ulbColumn: string,
// ) => {
//   const now = new Date();

//   const todayStart = startOfDay(now);
//   const weekStart = startOfWeek(now, { weekStartsOn: 1 });
//   const monthStart = startOfMonth(now);
//   const yearStart = startOfYear(now);

//   const table = db[tableName];

//   const ulbFilter = ulbId !== null ? { [ulbColumn]: ulbId } : {};

//   const [today, weekly, monthly, yearly] = await Promise.all([
//     table.aggregate({
//       _sum: { paid_amount: true },
//       where: {
//         recstatus: 1,
//         ...ulbFilter,
//         trans_date: {
//           gte: todayStart,
//         },
//       },
//     }),

//     table.aggregate({
//       _sum: { paid_amount: true },
//       where: {
//         recstatus: 1,
//         ...ulbFilter,
//         trans_date: {
//           gte: weekStart,
//         },
//       },
//     }),

//     table.aggregate({
//       _sum: { paid_amount: true },
//       where: {
//         recstatus: 1,
//         ...ulbFilter,
//         trans_date: {
//           gte: monthStart,
//         },
//       },
//     }),

//     table.aggregate({
//       _sum: { paid_amount: true },
//       where: {
//         recstatus: 1,
//         ...ulbFilter,
//         trans_date: {
//           gte: yearStart,
//         },
//       },
//     }),
//   ]);

//   return {
//     today: today._sum.paid_amount || 0,
//     weekly: weekly._sum.paid_amount || 0,
//     monthly: monthly._sum.paid_amount || 0,
//     yearly: yearly._sum.paid_amount || 0,
//   };
// };

// export const collectionDashboard = async (
//   req: AuthenticatedRequest,
//   res: Response,
// ) => {
//   try {
//     const ulbId = getUlbIdOrVerifyGlobalAccess(req, res);

//     if (ulbId === undefined) return;

//     const property = await getCollectionData(prop, "tbl_transaction_master", ulbId, "ulb_id");
//     const dummyCollection = { today: 0, weekly: 0, monthly: 0, yearly: 0 };

//     genrateResponse(
//       res,
//       HttpStatus.OK,
//       "Collection dashboard fetched successfully",
//       {
//         property,
//         waste: dummyCollection,
//         water: dummyCollection,
//       },
//     );
//   } catch (err: any) {
//     console.error(`[${new Date().toISOString()}]`, err);

//     genrateResponse(
//       res,
//       err?.status || HttpStatus.BadRequest,
//       err?.message || "Something went wrong",
//     );
//   }
// };

// export const collectionDashboardMobile = async (
//   req: AuthenticatedRequest,
//   res: Response,
// ) => {
//   try {
//     const ulb_id = Number(req.query.ulb_id);

//     if (!ulb_id) {
//       return genrateResponse(res, HttpStatus.BadRequest, "ulb_id is required");
//     }

//     const property = await getCollectionData(prop, "tbl_transaction_master", ulb_id, "ulb_id");
//     const dummyCollection = { today: 0, weekly: 0, monthly: 0, yearly: 0 };

//     return genrateResponse(
//       res,
//       HttpStatus.OK,
//       "Collection dashboard fetched successfully",
//       {
//         property,
//         waste: dummyCollection,
//         water: dummyCollection,
//       },
//     );
//   } catch (err: any) {
//     console.error(`[${new Date().toISOString()}]`, err);

//     return genrateResponse(
//       res,
//       err?.status || HttpStatus.BadRequest,
//       err?.message || "Something went wrong",
//     );
//   }
// };

