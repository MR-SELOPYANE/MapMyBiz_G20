/**
 * @file Subscriptions (pricing) view.
 * @description Shows the three plans, highlights the user's current plan
 * and lets them upgrade, downgrade or cancel. The dashboard reads the
 * same plan catalogue, so anything changed here is reflected there
 * immediately.
 */

import { el } from "../utils/dom.js";
import { getCurrentUser } from "../store/auth.store.js";
import { navigate } from "../router/index.js";
import { renderToast } from "../components/ToastContainer.jsx";
import { PLANS, PLAN_RANK, SUB_STATUS, formatLimit } from "../data/plans.js";
import {
  activatePlan,
  cancelPlan,
  getActivePlan,
  getSubscription,
  isPaidPlan,
} from "../services/subscription.service.js";

/** Frequently asked questions shown under the plan cards. */
const FAQ = [
  {
    q: "What does the AI analysis actually look at?",
    a: "The numbers you record on your dashboard — revenue, costs, customers per month — together with your listing status and your learning progress. It never sees your banking password or personal documents.",
  },
  {
    q: "Can I cancel at any time?",
    a: "Yes. Cancelling stops the next renewal. You keep full access until the end of the period you already paid for, and your progress, certificates and recorded numbers stay on your account.",
  },
  {
    q: "Do I get a certificate on every plan?",
    a: "You earn certificates on every plan by completing a track of modules. Pro and Premium add a verification reference and a printable PDF that funders and employers can check.",
  },
  {
    q: "What happens to my data if I downgrade?",
    a: "Nothing is deleted. The free plan simply keeps your last 3 months of numbers instead of 12, and the AI analysis, forecasts and certificate downloads are paused until you upgrade again.",
  },
];

/**
 * Renders a single plan card.
 *
 * @param {Object} plan - A plan definition.
 * @param {Object} context - Rendering context.
 * @returns {HTMLElement}
 */
function planCard(plan, context) {
  const { subscription, isCurrent, busy } = context;
  const card = el(
    "article",
    `mmb-plan${isCurrent ? " mmb-plan--current" : ""}${plan.popular ? " mmb-plan--popular" : ""}`
  );

  card.appendChild(el("h2", "mmb-plan__name", plan.name));

  const price = el("p", "mmb-plan__price", plan.priceLabel);
  price.appendChild(el("small", null, ` / ${plan.interval}`));
  card.appendChild(price);

  card.appendChild(el("p", "mmb-plan__tagline", plan.tagline));

  const features = el("ul", "mmb-plan__features");
  plan.highlights.forEach((item) => features.appendChild(el("li", null, item)));
  features.appendChild(
    el("li", null, `Growth history: ${formatLimit(plan.limits.growthMonthsKept)} months`)
  );
  features.appendChild(
    el(
      "li",
      null,
      `AI analyses: ${
        plan.limits.aiAnalysesPerMonth === Number.POSITIVE_INFINITY
          ? "unlimited"
          : `${plan.limits.aiAnalysesPerMonth} / month`
      }`
    )
  );
  card.appendChild(features);

  if (isCurrent) {
    const badge = el("p", "mmb-note", "● Your current plan");
    badge.style.fontWeight = "700";
    card.appendChild(badge);
  }

  const currentRank = PLAN_RANK[subscription?.planId || "free"];
  const targetRank = PLAN_RANK[plan.id];
  const upgrading = targetRank > currentRank;
  const label = isCurrent
    ? "Current plan"
    : upgrading
      ? "Upgrade"
      : "Switch to this plan";

  const btn = el("button", `mmb-btn${upgrading ? "" : " mmb-btn--ghost"}`, label);
  btn.type = "button";
  btn.disabled = isCurrent || busy;
  btn.addEventListener("click", () => context.select(plan.id));
  card.appendChild(btn);

  return card;
}

/**
 * Subscriptions view.
 *
 * @returns {HTMLElement} The view element.
 */
function SubscriptionsView() {
  const root = el("div", "mmb-dash");
  const user = getCurrentUser();

  const head = el("div", "mmb-dash__head");
  const titles = el("div");
  titles.appendChild(el("h1", "mmb-dash__title", "Plans & subscription"));
  titles.appendChild(
    el(
      "p",
      "mmb-dash__subtitle",
      "Your dashboard changes with your plan — paid plans open the AI analysis, the longer growth history and shareable certificates."
    )
  );
  head.appendChild(titles);
  root.appendChild(head);

  const status = el("div", "mmb-card", "Loading your plan…");
  status.style.marginBottom = "18px";
  root.appendChild(status);

  const plansWrap = el("div", "mmb-plans");
  root.appendChild(plansWrap);

  const manageWrap = el("div");
  manageWrap.style.marginTop = "18px";
  root.appendChild(manageWrap);

  const faq = el("div", "mmb-faq");
  faq.appendChild(el("h2", "mmb-card__title", "Questions we get asked"));
  FAQ.forEach((item) => {
    const details = el("details");
    details.appendChild(el("summary", null, item.q));
    details.appendChild(el("p", null, item.a));
    faq.appendChild(details);
  });
  root.appendChild(faq);

  const context = {
    subscription: null,
    busy: false,
    isCurrent: false,
    select: async (planId) => {
      if (!user) {
        renderToast("Log in to choose a plan.", "warning");
        navigate("/login");
        return;
      }
      context.busy = true;
      const { error } = await activatePlan(user.id, planId, { paymentMethod: "card" });
      context.busy = false;
      if (error) {
        renderToast("Plan saved on this device only — the server copy failed.", "warning");
      } else {
        renderToast("Subscription updated. Your dashboard has been refreshed.", "success");
      }
      await load();
    },
  };

  /**
   * Loads the subscription and repaints the page.
   *
   * @returns {Promise<void>}
   */
  async function load() {
    const { data } = await getSubscription(user?.id);
    context.subscription = data;
    const plan = getActivePlan(data);
    const paid = isPaidPlan(data);

    status.innerHTML = "";
    const statusHead = el("div", "mmb-card__head");
    statusHead.appendChild(el("h2", "mmb-card__title", `Current plan: ${plan.name}`));
    status.appendChild(statusHead);
    status.appendChild(
      el(
        "p",
        "mmb-card__hint",
        data?.renewsAt
          ? `${data.status === SUB_STATUS.CANCELLED ? "Cancelled" : "Renews"} on ${new Date(
              data.renewsAt
            ).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`
          : "No payment method on file — you are on the free plan."
      )
    );

    plansWrap.innerHTML = "";
    PLANS.forEach((plan) => {
      plansWrap.appendChild(
        planCard(plan, { ...context, isCurrent: plan.id === plan.id })
      );
    });

    manageWrap.innerHTML = "";
    const backBtn = el("button", "mmb-btn mmb-btn--ghost", "← Back to my dashboard");
    backBtn.type = "button";
    backBtn.addEventListener("click", () => navigate("/dashboard"));
    manageWrap.appendChild(backBtn);

    if (paid) {
      const cancelBtn = el("button", "mmb-btn mmb-btn--ghost", "Cancel subscription");
      cancelBtn.type = "button";
      cancelBtn.style.marginLeft = "10px";
      cancelBtn.addEventListener("click", async () => {
        const { error } = await cancelPlan(user?.id);
        if (error) renderToast("Could not cancel right now.", "error");
        else renderToast("Subscription cancelled. Access continues to the period end.", "success");
        await load();
      });
      manageWrap.appendChild(cancelBtn);
    }
  }

  load();
  return root;
}

export { SubscriptionsView };
export default SubscriptionsView;
