const API_KEY = "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";




const loader = document.getElementById("loader");
const resultBox = document.getElementById("result");

function showLoader() {
  loader.style.display = "block";
}

function hideLoader() {
  loader.style.display = "none";
}

// =======================
// SUMMARIZE BUTTON
// =======================
document.getElementById("summarize").addEventListener("click", async () => {

  const resultBox = document.getElementById("result");
  resultBox.value = "Getting page content...";

  let [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  chrome.tabs.sendMessage(tab.id, { action: "getText" }, async (response) => {

  if (chrome.runtime.lastError || !response) {
    document.getElementById("result").value =
      "Please refresh the page and try again.";
    return;
  }

  let text = response.text.substring(0, 2000);


  showLoader();

  let summary = await callAI("Summarize this:\n" + text);

  hideLoader();

  document.getElementById("result").value = summary;
});

});


// =======================
// GENERATE QUESTIONS
// =======================
document.getElementById("questions").addEventListener("click", async () => {

  const resultBox = document.getElementById("result");
  resultBox.value = "Generating questions...";

  let [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  chrome.tabs.sendMessage(tab.id, { action: "getText" }, async (response) => {

    let text = response.text.substring(0, 3000);

    let questions = await callAI(
      "Generate 5 important questions from this content:\n" + text
    );

    resultBox.value = questions;

  });

});


// =======================
// ASK QUESTION
// =======================
document.getElementById("ask").addEventListener("click", async () => {

  const question = document.getElementById("questionInput").value;
  const resultBox = document.getElementById("result");

  if (!question) {
    resultBox.value = "Please enter a question.";
    return;
  }

  resultBox.value = "Thinking...";

  let [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  chrome.tabs.sendMessage(tab.id, { action: "getText" }, async (response) => {

    if (chrome.runtime.lastError || !response) {
      resultBox.value = "Please refresh the page and try again.";
      return;
    }

    let text = response.text.substring(0, 3000);

    //  IMPORTANT PROMPT FIX
    let prompt = `
You are an assistant.

Use ONLY the content below to answer.

CONTENT:
${text}

QUESTION:
${question}

RULES:
- If answer is not in the content, say: "This question is not related to the page content."
- Do not repeat the full content
- Give a short answer
`;


    showLoader();

    let answer = await callAI(prompt);

    hideLoader();

    // ONLY SHOW ANSWER (NOT TEXT)
    resultBox.value = answer;

  });

});

// =======================
// OPENROUTER API FUNCTION
// =======================
async function callAI(promptText) {

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: promptText
          }
        ]
      })
    });

    const data = await response.json();

    console.log("AI RESPONSE:", data);

    if (data.error) {
      return "API Error: " + data.error.message;
    }

    return data.choices?.[0]?.message?.content || "No response";

  } catch (error) {
    console.log("ERROR:", error);
    return "Something went wrong!";
  }
}

document.getElementById("copy").addEventListener("click", () => {

  const text = document.getElementById("result").value;

  if (!text) return;

  navigator.clipboard.writeText(text);

  alert("Copied to clipboard!");
});

chrome.storage.local.set({ lastResult: result });

chrome.storage.local.get(["lastResult"], (data) => {
  if (data.lastResult) {
    document.getElementById("result").value = data.lastResult;
  }
});