const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const Expense = sequelize.define("Expense", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

    description: {
        type: DataTypes.STRING(255),
        allowNull: false
    },

    category: {
        type: DataTypes.STRING(50),
        allowNull: false
    }
});

// One user can have many expenses
User.hasMany(Expense);

// Every expense belongs to one user
Expense.belongsTo(User);

module.exports = Expense;