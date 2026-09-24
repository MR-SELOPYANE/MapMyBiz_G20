import { navigate } from "../router/index.js";
import { el } from "../utils/dom.js";

const STYLES = `
  .mmp-business { color: #1a3b5d; padding-bottom: 60px; }
  .mmp-page-header { text-align: center; padding: 60px 20px; background: #F0F6F6; border-bottom: 1px solid #B8D8D8; margin-bottom: 40px; }
  .mmp-action-buttons { display: flex; justify-content: center; gap: 20px; margin-bottom: 40px; flex-wrap: wrap; }
  .mmp-action-btn { padding: 14px 28px; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
  .mmp-action-btn.primary { background: #0A8791; color: #fff; }
  .mmp-action-btn.secondary { background: #FFC857; color: #1a3b5d; }
  .mmp-plan-selection { max-width: 1200px; margin: 0 auto 60px; padding: 0 20px; }
  .mmp-plan-cards { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; }
  .mmp-plan-card { flex: 1; min-width: 280px; max-width: 380px; background: #fff; border: 2px solid #e0e0e0; border-radius: 12px; padding: 24px; text-align: left; }
  .mmp-plan-card.selected { border-color: #0A8791; background: #f0f8ff; }
  .mmp-plan-card ul { list-style: none; padding: 0; }
  .mmp-plan-btn { width: 100%; padding: 14px; background: #FFC857; color: #1a3b5d; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 20px; }
`;

const PLANS = [
  { id: "free", name: "Free", price: "R 0 /month", features: ["Basic listing", "1 photo", "Contact info"] },
  { id: "premium", name: "PREMIUM", price: "R 100 /month", features: ["Standard business info", "5 photos", "Entry-level analytics"] },
  { id: "gold", name: "GOLD", price: "R 250 /month", features: ["Full business info", "10 photos", "Priority placement"] },
];

function BusinessView() {
  if (!document.getElementById("mmp-business-styles")) {
    const s = document.createElement("style");
    s.id = "mmp-business-styles";
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  const root = el("div", "mmp-business");
  const header = el("header", "mmp-page-header");
  header.appendChild(el("h1", null, "Business Listings"));
  header.appendChild(el("p", null, "Create and manage your business presence on the map"));
  root.appendChild(header);

  const actions = el("div", "mmp-action-buttons");
  const btnRegister = el("button", "mmp-action-btn primary", "Register Business");
  btnRegister.addEventListener("click", () => navigate("/add-business"));
  const btnManage = el("button", "mmp-action-btn secondary", "Manage Businesses");
  btnManage.addEventListener("click", () => navigate("/my-business"));
  const btnMap = el("button", "mmp-action-btn secondary", "Open smart map");
  btnMap.addEventListener("click", () => navigate("/map"));
  actions.appendChild(btnRegister);
  actions.appendChild(btnManage);
  actions.appendChild(btnMap);
  root.appendChild(actions);

  const planSection = el("section", "mmp-plan-selection");
  planSection.appendChild(el("h2", null, "Choose Your Plan"));
  const planCards = el("div", "mmp-plan-cards");
  PLANS.forEach((plan) => {
    const card = el("div", "mmp-plan-card");
    card.appendChild(el("h3", null, plan.name));
    card.appendChild(el("p", "price", plan.price));
    const ul = document.createElement("ul");
    plan.features.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = "✔ " + text;
      ul.appendChild(li);
    });
    card.appendChild(ul);
    const btn = el("button", "mmp-plan-btn", "Select & continue");
    btn.addEventListener("click", () => {
      planCards.querySelectorAll(".mmp-plan-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      sessionStorage.setItem("mmb-plan", plan.id);
      navigate("/add-business");
    });
    card.appendChild(btn);
    planCards.appendChild(card);
  });
  planSection.appendChild(planCards);
  root.appendChild(planSection);
  return root;
}

export { BusinessView };
export default BusinessView;
