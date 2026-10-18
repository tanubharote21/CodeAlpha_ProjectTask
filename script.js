// ========================================
// LANGUAGE TRANSLATION TOOL
// Translation API: MyMemory
// ========================================

// Get HTML elements
const sourceLanguage = document.getElementById("sourceLanguage");
const targetLanguage = document.getElementById("targetLanguage");

const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");

const translateButton = document.getElementById("translateButton");
const swapButton = document.getElementById("swapButton");
const clearButton = document.getElementById("clearButton");
const copyButton = document.getElementById("copyButton");
const speakButton = document.getElementById("speakButton");

const characterCount = document.getElementById("characterCount");
const outputLanguage = document.getElementById("outputLanguage");
const statusMessage = document.getElementById("statusMessage");

const MAX_CHARACTERS = 500;

// ========================================
// UPDATE CHARACTER COUNT
// ========================================

inputText.addEventListener("input", function () {
    characterCount.textContent =
        `${inputText.value.length} / ${MAX_CHARACTERS}`;
});

// ========================================
// SHOW STATUS MESSAGE
// ========================================

function showStatus(message, isError = false) {
    statusMessage.textContent = message;

    statusMessage.classList.toggle("error", isError);
}

// ========================================
// GET SELECTED LANGUAGE NAME
// ========================================

function getLanguageName(selectElement) {
    return selectElement.options[
        selectElement.selectedIndex
    ].text;
}

// ========================================
// TRANSLATE TEXT
// ========================================

async function translateText() {
    const text = inputText.value.trim();

    const source = sourceLanguage.value;
    const target = targetLanguage.value;

    // Validate input
    if (!text) {
        showStatus("Please enter some text to translate.", true);
        inputText.focus();
        return;
    }

    if (source === target) {
        outputText.textContent = text;
        outputLanguage.textContent = getLanguageName(targetLanguage);

        showStatus("Source and target languages are the same.");
        return;
    }

    // Show loading state
    translateButton.disabled = true;
    translateButton.textContent = "Translating...";
    outputText.textContent = "Please wait while we translate your text...";
    outputText.classList.add("output-placeholder");

    showStatus("");

    try {
        // Build the MyMemory API request
        const url = new URL(
            "https://api.mymemory.translated.net/get"
        );

        url.searchParams.set("q", text);
        url.searchParams.set("langpair", `${source}|${target}`);

        // Request translation
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("The translation service is unavailable.");
        }

        const data = await response.json();

        // Check the API response
        if (
            data.responseStatus !== 200 ||
            !data.responseData ||
            typeof data.responseData.translatedText !== "string"
        ) {
            throw new Error(
                data.responseDetails || "Translation failed."
            );
        }

        // Display translated text
        outputText.textContent =
            decodeHtmlEntities(data.responseData.translatedText);

        outputText.classList.remove("output-placeholder");

        outputLanguage.textContent =
            getLanguageName(targetLanguage);

        showStatus("Translation completed successfully!");

    } catch (error) {
        outputText.textContent =
            "Sorry, translation could not be completed.";

        outputText.classList.add("output-placeholder");

        showStatus(
            error.message.includes("Failed to fetch")
                ? "Network error. Check your internet connection or try again later."
                : error.message,
            true
        );

    } finally {
        translateButton.disabled = false;
        translateButton.innerHTML = "<span>🌍</span> Translate Text";
    }
}

// ========================================
// DECODE HTML ENTITIES
// ========================================

function decodeHtmlEntities(text) {
    const textarea = document.createElement("textarea");

    textarea.innerHTML = text;

    return textarea.value;
}

// ========================================
// TRANSLATE BUTTON
// ========================================

translateButton.addEventListener("click", translateText);

// ========================================
// SWAP SOURCE AND TARGET LANGUAGES
// ========================================

swapButton.addEventListener("click", function () {
    const previousSource = sourceLanguage.value;
    const previousTarget = targetLanguage.value;

    sourceLanguage.value = previousTarget;
    targetLanguage.value = previousSource;

    // Swap the text and its translation
    const previousInput = inputText.value;
    const previousOutput = outputText.textContent;

    if (
        previousOutput !== "Your translation will appear here..." &&
        previousOutput !== "Please wait while we translate your text..." &&
        previousOutput !== "Sorry, translation could not be completed."
    ) {
        inputText.value = previousOutput;

        outputText.textContent = previousInput ||
            "Your translation will appear here...";

        outputText.classList.toggle(
            "output-placeholder",
            !previousInput
        );
    }

    characterCount.textContent =
        `${inputText.value.length} / ${MAX_CHARACTERS}`;

    outputLanguage.textContent = getLanguageName(targetLanguage);

    showStatus("");
});

// ========================================
// CLEAR TEXT
// ========================================

clearButton.addEventListener("click", function () {
    inputText.value = "";

    outputText.textContent =
        "Your translation will appear here...";

    outputText.classList.add("output-placeholder");

    characterCount.textContent = `0 / ${MAX_CHARACTERS}`;

    showStatus("");

    inputText.focus();
});

// ========================================
// COPY TRANSLATED TEXT
// ========================================

copyButton.addEventListener("click", async function () {
    const translatedText = outputText.textContent;

    if (
        !translatedText ||
        translatedText === "Your translation will appear here..." ||
        translatedText === "Please wait while we translate your text..." ||
        translatedText === "Sorry, translation could not be completed."
    ) {
        showStatus("There is no translated text to copy.", true);
        return;
    }

    try {
        await navigator.clipboard.writeText(translatedText);

        showStatus("Translation copied to clipboard!");

    } catch (error) {
        // Fallback for browsers that do not support Clipboard API
        const temporaryTextArea = document.createElement("textarea");

        temporaryTextArea.value = translatedText;

        document.body.appendChild(temporaryTextArea);

        temporaryTextArea.select();

        const copied = document.execCommand("copy");

        temporaryTextArea.remove();

        if (copied) {
            showStatus("Translation copied to clipboard!");
        } else {
            showStatus("Unable to copy. Please select and copy manually.", true);
        }
    }
});

// ========================================
// TEXT-TO-SPEECH
// ========================================

speakButton.addEventListener("click", function () {
    const translatedText = outputText.textContent;

    if (
        !translatedText ||
        translatedText === "Your translation will appear here..." ||
        translatedText === "Please wait while we translate your text..." ||
        translatedText === "Sorry, translation could not be completed."
    ) {
        showStatus("There is no translated text to read.", true);
        return;
    }

    if (!("speechSynthesis" in window)) {
        showStatus("Text-to-speech is not supported by this browser.", true);
        return;
    }

    // Stop any previous speech
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(translatedText);

    // Set speech language
    speech.lang = targetLanguage.value;

    speech.rate = 0.9;
    speech.pitch = 1;

    speech.onerror = function () {
        showStatus("Unable to play speech. Please try again.", true);
    };

    window.speechSynthesis.speak(speech);

    showStatus("Playing translated text...");
});

// ========================================
// UPDATE TARGET LANGUAGE LABEL
// ========================================

targetLanguage.addEventListener("change", function () {
    outputLanguage.textContent = getLanguageName(targetLanguage);
    showStatus("");
});

// ========================================
// INITIAL SETUP
// ========================================

outputText.classList.add("output-placeholder");

outputLanguage.textContent = getLanguageName(targetLanguage);