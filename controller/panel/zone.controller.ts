import { AuthenticatedRequest } from "../../src/core/types";
import { AuthPayload } from "../../type/common.type";
import { PrismaClient as panelClient } from '../../generated/panel'
import genrateResponse from "../../lib/generateResponse";
import { Request, Response } from "express";
import HttpStatus from "../../lib/httpStatus";
import { extractPayload, encryptData } from "../../lib/apiCryptography";
import { handlePrismaError } from "../../lib/prismaErrorHandler";

const panel = new panelClient()


export const createZoneList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = extractPayload(req.body);
    const { zoneListName, zoneAddress, zoneCommissioner, zoneCommissionerNo, tollfreeNo, latitude, longitude, zoneCode, ulb_id } = data;

    const zoneList = await panel.zone_master.create({
      data: {
        name: zoneListName,
        zonecode: zoneCode,
        ulb_id: ulb_id,
        zone_address: zoneAddress,
        zone_commissioner: zoneCommissioner,
        commissioner_contact: zoneCommissionerNo,
        tollFree_No: tollfreeNo,
        latitude: latitude,
        longitude: longitude
      },
    });
    genrateResponse(
      res,
      HttpStatus.OK,
      'Zone created successfully',
      encryptData(zoneList)
    )
  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
}

export const getAllZoneList = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit
    const ulb_id = req.query.ulb_id ? Number(req.query.ulb_id) : undefined;

    const whereClause: any = {};
    if (ulb_id) {
      whereClause.ulb_id = ulb_id;
    }

    const totalCount = await panel.zone_master.count({ where: whereClause })
    const zoneList = await panel.zone_master.findMany({
      skip,
      take: limit,
      where: whereClause,
      include: { ulb: true },
      orderBy: { id: "desc" }
    })

    genrateResponse(
      res,
      HttpStatus.OK,
      'All Zone List fetched successfully',
      encryptData({
        data: zoneList,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      })
    )

  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
}

export const getZoneById = async (req: Request, res: Response) => {
  try {
    const data = extractPayload(req.query);

    const zone = await panel.zone_master.findUnique({
      where: { id: Number(data?.id) }
    })
    if (!zone) {
      return genrateResponse(res, HttpStatus.NotFound, 'Zone Not found')
    }
    genrateResponse(
      res,
      HttpStatus.OK,
      'Zone fetched successfully',
      encryptData(zone)
    )
  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
}

export const updateZoneById = async (req: Request, res: Response) => {
  try {
    const data = extractPayload(req.body);

    const zoneUpdate = await panel.zone_master.update({
      where: { id: Number(data.id) },
      data: {
        name: data.zoneListName,
        zonecode: data.zoneCode,
        ulb_id: Number(data.ulb_id),
        zone_address: data.zoneAddress,
        zone_commissioner: data.zoneCommissioner,
        commissioner_contact: data.zoneCommissionerNo,
        tollFree_No: data.tollfreeNo,
        latitude: data.latitude,
        longitude: data.longitude
      }
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      'Zone Updated Successfully',
      encryptData(zoneUpdate)
    )

  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
}

export const togglezone = async (req: Request, res: Response) => {
  try {
    const data = extractPayload(req.body);

    const prevStatus = await panel.zone_master.findUnique({
      where: { id: Number(data?.id) },
      select: { recstatus: true, is_active: true },
    });

    if (!prevStatus) {
      return genrateResponse(res, HttpStatus.NotFound, "Not Found")
    }

    const newStatus = prevStatus.recstatus === 1 ? 0 : 1;
    const newIsActive = !prevStatus.is_active;

    const updatedStatus = await panel.zone_master.update({
      where: { id: Number(data?.id) },
      data: {
        recstatus: newStatus,
        is_active: newIsActive
      }
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      `Zone toggled to ${updatedStatus.recstatus} successfully`,
      encryptData(updatedStatus)
    )

  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
}
