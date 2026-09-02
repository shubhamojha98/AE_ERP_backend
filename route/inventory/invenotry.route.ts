import { Router } from "express";
import productRoute from "./product/product.route";
// import stockRoute from "./stock/stock.route";
// import categoryRoute from "./category/category.route";
// import supplierRoute from "./supplier/supplier.route";

const router = Router();


router.use("/product", productRoute);
// router.use("/stock", stockRoute);
// router.use("/category", categoryRoute);
// router.use("/supplier", supplierRoute);


export default router;