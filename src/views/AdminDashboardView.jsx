/**
 * @file Admin dashboard view.
 * @description Admin-only screen with four tabs:
 *  - Overview: business analytics (users, listings, MRR, conversion, churn)
 *  - Subscriptions: check every subscriber, change plans, pause, resume
 *  - Promotions: create and manage marketing campaigns
 *  - Approvals: review, approve, feature or reject business listings
 */

import { el } from "../utils/dom.js";
import { getCurrentUser } from "../store/auth.store.js";
import { navigate } from "../router/index.js";
import { renderToast } from "../components/ToastContainer.jsx";
import { formatCurrency, formatDate } from "../utils/formatters.js";
import { isAdminUser } from "../utils/roles.js";
import { PLANS, PLAN_IDS, SUB_STATUS, getPlanById } from "../data/plans.js";
import {
  BUSINESS_STATUS,
  createPromotion,
  deletePromotion,
  describeSubscription,
  getPlatformStats,
  listPendingBusinesses,
  listPromotions,
  listSubscribers,
  setBusinessStatus,
  setPromotionActive,
  updateSubscriber,
} from "../services/admin.service.js";

/** Tab definitions, mapped to their hash routes. */
const TABS = [
  { id: "overview", label: "📊 Business analytics", path: "/admin/analytics" },
  { id: "subscriptions", label: "💳 Subscriptions", path: "/admin/subscriptions" },
  { id: "promotions", label: "📣 Promotions", path: "/admin/promotions" },
  { id: "approvals", label: "✅ Listing approvals", path: "/admin/approvals" },
];

/** Maps an admin route path to the tab it should open. */
const PATH_TO_TAB = TABS.reduce((acc, tab) => {
  acc[tab.path] = tab.id;
  return acc;
}, { "/admin": "overview" });

/**
 * Returns a badge class for a subscription status.
 *
 * @param {string} status - The status value.
 * @returns {string}
 */
function statusTone(status) {
  if (status === SUB_STATUS.ACTIVE) return "success";
  if (status === SUB_STATUS.PAST_DUE) return "warning";
  if (status === SUB_STATUS.CANCELLED || status === SUB_STATUS.EXPIRED) return "danger";
  return "info";
}

/**
 * Returns a badge class for a listing status.
 *
 * @param {string} status - The listing status.
 * @returns {string}
 */
function listingTone(status) {
  if (status === BUSINESS_STATUS.APPROVED || status === BUSINESS_STATUS.FEATURED) return "success";
  if (status === BUSINESS_STATUS.REJECTED) return "danger";
  return "warning";
}

/**
 * Renders a compact stat tile.
 *
 * @param {string} value - Headline value.
 * @param {string} label - Tile label.
 * @param {string} [note] - Optional sub-note.
 * @returns {HTMLElement}
 */
function statTile(value, label, note) {
  const node = el("div", "mmb-tile");
  node.appendChild(el("div", "mmb-tile__value", value));
  node.appendChild(el("div", "mmb-tile__label", label));
  if (note) node.appendChild(el("div", "mmb-tile__delta mmb-flat", note));
  return node;
}

/**
 * Builds a `<table>` from a column definition and row data.
 *
 * @param {Array<{ label: string, render: Function }>} columns - Column definitions.
 * @param {Object[]} rows - Row data.
 * @param {string} emptyMessage - Message shown when there are no rows.
 * @returns {HTMLElement}
 */
function dataTable(columns, rows, emptyMessage) {
  if (!rows.length) return el("p", "mmb-empty", emptyMessage);

  const wrap = el("div", "mmb-table-wrap");
  const table = el("table", "mmb-table");

  const thead = el("thead");
  const headRow = el("tr");
  columns.forEach((col) => headRow.appendChild(el("th", null, col.label)));
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = el("tbody");
  rows.forEach((row) => {
    const tr = el("tr");
    columns.forEach((col) => {
      const td = el("td");
      const content = col.render(row);
      if (content == null) td.textContent = "—";
      else if (typeof content === "string") td.textContent = content;
      else td.appendChild(content);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

/**
 * Renders the analytics tab.
 *
 * @param {Object} stats - Result of `getPlatformStats()`.
 * @returns {HTMLElement}
 */
function overviewTab(stats) {
  const wrap = el("div");
  const totals = stats.totals;

  const revenue = el("section", "mmb-card");
  const revenueHead = el("div", "mmb-card__head");
  revenueHead.appendChild(el("h2", "mmb-card__title", "Revenue & subscriptions"));
  revenue.appendChild(revenueHead);

  const tiles = el("div", "mmb-tiles");
  tiles.appendChild(
    statTile(formatCurrency(totals.mrr), "Monthly recurring revenue", `${totals.payingSubscribers} paying subscriber(s)`)
  );
  tiles.appendChild(
    statTile(`${totals.conversionPct}%`, "Free → paid conversion", `${totals.freeSubscribers} on free`)
  );
  tiles.appendChild(
    statTile(`${totals.churnPct}%`, "Cancellation rate", `${totals.cancelledSubscribers} cancelled`)
  );
  tiles.appendChild(
    statTile(
      String(totals.renewingSoon),
      "Renewing in 14 days",
      `${totals.pastDueSubscribers} payment(s) overdue`
    )
  );
  revenue.appendChild(tiles);
  wrap.appendChild(revenue);

  const users = el("section", "mmb-card", "");
  users.style.marginTop = "20px";
  const usersHead = el("div", "mmb-card__head");
  usersHead.appendChild(el("h2", "mmb-card__title", "Platform reach"));
  users.appendChild(usersHead);
  const userTiles = el("div", "mmb-tiles");
  userTiles.appendChild(
    statTile(String(totals.users), "Registered users", `${totals.newUsersThisMonth} new this month`)
  );
  userTiles.appendChild(statTile(String(totals.businesses), "Business listings", `${totals.youthOwned} youth-owned`));
  userTiles.appendChild(
    statTile(String(stats.businessStatus.pending), "Awaiting review", `${stats.businessStatus.approved} approved`)
  );
  userTiles.appendChild(
    statTile(String(stats.businessStatus.featured), "Featured listings", `${stats.businessStatus.rejected} rejected`)
  );
  users.appendChild(userTiles);
  wrap.appendChild(users);

  const planCard = el("section", "mmb-card");
  planCard.style.marginTop = "20px";
  const planHead = el("div", "mmb-card__head");
  planHead.appendChild(el("h2", "mmb-card__title", "Plan mix"));
  planCard.appendChild(planHead);
  planCard.appendChild(
    dataTable(
      [
        { label: "Plan", render: (row) => row.name },
        { label: "Price", render: (row) => (row.price ? `${formatCurrency(row.price)}/mo` : "Free") },
        { label: "Subscribers", render: (row) => String(row.total) },
        { label: "Active", render: (row) => String(row.active) },
        {
          label: "Share",
          render: (row) => {
            const wrapNode = el("div");
            const row2 = el("div", "mmb-progress__row");
            row2.appendChild(el("span", null, `${row.sharePct}%`));
            wrapNode.appendChild(row2);
            const bar = el("div", "mmb-progress");
            const fill = el("div", "mmb-progress__fill");
            fill.style.width = `${row.sharePct}%`;
            bar.appendChild(fill);
            wrapNode.appendChild(bar);
            return wrapNode;
          },
        },
      ],
      stats.byPlan,
      "No plan data yet."
    )
  );
  wrap.appendChild(planCard);

  const catCard = el("section", "mmb-card");
  catCard.style.marginTop = "20px";
  const catHead = el("div", "mmb-card__head");
  catHead.appendChild(el("h2", "mmb-card__title", "Where demand sits (top categories)"));
  catCard.appendChild(catHead);
  const maxCount = stats.topCategories.reduce((max, c) => Math.max(max, c.count), 1);
  stats.topCategories.forEach((category) => {
    const block = el("div");
    const row = el("div", "mmb-progress__row");
    row.appendChild(el("span", null, category.name));
    row.appendChild(el("span", null, `${category.count} listing(s)`));
    block.appendChild(row);
    const bar = el("div", "mmb-progress");
    const fill = el("div", "mmb-progress__fill");
    fill.style.width = `${Math.round((category.count / maxCount) * 100)}%`;
    bar.appendChild(fill);
    block.appendChild(bar);
    catCard.appendChild(block);
  });
  if (!stats.topCategories.length) {
    catCard.appendChild(el("p", "mmb-empty", "No listings to categorise yet."));
  }
  wrap.appendChild(catCard);

  return wrap;
}

/**
 * Renders the subscription-checking tab.
 *
 * @param {Object} context - Admin view context.
 * @returns {HTMLElement}
 */
function subscriptionsTab(context) {
  const wrap = el("div");
  const card = el("section", "mmb-card");

  const head = el("div", "mmb-card__head");
  head.appendChild(el("h2", "mmb-card__title", `Subscriber check (${context.subscribers.length})`));
  card.appendChild(head);

  const toolbar = el("div", "mmb-toolbar");

  const search = el("input", "mmb-input mmb-toolbar__search");
  search.type = "search";
  search.placeholder = "Search by name or email…";
  toolbar.appendChild(search);

  const filter = el("select", "mmb-select");
  [
    { value: "all", label: "All plans" },
    ...PLANS.map((plan) => ({ value: plan.id, label: plan.name })),
    { value: "paying", label: "Paying only" },
    { value: "free", label: "Free only" },
    { value: "at-risk", label: "Cancelled / overdue" },
  ].forEach((entry) => {
    const option = el("option", null, entry.label);
    option.value = entry.value;
    filter.appendChild(option);
  });
  toolbar.appendChild(filter);

  const exportBtn = el("button", "mmb-btn mmb-btn--ghost mmb-btn--small", "Export CSV");
  exportBtn.type = "button";
  toolbar.appendChild(exportBtn);
  card.appendChild(toolbar);

  const tableHost = el("div");
  card.appendChild(tableHost);

  /**
   * Applies the current search + filter to the subscriber list.
   *
   * @returns {void}
   */
  function paint() {
    const term = search.value.trim().toLowerCase();
    const mode = filter.value;

    const rows = context.subscribers.filter((sub) => {
      if (term && !`${sub.name} ${sub.email}`.toLowerCase().includes(term)) return false;
      if (mode === "paying") return sub.isPaying;
      if (mode === "free") return sub.planId === PLAN_IDS.FREE;
      if (mode === "at-risk") {
        return sub.status === SUB_STATUS.CANCELLED || sub.status === SUB_STATUS.PAST_DUE;
      }
      if (mode !== "all" && sub.planId !== mode) return false;
      return true;
    });

    tableHost.innerHTML = "";
    tableHost.appendChild(
      dataTable(
        [
          {
            label: "Subscriber",
            render: (row) => {
              const main = el("div", "mmb-list__main");
              main.appendChild(el("p", "mmb-list__title", row.name));
              main.appendChild(el("p", "mmb-list__meta", row.email));
              return main;
            },
          },
          {
            label: "Plan",
            render: (row) => {
              const badge = el(
                "span",
                `mmb-badge mmb-badge--${row.planId}`,
                row.planName
              );
              const wrapNode = el("div");
              wrapNode.appendChild(badge);
              wrapNode.appendChild(el("p", "mmb-list__meta", describeSubscription(row)));
              return wrapNode;
            },
          },
          {
            label: "Status",
            render: (row) =>
              el("span", `mmb-badge mmb-badge--${statusTone(row.status)}`, row.status),
          },
          {
            label: "Joined",
            render: (row) => (row.createdAt ? formatDate(row.createdAt) : "—"),
          },
          {
            label: "Actions",
            render: (row) => {
              const actions = el("div", "mmb-table__actions");

              const planSelect = el("select", "mmb-select");
              planSelect.style.width = "auto";
              PLANS.forEach((plan) => {
                const option = el("option", null, plan.name);
                option.value = plan.id;
                if (plan.id === row.planId) option.selected = true;
                planSelect.appendChild(option);
              });
              planSelect.addEventListener("change", async () => {
                const { error } = await updateSubscriber(row.userId, { planId: planSelect.value });
                if (error) renderToast("Plan change failed.", "error");
                else renderToast(`${row.name} moved to ${getPlanById(planSelect.value).name}.`, "success");
                await context.reload();
              });
              actions.appendChild(planSelect);

              if (row.isPaying) {
                const pause = el("button", "mmb-btn mmb-btn--ghost mmb-btn--small", "Pause");
                pause.type = "button";
                pause.addEventListener("click", async () => {
                  const { error } = await updateSubscriber(row.userId, { status: SUB_STATUS.PAST_DUE });
                  if (error) renderToast("Could not pause the subscription.", "error");
                  else renderToast(`${row.name} marked as payment overdue.`, "info");
                  await context.reload();
                });
                actions.appendChild(pause);

                const resume = el("button", "mmb-btn mmb-btn--small", "Resume");
                resume.type = "button";
                resume.addEventListener("click", async () => {
                  const { error } = await updateSubscriber(row.userId, { status: SUB_STATUS.ACTIVE });
                  if (error) renderToast("Could not resume the subscription.", "error");
                  else renderToast(`${row.name} resumed.`, "success");
                  await context.reload();
                });
                actions.appendChild(resume);
              } else {
                const grant = el("button", "mmb-btn mmb-btn--small", "Grant Pro");
                grant.type = "button";
                grant.addEventListener("click", async () => {
                  const { error } = await updateSubscriber(row.userId, {
                    planId: PLAN_IDS.PRO,
                    status: SUB_STATUS.ACTIVE,
                  });
                  if (error) renderToast("Could not grant the plan.", "error");
                  else renderToast(`Pro granted to ${row.name}.`, "success");
                  await context.reload();
                });
                actions.appendChild(grant);
              }

              const cancel = el("button", "mmb-btn mmb-btn--ghost mmb-btn--small", "Cancel");
              cancel.type = "button";
              cancel.addEventListener("click", async () => {
                const { error } = await updateSubscriber(row.userId, { status: SUB_STATUS.CANCELLED });
                if (error) renderToast("Could not cancel.", "error");
                else renderToast(`${row.name}'s subscription cancelled.`, "info");
                await context.reload();
              });
              actions.appendChild(cancel);

              return actions;
            },
          },
        ],
        rows,
        "No subscribers match that search."
      )
    );
  }

  search.addEventListener("input", paint);
  filter.addEventListener("change", paint);

  exportBtn.addEventListener("click", () => {
    const header = "name,email,plan,status,price,started,renews";
    const lines = context.subscribers.map((sub) =>
      [
        sub.name,
        sub.email,
        sub.planName,
        sub.status,
        sub.isPaying ? sub.price : 0,
        sub.startedAt || "",
        sub.renewsAt || "",
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = el("a");
    link.href = url;
    link.download = "map-my-biz-subscribers.csv";
    link.click();
    URL.revokeObjectURL(url);
    renderToast("Subscriber CSV downloaded.", "success");
  });

  paint();
  wrap.appendChild(card);
  return wrap;
}

/**
 * Renders the promotions tab.
 *
 * @param {Object} context - Admin view context.
 * @returns {HTMLElement}
 */
function promotionsTab(context) {
  const wrap = el("div");

  const formCard = el("section", "mmb-card");
  const formHead = el("div", "mmb-card__head");
  formHead.appendChild(el("h2", "mmb-card__title", "Create a promotion"));
  formCard.appendChild(formHead);
  formCard.appendChild(
    el(
      "p",
      "mmb-card__hint",
      "Campaigns push your best stories to the home page, the map and the newsletter. Premium subscribers are featured first."
    )
  );

  const form = el("form");
  const grid = el("div", "mmb-form-grid");

  const fields = {
    title: el("input", "mmb-input"),
    code: el("input", "mmb-input"),
    discountPct: el("input", "mmb-input"),
    startsAt: el("input", "mmb-input"),
    endsAt: el("input", "mmb-input"),
  };
  fields.title.type = "text";
  fields.title.placeholder = "e.g. Women's Month small business boost";
  fields.code.type = "text";
  fields.code.placeholder = "WOMEN25";
  fields.discountPct.type = "number";
  fields.discountPct.min = "0";
  fields.discountPct.max = "100";
  fields.discountPct.value = "10";
  fields.startsAt.type = "date";
  fields.endsAt.type = "date";

  const channelSelect = el("select", "mmb-select");
  [
    { value: "platform", label: "Whole platform" },
    { value: "email", label: "Email newsletter" },
    { value: "whatsapp", label: "WhatsApp broadcast" },
    { value: "social", label: "Social media" },
    { value: "map", label: "Map featured slot" },
  ].forEach((entry) => {
    const option = el("option", null, entry.label);
    option.value = entry.value;
    channelSelect.appendChild(option);
  });

  const audienceSelect = el("select", "mmb-select");
  [
    { value: "all", label: "Everyone" },
    { value: "free", label: "Free plan (upgrade push)" },
    { value: "paying", label: "Paying subscribers" },
    { value: "premium", label: "Premium only" },
  ].forEach((entry) => {
    const option = el("option", null, entry.label);
    option.value = entry.value;
    audienceSelect.appendChild(option);
  });

  [
    ["Campaign title", fields.title],
    ["Promo code", fields.code],
    ["Discount %", fields.discountPct],
    ["Starts", fields.startsAt],
    ["Ends", fields.endsAt],
    ["Channel", channelSelect],
    ["Audience", audienceSelect],
  ].forEach(([label, input]) => {
    const field = el("label", "mmb-field", label);
    field.appendChild(input);
    grid.appendChild(field);
  });

  form.appendChild(grid);
  const submit = el("button", "mmb-btn", "Create campaign");
  submit.type = "submit";
  form.appendChild(submit);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    const { error } = await createPromotion({
      title: fields.title.value,
      code: fields.code.value || null,
      discountPct: Number(fields.discountPct.value) || 0,
      startsAt: fields.startsAt.value || null,
      endsAt: fields.endsAt.value || null,
      channel: channelSelect.value,
      audience: audienceSelect.value,
      active: true,
    });
    submit.disabled = false;
    if (error) renderToast(error.message || "Could not create the campaign.", "error");
    else renderToast("Campaign created.", "success");
    fields.title.value = "";
    fields.code.value = "";
    await context.reload();
  });

  formCard.appendChild(form);
  wrap.appendChild(formCard);

  const listCard = el("section", "mmb-card");
  listCard.style.marginTop = "20px";
  const listHead = el("div", "mmb-card__head");
  listHead.appendChild(el("h2", "mmb-card__title", `Live campaigns (${context.promotions.length})`));
  listCard.appendChild(listHead);

  listCard.appendChild(
    dataTable(
      [
        {
          label: "Campaign",
          render: (row) => {
            const main = el("div", "mmb-list__main");
            main.appendChild(el("p", "mmb-list__title", row.title));
            const window_ = row.startsAt || row.endsAt
              ? `${row.startsAt ? formatDate(row.startsAt) : "now"} → ${row.endsAt ? formatDate(row.endsAt) : "open"}`
              : "Always on";
            main.appendChild(el("p", "mmb-list__meta", `${row.channel} · ${row.audience} · ${window_}`));
            return main;
          },
        },
        { label: "Code", render: (row) => (row.code ? row.code : "—") },
        { label: "Discount", render: (row) => `${row.discountPct}%` },
        { label: "Clicks", render: (row) => String(row.clicks) },
        { label: "Sign-ups", render: (row) => String(row.signups) },
        {
          label: "Status",
          render: (row) =>
            el(
              "span",
              `mmb-badge mmb-badge--${row.active ? "success" : "info"}`,
              row.active ? "active" : "paused"
            ),
        },
        {
          label: "Actions",
          render: (row) => {
            const actions = el("div", "mmb-table__actions");
            const toggle = el(
              "button",
              "mmb-btn mmb-btn--small",
              row.active ? "Pause" : "Activate"
            );
            toggle.type = "button";
            toggle.addEventListener("click", async () => {
              const { error } = await setPromotionActive(row.id, !row.active);
              if (error) renderToast("Could not update the campaign.", "error");
              else renderToast(`${row.title} ${row.active ? "paused" : "activated"}.`, "success");
              await context.reload();
            });
            actions.appendChild(toggle);

            const remove = el("button", "mmb-btn mmb-btn--ghost mmb-btn--small", "Delete");
            remove.type = "button";
            remove.addEventListener("click", async () => {
              if (!window.confirm(`Delete the campaign "${row.title}"?`)) return;
              const { error } = await deletePromotion(row.id);
              if (error) renderToast("Could not delete the campaign.", "error");
              else renderToast("Campaign deleted.", "info");
              await context.reload();
            });
            actions.appendChild(remove);
            return actions;
          },
        },
      ],
      context.promotions,
      "No campaigns yet. Create your first one above."
    )
  );

  wrap.appendChild(listCard);
  return wrap;
}

/**
 * Renders the listing approvals tab.
 *
 * @param {Object} context - Admin view context.
 * @returns {HTMLElement}
 */
function approvalsTab(context) {
  const wrap = el("div");
  const card = el("section", "mmb-card");
  const head = el("div", "mmb-card__head");
  head.appendChild(el("h2", "mmb-card__title", `Awaiting review (${context.pending.length})`));
  card.appendChild(head);
  card.appendChild(
    el(
      "p",
      "mmb-card__hint",
      "Approved listings appear on the public map and in search. Featured listings also get the top slot and are eligible for promotion campaigns."
    )
  );

  card.appendChild(
    dataTable(
      [
        {
          label: "Business",
          render: (row) => {
            const main = el("div", "mmb-list__main");
            main.appendChild(el("p", "mmb-list__title", row.name));
            main.appendChild(
              el(
                "p",
                "mmb-list__meta",
                `${row.category || "Uncategorised"} · ${row.location || "No location"}`
              )
            );
            return main;
          },
        },
        { label: "Owner", render: (row) => row.email || row.user_id || "—" },
        { label: "Submitted", render: (row) => (row.created_at ? formatDate(row.created_at) : "—") },
        {
          label: "Status",
          render: (row) =>
            el("span", `mmb-badge mmb-badge--${listingTone(row.status)}`, row.status || "pending"),
        },
        {
          label: "Actions",
          render: (row) => {
            const actions = el("div", "mmb-table__actions");
            [
              { status: BUSINESS_STATUS.APPROVED, label: "Approve", className: "mmb-btn" },
              { status: BUSINESS_STATUS.FEATURED, label: "Feature", className: "mmb-btn mmb-btn--ghost" },
              { status: BUSINESS_STATUS.REJECTED, label: "Reject", className: "mmb-btn mmb-btn--ghost" },
            ].forEach((action) => {
              const btn = el("button", `${action.className} mmb-btn--small`, action.label);
              btn.type = "button";
              btn.addEventListener("click", async () => {
                const { error } = await setBusinessStatus(row.id, action.status);
                if (error) renderToast("Could not update the listing.", "error");
                else renderToast(`${row.name} → ${action.status}.`, "success");
                await context.reload();
              });
              actions.appendChild(btn);
            });
            return actions;
          },
        },
      ],
      context.pending,
      "Nothing waiting for review. Nice work."
    )
  );

  wrap.appendChild(card);
  return wrap;
}

/**
 * Renders the access-denied panel.
 *
 * @returns {HTMLElement}
 */
function accessDenied() {
  const root = el("div", "mmb-dash");
  const card = el("section", "mmb-card");
  card.appendChild(el("h1", "mmb-dash__title", "Admins only"));
  card.appendChild(
    el(
      "p",
      "mmb-card__hint",
      "This dashboard is limited to platform administrators. If you think this is a mistake, ask your team lead to add your email to the admin list."
    )
  );
  const back = el("button", "mmb-btn", "← Back to my dashboard");
  back.type = "button";
  back.addEventListener("click", () => navigate("/dashboard"));
  card.appendChild(back);
  root.appendChild(card);
  return root;
}

/**
 * Admin dashboard view.
 *
 * @returns {HTMLElement} The view element.
 */
function AdminDashboardView(opts = {}) {
  const user = getCurrentUser();
  if (!user || !isAdminUser(user)) return accessDenied();

  const root = el("div", "mmb-dash");

  const head = el("div", "mmb-dash__head");
  const titles = el("div");
  titles.appendChild(el("h1", "mmb-dash__title", "Admin dashboard"));
  titles.appendChild(
    el(
      "p",
      "mmb-dash__subtitle",
      "Business analytics, subscription checking, promotions and listing approvals."
    )
  );
  head.appendChild(titles);

  const refreshBtn = el("button", "mmb-btn mmb-btn--ghost mmb-btn--small", "↻ Refresh");
  refreshBtn.type = "button";
  head.appendChild(refreshBtn);
  root.appendChild(head);

  const tabBar = el("div", "mmb-tabs");
  const tabHost = el("div");
  root.appendChild(tabBar);
  root.appendChild(tabHost);

  const context = {
    activeTab: PATH_TO_TAB[opts.path] || "overview",
    stats: null,
    subscribers: [],
    promotions: [],
    pending: [],
    reload: null,
  };

  /**
   * Repaints the tab bar and the active tab.
   *
   * @returns {void}
   */
  function paintTabs() {
    tabBar.innerHTML = "";
    TABS.forEach((tab) => {
      const button = el(
        "button",
        `mmb-tab${tab.id === context.activeTab ? " mmb-tab--active" : ""}`,
        tab.label
      );
      button.type = "button";
      button.addEventListener("click", () => {
        context.activeTab = tab.id;
        navigate(tab.path);
        paintTabs();
      });
      tabBar.appendChild(button);
    });

    tabHost.innerHTML = "";
    if (!context.stats) {
      tabHost.appendChild(el("p", "mmb-empty", "Loading platform data…"));
      return;
    }

    if (context.activeTab === "overview") tabHost.appendChild(overviewTab(context.stats));
    if (context.activeTab === "subscriptions") tabHost.appendChild(subscriptionsTab(context));
    if (context.activeTab === "promotions") tabHost.appendChild(promotionsTab(context));
    if (context.activeTab === "approvals") tabHost.appendChild(approvalsTab(context));
  }

  /**
   * Loads every dataset the tabs need.
   *
   * @returns {Promise<void>}
   */
  async function load() {
    tabHost.innerHTML = "";
    tabHost.appendChild(el("p", "mmb-empty", "Loading platform data…"));

    const [statsResult, subscribersResult, promotionsResult, pendingResult] = await Promise.all([
      getPlatformStats(),
      listSubscribers(),
      listPromotions(),
      listPendingBusinesses(),
    ]);

    context.stats = statsResult.data;
    context.subscribers = subscribersResult.data || [];
    context.promotions = promotionsResult.data || [];
    context.pending = pendingResult.data || [];
    paintTabs();
  }

  context.reload = load;
  refreshBtn.addEventListener("click", load);
  load();

  return root;
}

export { AdminDashboardView };
export default AdminDashboardView;
