const transactions = JSON.parse(localStorage.getItem("transactions")) || []; // local storage
const list = document.getElementById("listOfTransaction");
const balance = document.getElementById("balance");
const income = document.getElementById("income");
const expense = document.getElementById("expense");
const statusTransaction = document.getElementById("status");
const switchButton = document.getElementById("switch-button");
const form = document.querySelector("form");
let defulttransactionmode = "expense";

form.addEventListener("submit", addTransaction);
// button for each transactionmode
switchButton.addEventListener("click", () => {
    switchButton.classList.toggle("switch-active");

    defulttransactionmode = switchButton.classList.contains("switch-active") ? "income": "expense";
});


// Categories definition for transaction based on description
const categories = {
    food: ["food","pizza", "burger", "mcdonalds", "restaurant", "sandwich", "coffee", "fast food", "delivery"],
    clothing: ["shoes", "shirt", "jeans", "jacket", "clothing", "dress"],
    entertainment: ["concert", "movie", "cinema", "event", "show", "theater", "music"],
    transportation: ["gas", "fuel", "uber", "taxi", "bus", "train", "car", "transportation"],
    income: ["paycheck","pay-check","check","salary", "bonus", "payment", "income", "deposit", "job"]
};

// Function to categorize a transaction based on its description
function categorizeTransaction(description) {
    // Convert description to lowercase for case-insensitive comparison
    const lowerCaseDescription = description.toLowerCase();

    // Loop through the categories and check if the description matches any keyword
    for (const category in categories) {
        for (const keyword of categories[category]) {
            if (lowerCaseDescription.includes(keyword)) {
                return category;  // Return the matched category
            }
        }
    }
    // If no match is found, return 'Other' as a default
    return 'Other';
}

// the format of each transaction
const transactionFormat = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    signDisplay: "always",
});

// adding transaction
function addTransaction(e){
    e.preventDefault();

    const formData = new FormData(this);
    const amount = parseFloat(formData.get("amount"));
    const transactionAmount = defulttransactionmode === "expense" ? -amount : amount;
   
    const newTransaction = {
        id: transactions.length + 1,
        name: formData.get("name"),
        amount: transactionAmount,
        date: new Date(formData.get("date")),
        type: defulttransactionmode,
    }


    transactions.push(newTransaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    saveTransactions();
     

    if (defulttransactionmode === "income") {
        switchButton.classList.remove("switch-active"); // Reset the switch to "expense"
        defulttransactionmode = "expense"; // Update the mode variable
    }

    this.reset();
    updateTotal();
    renderList();
    updateChart();
}

// delete transaction
function deleteTransaction(id){
    const index = transactions.findIndex((trx) => trx.id === id);

    if (index !== -1) {
        transactions.splice(index, 1);

        localStorage.setItem("transactions", JSON.stringify(transactions));
        saveTransactions();
    updateTotal();
    renderList();
    updateChart();
    }
}


function updateTotal() {
    const incomeTotal = transactions
    .filter((trx) => trx.type === "income")
    .reduce((total, trx) => total + trx.amount, 0);
    const expenseTotal = transactions
    .filter((trx) => trx.type === "expense")
    .reduce((total, trx) => total + trx.amount, 0);
    const balanceTotal = incomeTotal + expenseTotal;

    balance.textContent = transactionFormat.format(balanceTotal);
    income.textContent = transactionFormat.format(incomeTotal);
    expense.textContent = transactionFormat.format(expenseTotal);
}


function renderList() {
    list.innerHTML = "";
    if(transactions.length === 0) {
        statusTransaction.textContent = 'No transactions.';
        return;
    } else {
    statusTransaction.textContent = '';
    transactions.forEach((transaction) =>{
        const { id, name, amount, date, type } = transaction;
        const li = document.createElement("li")
        li.innerHTML = `
            <div class="name">
            <h4>${name}</h4>
            <p>${new Date(date).toLocaleDateString()}</p>
            </div>
            <div class="amount ${type === 'income' ? 'income' : 'expense'}">
                <span>${transactionFormat.format(amount)}</span>
            </div>
            <div class="action">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
            onclick="deleteTransaction(${id})">
                <path stroke-linecap="round" stroke-linejoin="round"
                d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>

            </div>

        `;
        list.appendChild(li);
    });
}
}

const ctx = document.getElementById("expenseChart").getContext("2d");

// Data for the pie chart
const data = {
    labels: ['Income', 'Food', 'Clothing', 'Entertainment', 'Transportation', 'other'],
    datasets: [{
        label: 'Expenses and Income',
        data: [0, 0, 0, 0, 0, 0],  // Initial values set to 0
        backgroundColor: [
            '#4CAF50',  // Income - Green
            '#FF9800',  // Food - Orange
            '#2196F3',  // Clothing - Blue
            '#FF5722',  // Entertainment - Red
            '#9C27B0',  // Transportation - Purple
            '#ffff00'   // Other - yellow
        ],
        borderColor: '#fff',  // Border color for the segments
        borderWidth: 1
    }]
};

// Configuration for the pie chart
const config = {
    type: 'pie',  // Pie chart type
    data: data,
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',  // Position of the legend
            },
            tooltip: {
                callbacks: {
                    label: function(tooltipItem) {
                        const dataset = tooltipItem.dataset;
                        const total = dataset.data.reduce((acc, curr) => acc + curr, 0); // Calculate total of all values
                        const value = dataset.data[tooltipItem.dataIndex];
                        const percentage = ((value / total) * 100).toFixed(2);  // Calculate percentage
                        return `${tooltipItem.label}: ${percentage}%`;  // Return label with percentage
                    }
                }
            },
            datalabels: {
                color: '#fff',  // Color of the data labels
                formatter: function(value, context) {
                    const dataset = context.chart.data.datasets[0];
                    const total = dataset.data.reduce((acc, curr) => acc + curr, 0); // Calculate total of all values
                    const percentage = ((value / total) * 100).toFixed(2);  // Calculate percentage
                    return `${percentage}%`;  // Return percentage value
                },
                font: {
                    weight: 'bold',  // Font weight for the label
                    size: 14  // Font size for the label
                },
                anchor: 'end',  // Position of the label relative to the segment
                align: 'start'  // Alignment of the label
            }
        }
    }
};

// Create the chart
const expenseChart = new Chart(ctx, config);

// Initially update the chart to reflect the correct state
updateChart();

function updateChart() {
    // Get the transactions
    const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
   
    // Prepare categories and their amounts
    let income = 0, food = 0, clothing = 0, entertainment = 0, transportation = 0, other = 0;
   
    transactions.forEach(transaction => {
        const category = categorizeTransaction(transaction.name); // Get category using categorizeTransaction

        // Sum the amounts based on the category
        if (category === "income") {
            income += transaction.amount;  // Keep income as is
        } else if (category === "food") {
            food += Math.abs(transaction.amount);  // Convert expense amount to positive
        } else if (category === "clothing") {
            clothing += Math.abs(transaction.amount);  // Convert expense amount to positive
        } else if (category === "entertainment") {
            entertainment += Math.abs(transaction.amount);  // Convert expense amount to positive
        } else if (category === "transportation") {
            transportation += Math.abs(transaction.amount);  // Convert expense amount to positive
        } else {
            other += Math.abs(transaction.amount);  // Add amounts categorized as "Other"
        }
    });

    // Check if there are no transactions
    if (transactions.length === 0) {
        // Set chart data to empty or zero values
        data.datasets[0].data = [0, 0, 0, 0, 0, 0]; // Empty data set
    } else {
        // Set chart data based on categorized values
        data.datasets[0].data = [income, food, clothing, entertainment, transportation, other];
    }
   
    // Update the chart
    expenseChart.update();
}


function saveTransactions() {
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));  // Sort by date (latest first)
    localStorage.setItem("transactions", JSON.stringify(transactions));  // Save to localStorage
  }

renderList();
updateTotal();
