import { Router } from "express";
import { createCategory, getCategoryList, getCategoryById, updateCategory, deleteCategory, hardDeleteCategory, bulkDeleteCategories, mergeCategories } from "../../../controller/inventory/product.controller";
const router = Router();

router.post('/', createCategory);
router.get('/', getCategoryList);
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.delete('/:id/archive', deleteCategory); // soft delete

// Destructive actions — adjust these permission strings to whatever
// you're actually using elsewhere (guessing CATEGORY:DELETE /
// CATEGORY:MERGE by analogy with your PROPERTY:VIEW example).
router.delete('/:id', hardDeleteCategory);
router.post('/bulk-delete', bulkDeleteCategories);
router.post('/merge', mergeCategories);

export default router;