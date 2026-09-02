export async function generateConsumerNo(ulbName: string, insertMstrLastId: number, moduleName: string) {
    if (!ulbName) {
        throw new Error("ULB_NAME is required");
    }
    const municipalNameArr = ulbName.trim().split(/\s+/);

    const first = municipalNameArr[0]?.charAt(0) || '';
    const second = municipalNameArr[1]?.charAt(0) || '';
    const third = municipalNameArr[2]?.charAt(0) || '';

    const poNum = insertMstrLastId ? Number(insertMstrLastId) + 100000 : 100000;

    const consumerNo = `${first}${second}${third}${moduleName}${poNum}`;

    return consumerNo.toUpperCase();
}