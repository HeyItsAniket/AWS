const Expense = require("../models/Expense");
const User = require("../models/User");
const { getCategoryFromAI } = require("../services/aiService");


const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../config/s3");

// Add Expense
const addExpense = async (req, res) => {
    try {
        const { amount, description,  userId } = req.body;

        if (!amount || !description  || !userId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const category = await getCategoryFromAI(description);

        const expense = await Expense.create({
            amount,
            description,
            category,
            UserId: userId
        });

        return res.status(201).json({
            success: true,
            message: "Expense added successfully",
            expense
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Get Expenses
const getExpenses = async (req, res) => {
    try {
        const { userId } = req.params;

        const expenses = await Expense.findAll({
            where: {
                UserId: userId
            },
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json({
            success: true,
            expenses
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};



const deleteExpense = async (req, res) => {
    try {

        const { id } = req.params;
        const { userId } = req.body;

        const expense = await Expense.findOne({
            where: {
                id: id,
                UserId: userId
            }
        });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found or you are not allowed to delete it"
            });
        }

        await expense.destroy();

        return res.status(200).json({
            success: true,
            message: "Expense deleted successfully"
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    }
};



const downloadExpenses = async (req, res) => {
    try {
        const userId = req.params.userId;

        // User find karo
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Premium check
        if (!user.isPremium) {
            return res.status(401).json({
                message: "Premium subscription required"
            });
        }

        // User ke ALL expenses fetch karo
        const expenses = await Expense.findAll({
            where: {
                UserId: userId
            },
            order: [["createdAt", "DESC"]]
        });

        // CSV header
        let csv = "Amount,Description,Category,Date\n";

        // Expenses ko CSV mein convert karo
        expenses.forEach((expense) => {
            const amount = expense.amount ?? "";
            const description = `"${String(expense.description ?? "").replace(/"/g, '""')}"`;
            const category = `"${String(expense.category ?? "").replace(/"/g, '""')}"`;
            const date = expense.createdAt
                ? new Date(expense.createdAt).toISOString()
                : "";

            csv += `${amount},${description},${category},${date}\n`;
        });

        // Unique file name
        const fileName = `expenses/user-${userId}-${Date.now()}.csv`;

        // S3 mein upload
        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileName,
            Body: csv,
            ContentType: "text/csv",
            ContentDisposition: `attachment; filename="my-expenses.csv"`
        });

        await s3.send(uploadCommand);

        // Temporary download URL
        const downloadCommand = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileName,
            ResponseContentType: "text/csv",
            ResponseContentDisposition: 'attachment; filename="my-expenses.csv"'
        });

        const downloadUrl = await getSignedUrl(
            s3,
            downloadCommand,
            {
                expiresIn: 300
            }
        );

        return res.status(200).json({
            message: "Expense file generated successfully",
            downloadUrl: downloadUrl
        });

    } catch (error) {
        console.error("Download expenses error:", error);

        return res.status(500).json({
            message: "Failed to generate expense file"
        });
    }
};

module.exports = {
    addExpense,
    getExpenses,
    deleteExpense,
    downloadExpenses
};
