import { panel } from "./globalprimsaclient";
import getFinancialYear from "./getFinancialYear";

/**
 * Generates a unique employee code following the format:
 * [PREFIX]/[FINANCIAL_YEAR]/[SEQUENCE]
 * Example: UP/2024-25/0001
 */
export async function generateEmpCode(): Promise<string> {
    const prefix = process.env.EMP_CODE_PREFIX || "UP";
    const fy = getFinancialYear(); // returns "2024-2025"
    
    // Convert "2024-2025" to "2024-25" for brevity if desired, 
    // but we'll stick to a clean version.
    const fyShort = fy.split("-").map(y => y.slice(-2)).join("-"); // Optional short version
    const codePrefix = `${prefix}/${fy}/`;

    // Find the latest employee code starting with this prefix
    const lastEmployee = await panel.employee.findFirst({
        where: {
            empCode: {
                startsWith: codePrefix
            }
        },
        orderBy: {
            empCode: "desc"
        },
        select: {
            empCode: true
        }
    });

    let nextSequence = 1;

    if (lastEmployee?.empCode) {
        const parts = lastEmployee.empCode.split("/");
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
            nextSequence = lastSeq + 1;
        }
    }

    // Pad with zeros (e.g., 0001)
    const sequenceStr = String(nextSequence).padStart(4, "0");

    return `${codePrefix}${sequenceStr}`;
}
