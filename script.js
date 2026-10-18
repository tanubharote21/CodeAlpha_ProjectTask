```javascript
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatArea = document.getElementById("chatArea");
const sendButton = document.getElementById("sendButton");
const clearChatButton = document.getElementById("clearChat");

const initialMessage = `
    Hello! 👋 Welcome to the College FAQ Assistant.
    <br><br>
    You can ask me about admissions, courses, fees,
    examinations, attendance, internships, and placements.
    How can I help you today?
`;

// Create a timestamp.
function getCurrentTime() {
    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Add a message to the chat window.
function addMessage(message, sender) {
    const messageElement = document.createElement("div");

    messageElement.className =
        sender === "user"
            ? "message user-message"
            : "message bot-message";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = sender === "user" ? "👤" : "🤖";

    const content = document.createElement("div");
    content.className = "message-content";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    // Use textContent to avoid interpreting user input as HTML.
    bubble.textContent = message;

    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = getCurrentTime();

    content.appendChild(bubble);
    content.appendChild(time);

    messageElement.appendChild(avatar);
    messageElement.appendChild(content);

    chatArea.appendChild(messageElement);

    chatArea.scrollTop = chatArea.scrollHeight;

    return messageElement;
}

// Show a temporary loading message.
function showTypingIndicator() {
    const element = addMessage(
        "Typing...",
        "bot"
    );

    element.querySelector(".message-bubble").classList.add(
        "typing-indicator"
    );

    return element;
}

// Send a question to the Flask backend.
async function sendMessage(message) {
    const question = message.trim();

    if (!question) {
        return;
    }

    addMessage(question, "user");

    userInput.value = "";

    sendButton.disabled = true;
    userInput.disabled = true;
    sendButton.textContent = "...";

    const typingIndicator = showTypingIndicator();

    try {
        const response = await fetch("/chat", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: question
            })
        });

        const data = await response.json();

        typingIndicator.remove();

        if (!response.ok) {
            throw new Error(
                data.error || "Something went wrong."
            );
        }

        addMessage(data.answer, "bot");

        // Display the matched FAQ and similarity score in the console.
        if (data.matched_question) {
            console.log("Matched FAQ:", data.matched_question);

            console.log(
                "Cosine similarity:",
                data.similarity
            );
        }

    } catch (error) {
        typingIndicator.remove();

        addMessage(
            "Sorry, I couldn't connect to the chatbot server. " +
            "Please check that the Flask application is running and try again.",
            "bot"
        );

        console.error("Chatbot error:", error);

    } finally {
        sendButton.disabled = false;
        userInput.disabled = false;
        sendButton.textContent = "Send ➤";
        userInput.focus();
    }
}

// Handle form submission.
chatForm.addEventListener("submit", function (event) {
    event.preventDefault();

    sendMessage(userInput.value);
});

// Handle suggested questions.
document.querySelectorAll(".suggestion-btn").forEach(function (button) {
    button.addEventListener("click", function () {
        sendMessage(button.dataset.question);
    });
});

// Clear the visible conversation.
clearChatButton.addEventListener("click", function () {
    chatArea.replaceChildren();

    const welcomeMessage = document.createElement("div");
    welcomeMessage.className = "message bot-message";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "🤖";

    const content = document.createElement("div");
    content.className = "message-content";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    bubble.textContent =
        "Hello! 👋 Welcome to the College FAQ Assistant. " +
        "Ask me about admissions, courses, fees, examinations, " +
        "attendance, internships, or placements.";

    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = getCurrentTime();

    content.appendChild(bubble);
    content.appendChild(time);

    welcomeMessage.appendChild(avatar);
    welcomeMessage.appendChild(content);

    chatArea.appendChild(welcomeMessage);

    userInput.focus();
});
```
