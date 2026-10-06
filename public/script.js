const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");


// =========================================================
// SIGNUP
// =========================================================

if (signupForm) {

    signupForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const name =
            document.getElementById("name").value;

        const email =
            document.getElementById("email").value;

        const password =
            document.getElementById("password").value;

        try {

            const response = await fetch(
                "http://13.203.210.168:5001/api/auth/signup",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );

            const data =
                await response.json();

            document.getElementById("message").textContent =
                data.message;

            if (data.success) {
                signupForm.reset();
            }

        } catch (error) {

            console.error(error);

            document.getElementById("message").textContent =
                "Something went wrong";
        }

    });

}


// =========================================================
// LOGIN
// =========================================================

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            document.getElementById("email").value;

        const password =
            document.getElementById("password").value;

        const loginData = {
            email,
            password
        };

        try {

            const response = await fetch(
                "http://13.203.210.168:5001/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(loginData)
                }
            );

            const data =
                await response.json();

            document.getElementById("message").textContent =
                data.message;

            if (data.success) {

                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

                window.location.href =
                    "expense.html";
            }

        } catch (error) {

            console.error(error);

            document.getElementById("message").textContent =
                "Something went wrong";
        }

    });

}


// =========================================================
// SIGNUP BUTTON
// =========================================================

const signupButton =
    document.getElementById("signupButton");

if (signupButton) {

    signupButton.addEventListener("click", () => {

        window.location.href =
            "signup.html";

    });

}


// =========================================================
// LOGIN BUTTON
// =========================================================

const loginButton =
    document.getElementById("loginButton");

if (loginButton) {

    loginButton.addEventListener("click", () => {

        window.location.href =
            "index.html";

    });

}


// =========================================================
// FORGOT PASSWORD
// =========================================================

const forgotPasswordButton =
    document.getElementById("forgotPasswordButton");

if (forgotPasswordButton) {

    forgotPasswordButton.addEventListener(
        "click",
        async () => {

            const emailInput =
                document.getElementById("email");

            const email =
                emailInput.value.trim();

            const forgotMessage =
                document.getElementById(
                    "forgotMessage"
                );

            if (!email || !emailInput.checkValidity()) {

                forgotMessage.textContent =
                    "Enter your account email in the login email field first.";

                emailInput.focus();

                return;
            }

            try {

                forgotPasswordButton.disabled = true;
                forgotMessage.textContent =
                    "Sending reset email...";

                const response =
                    await axios.post(
                        "http://13.203.210.168:5001/password/forgotpassword",
                        {
                            email: email
                        }
                    );

                forgotMessage.textContent =
                    response.data.message;

                window.location.href =
                    "reset-password.html";

            } catch (error) {

                console.error(error);

                if (error.response) {

                    forgotMessage.textContent =
                        error.response.data.message;

                } else {

                    forgotMessage.textContent =
                        "Something went wrong";

                }

            } finally {

                forgotPasswordButton.disabled = false;

            }

        }
    );

}


// =========================================================
// EXPENSE + DYNAMIC PAGINATION
// =========================================================

// Saare expenses yahan store honge
let allExpenses = [];

// Current page
let currentPage = 1;


// User kitne expenses ek page par dekh sakta hai
const allowedRowsPerPage = [
    5,
    10,
    20,
    30,
    40,
    50
];


// Default value
let expensesPerPage = 10;


// Logged-in user
const expensePaginationUser =
    JSON.parse(
        localStorage.getItem("user")
    );

const welcomeMessage =
    document.getElementById("welcomeMessage");

if (welcomeMessage && expensePaginationUser?.name) {

    welcomeMessage.textContent =
        `Welcome ${expensePaginationUser.name}`;

}


// Rows per page dropdown
const rowsPerPageSelect =
    document.getElementById(
        "rowsPerPage"
    );


// =========================================================
// LOAD SAVED ROWS-PER-PAGE PREFERENCE ,(if logged in user exist then onLy implement inside code)
// =========================================================

if (expensePaginationUser) {

    const savedRowsPerPage =
        Number(
            localStorage.getItem(
                `expensesPerPage_${expensePaginationUser.id}`
            )
        );

    // Agar saved value valid hai
    if (
        allowedRowsPerPage.includes(
            savedRowsPerPage
        )
    ) {

        expensesPerPage =
            savedRowsPerPage;

    }

}


// =========================================================
// ROWS PER PAGE DROPDOWN
// =========================================================

if (rowsPerPageSelect) {

    // Saved value dropdown mein show karo
    rowsPerPageSelect.value =
        String(expensesPerPage);


    rowsPerPageSelect.addEventListener(
        "change",
        () => {

//Suppose user selected:

// 20

// Dropdown ki value usually string hoti hai:

// "20"

// Number() usko:

// 20

// number bana deta hai.


            const selectedRows =
                Number(
                    rowsPerPageSelect.value
                );


            // Invalid value ko ignore karo
            if (
                !allowedRowsPerPage.includes(
                    selectedRows
                )
            ) {

                return;

            }


            // New rows per page
            expensesPerPage =
                selectedRows;


            // User-specific preference save karo , I store the rows-per-page preference in localStorage using a user-specific key, so each user can have their own pagination preference.

            if (expensePaginationUser) {

                localStorage.setItem(
                    `expensesPerPage_${expensePaginationUser.id}`,
                    String(expensesPerPage)
                );

            }


            // Page size change hone ke baad
            // first page par chale jao
            currentPage = 1;


            // Table refresh karo ,New pagination settings ke according table ko dobara display karo.
            renderExpenses();

        }
    );

}


// =========================================================
// EXPENSE PAGE
// =========================================================

const expenseForm =
    document.getElementById(
        "expenseForm"
    );


if (expenseForm) {

    const user =
        JSON.parse(
            localStorage.getItem("user")
        );


    // User login nahi hai
    if (!user) {

        window.location.href =
            "index.html";

    } else {

        // Expenses load karo
        loadExpenses();


        // =================================================
        // ADD EXPENSE
        // =================================================

        expenseForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const amount =
                    document.getElementById(
                        "amount"
                    ).value;


                const description =
                    document.getElementById(
                        "description"
                    ).value;


                const expenseData = {

                    amount,

                    description,

                    userId: user.id

                };


                document.getElementById(
                    "expenseMessage"
                ).textContent =
                    "🤖 AI is categorizing your expense...";


                try {

                    const response =
                        await fetch(
                            "http://13.203.210.168:5001/api/expenses",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        expenseData
                                    )
                            }
                        );


                    const data =
                        await response.json();


                    document.getElementById(
                        "expenseMessage"
                    ).textContent =
                        data.message;


                    if (data.success) {

                        expenseForm.reset();


                        // New expense ke baad
                        // list reload karo
                        await loadExpenses();

                    }

                } catch (error) {

                    console.error(error);

                    document.getElementById(
                        "expenseMessage"
                    ).textContent =
                        "Something went wrong";

                }

            }
        );


        // =================================================
        // LOAD EXPENSES
        // =================================================

        async function loadExpenses() {

            try {

                const response =
                    await fetch(
                        `http://13.203.210.168:5001/api/expenses/${user.id}`
                    );


                const data =
                    await response.json();


                allExpenses =
                    data.expenses || [];


                // New data load hone par
                // first page
                currentPage = 1;


                renderExpenses();


            } catch (error) {

                console.error(error);

            }

        }

    }

}


// =========================================================
// RENDER EXPENSES
// =========================================================

function renderExpenses() {

    const tableBody =
        document.getElementById(
            "expenseTableBody"
        );

    const pagination =
        document.getElementById(
            "expensePagination"
        );

    const previousButton =
        document.getElementById(
            "previousPageButton"
        );

    const nextButton =
        document.getElementById(
            "nextPageButton"
        );

    const pageInfo =
        document.getElementById(
            "pageInfo"
        );


    // Required elements nahi hain
    if (
        !tableBody ||
        !pagination ||
        !previousButton ||
        !nextButton ||
        !pageInfo
    ) {

        return;

    }


    // Table clear karo
    tableBody.innerHTML = "";


    // =====================================================
    // TOTAL PAGES , Ye function decide karta hai:Current page par kaunse expenses dikhane hain.


    // =====================================================

    const totalPages =
        Math.ceil(
            allExpenses.length /
            expensesPerPage
        );


    // =====================================================
    // NO EXPENSES
    // =====================================================

    if (allExpenses.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    No expenses found.
                </td>
            </tr>
        `;


        pagination.style.display =
            "none";


        return;

    }


    // =====================================================
    // PAGE SAFETY
    // =====================================================

    // Agar current page total pages se
    // bada ho gaya
    if (
        currentPage > totalPages
    ) {

        currentPage =
            totalPages;

    }


    // Agar current page 1 se kam ho gaya
    if (currentPage < 1) {

        currentPage = 1;

    }


    // =====================================================
    // START & END INDEX
    // =====================================================

    const startIndex =
        (currentPage - 1) *
        expensesPerPage;


    const endIndex =
        startIndex +
        expensesPerPage;


    // Current page ke expenses , Start index se data leta hai, end index ko include nahi karta. , allExpenses.slice(0, 10)
    const currentExpenses =
        allExpenses.slice(
            startIndex,
            endIndex
        );


    // =====================================================
    // DISPLAY EXPENSES
    // =====================================================

    currentExpenses.forEach(
        (expense) => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `
                <td>
                    ₹${expense.amount}
                </td>

                <td>
                    ${escapeReportHTML(expense.description)}
                </td>

                <td>
                    ${escapeReportHTML(expense.category)}
                </td>

                <td>
                    <button
                        onclick="deleteExpense(${expense.id})"
                    >
                        Delete
                    </button>
                </td>
            `;


            tableBody.appendChild(row);

        }
    );


    // =====================================================
    // PAGINATION UI
    // =====================================================

    pagination.style.display =
        "flex";


    // Example:
    // 1-10 of 2337
    // 11-20 of 2337
    // 21-30 of 2337

    const startNumber =
        startIndex + 1;


    const endNumber =
        Math.min(
            endIndex,
            allExpenses.length
        );


    pageInfo.textContent =
        `${startNumber}-${endNumber} of ${allExpenses.length}`;


    // =====================================================
    // PREVIOUS BUTTON
    // =====================================================

    previousButton.disabled =
        currentPage === 1;


    // =====================================================
    // NEXT BUTTON
    // =====================================================

    nextButton.disabled =
        currentPage === totalPages;

}


// =========================================================
// PREVIOUS PAGE
// =========================================================

const previousPageButton =
    document.getElementById(
        "previousPageButton"
    );


if (previousPageButton) {

    previousPageButton.addEventListener(
        "click",
        () => {

            if (currentPage > 1) {

                currentPage--;

                renderExpenses();

            }

        }
    );

}


// =========================================================
// NEXT PAGE
// =========================================================

const nextPageButton =
    document.getElementById(
        "nextPageButton"
    );


if (nextPageButton) {

    nextPageButton.addEventListener(
        "click",
        () => {

            const totalPages =
                Math.ceil(
                    allExpenses.length /
                    expensesPerPage
                );


            if (
                currentPage <
                totalPages
            ) {

                currentPage++;

                renderExpenses();

            }

        }
    );

}


// =========================================================
// DELETE EXPENSE
// =========================================================

async function deleteExpense(
    expenseId
) {

    const user =
        JSON.parse(
            localStorage.getItem("user")
        );


    if (!user) {

        window.location.href =
            "index.html";

        return;

    }


    try {

        const response =
            await fetch(
                `http://13.203.210.168:5001/api/expenses/${expenseId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        userId: user.id
                    })
                }
            );


        const data =
            await response.json();


        const expenseMessage =
            document.getElementById(
                "expenseMessage"
            );


        if (expenseMessage) {

            expenseMessage.textContent =
                data.message;

        }


        if (data.success) {

            await reloadExpensesAfterDelete();

        }

    } catch (error) {

        console.error(error);


        const expenseMessage =
            document.getElementById(
                "expenseMessage"
            );


        if (expenseMessage) {

            expenseMessage.textContent =
                "Something went wrong";

        }

    }

}


// =========================================================
// RELOAD AFTER DELETE
// =========================================================

async function reloadExpensesAfterDelete() {

    const user =
        JSON.parse(
            localStorage.getItem("user")
        );


    if (!user) {
        return;
    }


    try {

        const response =
            await fetch(
                `http://13.203.210.168:5001/api/expenses/${user.id}`
            );


        const data =
            await response.json();


        allExpenses =
            data.expenses || [];


        const totalPages =
            Math.ceil(
                allExpenses.length /
                expensesPerPage
            );


        // Agar koi expense nahi bacha
        if (totalPages === 0) {

            currentPage = 1;

        }

        // Agar current page ab exist nahi karta
        else if (
            currentPage > totalPages
        ) {

            currentPage =
                totalPages;

        }


        renderExpenses();


    } catch (error) {

        console.error(error);

    }

}


// =========================================================
// PREMIUM & LEADERBOARD
// =========================================================

const paymentButton =
    document.getElementById(
        "paymentButton"
    );

const premiumSection =
    document.getElementById(
        "paymentSection"
    );

function setPremiumMessage(text) {
    if (premiumMessage) {
        premiumMessage.textContent = text;
    }
}

const leaderboardSection =
    document.getElementById(
        "leaderboardSection"
    );

const premiumMessage =
    document.getElementById(
        "premiumMessage"
    );

const leaderboardTableBody =
    document.getElementById(
        "leaderboardTableBody"
    );


if (paymentButton) {

    const user =
        JSON.parse(
            localStorage.getItem("user")
        );


    if (!user) {

        window.location.href =
            "index.html";

    } else {

        checkPremiumStatus();


        paymentButton.addEventListener(
            "click",
            async () => {

                const phone = document.getElementById("paymentPhone").value.trim();

                if (!/^\d{10}$/.test(phone)) {
                    setPremiumMessage("Enter a valid 10-digit mobile number to continue.");
                    return;
                }

                try {

                    paymentButton.disabled =
                        true;


                    paymentButton.textContent =
                        "Starting secure checkout...";


                    const response =
                        await fetch(
                            "http://13.203.210.168:5001/api/payment/orders",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        userId: user.id,
                                        phone
                                    })
                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok || !data.success) {
                        throw new Error(data.message || "Could not start payment.");
                    }

                    if (typeof Cashfree !== "function") {
                        throw new Error("Cashfree Checkout did not load. Refresh and try again.");
                    }

                    const cashfree = Cashfree({ mode: data.mode });
                    const checkoutResult = await cashfree.checkout({
                        paymentSessionId: data.paymentSessionId,
                        redirectTarget: "_self"
                    });

                    if (checkoutResult?.error) {
                        throw new Error(checkoutResult.error.message || "Checkout could not be opened.");
                    }

                } catch (error) {

                    console.error(error);


                    setPremiumMessage(error.message || "Unable to start payment.");


                    paymentButton.disabled =
                        false;


                    paymentButton.textContent =
                        "Pay ₹1 with Cashfree";

                }

            }
        );

    }

}


// =========================================================
// CHECK PREMIUM STATUS
// =========================================================

async function checkPremiumStatus() {

    const user =
        JSON.parse(
            localStorage.getItem("user")
        );


    if (!user) {
        return;
    }


    try {

        const response =
            await fetch(
                `http://13.203.210.168:5001/api/leaderboard/${user.id}`
            );


        const data =
            await response.json();


        if (data.success) {

            setPremiumMessage("You are a Premium user.");


            if (paymentButton) {

                paymentButton.style.display =
                    "none";

            }


            showLeaderboard();

        }

    } catch (error) {

        console.error(error);

    }

}


async function verifyCashfreeReturn() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");

    if (!orderId) {
        return;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    setPremiumMessage("Verifying your payment...");

    try {
        const response = await fetch(
            `http://13.203.210.168:5001/api/payment/orders/${encodeURIComponent(orderId)}/verify?userId=${encodeURIComponent(user.id)}`
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
            setPremiumMessage(data.message || "Payment is not confirmed yet.");
            return;
        }

        localStorage.setItem("user", JSON.stringify(data.user));
        setPremiumMessage(data.message);
        if (paymentButton) {
            paymentButton.style.display = "none";
        }
        params.delete("order_id");
        const query = params.toString();
        history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
        showLeaderboard();
    } catch (error) {
        console.error("Payment verification failed:", error);
        setPremiumMessage("Could not verify payment. Refresh this page to check again.");
    }
}


verifyCashfreeReturn();


// =========================================================
// SHOW LEADERBOARD
// =========================================================

async function showLeaderboard() {

    const user =
        JSON.parse(
            localStorage.getItem("user")
        );


    if (!user) {
        return;
    }


    try {

        const response =
            await fetch(
                `http://13.203.210.168:5001/api/leaderboard/${user.id}`
            );


        const data =
            await response.json();


        if (!data.success) {
            return;
        }


        if (!leaderboardTableBody) {
            return;
        }


        leaderboardTableBody.innerHTML =
            "";


        data.leaderboard.forEach(
            (person, index) => {

                const row =
                    document.createElement(
                        "tr"
                    );


                const rankCell = document.createElement("td");
                rankCell.textContent = index + 1;

                const nameCell = document.createElement("td");
                nameCell.textContent =
                    person.User ? person.User.name : "Unknown";

                const totalCell = document.createElement("td");
                totalCell.textContent =
                    "₹" + Number(person.totalExpense || 0).toFixed(2);

                row.append(rankCell, nameCell, totalCell);


                leaderboardTableBody.appendChild(
                    row
                );

            }
        );


        if (premiumSection) {

            premiumSection.style.display =
                "none";

        }


        if (leaderboardSection) {

            leaderboardSection.style.display =
                "block";

        }


        // Unlock Premium Reports too
        showPremiumReports();

    } catch (error) {

        console.error(error);

    }

}


// =========================================================
// RESET PASSWORD
// =========================================================

const resetPasswordForm =
    document.getElementById(
        "resetPasswordForm"
    );


if (resetPasswordForm) {

    resetPasswordForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const resetCode =
                document.getElementById(
                    "resetCode"
                ).value.trim();


            const newPassword =
                document.getElementById(
                    "newPassword"
                ).value;


            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;


            const resetMessage =
                document.getElementById(
                    "resetMessage"
                );


            if (!resetCode) {

                resetMessage.textContent =
                    "Enter the code sent to your email";

                return;

            }


            // Password match check
            if (
                newPassword !==
                confirmPassword
            ) {

                resetMessage.textContent =
                    "Passwords do not match";

                return;

            }


            try {

                resetMessage.textContent =
                    "Resetting password...";


                const response =
                    await axios.post(
                        "http://13.203.210.168:5001/password/resetpassword",
                        {
                            resetCode:
                                resetCode,

                            newPassword:
                                newPassword
                        }
                    );


                resetMessage.textContent =
                    response.data.message;


                if (
                    response.data.success
                ) {

                    setTimeout(
                        () => {

                            window.location.href =
                                "index.html";

                        },
                        2000
                    );

                }

            } catch (error) {

                console.error(error);


                if (error.response) {

                    resetMessage.textContent =
                        error.response.data.message;

                } else {

                    resetMessage.textContent =
                        "Something went wrong";

                }

            }

        }
    );

}


// =========================================================
// BACK TO LOGIN
// =========================================================

const backToLoginButton =
    document.getElementById(
        "backToLoginButton"
    );


if (backToLoginButton) {

    backToLoginButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "index.html";

        }
    );

}


// =========================================================
// PREMIUM EXPENSE & INCOME REPORTS
// =========================================================

// =========================================================
// GET USER
// =========================================================

const reportUser =
    JSON.parse(
        localStorage.getItem("user")
    );


// =========================================================
// ELEMENTS
// =========================================================

const premiumReportsSection =
    document.getElementById(
        "premiumReportsSection"
    );

const reportContent =
    document.getElementById(
        "reportContent"
    );

const reportPremiumLock =
    document.getElementById(
        "reportPremiumLock"
    );

const downloadReportButton =
    document.getElementById(
        "downloadReportButton"
    );

const periodButtons =
    document.querySelectorAll(
        ".period-button"
    );

const financialReportBody =
    document.getElementById(
        "financialReportBody"
    );

const yearlyReportBody =
    document.getElementById(
        "yearlyReportBody"
    );

const notesReportBody =
    document.getElementById(
        "notesReportBody"
    );

const reportPeriodTitle =
    document.getElementById(
        "reportPeriodTitle"
    );

const reportDateRange =
    document.getElementById(
        "reportDateRange"
    );

const reportTotalIncome =
    document.getElementById(
        "reportTotalIncome"
    );

const reportTotalExpense =
    document.getElementById(
        "reportTotalExpense"
    );

const reportSavings =
    document.getElementById(
        "reportSavings"
    );


// =========================================================
// PREMIUM STATUS
// =========================================================

let isReportPremium = false;


if (reportUser) {

    isReportPremium =
        reportUser.isPremium === true ||
        reportUser.isPremium === 1 ||
        reportUser.isPremium === "1";

}


// =========================================================
// REPORT DATA
// =========================================================

let reportExpenses = [];

let selectedReportPeriod =
    "daily";


// =========================================================
// LOAD REPORT DATA
// =========================================================

async function loadReportData() {

    if (!reportUser) {
        return;
    }


    try {

        const response =
            await axios.get(
                `http://13.203.210.168:5001/api/expenses/${reportUser.id}`
            );


        if (
            response.data &&
            Array.isArray(
                response.data.expenses
            )
        ) {

            reportExpenses =
                response.data.expenses;

        } else {

            reportExpenses = [];

        }


        renderReport();


    } catch (error) {

        console.error(
            "Failed to load report data:",
            error
        );


        reportExpenses = [];


        renderReport();

    }

}


// =========================================================
// DATE HELPERS
// =========================================================

function getExpenseDate(expense) {

    return new Date(
        expense.createdAt ||
        Date.now()
    );

}


function isSameDay(
    date1,
    date2
) {

    return (
        date1.getFullYear() ===
            date2.getFullYear() &&

        date1.getMonth() ===
            date2.getMonth() &&

        date1.getDate() ===
            date2.getDate()
    );

}


function getStartOfWeek(date) {

    const result =
        new Date(date);


    const day =
        result.getDay();


    const difference =
        day === 0
            ? -6
            : 1 - day;


    result.setDate(
        result.getDate() +
        difference
    );


    result.setHours(
        0,
        0,
        0,
        0
    );


    return result;

}


function isSameWeek(
    date1,
    date2
) {

    const startOfWeek =
        getStartOfWeek(
            date2
        );


    const endOfWeek =
        new Date(
            startOfWeek
        );


    endOfWeek.setDate(
        endOfWeek.getDate() +
        7
    );


    return (
        date1 >= startOfWeek &&
        date1 < endOfWeek
    );

}


function isSameMonth(
    date1,
    date2
) {

    return (
        date1.getFullYear() ===
            date2.getFullYear() &&

        date1.getMonth() ===
            date2.getMonth()
    );

}


// =========================================================
// FILTER REPORT EXPENSES
// =========================================================

function getFilteredReportExpenses() {

    const today =
        new Date();


    return reportExpenses.filter(
        (expense) => {

            const expenseDate =
                getExpenseDate(
                    expense
                );


            if (
                selectedReportPeriod ===
                "daily"
            ) {

                return isSameDay(
                    expenseDate,
                    today
                );

            }


            if (
                selectedReportPeriod ===
                "weekly"
            ) {

                return isSameWeek(
                    expenseDate,
                    today
                );

            }


            if (
                selectedReportPeriod ===
                "monthly"
            ) {

                return isSameMonth(
                    expenseDate,
                    today
                );

            }


            return true;

        }
    );

}


// =========================================================
// FORMAT DATE
// =========================================================

function formatReportDate(date) {

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


// =========================================================
// FORMAT MONEY
// =========================================================

function formatMoney(amount) {

    return `₹${Number(
        amount || 0
    ).toFixed(2)}`;

}


// =========================================================
// RENDER REPORT
// =========================================================

function renderReport() {

    if (!financialReportBody) {
        return;
    }


    // Non-premium user
    if (!isReportPremium) {

        if (reportContent) {

            reportContent.style.display =
                "none";

        }


        if (reportPremiumLock) {

            reportPremiumLock.style.display =
                "block";

        }


        if (downloadReportButton) {

            downloadReportButton.disabled =
                true;

        }


        return;

    }


    // Premium user
    if (reportContent) {

        reportContent.style.display =
            "block";

    }


    if (reportPremiumLock) {

        reportPremiumLock.style.display =
            "none";

    }


    if (downloadReportButton) {

        downloadReportButton.disabled =
            false;

    }


    const filteredExpenses =
        getFilteredReportExpenses();


    // =====================================================
    // TITLE
    // =====================================================

    if (
        selectedReportPeriod ===
        "daily"
    ) {

        reportPeriodTitle.textContent =
            "Daily Report";

    } else if (
        selectedReportPeriod ===
        "weekly"
    ) {

        reportPeriodTitle.textContent =
            "Weekly Report";

    } else {

        reportPeriodTitle.textContent =
            "Monthly Report";

    }


    const today =
        new Date();


    reportDateRange.textContent =
        formatReportDate(
            today
        );


    // =====================================================
    // CLEAR TABLE
    // =====================================================

    financialReportBody.innerHTML =
        "";


    // =====================================================
    // EMPTY
    // =====================================================

    if (
        filteredExpenses.length === 0
    ) {

        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `
            <td colspan="5">
                No expenses found for this period.
            </td>
        `;


        financialReportBody.appendChild(
            row
        );

    }


    // =====================================================
    // TOTALS
    // =====================================================

    let totalExpense = 0;

    let totalIncome = 0;


    // =====================================================
    // EXPENSE ROWS
    // =====================================================

    filteredExpenses.forEach(
        (expense) => {

            const row =
                document.createElement(
                    "tr"
                );


            const expenseAmount =
                Number(
                    expense.amount || 0
                );


            totalExpense +=
                expenseAmount;


            const expenseDate =
                getExpenseDate(
                    expense
                );


            row.innerHTML = `
                <td>
                    ${formatReportDate(
                        expenseDate
                    )}
                </td>

                <td>
                    ${escapeReportHTML(
                        expense.description
                    )}
                </td>

                <td>
                    ${escapeReportHTML(
                        expense.category
                    )}
                </td>

                <td>
                    ₹0.00
                </td>

                <td>
                    ${formatMoney(
                        expenseAmount
                    )}
                </td>
            `;


            financialReportBody.appendChild(
                row
            );

        }
    );


    // =====================================================
    // UPDATE TOTALS
    // =====================================================

    reportTotalIncome.textContent =
        formatMoney(
            totalIncome
        );


    reportTotalExpense.textContent =
        formatMoney(
            totalExpense
        );


    const savings =
        totalIncome -
        totalExpense;


    reportSavings.textContent =
        formatMoney(
            savings
        );


    // Yearly report
    renderYearlyReport();

}


// =========================================================
// YEARLY REPORT
// =========================================================

function renderYearlyReport() {

    if (!yearlyReportBody) {
        return;
    }


    yearlyReportBody.innerHTML =
        "";


    const currentYear =
        new Date().getFullYear();


    const monthlyData = {};


    // 12 months create karo
    for (
        let month = 0;
        month < 12;
        month++
    ) {

        monthlyData[month] = {

            income: 0,

            expense: 0

        };

    }


    // Expenses ko month-wise add karo
    reportExpenses.forEach(
        (expense) => {

            const date =
                getExpenseDate(
                    expense
                );


            if (
                date.getFullYear() !==
                currentYear
            ) {

                return;

            }


            const month =
                date.getMonth();


            monthlyData[month].expense +=
                Number(
                    expense.amount || 0
                );

        }
    );


    const monthNames = [

        "January",

        "February",

        "March",

        "April",

        "May",

        "June",

        "July",

        "August",

        "September",

        "October",

        "November",

        "December"

    ];


    let yearlyIncome = 0;

    let yearlyExpense = 0;


    monthNames.forEach(
        (monthName, index) => {

            const income =
                monthlyData[index]
                    .income;


            const expense =
                monthlyData[index]
                    .expense;


            const savings =
                income -
                expense;


            yearlyIncome +=
                income;


            yearlyExpense +=
                expense;


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `
                <td>
                    ${monthName}
                </td>

                <td>
                    ${formatMoney(
                        income
                    )}
                </td>

                <td>
                    ${formatMoney(
                        expense
                    )}
                </td>

                <td>
                    ${formatMoney(
                        savings
                    )}
                </td>
            `;


            yearlyReportBody.appendChild(
                row
            );

        }
    );


    // =====================================================
    // TOTAL ROW
    // =====================================================

    const totalRow =
        document.createElement(
            "tr"
        );


    totalRow.className =
        "report-total-row";


    totalRow.innerHTML = `
        <td>
            Total
        </td>

        <td>
            ${formatMoney(
                yearlyIncome
            )}
        </td>

        <td>
            ${formatMoney(
                yearlyExpense
            )}
        </td>

        <td>
            ${formatMoney(
                yearlyIncome -
                yearlyExpense
            )}
        </td>
    `;


    yearlyReportBody.appendChild(
        totalRow
    );

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeReportHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


// =========================================================
// PERIOD BUTTONS
// =========================================================

periodButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                periodButtons.forEach(
                    (item) => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                selectedReportPeriod =
                    button.dataset.period;


                renderReport();

            }
        );

    }
);


// =========================================================
// DOWNLOAD REPORT
// =========================================================

if (downloadReportButton) {

    downloadReportButton.addEventListener(
        "click",
        () => {

            if (!isReportPremium) {
                return;
            }


            downloadReportAsCSV();

        }
    );

}


// =========================================================
// DOWNLOAD REPORT AS CSV
// =========================================================

function downloadReportAsCSV() {

    const filteredExpenses =
        getFilteredReportExpenses();


    let csvContent =
        "Date,Description,Category,Income,Expense\n";


    filteredExpenses.forEach(
        (expense) => {

            const date =
                getExpenseDate(
                    expense
                );


            const description =
                String(
                    expense.description ||
                    ""
                ).replace(
                    /"/g,
                    '""'
                );


            const category =
                String(
                    expense.category ||
                    ""
                ).replace(
                    /"/g,
                    '""'
                );


            csvContent +=
                `"${formatReportDate(date)}",` +
                `"${description}",` +
                `"${category}",` +
                `"0.00",` +
                `"${Number(
                    expense.amount || 0
                ).toFixed(2)}"\n`;

        }
    );


    const blob =
        new Blob(
            [csvContent],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `expense-report-${selectedReportPeriod}.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );

}


// =========================================================
// NOTES
// =========================================================

if (notesReportBody) {

    notesReportBody.innerHTML = `
        <tr>
            <td colspan="2">
                No notes available yet.
            </td>
        </tr>
    `;

}


// =========================================================
// SHOW PREMIUM REPORTS (called once the user is premium)
// =========================================================

function showPremiumReports() {

    if (!premiumReportsSection) {
        return;
    }

    isReportPremium = true;

    premiumReportsSection.style.display =
        "block";

    loadReportData();

}


// =========================================================
// INITIAL REPORT LOAD
// =========================================================

if (
    premiumReportsSection &&
    reportUser
) {

    loadReportData();

}


const downloadExpensesButton = document.getElementById(
    "downloadExpensesButton"
);

if (downloadExpensesButton) {
    downloadExpensesButton.addEventListener("click", async () => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));

            if (!user) {
                alert("Please login first");
                return;
            }

            const response = await axios.get(
                `http://13.203.210.168:5001/api/expenses/download/${user.id}`
            );

            const downloadUrl = response.data.downloadUrl;

            // Download file
            window.location.href = downloadUrl;

        } catch (error) {
            console.error(error);

            if (error.response && error.response.status === 401) {
                alert("This feature is only available for premium users.");
            } else {
                alert("Failed to download expenses.");
            }
        }
    });
}

// =========================================================
// LOGOUT
// =========================================================

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "index.html";
    });
}
