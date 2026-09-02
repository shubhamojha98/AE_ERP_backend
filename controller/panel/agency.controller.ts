import { AuthenticatedRequest } from "../../src/core/types";
import { AuthPayload } from "../../type/common.type";
import { PrismaClient as panelClient } from '../../generated/panel'
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { extractPayload, encryptData } from "../../lib/apiCryptography";
import { handlePrismaError } from "../../lib/prismaErrorHandler";
import { Request, Response } from "express";

const panel = new panelClient()

export const createAgency = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = extractPayload(req.body);
    const { agencyName, ulb_id } = data;

    const agency = await panel.agency.create({
      data: {
        name: agencyName.trim(),
        ulb_id: ulb_id,
      },
    });
    genrateResponse(
      res,
      HttpStatus.OK,
      'Agency created successfully',
      encryptData(agency)
    )
  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
}

export const getAllAgency = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit

    const totalCount = await panel.agency.count()

    const agency = await panel.agency.findMany({
      skip,
      take: limit,
      include: {
        ulb: {
          select: {
            name: true
          }
        }
      },
      orderBy: { id: "desc" }
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      'All Agency fetched successfully',
      encryptData({ data: agency, pagination: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) })
    )
  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
}

export const getAgencyById = async (req: Request, res: Response) => {
  try {
    const data = extractPayload(req.query);

    const agency = await panel.agency.findUnique({
      where: { id: Number(data?.id) }
    });
    if (!agency) {
      return genrateResponse(res, HttpStatus.BadRequest, 'Agency not found')
    }
    genrateResponse(
      res,
      HttpStatus.OK,
      'Agency Fetched successfully',
      encryptData(agency)
    )

  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
}

export const updateAgencyById = async (req: Request, res: Response) => {
  try {
    const data = extractPayload(req.body);

    const agencyUpdate = await panel.agency.update({
      where: { id: Number(data.id) },
      data: {
        name: data.agencyName,
        ...(data?.ulb_id && { ulb_id: Number(data?.ulb_id) })
      }
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      'Agency Updated Successfully',
      encryptData(agencyUpdate)
    )

  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
}

export const toggleAgency = async (req: Request, res: Response) => {
  try {
    const data = extractPayload(req.body);

    const prevStatus = await panel.agency.findUnique({
      where: { id: Number(data?.id) },
      select: { recstatus: true, is_active: true },
    });

    if (!prevStatus) {
      return genrateResponse(res, HttpStatus.NotFound, "Not Found")
    }

    const newStatus = prevStatus.recstatus === 1 ? 0 : 1;
    const newIsActive = !prevStatus.is_active;

    const updatedStatus = await panel.agency.update({
      where: { id: Number(data?.id) },
      data: {
        recstatus: newStatus,
        is_active: newIsActive
      }
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      `Agency toggled to ${updatedStatus.recstatus} successfully`,
      encryptData(updatedStatus)
    )

  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
}


