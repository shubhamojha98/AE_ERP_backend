import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../src/core/types";
import { AuthPayload } from "../../type/common.type";
import genrateResponse from "../../lib/generateResponse";
import HttpStatus from "../../lib/httpStatus";
import { extractPayload, encryptData } from "../../lib/apiCryptography";
import { inventory } from "../../lib/globalprimsaclient";
import { Prisma } from "../../generated/inventory";
import convertBigIntToString from '../../lib/bigIntConversion';


// ============================================================================
// PRODUCT CATEGORY CONTROLLER LOGIC
// ============================================================================

// NOTE on parentCategory: this file treats it as a numeric category id
// (BigInt/Number), validated against real rows — NOT a category name.
// If your frontend is still sending the parent's *name* (older Firestore
// version was), it needs to switch to sending the parent's id, or these
// validations will always fail.

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
            code,
            demoSeedId,
            description,
            isDemo,
            order,
            parentCategory,
            searchName,
            status,
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

        // Check parent category existence if provided.
        // BUG FIX: this previously didn't scope by companyId, so a
        // category id from a *different* company could be set as parent.
        if (parentCategory !== undefined && parentCategory !== null) {
            const parentExists = await inventory.productCategory.findFirst({
                where: {
                    id: BigInt(parentCategory),
                    companyId: parsedCompanyId,
                    recStatus: 1,
                    isDeleted: false,
                },
            });

            if (!parentExists) {
                return genrateResponse(
                    res,
                    HttpStatus.BadRequest,
                    "Parent category not found."
                );
            }
        }

        const createdBy = currentUser?.userId
            ? String(currentUser.userId)
            : data.createdBy
                ? String(data.createdBy)
                : "SYSTEM";

        const newCategory = await inventory.productCategory.create({
            data: {
                companyId: parsedCompanyId,
                name: name.trim(),
                code: code ? String(code).trim() : null,
                description: description ? String(description).trim() : null,
                demoSeedId: demoSeedId || null,
                isDemo: isDemo !== undefined ? Boolean(isDemo) : false,
                order: order !== undefined ? Number(order) : null,
                parentCategory:
                    parentCategory !== undefined && parentCategory !== null
                        ? Number(parentCategory)
                        : null,
                searchName: searchName
                    ? String(searchName).trim()
                    : name.trim().toLowerCase(),
                status: status || "ACTIVE",
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
        const status = rawParams.status as string;
        const groupId = rawParams.groupId as string;
        const parentCategory =
            rawParams.parentCategory !== undefined && rawParams.parentCategory !== ""
                ? Number(rawParams.parentCategory)
                : undefined;

        const where: Prisma.ProductCategoryWhereInput = {
            recStatus: 1,
            isDeleted: false,
        };

        if (companyId) {
            where.companyId = companyId;
        }

        if (status) {
            where.status = status;
        }

        if (groupId) {
            where.groupId = groupId;
        }

        if (parentCategory !== undefined) {
            where.parentCategory = parentCategory;
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
                {
                    searchName: {
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
        });

        if (!category) {
            return genrateResponse(
                res,
                HttpStatus.NotFound,
                "Product category not found."
            );
        }

        // BUG FIX: previously any authenticated user could fetch any
        // company's category by guessing/incrementing the id. Enforce
        // company scoping when the token carries a companyId.
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

        // BUG FIX: company scoping, same as getCategoryById.
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

        // BUG FIX: parentCategory was never validated on update (only on
        // create). This let an update set a non-existent, cross-company,
        // or self-referencing parent id.
        if (data.parentCategory !== undefined && data.parentCategory !== null) {
            const newParentId = Number(data.parentCategory);

            if (newParentId === Number(categoryBigId)) {
                return genrateResponse(
                    res,
                    HttpStatus.BadRequest,
                    "A category cannot be its own parent."
                );
            }

            const parentExists = await inventory.productCategory.findFirst({
                where: {
                    id: BigInt(newParentId),
                    companyId: data.companyId
                        ? Number(data.companyId)
                        : existingCategory.companyId,
                    recStatus: 1,
                    isDeleted: false,
                },
            });

            if (!parentExists) {
                return genrateResponse(
                    res,
                    HttpStatus.BadRequest,
                    "Parent category not found."
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
                ...(data.isDemo !== undefined && { isDemo: Boolean(data.isDemo) }),
                ...(data.order !== undefined && {
                    order: data.order !== null ? Number(data.order) : null,
                }),
                ...(data.parentCategory !== undefined && {
                    parentCategory:
                        data.parentCategory !== null ? Number(data.parentCategory) : null,
                }),
                ...(data.searchName !== undefined && {
                    searchName: data.searchName ? String(data.searchName).trim() : null,
                }),
                ...(data.status !== undefined && { status: data.status }),
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
 * Marks the row inactive without removing it — linked products are left
 * untouched. This is the "Archive" action in the frontend, kept under
 * its original name so existing routes calling deleteCategory don't break.
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

        // BUG FIX: company scoping, same as getCategoryById.
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
 * Should be gated by a super-admin-only middleware at the route level,
 * matching the isSuperAdmin() check in the frontend and firestore.rules.
 * Refuses to delete if the category still has child categories or
 * products pointing at it, matching the frontend's confirm-dialog copy.
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

        const [childCount, linkedProductCount] = await Promise.all([
            inventory.productCategory.count({
                where: {
                    parentCategory: Number(categoryBigId),
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

        if (childCount > 0 || linkedProductCount > 0) {
            return genrateResponse(
                res,
                HttpStatus.BadRequest,
                "Cannot delete: category still has child categories or linked products."
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
 * Super-admin only (gate at route level). Skips — rather than fails — any
 * id that still has children or linked products, and reports which ones
 * were skipped so the frontend can tell the user.
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
            const [childCount, linkedProductCount] = await Promise.all([
                inventory.productCategory.count({
                    where: {
                        parentCategory: Number(category.id),
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

            if (childCount > 0 || linkedProductCount > 0) {
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
                skipped, // ids that still have children/products, left untouched
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
 * Super-admin only (gate at route level). Reassigns every product on the
 * source categories to the target category, then permanently deletes the
 * source categories. Runs as a transaction so a failure partway through
 * can't leave products pointing at a deleted category.
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
                data: { categoryId: targetBigId, category: target.name },
            }),
            // Re-point any category that had a merged-away category as its
            // parent, so the hierarchy doesn't dangle after the merge.
            inventory.productCategory.updateMany({
                where: {
                    companyId: target.companyId,
                    parentCategory: { in: sourceBigIds.map((id) => Number(id)) },
                },
                data: { parentCategory: Number(targetBigId) },
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