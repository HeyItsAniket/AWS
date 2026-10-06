const User = require("../models/User");
const Expense = require("../models/Expense");
const { fn, col, sum } = require("sequelize");

const getLeaderboard = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check whether the user is premium
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.isPremium) {
            return res.status(403).json({
                success: false,
                message: "Premium membership required"
            });
        }

        // Calculate total expense of every user
        const leaderboard = await Expense.findAll({
            attributes: [
                "UserId",
                [fn("SUM", col("amount")), "totalExpense"]
            ],
            include: [
                {
                    model: User,
                    attributes: ["name"]
                }
            ],
            group: ["UserId", "User.id", "User.name"],
            order: [[fn("SUM", col("amount")), "DESC"]]
        });

        return res.status(200).json({
            success: true,
            leaderboard
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    getLeaderboard
};