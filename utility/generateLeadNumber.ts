import { lead } from "../lib/globalprimsaclient";

export const generateLeadNumber = async () => {
    const lastLead = await lead.leadMaster.findFirst({
        orderBy: {
            id: "desc"
        },
        select: {
            id: true,
            leadNo: true,
        }
    });

    const nextId = (lastLead?.id ?? 0) + 1;

    return `LD${String(nextId).padStart(6, "0")}`;
};