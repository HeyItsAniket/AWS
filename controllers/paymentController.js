const User = require("../models/User");
const { randomUUID } = require("crypto");

const PREMIUM_PRICE = 1;
const CASHFREE_API_VERSION = "2023-08-01";

function getCashfreeConfig() {
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
        throw new Error("Cashfree credentials are not configured");
    }

    return {
        baseUrl: process.env.CASHFREE_ENV === "production"
            ? "https://api.cashfree.com/pg"
            : "https://sandbox.cashfree.com/pg",
        headers: {
            "Content-Type": "application/json",
            "x-api-version": CASHFREE_API_VERSION,
            "x-client-id": appId,
            "x-client-secret": secretKey
        }
    };
}

const createOrder = async (req, res) => {
    try {
        const { userId, phone } = req.body;

        if (!userId || !/^\d{10}$/.test(String(phone || ""))) {
            return res.status(400).json({
                success: false,
                message: "A user ID and valid 10-digit phone number are required"
            });
        }

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isPremium) {
            return res.status(409).json({
                success: false,
                message: "Premium is already active"
            });
        }

        const cashfree = getCashfreeConfig();
        const orderId = `premium_${user.id}_${randomUUID().replace(/-/g, "")}`;
        const frontendUrl = (process.env.FRONTEND_URL || "http://127.0.0.1:5500/frontend")
            .replace(/\/$/, "");
        const response = await fetch(`${cashfree.baseUrl}/orders`, {
            method: "POST",
            headers: cashfree.headers,
            body: JSON.stringify({
                order_id: orderId,
                order_amount: PREMIUM_PRICE,
                order_currency: "INR",
                customer_details: {
                    customer_id: `expuser${user.id}`,
                    ...(user.name.length >= 3 ? { customer_name: user.name } : {}),
                    customer_email: user.email,
                    customer_phone: String(phone)
                },
                order_note: "Premium membership",
                order_meta: {
                    return_url: `${frontendUrl}/expense.html?order_id={order_id}`
                },
                order_tags: {
                    user_id: String(user.id),
                    purpose: "premium_membership"
                }
            })
        });

        const order = await response.json();

        if (!response.ok) {
            console.error("Cashfree order creation failed:", order.message || order.type || response.status);
            return res.status(502).json({
                success: false,
                message: "Could not start payment. Check Cashfree credentials and try again."
            });
        }

        return res.status(201).json({
            success: true,
            orderId: order.order_id,
            paymentSessionId: order.payment_session_id,
            mode: process.env.CASHFREE_ENV === "production" ? "production" : "sandbox"
        });

    } catch (error) {
        console.error("Cashfree order creation error:", error.message);

        return res.status(500).json({
            success: false,
            message: error.message === "Cashfree credentials are not configured"
                ? "Cashfree credentials are not configured on the server"
                : "Unable to start payment right now"
        });
    }
};

const verifyOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const user = await User.findByPk(req.query.userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!orderId.startsWith(`premium_${user.id}_`)) {
            return res.status(403).json({ success: false, message: "Order does not belong to this user" });
        }

        const cashfree = getCashfreeConfig();
        const response = await fetch(
            `${cashfree.baseUrl}/orders/${encodeURIComponent(orderId)}`,
            { headers: cashfree.headers }
        );
        const order = await response.json();

        if (!response.ok) {
            console.error("Cashfree order verification failed:", order.message || order.type || response.status);
            return res.status(502).json({ success: false, message: "Could not verify payment" });
        }

        if (
            order.order_status !== "PAID" ||
            Number(order.order_amount) !== PREMIUM_PRICE ||
            order.order_currency !== "INR" ||
            order.customer_details?.customer_id !== `expuser${user.id}`
        ) {
            return res.status(202).json({
                success: false,
                message: "Payment has not been confirmed yet"
            });
        }

        if (!user.isPremium) {
            user.isPremium = true;
            await user.save();
        }

        return res.status(200).json({
            success: true,
            message: "Payment successful. Premium is now active.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isPremium: user.isPremium
            }
        });
    } catch (error) {
        console.error("Cashfree payment verification error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message === "Cashfree credentials are not configured"
                ? "Cashfree credentials are not configured on the server"
                : "Unable to verify payment right now"
        });
    }
};

module.exports = {
    createOrder,
    verifyOrder
};