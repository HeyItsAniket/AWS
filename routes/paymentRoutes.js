const express = require("express");

const {
    createOrder,
    verifyOrder
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/orders", createOrder);
router.get("/orders/:orderId/verify", verifyOrder);

module.exports = router;