import { Router } from "express";
import { createCategory,getCategoryList,updateCategory,deleteCategory,getCategoryById } from "../../controller/inventory/productCategory.controller";
import { createProduct,getProductList,updateProduct,deleteProduct,getProductById } from "../../controller/inventory/product.controller";

const router = Router();

// Category
router.post("/category", createCategory);
router.get("/category", getCategoryList);
router.get("/category/:id", getCategoryById);
router.put("/category/:id", updateCategory);
router.delete("/category/:id", deleteCategory);

// Product
router.post("/product", createProduct);
router.get("/product", getProductList);
router.get("/product/:id", getProductById);
router.put("/product/:id", updateProduct);
router.delete("/product/:id", deleteProduct);

export default router;