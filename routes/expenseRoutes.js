const express = require("express");

const {
    addExpense,
    getExpenses,
    deleteExpense,
    downloadExpenses
} = require("../controllers/expenseController");

const router = express.Router();

router.post("/", addExpense);

router.get("/download/:userId", downloadExpenses);

router.get("/:userId", getExpenses);

router.delete("/:id", deleteExpense);

module.exports = router;