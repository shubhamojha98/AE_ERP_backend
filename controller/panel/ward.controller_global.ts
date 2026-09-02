import { AuthenticatedRequest } from "../../src/core/types";
import { AuthPayload } from "../../type/common.type";
import { PrismaClient as panelClient } from '../../generated/panel'
import { Request, Response } from "express";
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { extractPayload, encryptData } from "../../lib/apiCryptography";

const panel = new panelClient()

export const createWardList = async (req: Request, res: Response) => {
  try {
    const { zoneId, wardNo, wardName, wardCode, wardArea, ulb_id } = req.body;
    const wardList = await panel.ward_master.create({
      data: {
        zone_id: zoneId,
        ulb_id: ulb_id,
        ward_no: wardNo,
        name: wardName,
        ward_code: wardCode,
        area: wardArea,
      },
    });
    genrateResponse(
      res,
      HttpStatus.OK,
      'Ward created successfully',
      encryptData(wardList)
    )
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message as string
    );
  }
}

export const getWardList = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const zoneId = req.query.zoneId ? Number(req.query.zoneId) : null;

    const whereCondition: any = {};
    if (zoneId) {
      whereCondition.zone_id = zoneId;
    }

    const totalCount = await panel.ward_master.count({
      where: whereCondition,
    });


    const wardList = await panel.ward_master.findMany({
      where: whereCondition,
      skip,
      take: limit,
      include: {
        zone: true,
      },
      orderBy: { id: "desc" },
    });

    genrateResponse(
      res,
      HttpStatus.OK,
      "Ward list fetched successfully",
      encryptData({
        data: wardList,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      })
    );
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message as string
    );
  }
};

export const getAllWard = async (req: Request, res: Response) => {
  try {
    const data = await panel.ward_master.findMany()
    genrateResponse(
      res,
      HttpStatus.OK,
      'All Wards fetched successfully',
      encryptData(data)

    )
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message as string
    )
  }
}

export const getWardById = async (req: Request, res: Response) => {
  try {
    const data = extractPayload(req.query);

    const zone = await panel.ward_master.findUnique({
      where: { id: Number(data?.id) }
    })
    if (!zone) {
      return genrateResponse(res, HttpStatus.NotFound, 'Ward Not found')
    }
    genrateResponse(
      res,
      HttpStatus.OK,
      'Ward fetched successfully',
      encryptData(zone)
    )
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
  }
}

export const updateWardById = async (req: Request, res: Response) => {
  try {
    const data = extractPayload(req.body);

    const wardUpdate = await panel.ward_master.update({
      where: { id: Number(data.id) },
      data: {
        zone_id: data.zoneId,
        ward_no: data.wardNo,
        name: data.wardName,
        ward_code: data.wardCode,
        area: data.wardArea,
      }
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      'Ward Updated Successfully',
      encryptData(wardUpdate)
    )

  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(res, err?.status || HttpStatus.BadRequest, err?.message);
  }
}

export const toggleWard = async (req: Request, res: Response) => {
  try {
    const data = extractPayload(req.body);

    const prevStatus = await panel.ward_master.findUnique({
      where: { id: Number(data?.id) },
      select: { recstatus: true },
    });

    if (!prevStatus) {
      return genrateResponse(res, HttpStatus.NotFound, "Not Found")
    }

    const newStatus = prevStatus.recstatus === 1 ? 0 : 1;

    const updatedStatus = await panel.ward_master.update({
      where: { id: Number(data?.id) },
      data: { recstatus: newStatus }
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      `Ward toggled to ${updatedStatus.recstatus} successfully`,
      encryptData(updatedStatus)
    )

  } catch (err: any) {
    console.error(`[${new Date().toISOString()}]`, err);
    genrateResponse(
      res,
      err?.status || HttpStatus.BadRequest,
      err?.message as string
    );
  }
}


// helpers/zoneHelper.ts
export const fetchUniqueZones = async (user: any) => {
  if (!user.ward || user.ward.length === 0) return [];

  const wardIds = user.ward.map((w: any) => w.id);

  const wards = await panel.ward_master.findMany({
    where: { id: { in: wardIds } },
    select: { zone_id: true },
  });

  const uniqueZone = Array.from(new Set(wards.map(w => w.zone_id)));

  return uniqueZone;
};
