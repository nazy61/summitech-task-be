const { Router } = require("express");
const { requireAuth } = require("../middlewares/auth");
const controller = require("../controllers/product_controller");

const router = Router();

router.get("/products", requireAuth, controller.get_products);
router.get("/stocks", requireAuth, controller.get_stocks);
router.get(
  "/product/stocks/:productId",
  requireAuth,
  controller.get_product_stocks
);
router.get("/product/:productId", requireAuth, controller.get_product);
router.post("/product", requireAuth, controller.create_product);
router.post("/product/stock", requireAuth, controller.add_stock);
router.put(
  "/product/update/:productId",
  requireAuth,
  controller.update_product
);
router.delete(
  "/product/delete/:productId",
  requireAuth,
  controller.delete_product
);
router.delete("/product/stock/delete/", requireAuth, controller.delete_stock);

module.exports = router;
