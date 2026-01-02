const primaryInput = document.getElementById("primaryData");
const secondaryView = document.querySelector(".dataView_secondary input");
const errorView = document.querySelector(".ErrorView input");

let currentExpression = "";
let lastAnswer = "0";

let history = [];  // stores { expression, result }


let justEvaluated = false;// Track if last action was evaluation

const toggleBtn = document.getElementById("toggleHistory");
const historyContainer = document.getElementById("historyContainer");

let activeButton = null;

function setActiveButton(id) {
    // Clear previous active
    if (activeButton) {
        activeButton.classList.remove("active");
    }

    // Set new active
    const button = document.getElementById(id);
    if (button) {
        button.classList.add("active");
        activeButton = button;
    }
}

toggleBtn.addEventListener("click", () => {
    if (historyContainer.style.display === "none") {
        historyContainer.style.display = "block";
        toggleBtn.textContent = "Hide History";
    } else {
        historyContainer.style.display = "none";
        toggleBtn.textContent = "Show History";
    }
});

// Update primary display
function updatePrimaryDisplay(value) {
    primaryInput.value = value;
}

function isValidFirstEntry(id) {
    // Not allowed as first entry: +, /, ^, ), *
    const notAllowed = ["sum", "division", "exponential", "closeBracket", "multiplication"];

    if (notAllowed.includes(id)) {
        errorView.value = "Error: invalid start of expression!";
        return false;
    }

    // Everything else is allowed
    return true;
}
// --- Validation function ---
function isValidNextInput(currentExpression, id) {
    let lastChar = currentExpression.slice(-1);

    // If last token is "ans" and next is digit, ans, or function
    if (/ans$/.test(currentExpression) &&
        (["digit0","digit1","digit2","digit3","digit4","digit5","digit6","digit7","digit8","digit9",
          "ans","sin","cos","tan","log","sqrt"].includes(id))) {
        errorView.value = "Error: need operator!";
        return false;
    }

    // If last char is digit or ')' and next is function or ans
    if ((/\d$/.test(lastChar) || lastChar === ")") &&
        ["sin","cos","tan","log","sqrt","ans"].includes(id)) {
        errorView.value = "Error: need operator!";
        return false;
    }

    // If last token is function or ans and next is another ans
    if ((/(sin|cos|tan|log|sqrt|ans)$/.test(currentExpression)) && id === "ans") {
        errorView.value = "Error: need operator!";
        return false;
    }
    
    // If last char is an operator and next is another operator (except minus for negative numbers)
// If last char is an operator and next is another operator (except minus for negative numbers)
if (/[\+\*\/\^%]$/.test(currentExpression) && 
    ["sum","multiplication","division","exponential","percentage","subtraction"].includes(id)) {
    // Allow subtraction (negative numbers), block others
    if (id !== "subtraction") {
        errorView.value = "Error: invalid operator sequence!";
        return false;
    }
}

// If last char is '+' and next is '+' (double plus not allowed)
// if (/\+$/.test(currentExpression) && id === "sum") {
//     errorView.value = "Error: invalid operator sequence!";
//     return false;
// }

// If last char is '-' and next is any operator except digit, decimal, function, or open bracket
if (/\-$/.test(currentExpression) && 
    ["sum","multiplication","division","exponential","percentage","subtraction"].includes(id)) {
    errorView.value = "Error: invalid operator sequence!";
    return false;
}

// If last char is '(' and next is an operator other than subtraction
if (/\($/.test(currentExpression) &&
    ["sum","multiplication","division","exponential","percentage"].includes(id)) {
    errorView.value = "Error: invalid operator after '('";
    return false;
}

// If last char is '(' and next is subtraction, that's fine (negative number/function)
if (/\($/.test(currentExpression) && id === "subtraction") {
    errorView.value = ""; // allow "-..."
    return true;
}

// If last char is '('
if (/\($/.test(currentExpression)) {
    // Allowed: subtraction (negative), digits, functions, ans, another '('
    if (
        id === "subtraction" ||
        id.startsWith("digit") ||
        ["sin","cos","tan","log","sqrt","ans","openBracket","decimal"].includes(id)
    ) {
        errorView.value = "";
        return true;
    }

    // Block any other operator (like '+', '*', '/', '^', '%')
    if (["sum","multiplication","division","exponential","percentage"].includes(id)) {
        errorView.value = "Error: invalid operator after '('";
        return false;
    }
}

    errorView.value = ""; // clear error if valid
    return true;
}


// Handle button clicks
document.querySelectorAll(".calc-key").forEach(button => {
    button.addEventListener("click", () => {
        const id = button.id;
        const text = button.textContent;

          // Check if last action was evaluation
        if (justEvaluated) {
    // If the pressed button is NOT an operator, clear and start new
                if (!["sum","subtraction","multiplication","division",
                        "openBracket","closeBracket","percentage","exponential"].includes(id)) {
                currentExpression = "";
        }
        justEvaluated = false;
        }

        if(!isValidNextInput(currentExpression, id)) return;
                // First entry validation
        if (currentExpression.length === 0 && !isValidFirstEntry(id)) {
            return; // block invalid start
        }



        switch (id) {
            // Digits
            case "digit0": case "digit1": case "digit2": case "digit3":
            case "digit4": case "digit5": case "digit6":
            case "digit7": case "digit8": case "digit9":
                currentExpression += text;
                break;

            // Decimal (prevent multiple in same number)
            case "decimal":
                let parts = currentExpression.split(/[\+\-\*\/\^\(\)]/);
                let lastPart = parts[parts.length - 1];
                if (!lastPart.includes(".")) {
                    currentExpression += ".";
                }
                break;

            // Operators
            case "sum": case "subtraction": case "multiplication":
            case "division": case "openBracket": case "closeBracket":
            case "percentage": case "exponential":
                currentExpression += text;
                break;

            // Functions (show simple name, handle later in eval)
            case "sin":
                currentExpression += "sin(";
                break;
            case "cos":
                currentExpression += "cos(";
                break;
            case "tan":
                currentExpression += "tan(";
                break;
            case "log":
                currentExpression += "log(";
                break;
            case "sqrt":
                currentExpression += "sqrt(";
                break;

            // Clear
            case "allClear":
                currentExpression = "";
                updatePrimaryDisplay("");
                secondaryView.value = "";
                errorView.value = "";
                return;

            case "lastClear":
                currentExpression = currentExpression.slice(0, -1);
                break;

            // Evaluate
            case "equal":
                evaluateExpression();
                return;

            // Ans button → show last answer in input, but keep it stored
            case "ans":
                currentExpression += "ans";
                updatePrimaryDisplay(currentExpression);
                return;


            default:
                break;
        }

        updatePrimaryDisplay(currentExpression);
    });
});

// Evaluate expression
function evaluateExpression() {
    try {

        // If currentExpression is empty, just show lastAnswer
        if (currentExpression.trim() === "") {
            updatePrimaryDisplay(lastAnswer);
            secondaryView.value = "";
            errorView.value = "";
            return;
        }

        // If currentExpression is just a number, show it directly
        if (!isNaN(currentExpression)) {
            secondaryView.value = currentExpression;
            updatePrimaryDisplay(currentExpression);
            lastAnswer = currentExpression;
            errorView.value = "";
            justEvaluated = true;
            return;
        }

        // Replace function names with Math equivalents before eval
        let expr = currentExpression
            .replace(/ans/g, lastAnswer.toString())
            .replace(/sin\(/g, "Math.sin(")
            .replace(/cos\(/g, "Math.cos(")
            .replace(/tan\(/g, "Math.tan(")
            .replace(/log\(/g, "Math.log(")
            .replace(/sqrt\(/g, "Math.sqrt(")
            .replace(/\^/g, "**") 
            .replace(/%/g, "/100"); // handle percentage

        let result = eval(expr);


        secondaryView.value = currentExpression; // show original expression
        updatePrimaryDisplay(result);            // show result
        lastAnswer = result;                     // store answer
        currentExpression = result.toString();   // allow chaining
        justEvaluated = true;   //tracking last action was evaluated
        errorView.value = "";

                // Save to history
history.push({
    expression: secondaryView.value || currentExpression,
    result: result.toString()
});
renderHistory();

    } catch (err) {
        errorView.value = "Error!";
    }
}

// Allow Enter key to evaluate
primaryInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "=") {
        evaluateExpression();
    }
});

document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();

    // Allowed keys
    const allowedKeys = [
        "0","1","2","3","4","5","6","7","8","9",".",
        "+","-","*","/","^","%","(",")","=",
        "enter","backspace","delete","tab",
        "s","c","t","l","q","a"
    ];

    if (!allowedKeys.includes(key)) {
        e.preventDefault(); // block everything else
        return;
    }

    // Digits
    if (/^[0-9]$/.test(key)){
        const id = "digit" + key;
        simulateButton(id);
        setActiveButton(id);

    } 

    // Decimal
    else if (key === ".") {
        simulateButton("decimal");
        setActiveButton("decimal");
    }

    // Operators
    else if (key === "+") { simulateButton("sum"); setActiveButton("sum"); }
    else if (key === "-") { simulateButton("subtraction"); setActiveButton("subtraction"); }
    else if (key === "*") { simulateButton("multiplication"); setActiveButton("multiplication"); }
    else if (key === "/") { simulateButton("division"); setActiveButton("division"); }
    else if (key === "^") { simulateButton("exponential"); setActiveButton("exponential");  }
    else if (key === "%") { simulateButton("percentage"); setActiveButton("percentage"); }

    // Brackets
    else if (key === "(") {
        simulateButton("openBracket");
        setActiveButton("openBracket");
        showGhostBracket();
    }
    else if (key === ")") {
        simulateButton("closeBracket");
        setActiveButton("closeBracket");
        clearGhostBracket();
    }

    // Functions
    else if (key === "s") { simulateButton("sin"); setActiveButton("sin"); }
    else if (key === "c") { simulateButton("cos"); setActiveButton("cos"); }
    else if (key === "t") { simulateButton("tan"); setActiveButton("tan"); }
    else if (key === "l") { simulateButton("log"); setActiveButton("l"); }
    else if (key === "q") { simulateButton("sqrt"); setActiveButton("sqrt"); }

    // Ans
    else if (key === "a") simulateButton("ans");

    // Enter
    else if (key === "enter" || key === "=") evaluateExpression();

    // Backspace
    else if (key === "backspace") simulateButton("lastClear");

    // Delete
    else if (key === "delete") simulateButton("allClear");

    // Tab - accept ghost bracket
    else if (key === "tab") {
        e.preventDefault();
        simulateButton("closeBracket");
        clearGhostBracket();
    }
});

function simulateButton(id) {
    const button = document.getElementById(id);
    if (button) {
        button.click();
    }
}

function showGhostBracket() {
    primaryInput.placeholder = currentExpression + " )"; // faint reminder
}

function clearGhostBracket() {
    primaryInput.placeholder = "0";
}

// Wait until DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    const darkModeBtn = document.getElementById("Dmode");

    darkModeBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");

        // Optional: change button text depending on mode
        if (document.body.classList.contains("dark-mode")) {
            darkModeBtn.textContent = "Light Mode";
        } else {
            darkModeBtn.textContent = "Dark Mode";
        }
    });
});

function renderHistory() {
    const container = document.getElementById("historyContainer");
    container.innerHTML = "";

    history.slice().reverse().forEach(item => {
        const entry = document.createElement("div");
        entry.className = "history-entry";
        entry.innerHTML = `<span class="expr">${item.expression}</span> = <span class="res">${item.result}</span>`;

        // Click handler: reuse expression
        entry.addEventListener("click", () => {
            currentExpression = item.expression;   // or item.result if you prefer
            updatePrimaryDisplay(currentExpression);
            errorView.value = "";
            justEvaluated = false;
        });

        container.appendChild(entry);
    });
}

document.querySelectorAll(".calc-key").forEach(button => {
    button.addEventListener("click", () => {
        setActiveButton(button.id);
    });
});