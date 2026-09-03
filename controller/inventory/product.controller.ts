import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../src/core/types";
import { AuthPayload } from "../../type/common.type";
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { extractPayload, encryptData } from "../../lib/apiCryptography";
import { inventory } from "../../lib/globalprimsaclient";
import { Prisma } from "../../generated/inventory";
import convertBigIntToString from '../../lib/bigIntConversion';
import { generateCategoryCode } from "../../lib/generateCategoryCode";


// ============================================================================
// PRODUCT CATEGORY CONTROLLER LOGIC
// ============================================================================

/**
 * Add / Create a new Product Category
 */
export const createCategory = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const data = extractPayload(req.body);
        const currentUser = req?.user as AuthPayload;

        const {
            companyId,
            name,
            description,
            isActive,
            groupId,
        } = data;

        // Required Field Validations
        if (!name || name.trim() === "") {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Category name is required."
            );
        }

        if (!companyId) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Company ID is required."
            );
        }

        const parsedCompanyId = Number(companyId);

        // Check duplicate category name within the same company
        const existingCategory = await inventory.productCategory.findFirst({
            where: {
                companyId: parsedCompanyId,
                name: {
                    equals: name.trim(),
                    mode: "insensitive",
                },
                recStatus: 1,
                isDeleted: false,
            },
        });

        if (existingCategory) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Category with this name already exists in this company."
            );
        }

        // Always auto-generate category code on backend
        const categoryCode = await generateCategoryCode(parsedCompanyId, name);

        const createdBy = currentUser?.userId
            ? String(currentUser.userId)
            : data.createdBy
                ? String(data.createdBy)
                : "SYSTEM";

        const newCategory = await inventory.productCategory.create({
            data: {
                companyId: parsedCompanyId,
                name: name.trim(),
                code: categoryCode,
                description: description ? String(description).trim() : null,
                isActive: isActive !== undefined ? Boolean(isActive) : true,
                groupId: groupId ? String(groupId) : null,
                createdBy: createdBy,
                recStatus: 1,
                isDeleted: false,
            },
        });

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Product category created successfully.",
            encryptData(convertBigIntToString(newCategory))
        );
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}] Error creating category:`, err);
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Failed to create product category."
        );
    }
};

/**
 * Get Product Category List with Pagination, Filtering, and Search
 */
export const getCategoryList = async (req: Request, res: Response) => {
    try {
        const rawParams = req.query?.ed ? extractPayload(req.query) : req.query;

        const page = Math.max(1, Number(rawParams.page) || 1);
        const limit = Math.max(1, Number(rawParams.limit) || 10);
        const search = rawParams.search as string;
        const companyId = rawParams.companyId ? Number(rawParams.companyId) : undefined;
        const rawIsActive = rawParams.isActive !== undefined ? rawParams.isActive : rawParams.status;
        const groupId = rawParams.groupId as string;

        const where: Prisma.ProductCategoryWhereInput = {
            recStatus: 1,
            isDeleted: false,
        };

        if (companyId) {
            where.companyId = companyId;
        }

        if (groupId) {
            where.groupId = groupId;
        }

        if (rawIsActive !== undefined && rawIsActive !== null && rawIsActive !== "") {
            where.isActive = rawIsActive === "true" || rawIsActive === true;
        }

        if (search && search.trim() !== "") {
            const searchTerm = search.trim();
            where.OR = [
                {
                    name: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                },
                {
                    code: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                },
                {
                    description: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                },
            ];
        }

        const [categoryList, total] = await inventory.$transaction([
            inventory.productCategory.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    subCategories: {
                        where: { recStatus: 1, isDeleted: false },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
            inventory.productCategory.count({ where }),
        ]);

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Product category list fetched successfully.",
            encryptData({
                categories: convertBigIntToString(categoryList),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            })
        );
    } catch (err: any) {
        console.error(
            `[${new Date().toISOString()}] Error fetching category list:`,
            err
        );
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Failed to fetch product category list."
        );
    }
};

/**
 * Get Product Category by ID
 */
export const getCategoryById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id || (req.query.id as string);
        const currentUser = req?.user as AuthPayload;

        if (!id) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Category ID is required."
            );
        }

        const category = await inventory.productCategory.findFirst({
            where: {
                id: BigInt(id),
                recStatus: 1,
                isDeleted: false,
            },
            include: {
                subCategories: {
                    where: { recStatus: 1, isDeleted: false },
                },
            },
        });

        if (!category) {
            return genrateResponse(
                res,
                HttpStatus.NotFound,
                "Product category not found."
            );
        }

        if (
            currentUser?.companyId !== undefined &&
            Number(currentUser.companyId) !== category.companyId
        ) {
            return genrateResponse(
                res,
                HttpStatus.Forbidden,
                "You do not have access to this category."
            );
        }

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Product category details fetched successfully.",
            encryptData(convertBigIntToString(category))
        );
    } catch (err: any) {
        console.error(
            `[${new Date().toISOString()}] Error fetching category details:`,
            err
        );
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Failed to fetch product category details."
        );
    }
};

/**
 * Update an existing Product Category
 */
export const updateCategory = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const data = extractPayload(req.body);
        const currentUser = req?.user as AuthPayload;
        const categoryId = req.params.id || data.id;

        if (!categoryId) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Category ID is required for update."
            );
        }

        const categoryBigId = BigInt(categoryId);

        const existingCategory = await inventory.productCategory.findFirst({
            where: {
                id: categoryBigId,
                recStatus: 1,
                isDeleted: false,
            },
        });

        if (!existingCategory) {
            return genrateResponse(
                res,
                HttpStatus.NotFound,
                "Product category not found."
            );
        }

        if (
            currentUser?.companyId !== undefined &&
            Number(currentUser.companyId) !== existingCategory.companyId
        ) {
            return genrateResponse(
                res,
                HttpStatus.Forbidden,
                "You do not have access to this category."
            );
        }

        const updatedBy = currentUser?.userId
            ? String(currentUser.userId)
            : data.updatedBy
                ? String(data.updatedBy)
                : "SYSTEM";

        // Check duplicate name if updating name
        if (
            data.name &&
            data.name.trim().toLowerCase() !== existingCategory.name.toLowerCase()
        ) {
            const duplicate = await inventory.productCategory.findFirst({
                where: {
                    companyId: data.companyId
                        ? Number(data.companyId)
                        : existingCategory.companyId,
                    name: {
                        equals: data.name.trim(),
                        mode: "insensitive",
                    },
                    id: {
                        not: categoryBigId,
                    },
                    recStatus: 1,
                    isDeleted: false,
                },
            });

            if (duplicate) {
                return genrateResponse(
                    res,
                    HttpStatus.BadRequest,
                    "Category with this name already exists in this company."
                );
            }
        }

        const updatedCategory = await inventory.productCategory.update({
            where: {
                id: categoryBigId,
            },
            data: {
                ...(data.companyId !== undefined && {
                    companyId: Number(data.companyId),
                }),
                ...(data.name !== undefined && { name: data.name.trim() }),
                ...(data.code !== undefined && { code: data.code ? String(data.code).trim() : null }),
                ...(data.description !== undefined && {
                    description: data.description ? String(data.description).trim() : null,
                }),
                ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
                ...(data.groupId !== undefined && {
                    groupId: data.groupId ? String(data.groupId) : null,
                }),
                updatedBy: updatedBy,
            },
        });

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Product category updated successfully.",
            encryptData(convertBigIntToString(updatedCategory))
        );
    } catch (err: any) {
        console.error(
            `[${new Date().toISOString()}] Error updating category:`,
            err
        );
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Failed to update product category."
        );
    }
};

/**
 * Soft Delete (Archive) Product Category
 */
export const deleteCategory = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const data = extractPayload(req.body);
        const currentUser = req?.user as AuthPayload;
        const categoryId = req.params.id || data.id;

        if (!categoryId) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Category ID is required for deletion."
            );
        }

        const categoryBigId = BigInt(categoryId);

        const existingCategory = await inventory.productCategory.findFirst({
            where: {
                id: categoryBigId,
                recStatus: 1,
                isDeleted: false,
            },
        });

        if (!existingCategory) {
            return genrateResponse(
                res,
                HttpStatus.NotFound,
                "Product category not found."
            );
        }

        if (
            currentUser?.companyId !== undefined &&
            Number(currentUser.companyId) !== existingCategory.companyId
        ) {
            return genrateResponse(
                res,
                HttpStatus.Forbidden,
                "You do not have access to this category."
            );
        }

        const deletedBy = currentUser?.userId
            ? String(currentUser.userId)
            : data.deletedBy
                ? String(data.deletedBy)
                : "SYSTEM";

        const deletedCategory = await inventory.productCategory.update({
            where: {
                id: categoryBigId,
            },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: deletedBy,
                recStatus: 0,
            },
        });

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Product category deleted successfully.",
            encryptData(convertBigIntToString(deletedCategory))
        );
    } catch (err: any) {
        console.error(
            `[${new Date().toISOString()}] Error deleting category:`,
            err
        );
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Failed to delete product category."
        );
    }
};

/**
 * Hard Delete Product Category (permanent)
 * Refuses to delete if the category still has child subcategories or
 * products pointing at it.
 */
export const hardDeleteCategory = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const data = extractPayload(req.body);
        const currentUser = req?.user as AuthPayload;
        const categoryId = req.params.id || data.id;

        if (!categoryId) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Category ID is required for deletion."
            );
        }

        const categoryBigId = BigInt(categoryId);

        const existingCategory = await inventory.productCategory.findFirst({
            where: { id: categoryBigId },
        });

        if (!existingCategory) {
            return genrateResponse(
                res,
                HttpStatus.NotFound,
                "Product category not found."
            );
        }

        if (
            currentUser?.companyId !== undefined &&
            Number(currentUser.companyId) !== existingCategory.companyId
        ) {
            return genrateResponse(
                res,
                HttpStatus.Forbidden,
                "You do not have access to this category."
            );
        }

        const [subCategoryCount, linkedProductCount] = await Promise.all([
            inventory.productSubCategory.count({
                where: {
                    categoryId: categoryBigId,
                    companyId: existingCategory.companyId,
                    isDeleted: false,
                },
            }),
            inventory.product.count({
                where: {
                    categoryId: categoryBigId,
                    companyId: existingCategory.companyId,
                    isDeleted: false,
                },
            }),
        ]);

        if (subCategoryCount > 0 || linkedProductCount > 0) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Cannot delete: category still has child subcategories or linked products."
            );
        }

        await inventory.productCategory.delete({
            where: { id: categoryBigId },
        });

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Product category permanently deleted."
        );
    } catch (err: any) {
        console.error(
            `[${new Date().toISOString()}] Error hard-deleting category:`,
            err
        );
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Failed to permanently delete product category."
        );
    }
};

/**
 * Bulk Hard Delete Product Categories
 * Body: { ids: (string|number)[] }
 */
export const bulkDeleteCategories = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const data = extractPayload(req.body);
        const currentUser = req?.user as AuthPayload;
        const ids: (string | number)[] = Array.isArray(data.ids) ? data.ids : [];

        if (!ids.length) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "ids must be a non-empty array."
            );
        }

        let bigIntIds: bigint[];
        try {
            bigIntIds = ids.map((id) => BigInt(id));
        } catch {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "One or more category ids are invalid."
            );
        }

        const categories = await inventory.productCategory.findMany({
            where: { id: { in: bigIntIds } },
        });

        if (
            currentUser?.companyId !== undefined &&
            categories.some((c) => c.companyId !== Number(currentUser.companyId))
        ) {
            return genrateResponse(
                res,
                HttpStatus.Forbidden,
                "You do not have access to one or more of these categories."
            );
        }

        const deletable: bigint[] = [];
        const skipped: string[] = [];

        for (const category of categories) {
            const [subCategoryCount, linkedProductCount] = await Promise.all([
                inventory.productSubCategory.count({
                    where: {
                        categoryId: category.id,
                        companyId: category.companyId,
                        isDeleted: false,
                    },
                }),
                inventory.product.count({
                    where: {
                        categoryId: category.id,
                        companyId: category.companyId,
                        isDeleted: false,
                    },
                }),
            ]);

            if (subCategoryCount > 0 || linkedProductCount > 0) {
                skipped.push(category.id.toString());
            } else {
                deletable.push(category.id);
            }
        }

        if (deletable.length) {
            await inventory.productCategory.deleteMany({
                where: { id: { in: deletable } },
            });
        }

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Bulk delete completed.",
            encryptData({
                deletedCount: deletable.length,
                skipped,
            })
        );
    } catch (err: any) {
        console.error(
            `[${new Date().toISOString()}] Error bulk-deleting categories:`,
            err
        );
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Failed to bulk delete product categories."
        );
    }
};

/**
 * Merge Product Categories
 * Body: { sourceIds: (string|number)[], targetId: string|number }
 * Reassigns products and subcategories on the source categories to target category,
 * then permanently deletes source categories.
 */
export const mergeCategories = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const data = extractPayload(req.body);
        const currentUser = req?.user as AuthPayload;
        const { targetId } = data;
        const sourceIds: (string | number)[] = Array.isArray(data.sourceIds) ? data.sourceIds : [];

        if (!targetId || !sourceIds.length) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "targetId and a non-empty sourceIds array are required."
            );
        }

        let targetBigId: bigint;
        let sourceBigIds: bigint[];
        try {
            targetBigId = BigInt(targetId);
            sourceBigIds = sourceIds
                .filter((id) => String(id) !== String(targetId))
                .map((id) => BigInt(id));
        } catch {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "One or more category ids are invalid."
            );
        }

        if (!sourceBigIds.length) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Select at least one source category different from the target."
            );
        }

        const target = await inventory.productCategory.findFirst({
            where: { id: targetBigId, isDeleted: false },
        });

        if (!target) {
            return genrateResponse(
                res,
                HttpStatus.NotFound,
                "Target category not found."
            );
        }

        if (
            currentUser?.companyId !== undefined &&
            Number(currentUser.companyId) !== target.companyId
        ) {
            return genrateResponse(
                res,
                HttpStatus.Forbidden,
                "You do not have access to this category."
            );
        }

        await inventory.$transaction([
            inventory.product.updateMany({
                where: { companyId: target.companyId, categoryId: { in: sourceBigIds } },
                data: { categoryId: targetBigId },
                }),
            inventory.productSubCategory.updateMany({
                where: {
                    companyId: target.companyId,
                    categoryId: { in: sourceBigIds },
                },
                data: { categoryId: targetBigId },
            }),
            inventory.productCategory.deleteMany({
                where: { companyId: target.companyId, id: { in: sourceBigIds } },
            }),
        ]);

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Categories merged successfully.",
            encryptData(convertBigIntToString(target))
        );
    } catch (err: any) {
        console.error(
            `[${new Date().toISOString()}] Error merging categories:`,
            err
        );
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Failed to merge product categories."
        );
    }
};


// ============================================================================
// PRODUCT SUB-CATEGORY CONTROLLER LOGIC
// ============================================================================

/**
 * Add / Create a new Product SubCategory
 */
export const createSubCategory = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const data = extractPayload(req.body);
        const currentUser = req?.user as AuthPayload;

        const {
            companyId,
            categoryId,
            name,
            description,
            isActive,
            groupId,
        } = data;

        // Required Field Validations
        if (!name || name.trim() === "") {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Subcategory name is required."
            );
        }

        if (!companyId) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Company ID is required."
            );
        }

        if (!categoryId) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Category ID is required."
            );
        }

        const parsedCompanyId = Number(companyId);
        const categoryBigId = BigInt(categoryId);

        // Check parent category exists
        const parentCategoryExists = await inventory.productCategory.findFirst({
            where: {
                id: categoryBigId,
                companyId: parsedCompanyId,
                recStatus: 1,
                isDeleted: false,
            },
        });

        if (!parentCategoryExists) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Parent category not found for this company."
            );
        }

        // Check duplicate subcategory name within the same category & company
        const existingSubCategory = await inventory.productSubCategory.findFirst({
            where: {
                companyId: parsedCompanyId,
                categoryId: categoryBigId,
                name: {
                    equals: name.trim(),
                    mode: "insensitive",
                },
                recStatus: 1,
                isDeleted: false,
            },
        });

        if (existingSubCategory) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Subcategory with this name already exists in this category."
            );
        }

        const createdBy = currentUser?.userId
            ? String(currentUser.userId)
            : data.createdBy
                ? String(data.createdBy)
                : "SYSTEM";

        const newSubCategory = await inventory.productSubCategory.create({
            data: {
                companyId: parsedCompanyId,
                categoryId: categoryBigId,
                name: name.trim(),
                description: description ? String(description).trim() : null,
                isActive: isActive !== undefined ? Boolean(isActive) : true,
                groupId: groupId ? String(groupId) : null,
                createdBy: createdBy,
                recStatus: 1,
                isDeleted: false,
            },
        });

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Product subcategory created successfully.",
            encryptData(convertBigIntToString(newSubCategory))
        );
    } catch (err: any) {
        console.error(`[${new Date().toISOString()}] Error creating subcategory:`, err);
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Failed to create product subcategory."
        );
    }
};

/**
 * Get Product SubCategory List with Pagination, Filtering, and Search
 */
export const getSubCategoryList = async (req: Request, res: Response) => {
    try {
        const rawParams = req.query?.ed ? extractPayload(req.query) : req.query;

        const page = Math.max(1, Number(rawParams.page) || 1);
        const limit = Math.max(1, Number(rawParams.limit) || 10);
        const search = rawParams.search as string;
        const companyId = rawParams.companyId ? Number(rawParams.companyId) : undefined;
        const categoryId = rawParams.categoryId ? BigInt(rawParams.categoryId) : undefined;
        const rawIsActive = rawParams.isActive !== undefined ? rawParams.isActive : rawParams.status;
        const groupId = rawParams.groupId as string;

        const where: Prisma.ProductSubCategoryWhereInput = {
            recStatus: 1,
            isDeleted: false,
        };

        if (companyId) {
            where.companyId = companyId;
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (groupId) {
            where.groupId = groupId;
        }

        if (rawIsActive !== undefined && rawIsActive !== null && rawIsActive !== "") {
            where.isActive = rawIsActive === "true" || rawIsActive === true;
        }

       

        if (search && search.trim() !== "") {
            const searchTerm = search.trim();
            where.OR = [
                {
                    name: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                },
                {
                    description: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                },
            ];
        }

        const [subCategoryList, total] = await inventory.$transaction([
            inventory.productSubCategory.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    categoryMaster: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
            inventory.productSubCategory.count({ where }),
        ]);

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Product subcategory list fetched successfully.",
            encryptData({
                subCategories: convertBigIntToString(subCategoryList),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            })
        );
    } catch (err: any) {
        console.error(
            `[${new Date().toISOString()}] Error fetching subcategory list:`,
            err
        );
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Failed to fetch product subcategory list."
        );
    }
};

/**
 * Get Product SubCategory by ID
 */
export const getSubCategoryById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id || (req.query.id as string);
        const currentUser = req?.user as AuthPayload;

        if (!id) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Subcategory ID is required."
            );
        }

        const subCategory = await inventory.productSubCategory.findFirst({
            where: {
                id: BigInt(id),
                recStatus: 1,
                isDeleted: false,
            },
            include: {
                categoryMaster: true,
            },
        });

        if (!subCategory) {
            return genrateResponse(
                res,
                HttpStatus.NotFound,
                "Product subcategory not found."
            );
        }

        if (
            currentUser?.companyId !== undefined &&
            Number(currentUser.companyId) !== subCategory.companyId
        ) {
            return genrateResponse(
                res,
                HttpStatus.Forbidden,
                "You do not have access to this subcategory."
            );
        }

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Product subcategory details fetched successfully.",
            encryptData(convertBigIntToString(subCategory))
        );
    } catch (err: any) {
        console.error(
            `[${new Date().toISOString()}] Error fetching subcategory details:`,
            err
        );
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Failed to fetch product subcategory details."
        );
    }
};

/**
 * Update an existing Product SubCategory
 */
export const updateSubCategory = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const data = extractPayload(req.body);
        const currentUser = req?.user as AuthPayload;
        const subCategoryId = req.params.id || data.id;

        if (!subCategoryId) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Subcategory ID is required for update."
            );
        }

        const subCategoryBigId = BigInt(subCategoryId);

        const existingSubCategory = await inventory.productSubCategory.findFirst({
            where: {
                id: subCategoryBigId,
                recStatus: 1,
                isDeleted: false,
            },
        });

        if (!existingSubCategory) {
            return genrateResponse(
                res,
                HttpStatus.NotFound,
                "Product subcategory not found."
            );
        }

        if (
            currentUser?.companyId !== undefined &&
            Number(currentUser.companyId) !== existingSubCategory.companyId
        ) {
            return genrateResponse(
                res,
                HttpStatus.Forbidden,
                "You do not have access to this subcategory."
            );
        }

        const targetCompanyId = data.companyId
            ? Number(data.companyId)
            : existingSubCategory.companyId;
        const targetCategoryId = data.categoryId
            ? BigInt(data.categoryId)
            : existingSubCategory.categoryId;

        // If categoryId is changing, verify new parent category exists
        if (data.categoryId && BigInt(data.categoryId) !== existingSubCategory.categoryId) {
            const parentCategoryExists = await inventory.productCategory.findFirst({
                where: {
                    id: targetCategoryId,
                    companyId: targetCompanyId,
                    recStatus: 1,
                    isDeleted: false,
                },
            });

            if (!parentCategoryExists) {
                return genrateResponse(
                    res,
                    HttpStatus.BadRequest,
                    "Parent category not found."
                );
            }
        }

        // Check duplicate name if updating name or category
        if (data.name || data.categoryId) {
            const newName = data.name ? data.name.trim() : existingSubCategory.name;
            const duplicate = await inventory.productSubCategory.findFirst({
                where: {
                    companyId: targetCompanyId,
                    categoryId: targetCategoryId,
                    name: {
                        equals: newName,
                        mode: "insensitive",
                    },
                    id: {
                        not: subCategoryBigId,
                    },
                    recStatus: 1,
                    isDeleted: false,
                },
            });

            if (duplicate) {
                return genrateResponse(
                    res,
                    HttpStatus.BadRequest,
                    "Subcategory with this name already exists in this category."
                );
            }
        }

        const updatedBy = currentUser?.userId
            ? String(currentUser.userId)
            : data.updatedBy
                ? String(data.updatedBy)
                : "SYSTEM";

        const updatedSubCategory = await inventory.productSubCategory.update({
            where: {
                id: subCategoryBigId,
            },
            data: {
                ...(data.companyId !== undefined && {
                    companyId: Number(data.companyId),
                }),
                ...(data.categoryId !== undefined && {
                    categoryId: BigInt(data.categoryId),
                }),
                ...(data.name !== undefined && { name: data.name.trim() }),
                ...(data.description !== undefined && {
                    description: data.description ? String(data.description).trim() : null,
                }),
                ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
                ...(data.groupId !== undefined && {
                    groupId: data.groupId ? String(data.groupId) : null,
                }),
                updatedBy: updatedBy,
            },
        });

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Product subcategory updated successfully.",
            encryptData(convertBigIntToString(updatedSubCategory))
        );
    } catch (err: any) {
        console.error(
            `[${new Date().toISOString()}] Error updating subcategory:`,
            err
        );
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Failed to update product subcategory."
        );
    }
};

/**
 * Soft Delete (Archive) Product SubCategory
 */
export const deleteSubCategory = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const data = extractPayload(req.body);
        const currentUser = req?.user as AuthPayload;
        const subCategoryId = req.params.id || data.id;

        if (!subCategoryId) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Subcategory ID is required for deletion."
            );
        }

        const subCategoryBigId = BigInt(subCategoryId);

        const existingSubCategory = await inventory.productSubCategory.findFirst({
            where: {
                id: subCategoryBigId,
                recStatus: 1,
                isDeleted: false,
            },
        });

        if (!existingSubCategory) {
            return genrateResponse(
                res,
                HttpStatus.NotFound,
                "Product subcategory not found."
            );
        }

        if (
            currentUser?.companyId !== undefined &&
            Number(currentUser.companyId) !== existingSubCategory.companyId
        ) {
            return genrateResponse(
                res,
                HttpStatus.Forbidden,
                "You do not have access to this subcategory."
            );
        }

        const deletedBy = currentUser?.userId
            ? String(currentUser.userId)
            : data.deletedBy
                ? String(data.deletedBy)
                : "SYSTEM";

        const deletedSubCategory = await inventory.productSubCategory.update({
            where: {
                id: subCategoryBigId,
            },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: deletedBy,
                recStatus: 0,
            },
        });

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Product subcategory deleted successfully.",
            encryptData(convertBigIntToString(deletedSubCategory))
        );
    } catch (err: any) {
        console.error(
            `[${new Date().toISOString()}] Error deleting subcategory:`,
            err
        );
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Failed to delete product subcategory."
        );
    }
};

/**
 * Hard Delete Product SubCategory (permanent)
 */
export const hardDeleteSubCategory = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const data = extractPayload(req.body);
        const currentUser = req?.user as AuthPayload;
        const subCategoryId = req.params.id || data.id;

        if (!subCategoryId) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Subcategory ID is required for deletion."
            );
        }

        const subCategoryBigId = BigInt(subCategoryId);

        const existingSubCategory = await inventory.productSubCategory.findFirst({
            where: { id: subCategoryBigId },
        });

        if (!existingSubCategory) {
            return genrateResponse(
                res,
                HttpStatus.NotFound,
                "Product subcategory not found."
            );
        }

        if (
            currentUser?.companyId !== undefined &&
            Number(currentUser.companyId) !== existingSubCategory.companyId
        ) {
            return genrateResponse(
                res,
                HttpStatus.Forbidden,
                "You do not have access to this subcategory."
            );
        }

        const linkedProductCount = await inventory.product.count({
            where: {
                subCategoryId: subCategoryBigId,
                companyId: existingSubCategory.companyId,
                isDeleted: false,
            },
        });

        if (linkedProductCount > 0) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Cannot delete: subcategory still has linked products."
            );
        }

        await inventory.productSubCategory.delete({
            where: { id: subCategoryBigId },
        });

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Product subcategory permanently deleted."
        );
    } catch (err: any) {
        console.error(
            `[${new Date().toISOString()}] Error hard-deleting subcategory:`,
            err
        );
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Failed to permanently delete product subcategory."
        );
    }
};

/**
 * Bulk Hard Delete Product SubCategories
 */
export const bulkDeleteSubCategories = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    try {
        const data = extractPayload(req.body);
        const currentUser = req?.user as AuthPayload;
        const ids: (string | number)[] = Array.isArray(data.ids) ? data.ids : [];

        if (!ids.length) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "ids must be a non-empty array."
            );
        }

        let bigIntIds: bigint[];
        try {
            bigIntIds = ids.map((id) => BigInt(id));
        } catch {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "One or more subcategory ids are invalid."
            );
        }

        const subCategories = await inventory.productSubCategory.findMany({
            where: { id: { in: bigIntIds } },
        });

        if (
            currentUser?.companyId !== undefined &&
            subCategories.some((sc) => sc.companyId !== Number(currentUser.companyId))
        ) {
            return genrateResponse(
                res,
                HttpStatus.Forbidden,
                "You do not have access to one or more of these subcategories."
            );
        }

        const deletable: bigint[] = [];
        const skipped: string[] = [];

        for (const subCat of subCategories) {
            const linkedProductCount = await inventory.product.count({
                where: {
                    subCategoryId: subCat.id,
                    companyId: subCat.companyId,
                    isDeleted: false,
                },
            });

            if (linkedProductCount > 0) {
                skipped.push(subCat.id.toString());
            } else {
                deletable.push(subCat.id);
            }
        }

        if (deletable.length) {
            await inventory.productSubCategory.deleteMany({
                where: { id: { in: deletable } },
            });
        }

        return genrateResponse(
            res,
            HttpStatus.OK,
            "Bulk delete completed.",
            encryptData({
                deletedCount: deletable.length,
                skipped,
            })
        );
    } catch (err: any) {
        console.error(
            `[${new Date().toISOString()}] Error bulk-deleting subcategories:`,
            err
        );
        return genrateResponse(
            res,
            err?.status || HttpStatus.BadRequest,
            err?.message || "Failed to bulk delete product subcategories."
        );
    }
};