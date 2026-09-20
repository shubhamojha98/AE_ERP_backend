import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../src/core/types";
import { AuthPayload } from "../../type/common.type";
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { extractPayload, encryptData, decryptData } from "../../lib/apiCryptography";
import { project } from "../../lib/globalprimsaclient";
import convertBigIntToString from "../../lib/bigIntConversion";

export const createProject = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {

   const data = extractPayload(req.body);
    const newProject = await project.project.create({
      data: {
        projectCode: data.projectCode,
        customerId: data.customerId,
        leadId: data.leadId,
        capacityKw: data.capacityKw,
        projectType: data.projectType,
        stage: data.stage,
        status: data.status,
        salesOwnerId: data.salesOwnerId,
        salesOwnerName: data.salesOwnerName,
        surveyorId: data.surveyorId,
        surveyorName: data.surveyorName,
        installerId: data.installerId,
        installerName: data.installerName,
        managerId: data.managerId,
        managerName: data.managerName,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        landmark: data.landmark,
        city: data.city,
        district: data.district,
        state: data.state,
        pincode: data.pincode,
        country: data.country,
        notes: data.notes,
        groupId: data.groupId,
        createdById: data.createdById,
      },
    });

    return genrateResponse(
      res,
      HttpStatus.OK,
      "Project created successfully.",
      convertBigIntToString(newProject),
    );
  } catch (error: any) {
    return genrateResponse(
      res,
      HttpStatus.BadRequest,
      error.message || "Failed to create project.",
    );
  }
};

// export const getAllProjects = async (
//   req: AuthenticatedRequest,
//   res: Response,
// ) => {
//   try {
//     const projects = await project.project.findMany({
//       orderBy: {
//         id: "desc",
//       },
//     });

//     return genrateResponse(
//       res,
//       HttpStatus.OK,
//       "Products fetched successfully.",
//       convertBigIntToString(project),
//     );
//   } catch (error: any) {
//     return genrateResponse(
//       res,
//       HttpStatus.BadRequest,
//       error.message || "Failed to fetch products.",
//     );
//   }
// };

