
import { AuthenticatedRequest } from "../../src/core/types";
import { AuthPayload } from "../../type/common.type";
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { extractPayload, encryptData } from "../../lib/apiCryptography";
import { Request, Response } from "express";
import { generateLeadNumber } from "../../utility/generateLeadNumber";
import { lead } from "../../lib/globalprimsaclient";
import { Prisma } from "../../generated/lead";


const STATUS_MAP: Record<string, number> = {
    'new': 1,
    'follow-up': 2,
    'followup': 2,
    'qualified': 3,
    'converted': 4,
    'lost': 5,
};

const REVERSE_STATUS_MAP: Record<number, string> = {
    1: 'New',
    2: 'Follow-up',
    3: 'Qualified',
    4: 'Converted',
    5: 'Lost',
};

export const masterData = async (req: Request, res: Response) => {
    try {
        const [source] = await Promise.all([
            lead.leadSourceMaster.findMany({
                where: {
                    recStatus: 1
                }
            }),
        ])

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Master data fetched successfully",
            encryptData({
                source
            })
        );

    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Something went wrong."
        );
    }
}


export const createLead = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const data = extractPayload(req.body);
        const currentUser = req?.user as AuthPayload;

        const mobileNo = String(data.mobile_no || data.mobileNo || data.phone || "").trim();
        const customerName = String(data.customer_name || data.customerName || data.name || "").trim();

        if (!mobileNo || !customerName) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Customer name and mobile number are required."
            );
        }

        // Check duplicate lead
        const duplicateLead = await lead.leadMaster.findFirst({
            where: {
                recStatus: 1,
                OR: [
                    {
                        mobileNo: mobileNo,
                    },
                    ...(data.email
                        ? [
                            {
                                email: data.email,
                            },
                        ]
                        : []),
                ],
            },
        });

        if (duplicateLead) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Lead already exists with same Mobile Number or Email."
            );
        }

        const companyId = currentUser?.companyId
            ? Number(currentUser.companyId)
            : (data.company_id && !isNaN(Number(data.company_id))
                ? Number(data.company_id)
                : (data.companyId && !isNaN(Number(data.companyId)) ? Number(data.companyId) : 1));

        // Validate or resolve Lead Source
        let leadSourceId = Number(data.lead_source_id || data.leadSourceId);
        if (isNaN(leadSourceId) || leadSourceId <= 0) {
            const sourceName = String(data.source || data.leadSource || data.lead_source || "Website").trim();
            let foundSource = await lead.leadSourceMaster.findFirst({
                where: {
                    name: {
                        equals: sourceName,
                        mode: "insensitive",
                    },
                    recStatus: 1,
                },
            });
            if (!foundSource) {
                foundSource = await lead.leadSourceMaster.findFirst({
                    where: { recStatus: 1 },
                });
                if (!foundSource) {
                    foundSource = await lead.leadSourceMaster.create({
                        data: {
                            name: sourceName || "Website",
                            companyId,
                            recStatus: 1,
                        },
                    });
                }
            }
            leadSourceId = foundSource.id;
        }

        const rawStatus = data.status || data.status_name;
        let statusId = Number(data.status_id || data.statusId);
        if (isNaN(statusId) || statusId <= 0) {
            if (typeof rawStatus === 'string') {
                statusId = STATUS_MAP[rawStatus.trim().toLowerCase()] || 1;
            } else {
                statusId = 1;
            }
        }

        const rawAssigned = data.assigned_to ?? data.assignedTo ?? data.assignedToId;
        const assignedTo = rawAssigned && !isNaN(Number(rawAssigned)) ? Number(rawAssigned) : null;

        let nextFollowupDate: Date | null = null;
        const rawDate = data.next_followup_date || data.nextFollowupDate || data.next_date;
        if (rawDate) {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
                nextFollowupDate = d;
            }
        }

        const userId = currentUser?.userId ? Number(currentUser.userId) : null;
        const leadNo = await generateLeadNumber();

        const newLead = await lead.$transaction(async (tx: any) => {
            const createdLead = await tx.leadMaster.create({
                data: {
                    companyId,
                    leadNo,
                    leadSourceId,
                    customerName,
                    mobileNo,
                    email: data.email || null,
                    address: data.address || null,
                    city: data.city || null,
                    state: data.state || null,
                    pincode: data.pincode ? String(data.pincode) : null,
                    assignedTo,
                    remarks: data.remarks || data.notes || null,
                    nextFollowupDate,
                    lastFollowupDate: new Date(),
                    createdBy: userId,
                },
            });

            await tx.leadFollowup.create({
                data: {
                    companyId,
                    leadId: createdLead.id,
                    statusId,
                    remarks: data.remarks || data.notes || "Lead Created",
                    followupDate: new Date(),
                    nextFollowupDate: createdLead.nextFollowupDate,
                    createdBy: userId,
                },
            });

            return createdLead;
        });

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Lead created successfully.",
            encryptData(convertBigIntToString(newLead))
        );
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);

        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Something went wrong."
        );
    }
};


import convertBigIntToString from "../../lib/bigIntConversion";

export const getLeadList = async (req: Request, res: Response) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || Number(req.query.perPage) || 10);

        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
        const lead_source = typeof req.query.lead_source === 'string' ? req.query.lead_source.trim() : (typeof req.query.source === 'string' ? req.query.source.trim() : '');
        const assigned_to = typeof req.query.assigned_to === 'string' ? req.query.assigned_to.trim() : (typeof req.query.assignedTo === 'string' ? req.query.assignedTo.trim() : '');
        const companyId = req.query.companyId
            ? Number(req.query.companyId)
            : (req.headers["x-company-id"] ? Number(req.headers["x-company-id"]) : undefined);

        const where: Prisma.LeadMasterWhereInput = {
            recStatus: 1
        };

        if (companyId && !isNaN(companyId)) {
            where.companyId = companyId;
        }

        if (search) {
            where.OR = [
                {
                    customerName: {
                        contains: search,
                        mode: "insensitive"
                    }
                },
                {
                    mobileNo: {
                        contains: search
                    }
                },
                {
                    leadNo: {
                        contains: search,
                        mode: "insensitive"
                    }
                },
                {
                    email: {
                        contains: search,
                        mode: "insensitive"
                    }
                },
                {
                    city: {
                        contains: search,
                        mode: "insensitive"
                    }
                }
            ];
        }

        if (status) {
            const statusNum = Number(status) || STATUS_MAP[status.toLowerCase()];
            if (statusNum && !isNaN(statusNum) && statusNum > 0) {
                where.followups = {
                    some: {
                        statusId: statusNum
                    }
                };
            }
        }

        if (lead_source) {
            const sourceNum = Number(lead_source);
            if (!isNaN(sourceNum)) {
                where.leadSourceId = sourceNum;
            } else {
                where.leadSource = {
                    name: {
                        equals: lead_source,
                        mode: "insensitive"
                    }
                };
            }
        }

        if (assigned_to) {
            const assignedNum = Number(assigned_to);
            if (!isNaN(assignedNum)) {
                where.assignedTo = assignedNum;
            }
        }

        const [leadList, total] = await lead.$transaction([
            lead.leadMaster.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: "desc"
                },
                include: {
                    leadSource: true,
                    followups: {
                        orderBy: {
                            createdAt: "desc"
                        },
                        take: 1
                    }
                }
            }),
            lead.leadMaster.count({
                where
            })
        ]);

        const formattedList = leadList.map((item: any) => {
            const latestFollowup = item.followups?.[0];
            return {
                id: String(item.id),
                leadNo: item.leadNo,
                name: item.customerName,
                customerName: item.customerName,
                phone: item.mobileNo,
                mobileNo: item.mobileNo,
                email: item.email || "",
                address: item.address || "",
                city: item.city || "",
                state: item.state || "",
                pincode: item.pincode || "",
                source: item.leadSource?.name || "Website",
                leadSourceId: item.leadSourceId,
                status: latestFollowup ? (REVERSE_STATUS_MAP[latestFollowup.statusId] || "New") : "New",
                assignedTo: item.assignedTo,
                assignedToName: item.assignedTo ? `Sales Rep #${item.assignedTo}` : "Unassigned",
                next_date: item.nextFollowupDate,
                nextFollowupDate: item.nextFollowupDate,
                lastFollowupDate: item.lastFollowupDate,
                notes: item.remarks || "",
                remarks: item.remarks || "",
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            };
        });

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Lead list fetched successfully",
            encryptData(
                convertBigIntToString({
                    leadList: formattedList,
                    rawLeads: leadList,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                })
            )
        );

    } catch (err: any) {
        console.error(`[${new Date().toISOString()}]`, err);
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message as string
        );
    }
};