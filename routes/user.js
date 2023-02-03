const { Router } = require("express");
const { requireAuth } = require("../middlewares/auth");
const controller = require("../controllers/user_controller");

const router = Router();

router.get("/users", requireAuth, controller.get_users);
router.get("/user/me", requireAuth, controller.get_me);
router.get("/user/:userId", requireAuth, controller.get_user);
router.post("/user", controller.create_user);
router.post("/login", controller.login);
router.put("/user/update/:userId", requireAuth, controller.update_user);
router.put("/user/password", requireAuth, controller.change_password);
router.delete("/user/delete/:userId", requireAuth, controller.delete_user);

module.exports = router;
