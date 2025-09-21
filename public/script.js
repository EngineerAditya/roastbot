const chatBox = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");

// Generate a unique sessionId per browser session
const sessionId = crypto.randomUUID();

function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = role;
  div.textContent = `${role === "user" ? "You" : "RoastBot"}: ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const userText = input.value.trim();
  if (!userText) return;

  appendMessage("user", userText);
  input.value = "";

  const res = await fetch("/roast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, userInput: userText }),
  });

  const data = await res.json();
  if (data.roast) appendMessage("bot", data.roast);
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
