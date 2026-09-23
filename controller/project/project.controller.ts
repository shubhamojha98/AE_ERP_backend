import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/authMiddleware";
import { AuthPayload } from "../../type/common.type";
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { extractPayload, encryptData, decryptData } from "../../lib/apiCryptography";
import { project } from "../../lib/globalprimsaclient";
import convertBigIntToString from "../../lib/bigIntConversion";

export const createCustomer = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    try {
      const data = extractPayload(req.body);
      const userId = Number.isNaN(Number(req.user?.uid)) ? 1 : Number(req.user?.uid);
      const companyId = Number.isNaN(Number(data.companyId)) ? 1 : Number(data.companyId);
      const customerCode = data.customerCode || `CUST-${Date.now().toString().slice(-6)}`;
      const phone = String(data.customerPhone || data.phone || '').trim();
      const name = String(data.customerName || data.name || '').trim();

      if (!phone || !name) {
        throw new Error("Customer name and phone number are required.");
      }

      const existing = await project.customer.findUnique({
        where: { customerPhone: phone },
      });
      if (existing) {
        return genrateResponse(
          res,
          HttpStatus.OK,
          "Customer already exists.",
          convertBigIntToString(existing),
        );
      }

      const newCustomer = await project.customer.create({
          data: {
            companyId,
            customerCode,
            customerName: name,
            customerPhone: phone,
            customerEmail: data.customerEmail || data.email || null,
            customerType: data.customerType || data.type || 'B2C',
            createdBy: userId,
            groupId: data.groupId || null,
          },
      });

      return genrateResponse(
          res,
          HttpStatus.OK,
          "Customer created successfully.",
          convertBigIntToString(newCustomer),
      );
    } catch (error: any) {
      return genrateResponse(
          res,
          HttpStatus.BadRequest,
          error.message || "Failed to create customer.",
      );
    }
};

export const createProject = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const data = extractPayload(req.body);
    const userId = Number.isNaN(Number(req.user?.uid)) ? 1 : Number(req.user?.uid);
    const companyId = Number.isNaN(Number(data.companyId)) ? 1 : Number(data.companyId);

    console.log(data,"data")
    const newProject = await project.$transaction(async (tx) => {
      let customerId: number | null = null;
      if (data.customerId) {
        const parsed = Number(data.customerId);
        if (!Number.isNaN(parsed)) {
          customerId = parsed;
        }
      }

      // If customerId is not found/given, check for new customer data
      const customerPayload = data.customer || (data.customerName && data.customerPhone ? data : null);

      if (!customerId && customerPayload) {
        const phone = String(customerPayload.customerPhone || customerPayload.phone || '').trim();
        const name = String(customerPayload.customerName || customerPayload.name || '').trim();
        const email = customerPayload.customerEmail || customerPayload.email || null;
        const type = customerPayload.customerType || customerPayload.type || 'B2C';

        if (!phone || !name) {
          throw new Error("Customer name and phone number are required.");
        }

        // Reuse if phone already exists
        const existingCustomer = await tx.customer.findUnique({
          where: { customerPhone: phone },
        });

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const customerCode = customerPayload.customerCode || `CUST-${Date.now().toString().slice(-6)}`;
          const createdCustomer = await tx.customer.create({
            data: {
              companyId,
              customerCode,
              customerName: name,
              customerPhone: phone,
              customerEmail: email,
              customerType: type,
              createdBy: userId,
              groupId: data.groupId || null,
            },
          });
          customerId = createdCustomer.id;
        }
      }

      if (!customerId) {
        throw new Error("A valid customerId or new customer details (name and phone) must be provided.");
      }

      const projectCode = data.projectCode || `PRJ-${Date.now().toString().slice(-6)}`;

      return tx.project.create({
        data: {
          companyId,
          projectCode,
          customerId,
          leadId: data.leadId ? String(data.leadId) : null,
          capacityKw: Number(data.capacityKw) || 0,
          projectType: data.projectType || 'Residential',
          stage: data.stage || 'QUOTATION',
          status: data.status || 'ACTIVE',
          salesOwnerId: data.salesOwnerId ? Number(data.salesOwnerId) : null,
          salesOwnerName: data.salesOwnerName || data.salesOwner || null,
          surveyorId: data.surveyorId ? Number(data.surveyorId) : null,
          surveyorName: data.surveyorName || data.assignedSurveyor || null,
          installerId: data.installerId ? Number(data.installerId) : null,
          installerName: data.installerName || data.assignedInstaller || null,
          managerId: data.managerId ? Number(data.managerId) : null,
          managerName: data.managerName || null,
          addressLine1: data.addressLine1 || null,
          addressLine2: data.addressLine2 || null,
          landmark: data.landmark || null,
          city: data.city || null,
          district: data.district || null,
          state: data.state || null,
          pincode: data.pincode || null,
          country: data.country || 'India',
          notes: data.notes || null,
          groupId: data.groupId || null,
          createdBy: userId,
        },
        include: {
          customer: true,
        },
      });
    });

    return genrateResponse(
      res,
      HttpStatus.OK,
      "Project created successfully.",
      convertBigIntToString(newProject),
    );
  } catch (error: any) {
    console.error("createProject error:", error);
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

