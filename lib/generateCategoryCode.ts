import { inventory } from "./globalprimsaclient";

/**
 * Automatically generates a unique sequential category code on the backend.
 * Example output: ELEC-0001 (for Electronics) or CAT-0001
 * 
 * @param companyId The ID of the company
 * @param categoryName Optional category name to derive prefix (e.g., "Electronics" -> "ELEC")
 */
export async function generateCategoryCode(
    companyId: number,
    categoryName?: string
): Promise<string> {
    // 1. Generate prefix (Default: "CAT" or first 4 letters of Category Name)
    let prefix = "CAT";
    if (categoryName && categoryName.trim() !== "") {
        const cleaned = categoryName.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        if (cleaned.length >= 3) {
            prefix = cleaned.substring(0, 4); // e.g., "ELECTRONICS" -> "ELEC"
        }
    }

    const codePrefix = `${prefix}-`;

    // 2. Query the latest category code with this prefix for the company
    const lastCategory = await inventory.productCategory.findFirst({
        where: {
            companyId: companyId,
            code: {
                startsWith: codePrefix,
            },
        },
        orderBy: {
            id: "desc",
        },
        select: {
            code: true,
        },
    });

    let nextSequence = 1;

    if (lastCategory?.code) {
        const parts = lastCategory.code.split("-");
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
            nextSequence = lastSeq + 1;
        }
    }

    // 3. Pad sequence number (e.g., ELEC-0001)
    const sequenceStr = String(nextSequence).padStart(4, "0");
    return `${codePrefix}${sequenceStr}`;
}
