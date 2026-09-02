// import { crm } from "../lib/globalprimsaclient";

// export const generateLeadNumber = async () => {

//     const lastLead = await crm.lead_master.findFirst({
//         orderBy: {
//             id: "desc"
//         },
//         select: {
//             id: true,
//             lead_no: true,
//         }
//     });

//     const nextId = (lastLead?.id ?? 0) + 1;

//     return `LD${String(nextId).padStart(6, "0")}`;
// };