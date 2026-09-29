const elements = {
  form: document.querySelector("#chat-form"),
  question: document.querySelector("#question"),
  sendButton: document.querySelector("#send-button"),
  messages: document.querySelector("#messages"),
  clearChat: document.querySelector("#clear-chat"),
  apiKey: document.querySelector("#api-key"),
  userId: document.querySelector("#user-id"),
  toggleKey: document.querySelector("#toggle-key"),
  charCount: document.querySelector("#char-count"),
  healthStatus: document.querySelector("#health-status"),
  healthDetail: document.querySelector("#health-detail"),
  readyDetail: document.querySelector("#ready-detail"),
  refreshStatus: document.querySelector("#refresh-status"),
  toast: document.querySelector("#toast"),
};

const welcomeMarkup = elements.messages.innerHTML;
let toastTimer;

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 3000);
}

function saveSessionSettings() {
  sessionStorage.setItem("may-nho-api-key", elements.apiKey.value);
  sessionStorage.setItem("may-nho-user-id", elements.userId.value);
}

function restoreSessionSettings() {
  elements.apiKey.value = sessionStorage.getItem("may-nho-api-key") || "";
  elements.userId.value = sessionStorage.getItem("may-nho-user-id") || "";
}

function resizeComposer() {
  elements.question.style.height = "auto";
  elements.question.style.height = `${Math.min(elements.question.scrollHeight, 150)}px`;
  elements.charCount.textContent = `${elements.question.value.length}/2000`;
}

function scrollToLatest() {
  elements.messages.scrollTop = elements.messages.scrollHeight;
}

function createMessage(role, text, metadata = []) {
  const article = document.createElement("article");
  article.className = `message ${role === "user" ? "user-message" : "assistant-message"}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = role === "user" ? "🌷" : "☁️";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  if (role !== "user") {
    const name = document.createElement("p");
    name.className = "message-name";
    name.textContent = "Mây Nhỏ";
    bubble.appendChild(name);
  }

  const content = document.createElement("p");
  content.textContent = text;
  bubble.appendChild(content);

  if (metadata.length) {
    const meta = document.createElement("div");
    meta.className = "message-meta";
    metadata.forEach((item) => {
      const span = document.createElement("span");
      span.textContent = item;
      meta.appendChild(span);
    });
    bubble.appendChild(meta);
  }

  article.append(avatar, bubble);
  elements.messages.appendChild(article);
  scrollToLatest();
  return article;
}

function createTypingMessage() {
  const article = document.createElement("article");
  article.className = "message assistant-message";
  article.innerHTML = `
    <div class="avatar" aria-hidden="true">☁️</div>
    <div class="bubble" aria-label="Mây Nhỏ đang trả lời">
      <div class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></div>
    </div>`;
  elements.messages.appendChild(article);
  scrollToLatest();
  return article;
}

function readableError(status, detail) {
  if (status === 401) return "API key chưa đúng hoặc còn thiếu. Bạn kiểm tra lại nhé.";
  if (status === 402) return "Ngân sách tháng này đã hết. Mình tạm nghỉ một chút nhé.";
  if (status === 429) return "Bạn gửi hơi nhanh rồi. Chờ khoảng một phút rồi thử lại nhé.";
  if (status === 422) return "Câu hỏi chưa hợp lệ. Hãy nhập từ 1 đến 2.000 ký tự.";
  return detail || "Mình chưa thể trả lời lúc này. Bạn thử lại sau một chút nhé.";
}

async function submitQuestion(event) {
  event.preventDefault();
  const question = elements.question.value.trim();
  const apiKey = elements.apiKey.value.trim();
  const userId = elements.userId.value.trim();

  if (!apiKey) {
    elements.apiKey.focus();
    showToast("Hãy nhập API key trước khi trò chuyện nhé ✨");
    return;
  }
  if (!question) return;

  saveSessionSettings();
  createMessage("user", question);
  elements.question.value = "";
  resizeComposer();
  elements.sendButton.disabled = true;
  const typing = createTypingMessage();

  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  };
  if (userId) headers["X-User-Id"] = userId;

  try {
    const response = await fetch("/ask", {
      method: "POST",
      headers,
      body: JSON.stringify({ question }),
    });
    const data = await response.json().catch(() => ({}));
    typing.remove();

    if (!response.ok) {
      const error = createMessage("assistant", readableError(response.status, data.detail));
      error.classList.add("error-message");
      return;
    }

    const totalTokens = (data.tokens?.in || 0) + (data.tokens?.out || 0);
    createMessage("assistant", data.answer, [
      `${totalTokens} tokens`,
      `$${Number(data.cost_usd || 0).toFixed(6)}`,
      `${data.history_length || 0} tin trước đó`,
    ]);
  } catch (_error) {
    typing.remove();
    const error = createMessage("assistant", "Không kết nối được tới dịch vụ. Hãy kiểm tra trạng thái hệ thống rồi thử lại nhé.");
    error.classList.add("error-message");
  } finally {
    elements.sendButton.disabled = false;
    elements.question.focus();
  }
}

function setMainStatus(state, label) {
  elements.healthStatus.classList.remove("online", "offline");
  if (state) elements.healthStatus.classList.add(state);
  elements.healthStatus.querySelector("span").textContent = label;
}

async function checkStatus() {
  elements.refreshStatus.classList.add("loading");
  setMainStatus("", "Đang kiểm tra");

  const healthRequest = fetch("/health", { cache: "no-store" });
  const readyRequest = fetch("/ready", { cache: "no-store" });
  const [healthResult, readyResult] = await Promise.allSettled([healthRequest, readyRequest]);

  const healthOk = healthResult.status === "fulfilled" && healthResult.value.ok;
  const readyOk = readyResult.status === "fulfilled" && readyResult.value.ok;
  elements.healthDetail.textContent = healthOk ? "Hoạt động" : "Gián đoạn";
  elements.readyDetail.textContent = readyOk ? "Sẵn sàng" : "Chưa sẵn sàng";

  if (healthOk && readyOk) setMainStatus("online", "Đang hoạt động");
  else setMainStatus("offline", healthOk ? "Chưa sẵn sàng" : "Mất kết nối");

  elements.refreshStatus.classList.remove("loading");
}

elements.form.addEventListener("submit", submitQuestion);
elements.question.addEventListener("input", resizeComposer);
elements.question.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    elements.form.requestSubmit();
  }
});

elements.apiKey.addEventListener("change", saveSessionSettings);
elements.userId.addEventListener("change", saveSessionSettings);
elements.toggleKey.addEventListener("click", () => {
  const reveal = elements.apiKey.type === "password";
  elements.apiKey.type = reveal ? "text" : "password";
  elements.toggleKey.textContent = reveal ? "Ẩn" : "Hiện";
  elements.toggleKey.setAttribute("aria-label", reveal ? "Ẩn API key" : "Hiện API key");
});

elements.clearChat.addEventListener("click", () => {
  elements.messages.innerHTML = welcomeMarkup;
  showToast("Đã dọn phần trò chuyện đang hiển thị 🌸");
});

document.querySelectorAll(".prompt-chip").forEach((button) => {
  button.addEventListener("click", () => {
    elements.question.value = button.dataset.prompt;
    resizeComposer();
    elements.question.focus();
  });
});

elements.refreshStatus.addEventListener("click", checkStatus);

restoreSessionSettings();
resizeComposer();
checkStatus();
window.setInterval(checkStatus, 30000);
