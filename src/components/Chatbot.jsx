/**
 * Chatbot component - returns DOM element.
 */
import { renderToast } from "./ToastContainer.jsx";

const TOPIC_RESPONSES = {
  cipc: `To register your business with the CIPC:\n\n1. Visit www.bizportal.gov.za\n2. Choose your business structure (Pty Ltd, Sole Proprietor, etc.)\n3. Reserve and verify your company name\n4. Complete the registration online\n5. Upload your ID and proof of address\n\nA Pty Ltd company requires at least one director and one shareholder.`,

  popia: `POPIA (Protection of Personal Information Act) compliance:\n\n- Process personal data lawfully, fairly, and transparently\n- Obtain consent where required\n- Secure personal information against theft or unauthorised access\n- Appoint an Information Officer and deputy\n- Conduct Privacy Impact Assessments (PIA) where applicable\n\nEnsure your privacy policy documents the lawful basis for processing.`,

  licensing: `Business licensing in South Africa:\n\n- Trading/occupational license from your local municipality\n- Industry-specific permits (health, tourism, transport, finance)\n- National regulator permits where applicable\n\nApply through your local municipality business licensing department.`,

  vat: `VAT in South Africa:\n\n- Standard rate is 15%\n- Mandatory once annual turnover exceeds R1 million (voluntary below)\n- Submit VAT returns monthly, quarterly, or annually\n\nRegister through SARS eFiling and keep VAT invoices for 5 years.`,

  pricing: `Pricing your products/services:\n\n1. Calculate Cost of Goods Sold (COGS)\n2. Add overhead and operating expenses\n3. Apply a markup for your desired profit\n4. Research competitor pricing\n5. Factor in perceived value\n\nA typical markup ranges from 50% to 100% above COGS.`,

  funding: `Startup funding options in South Africa:\n\n- Personal savings and friends/family\n- SEF A loan and Micro Bank (government-backed)\n- Venture capital and angel investors\n- Crowdfunding platforms (Thundafund)\n- Development finance (NEF, IDC)\n\nStart with a solid business plan and pitch deck.`,

  sars: `SARS (South African Revenue Service):\n\n- Handles income tax, VAT, PAYE, and customs duties\n- Register for eFiling at www.efs.gov.za\n- Keep financial records for at least 5 years\n- File returns and pay on time to avoid penalties\n\nYou can register for tax online or at a SARS branch.`,
};

const CONTEXTUAL_HELP = {
  cipc: "Need help choosing a business structure?",
  popia: "Want a POPIA compliance checklist?",
  licensing: "Need help with the application process?",
  vat: "Need help registering for VAT?",
  pricing: "Want a quick pricing formula?",
  funding: "Which funding route fits your stage?",
  sars: "Need help with SARS eFiling registration?",
};

const GREETING = `Hello! I'm your AI Mentor 👋\n\nI can help with: CIPC registration, POPIA, licensing, VAT, pricing, funding, and SARS. What would you like to know?`;

const TOPIC_KEYWORDS = {
  cipc: ["cipc", "register", "company", "bizportal", "business registration"],
  popia: ["popia", "privacy", "data protect", "protection of personal", "consent"],
  licensing: ["license", "licence", "permit", "trading", "municipality"],
  vat: ["vat", "value added tax"],
  pricing: ["price", "pricing", "cost", "markup", "margin", "how much"],
  funding: ["fund", "loan", "invest", "grant", "capital", "investor"],
  sars: ["sars", "income tax", "revenue", "efiling", "efill", "tax"],
};

const TYPING_DELAY_MS = 900;

const STYLES = `
.chatbot-widget {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
  font-family: inherit;
}

.chatbot-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  margin-left: auto;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #0A8791;
  color: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  font-size: 26px;
}

.chatbot-button:hover,
.chatbot-button:focus {
  background: #09676c;
  outline: 3px solid rgba(10, 135, 145, 0.25);
  outline-offset: 2px;
}

.chatbot-panel {
  position: absolute;
  right: 0;
  bottom: 72px;
  display: flex;
  flex-direction: column;
  width: min(360px, calc(100vw - 40px));
  height: 500px;
  max-height: calc(100vh - 110px);
  overflow: hidden;
  border: 1px solid #B8D8D8;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
}

.chatbot-header {
  display: flex;
  align-items: center;
  padding: 16px 18px;
  background: #0A8791;
  color: #fff;
}

.chatbot-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.chatbot-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f8fafc;
}

.chatbot-quick-replies {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}

.chatbot-quick-reply {
  padding: 8px 10px;
  border: 1px solid #B8D8D8;
  border-radius: 999px;
  background: #eff6ff;
  color: #0A8791;
  cursor: pointer;
  font-size: 12px;
}

.chatbot-quick-reply:hover,
.chatbot-quick-reply:focus {
  border-color: #0A8791;
  background: #dbeafe;
  outline: 2px solid rgba(10, 135, 145, 0.2);
  outline-offset: 1px;
}

.chatbot-form {
  display: flex;
  gap: 8px;
  padding: 14px 16px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}

.chatbot-input {
  min-width: 0;
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #B8D8D8;
  border-radius: 8px;
  font: inherit;
}

.chatbot-input:focus {
  border-color: #0A8791;
  outline: 2px solid rgba(10, 135, 145, 0.2);
  outline-offset: 1px;
}

.chatbot-send {
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: #0A8791;
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

.chatbot-send:hover,
.chatbot-send:focus {
  background: #09676c;
  outline: 2px solid rgba(10, 135, 145, 0.2);
  outline-offset: 1px;
}

.chatbot-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.chatbot-message {
  margin-bottom: 12px;
  max-width: 80%;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
  padding: 8px 12px;
  border-radius: 14px;
  font-size: 14px;
}

.chatbot-message--user {
  margin-left: auto;
  background: #0A8791;
  color: #fff;
  text-align: right;
}

.chatbot-message--bot {
  background: #f1f5f9;
  color: #1e293b;
}

.chatbot-typing-dots {
  font-size: 18px;
  letter-spacing: -2px;
}

@media (max-width: 480px) {
  .chatbot-widget {
    right: 12px;
    bottom: 12px;
  }

  .chatbot-panel {
    width: calc(100vw - 24px);
    height: min(500px, calc(100vh - 100px));
  }
}
`;

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected) return;
  if (typeof document !== "undefined" && !document.getElementById("chatbot-styles")) {
    const s = document.createElement("style");
    s.id = "chatbot-styles";
    s.textContent = STYLES;
    document.head.appendChild(s);
    stylesInjected = true;
  }
}

function scrollToBottom(container) {
  if (container) container.scrollTop = container.scrollHeight;
}

function addMessage(container, sender, text) {
  const el = document.createElement("div");
  el.className = `chatbot-message chatbot-message--${sender}`;
  el.textContent = text;
  container.appendChild(el);
  scrollToBottom(container);
}

function showTypingIndicator(container) {
  const el = document.createElement("div");
  el.className = "chatbot-message chatbot-message--bot chatbot-typing";
  el.setAttribute("aria-label", "AI Mentor is typing");
  const dots = document.createElement("span");
  dots.className = "chatbot-typing-dots";
  el.appendChild(dots);
  container.appendChild(el);
  scrollToBottom(container);
  let count = 0;
  el._tick = setInterval(() => {
    count = (count % 3) + 1;
    dots.textContent = ".".repeat(count);
  }, 500);
  return el;
}

function hideTypingIndicator(el) {
  clearInterval(el._tick);
  el.remove();
}

function getResponse(message) {
  const text = message.toLowerCase();

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return `${TOPIC_RESPONSES[topic]}\n\n${CONTEXTUAL_HELP[topic]}`;
    }
  }

  const topics = Object.keys(TOPIC_RESPONSES).join(", ");
  return `I'm here to help with South African business setup.\n\nYou can ask me about: ${topics}. Or tap a quick reply below.`;
}

function Chatbot() {
  injectStyles();

  const widget = document.createElement("div");
  widget.className = "chatbot-widget";

  let isOpen = true;
  let isTyping = false;
  const messages = [{ sender: "bot", text: GREETING }];

  // Button
  const toggleBtn = document.createElement("button");
  toggleBtn.className = "chatbot-button";
  toggleBtn.type = "button";
  toggleBtn.setAttribute("aria-label", "Open AI Mentor chat");
  toggleBtn.setAttribute("aria-expanded", "true");
  toggleBtn.innerHTML = '<span aria-hidden="true">💬</span>';

  // Panel
  const panel = document.createElement("section");
  panel.className = "chatbot-panel";
  panel.setAttribute("aria-label", "AI Mentor chat");
  panel.style.display = isOpen ? "flex" : "none";

  // Header
  const header = document.createElement("header");
  header.className = "chatbot-header";
  header.innerHTML = "<h2>AI Mentor</h2>";
  panel.appendChild(header);

  // Messages
  const messagesContainer = document.createElement("div");
  messagesContainer.className = "chatbot-messages";
  messagesContainer.setAttribute("aria-live", "polite");
  messagesContainer.setAttribute("aria-label", "Chat messages");
  panel.appendChild(messagesContainer);

  // Render initial messages
  messages.forEach(msg => addMessage(messagesContainer, msg.sender, msg.text));

  // Quick replies
  const quickRepliesContainer = document.createElement("div");
  quickRepliesContainer.className = "chatbot-quick-replies";
  quickRepliesContainer.setAttribute("aria-label", "Quick replies");

  const quickReplies = [
    "What licenses do I need in SA?",
    "How do I register with CIPC?",
    "What is POPIA?",
    "How do I price my products?",
  ];

  quickReplies.forEach(reply => {
    const btn = document.createElement("button");
    btn.className = "chatbot-quick-reply";
    btn.type = "button";
    btn.textContent = reply;
    btn.addEventListener("click", () => {
      handleSend(reply);
    });
    quickRepliesContainer.appendChild(btn);
  });
  panel.appendChild(quickRepliesContainer);

  // Form
  const form = document.createElement("form");
  form.className = "chatbot-form";

  const label = document.createElement("label");
  label.className = "chatbot-sr-only";
  label.htmlFor = "chatbot-input";
  label.textContent = "Your message";

  const input = document.createElement("input");
  input.id = "chatbot-input";
  input.className = "chatbot-input";
  input.type = "text";
  input.placeholder = "Ask the AI Mentor...";
  input.autocomplete = "off";

  const sendBtn = document.createElement("button");
  sendBtn.className = "chatbot-send";
  sendBtn.type = "submit";
  sendBtn.textContent = "Send";

  form.appendChild(label);
  form.appendChild(input);
  form.appendChild(sendBtn);
  panel.appendChild(form);

  // Toggle handler
  toggleBtn.addEventListener("click", () => {
    isOpen = !isOpen;
    panel.style.display = isOpen ? "flex" : "none";
    toggleBtn.setAttribute("aria-expanded", String(isOpen));
  });

  // Send handler
  function handleSend(text) {
    const msgText = text.trim();
    if (!msgText) {
      renderToast("Please enter a message.", "warning");
      return;
    }
    if (isTyping) return;

    addMessage(messagesContainer, "user", msgText);
    input.value = "";
    input.disabled = true;
    sendBtn.disabled = true;
    isTyping = true;

    const typingEl = showTypingIndicator(messagesContainer);

    setTimeout(() => {
      isTyping = false;
      hideTypingIndicator(typingEl);
      addMessage(messagesContainer, "bot", getResponse(msgText));
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }, TYPING_DELAY_MS);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSend(input.value);
  });

  // Assemble
  widget.appendChild(toggleBtn);
  widget.appendChild(panel);

  return widget;
}

export { Chatbot };
export default Chatbot;