# SpendWise

SpendWise is a small, responsive budgeting dashboard built with HTML, CSS, and plain JavaScript. It lets you set a monthly budget, record expenses in Kenyan shillings, review spending progress, filter expense activity, and remove entries. Budget and expense data are saved in the browser's local storage.

## Improvements made

- Added a dashboard showing the monthly budget, current-month spending, remaining amount, and budget-use progress.
- Added an expense form with a description, amount, category, and date.
- Added a recent-expenses list with category icons, date formatting, a category filter, and delete buttons.
- Added responsive styling and accessible labels, focus states, and live status messages.
- Persisted expenses and the budget between visits using local storage.

## JavaScript concepts

- **Conditionals:** Input checks reject non-positive budgets and expenses. Dashboard conditionals distinguish between an unset budget, spending within budget, and going over budget, and the list provides a different empty state when a category filter has no matches.
- **Arrays:** The `expenses` array stores expense records as objects. Adding pushes a record, deleting filters one out, and loading validates the records saved in local storage.
- **Loops:** `for...of` loops calculate total spending and create a visible row for each matching expense.
- **DOM updates:** `renderDashboard()` and `renderExpenses()` update summary values, progress, count, and expense rows directly in the page. User-entered names are inserted as text, not interpreted as HTML.
- **Events and interactions:** Submit listeners handle the budget and expense forms; a change listener updates the category filter; a delegated click listener handles expense deletion.

## Challenges and resolutions

- **Keeping the dashboard consistent after changes:** Budget, add, and delete actions all save the current data and re-render the dashboard so totals and the list stay in sync.
- **Handling saved data safely:** Local-storage parsing is guarded against malformed JSON, and loaded expense records are checked before use. If storage cannot be written, the error is logged and the user sees a status message.
- **Avoiding unsafe rendering:** Expense text is created with DOM elements and `textContent`, so names are displayed as plain text.

## Run locally

Open `index.html` in a modern browser. No build step or package installation is required. Data is stored locally in that browser and is not synced between devices.
