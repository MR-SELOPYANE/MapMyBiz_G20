import { getCurrentUser } from "../store/auth.store.js";
import { navigate } from "../router/index.js";
import { el } from "../utils/dom.js";
import { COURSES } from "../data/courses.js";
import { FEATURES, getPlanById } from "../data/plans.js";
import { AiInsightPanel } from "../components/AiInsightPanel.jsx";
import { renderToast } from "../components/ToastContainer.jsx";
import { getUserProgress } from "../services/progress.service.js";
import { getUserBusinesses } from "../services/business.service.js";
import {
  getActivePlan,
  getSubscription,
  hasFeature,
  isPaidPlan,
  onSubscriptionChange,
  remainingAiAnalyses,
} from "../services/subscription.service.js";
import { computeGrowth, currentMonthKey, formatMonthLabel, getMetrics, saveMetric } from "../services/metrics.service.js";
import {
  getTrackProgress,
  issueEarnedCertificates,
  printCertificate,
} from "../services/certificate.service.js";
import { formatCurrency } from "../utils/formatters.js";

/**
 * Formats a percentage delta such as `+12.4%` or `—`.
 *
 * @param {number|null} value - A percentage change.
 * @returns {string}
 */
function formatDelta(value) {
  if (value == null || Number.isNaN(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(rounded) < 0.1) return "0%";
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

/**
 * Returns the CSS class for a delta direction.
 *
 * @param {number|null} value - A percentage change.
 * @param {boolean} [invert=false] - When true, a rise is bad (costs).
 * @returns {string}
 */
function deltaClass(value, invert = false) {
  if (value == null || Math.abs(value) < 0.1) return "mmb-flat";
  const good = invert ? value < 0 : value > 0;
  return good ? "mmb-up" : "mmb-down";
}

/**
 * Creates a metric tile.
 *
 * @param {string} value - The headline value.
 * @param {string} label - The tile label.
 * @param {Object} [opts={}] - Options.
 * @param {number|null} [opts.delta] - Percentage delta to show.
 * @param {string} [opts.deltaClassName] - Class for the delta.
 * @returns {HTMLElement}
 */
function tile(value, label, opts = {}) {
  const node = el("div", "mmb-tile");
  node.appendChild(el("div", "mmb-tile__value", value));
  node.appendChild(el("div", "mmb-tile__label", label));
  if (opts.delta !== undefined) {
    node.appendChild(
      el("div", `mmb-tile__delta ${opts.deltaClassName || "mmb-flat"}`, opts.delta)
    );
  }
  return node;
}

/**
 * Creates a card shell with a title and optional action node.
 *
 * @param {string} title - Card title.
 * @param {HTMLElement} [action] - Node rendered on the right of the header.
 * @param {string} [extraClass] - Additional class names.
 * @returns {HTMLElement} The card element (header already appended).
 */
function card(title, action, extraClass = "") {
  const node = el("section", `mmb-card ${extraClass}`.trim());
  const head = el("div", "mmb-card__head");
  head.appendChild(el("h2", "mmb-card__title", title));
  if (action) head.appendChild(action);
  node.appendChild(head);
  return node;
}

/**
 * Renders the subscription banner at the top of the dashboard.
 *
 * @param {Object} subscription - The user's subscription record.
 * @returns {HTMLElement}
 */
function planBanner(subscription) {
  const plan = getActivePlan(subscription);
  const paid = isPaidPlan(subscription);
  const banner = el("div", `mmb-plan-banner${paid ? "" : " mmb-plan-banner--free"}`);

  const text = el("div", "mmb-plan-banner__text");
  text.appendChild(el("p", "mmb-plan-banner__label", paid ? "Your subscription" : "Free plan"));
  const value = plan.name + (plan.price ? ` · ${plan.priceLabel} ${plan.interval}` : "");
  text.appendChild(el("p", "mmb-plan-banner__value", value));

  if (paid && subscription.renewsAt) {
    const renews = new Date(subscription.renewsAt).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    text.appendChild(
      el("p", "mmb-card__hint", `Renews on ${renews} · ${subscription.status}`)
    );
  } else if (paid && subscription.status === "cancelled") {
    text.appendChild(
      el("p", "mmb-card__hint", "Cancelled — you keep access until the period ends.")
    );
  } else {
    text.appendChild(
      el("p", "mmb-card__hint", "Upgrade to unlock AI analysis, extra growth history and shareable certificates.")
    );
  }
  banner.appendChild(text);

  const actions = el("div", "mmb-plan-banner__actions");
  const manageBtn = el("button", "mmb-btn mmb-btn--light", paid ? "Manage plan" : "See plans");
  manageBtn.type = "button";
  manageBtn.addEventListener("click", () => navigate("/subscriptions"));
  actions.appendChild(manageBtn);
  banner.appendChild(actions);

  return banner;
}

/**
 * Renders the "Business Growth" card: the month-entry form, the revenue
 * trend, and the paid-only forecast and margin figures.
 *
 * @param {Object} context - Rendering context.
 * @returns {HTMLElement}
 */
function growthCard(context) {
  const { growth, metrics, subscription } = context;
  const advanced = hasFeature(subscription, FEATURES.GROWTH_ADVANCED);
  const node = card(
    "📈 Business Growth",
    (() => {
      const link = el("button", "mmb-btn mmb-btn--ghost mmb-btn--small", "View listing");
      link.type = "button";
      link.addEventListener("click", () => navigate("/my-business"));
      return link;
    })()
  );

  node.appendChild(
    el(
      "p",
      "mmb-card__hint",
      advanced
        ? "Record your numbers once a month. Twelve months of history unlocks the forecast and margin view."
        : "Record your numbers once a month. The free plan keeps your last 3 months — upgrade for 12 months of history and forecasting."
    )
  );

  if (!growth.hasData) {
    node.appendChild(
      el("p", "mmb-empty", "No numbers yet. Add your first month below — it takes two minutes.")
    );
  } else {
    const row = el("div", "mmb-form-grid");
    row.appendChild(
      tile(formatCurrency(growth.revenue), `Revenue · ${formatMonthLabel(growth.latest.month)}`, {
        delta: formatDelta(growth.revenueChangePct),
        deltaClassName: deltaClass(growth.revenueChangePct),
      })
    );
    row.appendChild(
      tile(formatCurrency(growth.expenses), "Costs this month", {
        delta: formatDelta(growth.expenseChangePct),
        deltaClassName: deltaClass(growth.expenseChangePct, true),
      })
    );
    node.appendChild(row);

    const profitRow = el("div", "mmb-form-grid");
    profitRow.appendChild(
      tile(formatCurrency(growth.profit), "Profit", {
        delta: formatDelta(growth.profitChangePct),
        deltaClassName: deltaClass(growth.profitChangePct),
      })
    );
    profitRow.appendChild(tile(String(Math.round(growth.marginPct)), "Margin %"));
    profitRow.appendChild(
      tile(String(Math.round(growth.customers)), "Customers", {
        delta: formatDelta(growth.customerChangePct),
        deltaClassName: deltaClass(growth.customerChangePct),
      })
    );
    node.appendChild(profitRow);

    node.appendChild(renderTrend(growth, advanced, metrics));
  }

  node.appendChild(monthForm(context));
  return node;
}

/**
 * Renders the revenue trend bars, optionally with a paid-only forecast.
 *
 * @param {Object} growth - `computeGrowth()` result.
 * @param {boolean} advanced - Whether forecast bars may be shown.
 * @param {Object[]} metrics - Raw metric records.
 * @returns {HTMLElement}
 */
function renderTrend(growth, advanced, metrics) {
  const wrap = el("div");
  wrap.appendChild(el("h4", null, "Revenue by month"));

  const chart = el("div", "mmb-trend");
  const entries = metrics.map((m) => ({ label: formatMonthLabel(m.month), value: m.revenue }));
  if (advanced && growth.forecast?.length) {
    const lastLabel = formatMonthLabel(growth.latest.month);
    growth.forecast.forEach((value, index) => {
      entries.push({ label: `+${index + 1} mo`, value, forecast: true, lastLabel });
    });
  }

  const max = Math.max(...entries.map((e) => e.value), 1);
  entries.forEach((entry) => {
    const bar = el("div", `mmb-trend__bar${entry.forecast ? " mmb-trend__bar--forecast" : ""}`);
    const fill = el("div", "mmb-trend__fill");
    fill.style.height = `${Math.max(3, Math.round((entry.value / max) * 100))}%`;
    fill.title = `${entry.label}: ${formatCurrency(entry.value)}`;
    bar.appendChild(el("span", "mmb-trend__label", entry.label));
    bar.appendChild(fill);
    chart.appendChild(bar);
  });

  wrap.appendChild(chart);

  if (!advanced) {
    const upgrade = el("p", "mmb-note", "Forecasting is a Pro feature. Upgrade to see the next 3 months projected.");
    wrap.appendChild(upgrade);
  }
  return wrap;
}

/**
 * Renders the form used to save this month's numbers.
 *
 * @param {Object} context - Rendering context.
 * @returns {HTMLElement}
 */
function monthForm(context) {
  const { userId, subscription, onSaved, businesses = [] } = context;
  const form = el("form", "mmb-card__head");
  form.style.display = "block";
  form.style.marginTop = "14px";

  const grid = el("div", "mmb-form-grid");

  const businessSelect = el("select", "mmb-select");
  const blank = el("option", null, "All businesses");
  blank.value = "";
  businessSelect.appendChild(blank);
  businesses.forEach((biz) => {
    const option = el("option", null, biz.name);
    option.value = String(biz.id);
    businessSelect.appendChild(option);
  });
  const businessField = el("label", "mmb-field", "Business");
  businessField.appendChild(businessSelect);
  grid.appendChild(businessField);

  const latest = context.growth.latest;
  const inputs = {
    month: el("input", "mmb-input"),
    revenue: el("input", "mmb-input"),
    expenses: el("input", "mmb-input"),
    customers: el("input", "mmb-input"),
  };

  inputs.month.type = "month";
  inputs.month.value = latest?.month || currentMonthKey();
  inputs.revenue.type = "number";
  inputs.revenue.min = "0";
  inputs.revenue.step = "0.01";
  inputs.revenue.placeholder = "Total sales";
  inputs.expenses.type = "number";
  inputs.expenses.min = "0";
  inputs.expenses.step = "0.01";
  inputs.expenses.placeholder = "Total costs";
  inputs.customers.type = "number";
  inputs.customers.min = "0";
  inputs.customers.step = "1";
  inputs.customers.placeholder = "Customers served";

  [
    ["Month", inputs.month],
    ["Revenue (R)", inputs.revenue],
    ["Costs (R)", inputs.expenses],
    ["Customers", inputs.customers],
  ].forEach(([label, input]) => {
    const field = el("label", "mmb-field", label);
    field.appendChild(input);
    grid.appendChild(field);
  });

  form.appendChild(grid);

  const saveBtn = el("button", "mmb-btn", "Save this month");
  saveBtn.type = "submit";
  form.appendChild(saveBtn);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    saveBtn.disabled = true;
    const { error, capped } = await saveMetric(
      {
        userId,
        businessId: businessSelect.value || null,
        month: inputs.month.value,
        revenue: inputs.revenue.value,
        expenses: inputs.expenses.value,
        customers: inputs.customers.value,
      },
      { subscription }
    );
    saveBtn.disabled = false;

    if (error) {
      renderToast("Saved on this device only — the server copy failed.", "warning");
    } else {
      renderToast(capped ? "Saved. Older months were trimmed to your plan limit." : "Month saved.", "success");
    }
    if (typeof onSaved === "function") onSaved();
  });

  return form;
}

/**
 * Renders the "Progress Check" card: overall module completion, the next
 * recommended module, and per-track certificate progress.
 *
 * @param {Object} context - Rendering context.
 * @returns {HTMLElement}
 */
function progressCard(context) {
  const { completed, growth, businesses } = context;
  const completedSet = new Set(completed.map((id) => String(id)));
  const total = COURSES.length;
  const done = COURSES.filter((course) => completedSet.has(String(course.id))).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const node = card("🎯 Progress Check");

  const labels = el("div", "mmb-progress__row");
  labels.appendChild(el("span", null, `${done} of ${total} modules complete`));
  labels.appendChild(el("span", null, `${pct}%`));
  node.appendChild(labels);

  const progress = el("div", "mmb-progress");
  const fill = el("div", "mmb-progress__fill");
  fill.style.width = `${pct}%`;
  progress.appendChild(fill);
  node.appendChild(progress);

  const nextCourse = COURSES.find((course) => !completedSet.has(String(course.id)));
  if (nextCourse) {
    const next = el("p", "mmb-card__hint");
    next.textContent = `Next up: ${nextCourse.title} (${nextCourse.level}).`;
    node.appendChild(next);
    const goBtn = el("button", "mmb-btn mmb-btn--ghost mmb-btn--small", "Continue learning");
    goBtn.type = "button";
    goBtn.addEventListener("click", () => navigate(`/module/${nextCourse.id}`));
    node.appendChild(goBtn);
  } else {
    node.appendChild(
      el("p", "mmb-card__hint", "Every module is complete. Claim your certificates below.")
    );
  }

  const tracks = getTrackProgress(completedSet);
  const trackWrap = el("div", "mmb-card__section");
  trackWrap.style.marginTop = "16px";
  trackWrap.appendChild(el("h4", null, "Certificate progress"));
  tracks.forEach((entry) => {
    const block = el("div");
    const row = el("div", "mmb-progress__row");
    row.appendChild(el("span", null, entry.track.name));
    row.appendChild(el("span", null, `${entry.done}/${entry.total}`));
    block.appendChild(row);
    const bar = el("div", "mmb-progress");
    const barFill = el("div", "mmb-progress__fill");
    barFill.style.width = `${entry.pct}%`;
    bar.appendChild(barFill);
    block.appendChild(bar);
    if (!entry.complete && entry.missing.length) {
      block.appendChild(
        el(
          "p",
          "mmb-note",
          `Still to finish: ${entry.missing
            .map((id) => COURSES.find((c) => c.id === id)?.title || `Module ${id}`)
            .join(", ")}`
        )
      );
    }
    trackWrap.appendChild(block);
  });
  node.appendChild(trackWrap);

  const summary = el("p", "mmb-card__hint");
  summary.style.marginTop = "12px";
  const points = [];
  points.push(`${done}/${total} modules`);
  points.push(`${context.certificates.length} certificate(s)`);
  points.push(`${businesses.length} listing(s)`);
  if (growth.hasData) points.push(`${growth.months} month(s) of numbers`);
  summary.textContent = `Your progress: ${points.join(" · ")}.`;
  node.appendChild(summary);

  return node;
}

/**
 * Renders the certificates card: earned certificates first, then the
 * tracks still in progress.
 *
 * @param {Object} context - Rendering context.
 * @returns {HTMLElement}
 */
function certificatesCard(context) {
  const { certificates, subscription, holderName } = context;
  const canShare = hasFeature(subscription, FEATURES.CERTIFICATE_SHARE);
  const node = card("🏅 Certificates");

  if (!certificates.length) {
    node.appendChild(
      el("p", "mmb-empty", "No certificates yet. Complete every module in a track to earn one.")
    );
  } else {
    certificates.forEach((cert) => {
      const track = context.tracks.find((t) => t.id === cert.trackId);
      if (!track) return;
      const box = el("div", "mmb-cert mmb-cert--earned");
      box.appendChild(el("h3", "mmb-cert__name", track.name));
      box.appendChild(el("p", "mmb-cert__desc", track.description));

      const meta = el("p", "mmb-note");
      meta.textContent = `Issued ${
        cert.issuedAt
          ? new Date(cert.issuedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })
          : "recently"
      }`;
      box.appendChild(meta);

      if (canShare) {
        box.appendChild(el("p", "mmb-cert__ref", `Ref: ${cert.reference}`));
        const actions = el("div", "mmb-list__actions");
        const printBtn = el("button", "mmb-btn mmb-btn--small", "Print / Save PDF");
        printBtn.type = "button";
        printBtn.addEventListener("click", () => {
          const opened = printCertificate(cert, track, {
            holderName,
            modulesCompleted: `${track.moduleIds.length} of ${track.moduleIds.length} modules`,
          });
          if (!opened) {
            renderToast("Allow pop-ups to print your certificate.", "warning");
          }
        });
        actions.appendChild(printBtn);

        const copyBtn = el("button", "mmb-btn mmb-btn--ghost mmb-btn--small", "Copy reference");
        copyBtn.type = "button";
        copyBtn.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(cert.reference || "");
            renderToast("Certificate reference copied.", "success");
          } catch (_) {
            renderToast(`Reference: ${cert.reference}`, "info");
          }
        });
        actions.appendChild(copyBtn);
        box.appendChild(actions);
      } else {
        box.appendChild(
          el("p", "mmb-note", "Upgrade to Pro to download certificates and share a verification reference.")
        );
      }
      node.appendChild(box);
    });
  }

  if (!canShare) {
    const upgrade = el("button", "mmb-btn mmb-btn--ghost mmb-btn--small", "Unlock shareable certificates");
    upgrade.type = "button";
    upgrade.addEventListener("click", () => navigate("/subscriptions"));
    node.appendChild(upgrade);
  }

  const inProgress = context.trackProgress.filter((entry) => !entry.complete);
  if (inProgress.length) {
    node.appendChild(el("h4", null, "In progress"));
    inProgress.forEach((entry) => {
      const block = el("div", "mmb-cert");
      block.appendChild(el("h3", "mmb-cert__name", entry.track.name));
      const row = el("div", "mmb-progress__row");
      row.appendChild(el("span", null, `${entry.done} of ${entry.total} modules`));
      row.appendChild(el("span", null, `${entry.pct}%`));
      block.appendChild(row);
      const bar = el("div", "mmb-progress");
      const fill = el("div", "mmb-progress__fill");
      fill.style.width = `${entry.pct}%`;
      bar.appendChild(fill);
      block.appendChild(bar);
      node.appendChild(block);
    });
  }

  return node;
}

/**
 * Renders the listings card.
 *
 * @param {Object} context - Rendering context.
 * @returns {HTMLElement}
 */
function listingsCard(context) {
  const node = card("🏪 My businesses");
  const addBtn = el("button", "mmb-btn mmb-btn--ghost mmb-btn--small", "+ Add");
  addBtn.type = "button";
  addBtn.addEventListener("click", () => navigate("/add-business"));
  const head = node.querySelector(".mmb-card__head");
  if (head) head.appendChild(addBtn);

  if (!context.businesses.length) {
    node.appendChild(
      el("p", "mmb-empty", "No listings yet. Add your business so customers and funders can find you.")
    );
    return node;
  }

  const list = el("ul", "mmb-list");
  context.businesses.forEach((biz) => {
    const item = el("li", "mmb-list__item");
    const main = el("div", "mmb-list__main");
    main.appendChild(el("p", "mmb-list__title", biz.name));
    main.appendChild(
      el("p", "mmb-list__meta", `${biz.category || "Uncategorised"} · ${biz.location || "No location"}`)
    );
    item.appendChild(main);
    item.appendChild(
      el("span", `mmb-badge mmb-badge--${statusBadgeTone(biz.status)}`, biz.status || "pending")
    );
    list.appendChild(item);
  });
  node.appendChild(list);
  return node;
}

/**
 * Maps a listing status to a badge colour class.
 *
 * @param {string} status - The listing status.
 * @returns {string}
 */
function statusBadgeTone(status) {
  if (status === "approved" || status === "featured") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

/**
 * Renders the upgrade nudge shown to free-plan users.
 *
 * @param {Object} context - Rendering context.
 * @returns {HTMLElement}
 */
function upgradeCard(context) {
  const suggested = getPlanById("pro");
  const node = card("🚀 Get more from Map My Biz", undefined, "mmb-card--wide");

  const list = el("ul", "mmb-plan__features");
  [
    "AI business analysis every month",
    "12 months of growth history plus forecasting",
    "Shareable certificates with a verification reference",
    "Monthly growth report you can show a funder",
  ].forEach((text) => list.appendChild(el("li", null, text)));
  node.appendChild(list);

  const row = el("div", "mmb-plan-banner__actions");
  row.style.marginTop = "14px";
  const btn = el("button", "mmb-btn", `Upgrade to ${suggested.name} · ${suggested.priceLabel}/month`);
  btn.type = "button";
  btn.addEventListener("click", () => navigate("/subscriptions"));
  row.appendChild(btn);
  node.appendChild(row);

  const note = el(
    "p",
    "mmb-note",
    context.subscription
      ? "You are on the free plan. Everything you have learned stays exactly where it is."
      : "Sign in to track your progress across devices."
  );
  node.appendChild(note);
  return node;
}

/**
 * Assembles the full state object the renderers consume.
 *
 * @param {Object} state - Raw loaded state.
 * @returns {Object}
 */
function buildContext(state) {
  return {
    ...state,
    tracks: state.trackProgress.map((entry) => entry.track),
  };
}

/**
 * Renders (or re-renders) the dashboard into a container.
 *
 * @param {HTMLElement} root - The dashboard root element.
 * @param {Object} state - Loaded state.
 * @returns {void}
 */
function render(root, state) {
  const context = buildContext(state);
  root.innerHTML = "";

  const head = el("div", "mmb-dash__head");
  const titles = el("div");
  titles.appendChild(
    el("h1", "mmb-dash__title", state.showBusinesses ? "My businesses" : `Welcome back, ${state.firstName}`)
  );
  titles.appendChild(
    el(
      "p",
      "mmb-dash__subtitle",
      state.showBusinesses
        ? "Everything you have listed on the Map My Biz map."
        : "Your growth, your progress and your certificates — all in one place."
    )
  );
  head.appendChild(titles);

  const refreshBtn = el("button", "mmb-btn mmb-btn--ghost mmb-btn--small", "↻ Refresh");
  refreshBtn.type = "button";
  refreshBtn.addEventListener("click", () => state.refresh());
  head.appendChild(refreshBtn);
  root.appendChild(head);

  if (state.showBusinesses) {
    root.appendChild(listingsCard(context));
    return;
  }

  root.appendChild(planBanner(context.subscription));

  const tiles = el("div", "mmb-tiles");
  tiles.appendChild(
    tile(`${context.growth.months}`, "Months of numbers", {
      delta: context.growth.hasData ? formatDelta(context.growth.revenueChangePct) : "Add your first month",
      deltaClassName: deltaClass(context.growth.revenueChangePct),
    })
  );
  tiles.appendChild(
    tile(
      `${context.completed.length}/${COURSES.length}`,
      "Modules complete",
      { delta: `${context.trackProgress.filter((t) => t.complete).length} track(s) finished` }
    )
  );
  tiles.appendChild(tile(String(context.certificates.length), "Certificates earned"));
  tiles.appendChild(
    tile(String(context.businesses.length), "Business listings", {
      delta: `${context.businesses.filter((b) => b.status === "approved" || b.status === "featured").length} live on the map`,
    })
  );
  root.appendChild(tiles);

  const grid = el("div", "mmb-dash__grid");
  grid.appendChild(growthCard(context));
  grid.appendChild(progressCard(context));
  grid.appendChild(
    AiInsightPanel({
      subscription: context.subscription,
      userId: context.userId,
      unlocked: hasFeature(context.subscription, FEATURES.AI_ANALYSIS),
      growth: context.growth,
      businesses: context.businesses,
      completedModules: context.completed.length,
      totalModules: COURSES.length,
      certificates: context.certificates.length,
      remaining: remainingAiAnalyses(context.subscription, context.userId),
    })
  );
  grid.appendChild(certificatesCard(context));
  grid.appendChild(listingsCard(context));
  root.appendChild(grid);

  if (!isPaidPlan(context.subscription)) {
    root.appendChild(el("div", "mmb-dash__grid")).appendChild(upgradeCard(context));
  }
}

/**
 * Loads all dashboard data, then renders it.
 *
 * @param {HTMLElement} root - The dashboard root element.
 * @param {Object} opts - Options passed from the router.
 * @returns {void}
 */
function load(root, opts) {
  const user = getCurrentUser();
  const userId = opts.userId || user?.id || null;
  const state = {
    userId,
    firstName: (user?.fullName || "entrepreneur").split(" ")[0],
    holderName: user?.fullName || "",
    showBusinesses: opts.view === "my-business",
    subscription: null,
    businesses: [],
    completed: [],
    certificates: [],
    metrics: [],
    growth: computeGrowth([]),
    trackProgress: getTrackProgress([]),
    refresh: () => load(root, opts),
  };

  render(root, state);

  Promise.all([
    getSubscription(userId),
    userId ? getUserBusinesses(userId) : Promise.resolve({ data: [] }),
    getUserProgress(userId),
  ]).then(async ([subResult, businessResult, progressResult]) => {
    state.subscription = subResult.data;
    state.businesses = businessResult.data || [];
    state.completed = progressResult.data || [];

    const metricsResult = await getMetrics(userId, { subscription: state.subscription });
    state.metrics = metricsResult.data || [];
    state.growth = computeGrowth(state.metrics);
    state.trackProgress = getTrackProgress(state.completed);

    const certResult = await issueEarnedCertificates(userId, state.completed, {
      holderName: state.holderName,
    });
    state.certificates = certResult.data || [];

    render(root, state);
  });
}

/**
 * User dashboard view.
 *
 * Renders subscription-aware content: free users see the learning and
 * listing tools with clear upgrade prompts, paying users additionally see
 * AI analysis, longer growth history, forecasts and shareable
 * certificates. A plan change re-renders the page in place.
 *
 * @param {Object} [opts={}] - Router options.
 * @returns {HTMLElement} The dashboard element.
 */
function DashboardView(opts = {}) {
  const root = el("div", "mmb-dash");
  load(root, opts);

  const unsubscribe = onSubscriptionChange(() => {
    if (root.isConnected) load(root, opts);
  });
  root._cleanup = unsubscribe;

  return root;
}

export { DashboardView };
export default DashboardView;
