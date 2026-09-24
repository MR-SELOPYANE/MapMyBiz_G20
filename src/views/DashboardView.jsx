import { getUserProgress } from "../services/progress.service.js";
import { ModuleCard } from "../components/ModuleCard.jsx";
import { getCurrentUser } from "../store/auth.store.js";
import { navigate } from "../router/index.js";
import { el } from "../utils/dom.js";
import { COURSES } from "../data/courses.js";
import { getUserBusinesses } from "../services/business.service.js";

const STYLES = `
  .mmp-dashboard { color: #1a3b5d; padding: 24px 20px 60px; max-width: 1200px; margin: 0 auto; text-align: left; }
  .mmp-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 28px; }
  .mmp-metric { background: #fff; border: 2px solid #B8D8D8; border-radius: 12px; padding: 18px; text-align: center; }
  .mmp-metric__value { font-size: 1.8rem; font-weight: 700; color: #0A8791; }
  .mmp-metric__label { font-size: 0.8rem; color: #555; margin-top: 4px; }
  .mmp-modules-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }
  .mmp-section-title { color: #0A8791; margin-bottom: 14px; }
  .mmp-biz-list { list-style: none; padding: 0; }
  .mmp-biz-list li { background: #fff; border: 1px solid #B8D8D8; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; }
`;

function metricEl(valueId, label, initial) {
  const m = el("div", "mmp-metric");
  const v = el("div", "mmp-metric__value", initial);
  v.id = valueId;
  m.appendChild(v);
  m.appendChild(el("div", "mmp-metric__label", label));
  return m;
}

function DashboardView(opts = {}) {
  if (!document.getElementById("mmp-dashboard-styles")) {
    const s = document.createElement("style");
    s.id = "mmp-dashboard-styles";
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  const user = getCurrentUser();
  const userId = opts.userId || user?.id || null;
  const showBusinesses = opts.view === "my-business";
  const root = el("div", "mmp-dashboard");
  root.appendChild(el("h1", null, showBusinesses ? "My businesses" : "Dashboard"));

  const metrics = el("div", "mmp-metrics");
  metrics.appendChild(metricEl("mmp-metric-completed", "Modules Completed", "0"));
  metrics.appendChild(metricEl("mmp-metric-total", "Total Modules", String(COURSES.length)));
  metrics.appendChild(metricEl("mmp-metric-badges", "Badges Earned", "0"));
  root.appendChild(metrics);

  if (showBusinesses) {
    const list = el("ul", "mmp-biz-list");
    list.appendChild(el("li", null, "Loading your listings..."));
    root.appendChild(el("h2", "mmp-section-title", "Your listings"));
    root.appendChild(list);
    getUserBusinesses(userId).then(({ data, error }) => {
      list.innerHTML = "";
      if (error) {
        list.appendChild(el("li", null, "Could not load businesses. You can still add a listing."));
        return;
      }
      if (!data?.length) {
        list.appendChild(el("li", null, "No businesses yet."));
      } else {
        data.forEach((biz) => {
          const li = el("li");
          li.textContent = `${biz.name} — ${biz.category || "Uncategorised"} (${biz.status || "pending"})`;
          list.appendChild(li);
        });
      }
    });
  }

  const gridSection = document.createElement("section");
  gridSection.appendChild(el("h2", "mmp-section-title", "Learning Modules"));
  const grid = el("div", "mmp-modules-grid");
  gridSection.appendChild(grid);
  root.appendChild(gridSection);

  loadProgress(root, userId, grid);
  return root;
}

async function loadProgress(root, userId, grid) {
  const { data: completed = [] } = await getUserProgress(userId);
  const set = new Set(completed.map((id) => String(id)));
  const completedEl = root.querySelector("#mmp-metric-completed");
  if (completedEl) completedEl.textContent = String(set.size);
  const badgesEl = root.querySelector("#mmp-metric-badges");
  if (badgesEl) badgesEl.textContent = String(set.size);
  COURSES.forEach((mod) => {
    const isDone = set.has(String(mod.id)) || set.has(`Module ${mod.id}`);
    const card = ModuleCard(
      { id: String(mod.id), title: mod.title, description: mod.summary, path: `/module/${mod.id}` },
      { completed: isDone, progress: isDone ? 100 : 0 },
    );
    card.style.cursor = "pointer";
    card.addEventListener("click", () => navigate(`/module/${mod.id}`));
    grid.appendChild(card);
  });
}

export { DashboardView };
export default DashboardView;
