import { Request, Response } from 'express';
import { PrismaClient as panelClient } from '../../generated/panel'
import convertBigIntToString from '../../lib/bigIntConversion';
import genrateResponse from '../../lib/generateResponse';
import HttpStatus from '../../lib/httpStatus';
import { extractPayload, encryptData } from '../../lib/apiCryptography';
import { SecurityCache } from '../../src/core/SecurityCache';
import { handlePrismaError } from '../../lib/prismaErrorHandler';
import socketService from '../../services/socket-service';

const panel = new panelClient()

// *******************ULB Type*********************//

export const createUlbType = async (req: Request, res: Response) => {
  try {
    const data = extractPayload(req.body);
    const { ulbTypeName: name } = data;

    const ulb = await panel.ulb_type.create({
      data: {
        name
      },
    })
    genrateResponse(
      res,
      HttpStatus.OK,
      'ULB type created successfully',
      encryptData(ulb) // returns all columns
    )
  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
}


export const getAllUlbType = async (req: Request, res: Response) => {
  try {
    // read query params (default page = 1, limit = 10)
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // get data with pagination (descending order)
    const ulbType = await panel.ulb_type.findMany({
      skip,
      take: limit,
      orderBy: { id: "desc" }
    });

    // get total count
    const total = await panel.ulb_type.count();

    genrateResponse(
      res,
      HttpStatus.OK,
      "ULB Types fetched successfully",
      encryptData({
        data: ulbType,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      })
    );
  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
};



/**
 * UPDATE ULB Type
 */
export const updateUlbType = async (req: Request, res: Response) => {
  try {

    const data = extractPayload(req.body);

    const ulbType = await panel.ulb_type.update({
      where: { id: Number(data.ulbTypeId) },
      data: {
        name: data.ulbTypeName,
      },
    });

    genrateResponse(
      res,
      HttpStatus.OK,
      'ULB type updated successfully',
      encryptData(ulbType)
    );
  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
};


/**
 * DELETE ULB Type
 */
export const toggleUlbType = async (req: Request, res: Response) => {
  try {
    const data = extractPayload(req.body);

    // find current status
    const prevStatus = await panel.ulb_type.findUnique({
      where: { id: Number(data?.id) },
      select: { recstatus: true },
    });

    if (!prevStatus) {
      return genrateResponse(res, HttpStatus.NotFound, "ULB Type not found");
    }

    // toggle status
    const newStatus = prevStatus.recstatus === 1 ? 0 : 1;

    const updatedUlb = await panel.ulb_type.update({
      where: { id: Number(data?.id) },
      data: { recstatus: newStatus },
    });

    genrateResponse(
      res,
      HttpStatus.OK,
      `ULB Type toggled to ${updatedUlb.recstatus} successfully`,
      encryptData(updatedUlb)
    );
  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
};



// ******************ULB Master***********************//

export const createUlb = async (req: Request, res: Response) => {
  try {
    const data = extractPayload(req.body);

    const {
      name,
      ulb_type_id,
      name_hindi,
      address,
      nigamtollfreeno,
      receipttollfreeno,
      municipallogo,
      agencyfullname,
      agencylogo,
      domainname,
      gstno,
      ulbRecStatus: recstatus,
      payee_id,
      latitude,
      longitude,
      bankname,
      accountno,
      ifsccode,
    } = data;

    const ulb = await panel.ulb_master.create({
      data: {
        name,
        ulb_type_id,
        name_hindi,
        address,
        nigamtollfreeno,
        receipttollfreeno,
        municipallogo,
        agencyfullname,
        agencylogo,
        domainname,
        gstno,
        recstatus,
        payee_id,
        latitude,
        longitude,
        bankname,
        accountno,
        ifsccode,
      },
    });

    genrateResponse(
      res,
      HttpStatus.OK,
      'ULB master created successfully',
      encryptData(ulb)
    );
  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
};

export const getAllUlbs = async (req: Request, res: Response) => {
  try {
    // get page & limit from query params, with defaults
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // fetch total count for pagination metadata
    const totalCount = await panel.ulb_master.count();

    // fetch paginated data
    const ulbs = await panel.ulb_master.findMany({
      skip,
      take: limit,
      include: {
        ulb_type: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const pagination = {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };

    genrateResponse(
      res,
      HttpStatus.OK,
      'ULB Master list fetched successfully',
      encryptData({ data: ulbs, pagination })
    );
  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
};


/**
 * GET ULB Master by ID
 */
export const getById = async (req: Request, res: Response) => {
  try {
    const id = extractPayload(req.query);

    const ulb = await panel.ulb_master.findUnique({
      where: { id: Number(id.id) },

      include: {
        ulb_type: true,
        zones: true,
      },

    });
    if (!ulb) {
      return genrateResponse(res, HttpStatus.NotFound, 'ULB Master not found');
    }

    genrateResponse(
      res,
      HttpStatus.OK,
      'ULB Master fetched successfully',
      encryptData(ulb)
    );
  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
};

/**
 * UPDATE ULB Master
 */
export const update = async (req: Request, res: Response) => {
  try {
    const dataToUpdate = extractPayload(req.body);

    // destructure required fields
    const {
      id,
      name,
      ulb_type_id,
      name_hindi,
      address,
      nigamtollfreeno,
      receipttollfreeno,
      municipallogo,
      agencyfullname,
      agencylogo,
      domainname,
      gstno,
      ulbRecStatus: recstatus,
      payee_id,
      latitude,
      longitude,
      bankname,
      accountno,
      ifsccode,
    } = dataToUpdate;

    const ulb = await panel.ulb_master.update({
      where: { id: Number(id) },
      data: {
        name,
        ulb_type_id,
        name_hindi,
        address,
        nigamtollfreeno,
        receipttollfreeno,
        municipallogo,
        agencyfullname,
        agencylogo,
        domainname,
        gstno,
        recstatus,
        payee_id,
        latitude,
        longitude,
        bankname,
        accountno,
        ifsccode,
      },
    });

    genrateResponse(
      res,
      HttpStatus.OK,
      'ULB Master updated successfully',
      encryptData(ulb)
    );
  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
};



/**
 * DELETE ULB Master
 */
export const toggleUlb = async (req: Request, res: Response) => {
  try {
    const data = extractPayload(req.body);

    // find current status
    const prevStatus = await panel.ulb_master.findUnique({
      where: { id: Number(data?.id) },
      select: { recstatus: true, is_active: true },
    });

    if (!prevStatus) {
      return genrateResponse(res, HttpStatus.NotFound, "ULB Type not found");
    }

    // toggle status
    const newStatus = prevStatus.recstatus === 1 ? 0 : 1;
    const newIsActive = !prevStatus.is_active;

    const updatedUlb = await panel.ulb_master.update({
      where: { id: Number(data?.id) },
      data: { 
        recstatus: newStatus,
        is_active: newIsActive
      },
    });

    // Enterprise Kill-Switch: Invalidate ULB Cache Instantly
    await SecurityCache.invalidateUlbStatus(Number(data?.id));

    // Live UI Update: Refresh sidebar for any connected admins/users
    socketService.emitGlobal('permissions_updated', { message: 'ULB status updated' });

    genrateResponse(
      res,
      HttpStatus.OK,
      `ULB Master toggled to ${updatedUlb.recstatus} successfully`,
      encryptData(updatedUlb)
    );
  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
};

/**
 * GET Active Modules for a ULB
 */
export const getUlbModules = async (req: Request, res: Response) => {
  try {
    const data = extractPayload(req.query);

    const mappings = await panel.ulb_module_mapping.findMany({
      where: { 
        ulb_id: Number(data.id),
        is_active: true
      },
      select: { module_id: true }
    });

    const moduleIds = mappings.map(m => m.module_id);

    genrateResponse(
      res,
      HttpStatus.OK,
      'ULB Modules fetched successfully',
      encryptData(moduleIds)
    );
  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
};

/**
 * SYNC Modules for a ULB
 */
export const syncUlbModules = async (req: Request, res: Response) => {
  try {
    const data = extractPayload(req.body);
    const { id, moduleIds } = data; // id is ulb_id, moduleIds is array of numbers

    if (!Array.isArray(moduleIds)) {
      return genrateResponse(res, HttpStatus.BadRequest, "moduleIds must be an array");
    }

    await panel.$transaction(async (tx) => {
      // 1. Disable all existing mappings for this ULB
      await tx.ulb_module_mapping.updateMany({
        where: { ulb_id: Number(id) },
        data: { is_active: false }
      });

      // 2. Upsert the provided modules to active
      for (const modId of moduleIds) {
        await tx.ulb_module_mapping.upsert({
          where: { ulb_id_module_id: { ulb_id: Number(id), module_id: Number(modId) } },
          update: { is_active: true },
          create: { ulb_id: Number(id), module_id: Number(modId), is_active: true }
        });
      }
    });

    // Enterprise Kill-Switch: Invalidate permissions for this ULB
    await SecurityCache.invalidateAllUlbUsers(Number(id));

    // Live UI Update: Refresh sidebar for any connected users in this ULB
    socketService.emitGlobal('permissions_updated', { message: 'ULB modules synced' });

    genrateResponse(
      res,
      HttpStatus.OK,
      'ULB Modules synchronized successfully',
      encryptData({ success: true })
    );
  } catch (err: any) {
    const error = handlePrismaError(err);
    genrateResponse(res, error.status, error.message);
  }
};
