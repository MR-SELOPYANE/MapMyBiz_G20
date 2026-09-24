import { getJobs } from "../services/jobs.service.js";
import { JOBS } from "../data/jobs.js";
import { navigate } from "../router/index.js";
import { el } from "../utils/dom.js";
import { BookmarkButton } from "../components/BookmarkButton.jsx";
import { ShareButton } from "../components/ShareButton.jsx";
import { jobShareMessage } from "../utils/wa-share.js";
import { SAVED_TYPES } from "../services/saved.service.js";

const STYLES = `
  .mmp-jobs { font-family: inherit; color: #1a3b5d; }
  .mmp-jobs-header { text-align: center; padding: 60px 20px; background: #F0F6F6; border-bottom: 1px solid #B8D8D8; margin-bottom: 40px; }
  .mmp-jobs-header h1 { font-size: 2.5rem; color: #1a3b5d; margin-bottom: 12px; font-weight: 700; }
  .mmp-jobs-header p { font-size: 1.1rem; color: #555; }
  .mmp-jobs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto 60px; padding: 0 20px; }
  .mmp-job-card { background: #fff; border: 1px solid #B8D8D8; border-radius: 12px; padding: 24px; box-shadow: 0 4px 8px rgba(0,0,0,0.08); }
  .mmp-job-card:hover { transform: translateY(-3px); border-color: #0A8791; }
  .mmp-job-card__topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .mmp-job-card__topbar > * { display: inline-flex; align-items: center; }
  .mmp-job-card h3 { margin: 0 0 8px; color: #1a3b5d; font-size: 1.25rem; }
  .mmp-job-meta { color: #666; font-size: 0.9rem; margin: 8px 0; }
  .mmp-job-desc { margin: 12px 0; color: #444; line-height: 1.5; }
  .mmp-job-salary { font-weight: 700; color: #0A8791; margin: 8px 0; }
  .mmp-job-link { display: inline-block; margin-top: 12px; padding: 8px 20px; background: #0A8791; color: #fff; border-radius: 6px; font-weight: 600; text-decoration: none; }
  .mmp-job-link:hover { background: #1a3b5d; }
  .mmp-loading { padding: 40px; text-align: center; color: #666; }
`;

function JobsView() {
  const styleId = "mmp-jobs-styles";
  if (!document.getElementById(styleId)) {
    const s = document.createElement("style");
    s.id = styleId;
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  const root = el("div", "mmp-jobs");

  const header = el("header", "mmp-jobs-header");
  header.appendChild(el("h1", null, "Jobs & collaboration"));
  header.appendChild(
    el(
      "p",
      null,
      "Opportunities posted by entrepreneurs on Map My Biz — connect, apply, and grow together."
    )
  );
  root.appendChild(header);

  const grid = el("div", "mmp-jobs-grid");
  grid.classList.add("mmp-loading");
  grid.textContent = "Loading jobs...";
  root.appendChild(grid);

  function renderJobs(jobs) {
    grid.classList.remove("mmp-loading");
    grid.innerHTML = "";
    if (!jobs?.length) {
      grid.appendChild(
        el(
          "p",
          null,
          "No jobs posted yet. Check back soon for new opportunities."
        )
      );
      return;
    }
    jobs.forEach((job) => {
      const card = el("article", "mmp-job-card");

      const topbar = el("div", "mmp-job-card__topbar");
      topbar.appendChild(BookmarkButton({ type: SAVED_TYPES.JOB, item: job, compact: true }));
      topbar.appendChild(ShareButton({ message: jobShareMessage(job), label: "Share" }));
      card.appendChild(topbar);

      card.appendChild(el("h3", null, job.title));
      card.appendChild(
        el(
          "div",
          "mmp-job-meta",
          `${job.company || ""} · ${job.location || ""} · ${job.job_type || ""}`
        )
      );
      if (job.salary) card.appendChild(el("div", "mmp-job-salary", job.salary));
      if (job.description)
        card.appendChild(el("p", "mmp-job-desc", job.description));
      const link = el("a", "mmp-job-link", "View Details");
      link.href = "#";
      link.addEventListener("click", (e) => {
        e.preventDefault();
        navigate(`/jobs/${job.id}`);
      });
      card.appendChild(link);
      grid.appendChild(card);
    });
  }

  getJobs()
    .then(({ data, error }) => {
      if (error || !data?.length) {
        renderJobs(JOBS);
      } else {
        renderJobs(data);
      }
    })
    .catch(() => renderJobs(JOBS));

  return root;
}

export { JobsView };
export default JobsView;
