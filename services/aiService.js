const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const CATEGORIES = ["Food", "Petrol", "Salary", "Shopping", "Travel", "Other"];

// Backup rules, used only when the AI call fails
const KEYWORDS = {
    Food: ["food", "pasta", "pizza", "burger", "biryani", "rice", "dal", "roti", "paneer",
        "chicken", "mutton", "fish", "egg", "milk", "bread", "tea", "coffee", "chai",
        "juice", "snack", "chips", "dinner", "lunch", "breakfast", "restaurant", "cafe",
        "zomato", "swiggy", "grocery", "groceries", "vegetable", "fruit", "sweet",
        "cake", "ice cream", "momo", "noodle", "maggi", "sandwich", "dosa", "idli"],
    Petrol: ["petrol", "diesel", "fuel", "cng", "gas station", "pump"],
    Salary: ["salary", "wage", "stipend", "payroll", "bonus", "income"],
    Shopping: ["shirt", "tshirt", "t-shirt", "jeans", "pant", "shoe", "clothes", "dress",
        "kurta", "saree", "watch", "bag", "amazon", "flipkart", "myntra", "mall",
        "shopping", "jacket", "phone", "headphone", "earphone", "laptop", "cosmetic"],
    Travel: ["travel", "taxi", "cab", "uber", "ola", "rapido", "auto", "bus", "train",
        "metro", "flight", "ticket", "hotel", "trip", "irctc", "toll", "parking"]
};

const getCategoryFromKeywords = (description) => {
    const text = String(description).toLowerCase();

    for (const [category, words] of Object.entries(KEYWORDS)) {
        if (words.some((word) => text.includes(word))) {
            return category;
        }
    }

    return "Other";
};

const askAI = async (description) => {
    const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Categorize this expense into exactly one category.

Categories:
Food, Petrol, Salary, Shopping, Travel, Other

Expense:
${description}

Return only the category name.`
    });

    const answer = (response.text || "").trim().toLowerCase();

    return CATEGORIES.find(
        (category) => answer.includes(category.toLowerCase())
    );
};

const getCategoryFromAI = async (description) => {

    // Try the AI twice (Gemini sometimes fails briefly when busy)
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const category = await askAI(description);

            if (category) {
                return category;
            }

            console.warn("AI gave an unknown category, using keyword rules");
            break;

        } catch (error) {
            console.error(
                `AI categorization failed (attempt ${attempt}):`,
                error.status || "",
                error.message
            );

            if (attempt === 1) {
                await new Promise((resolve) => setTimeout(resolve, 1500));
            }
        }
    }

    // AI didn't work, so use the keyword rules instead
    return getCategoryFromKeywords(description);
};

module.exports = {
    getCategoryFromAI
};
