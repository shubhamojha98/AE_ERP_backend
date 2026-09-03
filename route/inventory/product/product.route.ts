import { Router } from "express";
import {
    createCategory,
    getCategoryList,
    getCategoryById,
    updateCategory,
    deleteCategory,
    hardDeleteCategory,
    bulkDeleteCategories,
    mergeCategories,
    createSubCategory,
    getSubCategoryList,
    getSubCategoryById,
    updateSubCategory,
    deleteSubCategory,
    hardDeleteSubCategory,
    bulkDeleteSubCategories
} from "../../../controller/inventory/product.controller";

const router = Router();

// ==========================================
// PRODUCT SUB-CATEGORY ROUTES
// ==========================================
router.post('/subcategory', createSubCategory);
router.get('/subcategory', getSubCategoryList);
router.get('/subcategory/:id', getSubCategoryById);
router.put('/subcategory/:id', updateSubCategory);
router.delete('/subcategory/:id/archive', deleteSubCategory);
router.delete('/subcategory/:id', hardDeleteSubCategory);
router.post('/subcategory/bulk-delete', bulkDeleteSubCategories);

// ==========================================
// PRODUCT CATEGORY ROUTES
// ==========================================
router.post('/', createCategory);
router.get('/', getCategoryList);
router.post('/bulk-delete', bulkDeleteCategories);
router.post('/merge', mergeCategories);
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.delete('/:id/archive', deleteCategory); // soft delete
router.delete('/:id', hardDeleteCategory);

export default router;