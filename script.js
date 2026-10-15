"use strict";

const STORAGE_KEYS = {
  budget: "spendwise-budget",
  expenses: "spendwise-expenses"
};

const categoryIcons = {
  Food: "🥑",
  Transport: "🚲",
  Bills: "🧾",
  Shopping: "🛍️",
  Health: "🌿",
  Other: "✦"
};

const currencyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 2
});

const budgetForm = document.querySelector("#budget-form");
const budgetInput = document.querySelector("#budget-input");
const expenseForm = document.querySelector("#expense-form");
const expenseNameInput = document.querySelector("#expense-name");
const expenseAmountInput = document.querySelector("#expense-amount");
const expenseDateInput = document.querySelector("#expense-date");
const categoryFilter = document.querySelector("#category-filter");
const expenseList = document.querySelector("#expense-list");
const formMessage = document.querySelector("#form-message");
const monthLabel = document.querySelector("#current-month");
const budgetValue = document.querySelector("#budget-value");
const spentValue = document.querySelector("#spent-value");
const spentNote = document.querySelector("#spent-note");
const remainingValue = document.querySelector("#remaining-value");
const remainingNote = document.querySelector("#remaining-note");
const progress = document.querySelector("#budget-progress");
const progressFill = document.querySelector("#progress-fill");
const expenseCount = document.querySelector("#expense-count");
const listFooter = document.querySelector("#list-footer");

let expenses = loadExpenses();
let monthlyBudget = loadBudget();

function loadExpenses() {
  try {
    const savedExpenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.expenses) || "[]");
    if (!Array.isArray(savedExpenses)) {
      return [];
    }
    return savedExpenses.filter((expense) =>
      expense &&
      typeof expense.id === "string" &&
      typeof expense.name === "string" &&
      typeof expense.amount === "number" &&
      Number.isFinite(expense.amount) &&
      typeof expense.category === "string" &&
      typeof expense.date === "string"
    );
  } catch (error) {
    console.error("Unable to load saved expenses.", error);
    return [];
  }
}

function loadBudget() {
  const savedBudget = Number(localStorage.getItem(STORAGE_KEYS.budget));
  return Number.isFinite(savedBudget) && savedBudget > 0 ? savedBudget : 0;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
    localStorage.setItem(STORAGE_KEYS.budget, String(monthlyBudget));
    return true;
  } catch (error) {
    console.error("Unable to save SpendWise data.", error);
    formMessage.textContent = "Your browser couldn't save this change. Check available storage.";
    return false;
  }
}

function getLocalDateString(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function formatMoney(amount) {
  return currencyFormatter.format(amount);
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function renderDashboard() {
  let totalSpent = 0;
  const currentMonthKey = getLocalDateString().slice(0, 7);
  const currentMonthExpenses = expenses.filter((expense) => expense.date.startsWith(currentMonthKey));
  for (const expense of currentMonthExpenses) {
    totalSpent += expense.amount;
  }

  const remaining = monthlyBudget - totalSpent;
  budgetValue.textContent = monthlyBudget > 0 ? formatMoney(monthlyBudget) : "Not set";
  spentValue.textContent = formatMoney(totalSpent);
  expenseCount.textContent = String(currentMonthExpenses.length);
  spentNote.textContent = currentMonthExpenses.length === 1
    ? "Across 1 expense this month"
    : `Across ${currentMonthExpenses.length} expenses this month`;

  if (monthlyBudget <= 0) {
    remainingValue.textContent = "—";
    remainingNote.textContent = "Set a budget to see your progress";
    progress.setAttribute("aria-valuenow", "0");
    progressFill.style.width = "0%";
    progress.classList.remove("over-budget");
  } else if (remaining < 0) {
    remainingValue.textContent = `−${formatMoney(Math.abs(remaining))}`;
    remainingNote.textContent = "Over budget — consider adjusting your spending";
    progress.setAttribute("aria-valuenow", "100");
    progressFill.style.width = "100%";
    progress.classList.add("over-budget");
  } else {
    remainingValue.textContent = formatMoney(remaining);
    remainingNote.textContent = `${Math.min(Math.round((totalSpent / monthlyBudget) * 100), 100)}% of your budget used`;
    const percentageUsed = Math.min((totalSpent / monthlyBudget) * 100, 100);
    progress.setAttribute("aria-valuenow", String(Math.round(percentageUsed)));
    progressFill.style.width = `${percentageUsed}%`;
    progress.classList.remove("over-budget");
  }

  budgetInput.value = monthlyBudget > 0 ? String(monthlyBudget) : "";
  renderExpenses();
}

function renderExpenses() {
  const selectedCategory = categoryFilter.value;
  const visibleExpenses = expenses
    .filter((expense) => selectedCategory === "All" || expense.category === selectedCategory)
    .slice()
    .sort((first, second) => second.date.localeCompare(first.date) || second.id.localeCompare(first.id));

  expenseList.replaceChildren();
  listFooter.textContent = visibleExpenses.length < expenses.length
    ? `Showing ${visibleExpenses.length} of ${expenses.length} expenses`
    : "";

  if (visibleExpenses.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = selectedCategory === "All" ? "✳" : "⌕";
    const title = document.createElement("strong");
    title.textContent = selectedCategory === "All" ? "A fresh start" : `No ${selectedCategory.toLowerCase()} expenses`;
    const message = document.createElement("p");
    message.textContent = selectedCategory === "All"
      ? "Your expenses will show up here. Add one to see your spending take shape."
      : "Try another category or add an expense in this category.";
    emptyState.append(icon, title, message);
    expenseList.append(emptyState);
    return;
  }

  for (const expense of visibleExpenses) {
    const row = document.createElement("article");
    row.className = "expense-item";

    const icon = document.createElement("span");
    icon.className = "category-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = categoryIcons[expense.category] || categoryIcons.Other;

    const details = document.createElement("div");
    details.className = "expense-details";
    const name = document.createElement("p");
    name.className = "expense-name";
    name.textContent = expense.name;
    const meta = document.createElement("p");
    meta.className = "expense-meta";
    meta.textContent = `${expense.category} · ${formatDate(expense.date)}`;
    details.append(name, meta);

    const amount = document.createElement("p");
    amount.className = "expense-amount";
    amount.textContent = formatMoney(expense.amount);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.expenseId = expense.id;
    deleteButton.setAttribute("aria-label", `Delete ${expense.name}`);
    deleteButton.textContent = "×";

    row.append(icon, details, amount, deleteButton);
    expenseList.append(row);
  }
}

budgetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nextBudget = Number(budgetInput.value);
  if (!Number.isFinite(nextBudget) || nextBudget <= 0) {
    budgetInput.setCustomValidity("Enter a budget greater than zero.");
    budgetInput.reportValidity();
    return;
  }
  budgetInput.setCustomValidity("");
  monthlyBudget = nextBudget;
  const saved = saveState();
  renderDashboard();
  if (saved) {
    formMessage.textContent = "Monthly budget updated.";
  }
});

budgetInput.addEventListener("input", () => budgetInput.setCustomValidity(""));

expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!expenseForm.reportValidity()) {
    return;
  }
  const amount = Number(expenseAmountInput.value);
  if (!Number.isFinite(amount) || amount <= 0) {
    expenseAmountInput.setCustomValidity("Enter an amount greater than zero.");
    expenseAmountInput.reportValidity();
    return;
  }

  const formData = new FormData(expenseForm);
  expenses.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: String(formData.get("name")).trim(),
    amount,
    category: String(formData.get("category")),
    date: String(formData.get("date"))
  });
  const saved = saveState();
  renderDashboard();
  expenseForm.reset();
  expenseDateInput.value = getLocalDateString();
  if (saved) {
    formMessage.textContent = "Expense added to your activity.";
  }
  expenseNameInput.focus();
});

expenseAmountInput.addEventListener("input", () => expenseAmountInput.setCustomValidity(""));
categoryFilter.addEventListener("change", renderExpenses);

expenseList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("button[data-expense-id]");
  if (!deleteButton) {
    return;
  }
  const expense = expenses.find((item) => item.id === deleteButton.dataset.expenseId);
  if (!expense) {
    return;
  }
  expenses = expenses.filter((item) => item.id !== expense.id);
  saveState();
  renderDashboard();
});

const now = new Date();
monthLabel.textContent = new Intl.DateTimeFormat("en-KE", { month: "long", year: "numeric" }).format(now);
expenseDateInput.value = getLocalDateString(now);
renderDashboard();
