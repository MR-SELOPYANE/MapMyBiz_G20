import { navigate } from "../router/index.js";
import { isAuthenticated } from "../store/auth.store.js";
import { renderToast } from "../components/ToastContainer.jsx";
import { el } from "../utils/dom.js";
import { COURSES } from "../data/courses.js";
import { BookmarkButton } from "../components/BookmarkButton.jsx";
import { ShareButton } from "../components/ShareButton.jsx";
import { courseShareMessage } from "../utils/wa-share.js";
import { SAVED_TYPES } from "../services/saved.service.js";

const STYLES = `
  .mmp-courses { font-family: inherit; color: #1a3b5d; padding-bottom: 60px; }
  .mmp-page-header { text-align: center; padding: 60px 20px; background: #F0F6F6; border-bottom: 1px solid #B8D8D8; margin-bottom: 40px; }
  .mmp-page-header h1 { font-size: 2.5rem; color: #1a3b5d; margin-bottom: 12px; font-weight: 700; }
  .mmp-page-header p { font-size: 1.1rem; color: #555; max-width: 700px; margin: 0 auto; }
  .mmp-filters { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 20px; padding: 20px; background: #f9f9f9; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); max-width: 1200px; margin: 0 auto 30px; }
  .mmp-search-bar input { width: 100%; max-width: 300px; padding: 12px 16px; border: 1px solid #0A8791; border-radius: 6px; font-size: 14px; }
  .mmp-filter-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
  .mmp-filter-btn { padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; background: #ddd; color: #333; }
  .mmp-filter-btn.active { background: #0A8791; color: #fff; }
  .mmp-clear-btn { display: none; align-items: center; gap: 8px; padding: 12px 16px; background: transparent; border: 1px solid #0A8791; border-radius: 6px; color: #0A8791; cursor: pointer; }
  .mmp-courses-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; padding: 0 20px; max-width: 1200px; margin: 0 auto; }
  .mmp-course-card { background: #fff; border: 1px solid #B8D8D8; border-radius: 12px; padding: 24px; box-shadow: 0 4px 8px rgba(0,0,0,0.08); text-align: center; }
  .mmp-course-card:hover { transform: translateY(-5px); border-color: #0A8791; }
  .mmp-course-card__topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .mmp-course-card__topbar > * { display: inline-flex; align-items: center; }
  .mmp-course-level { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; margin-bottom: 16px; }
  .mmp-course-level.beginner { background: #d4edda; color: #155724; }
  .mmp-course-level.intermediate { background: #fff3cd; color: #856404; }
  .mmp-course-level.advanced { background: #f8d7da; color: #721c24; }
  .mmp-course-btn { width: 100%; padding: 12px; background: #FFC857; color: #1a3b5d; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; }
`;

function CoursesView() {
  const styleId = "mmp-courses-styles";
  if (!document.getElementById(styleId)) {
    const s = document.createElement("style");
    s.id = styleId;
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  let searchTerm = "";
  let activeFilter = "all";
  const root = el("div", "mmp-courses");

  const header = el("header", "mmp-page-header");
  header.appendChild(el("h1", null, "Courses"));
  header.appendChild(el("p", null, "Explore our curated learning modules designed for entrepreneurs at every stage."));
  root.appendChild(header);

  const filters = el("section", "mmp-filters");
  const searchBar = el("div", "mmp-search-bar");
  const searchInput = el("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search modules...";
  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderCourses();
  });
  searchBar.appendChild(searchInput);
  filters.appendChild(searchBar);

  const filterButtons = el("div", "mmp-filter-buttons");
  ["all", "beginner", "intermediate", "advanced"].forEach((level) => {
    const btn = el("button", `mmp-filter-btn${level === "all" ? " active" : ""}`, level.charAt(0).toUpperCase() + level.slice(1));
    btn.dataset.level = level;
    btn.addEventListener("click", () => {
      activeFilter = level;
      filterButtons.querySelectorAll(".mmp-filter-btn").forEach((b) => b.classList.toggle("active", b.dataset.level === level));
      renderCourses();
    });
    filterButtons.appendChild(btn);
  });
  filters.appendChild(filterButtons);

  const clearBtn = el("button", "mmp-clear-btn", "Clear filters");
  clearBtn.addEventListener("click", () => {
    searchTerm = "";
    activeFilter = "all";
    searchInput.value = "";
    filterButtons.querySelectorAll(".mmp-filter-btn").forEach((b) => b.classList.toggle("active", b.dataset.level === "all"));
    renderCourses();
  });
  filters.appendChild(clearBtn);
  root.appendChild(filters);

  const gridSection = el("section", "mmp-courses-grid");
  root.appendChild(gridSection);

  function renderCourses() {
    const filtered = COURSES.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === "all" || course.level === activeFilter;
      return matchesSearch && matchesFilter;
    });
    clearBtn.style.display = searchTerm || activeFilter !== "all" ? "flex" : "none";
    gridSection.innerHTML = "";
    filtered.forEach((course) => {
      const card = el("article", "mmp-course-card");

      const topbar = el("div", "mmp-course-card__topbar");
      topbar.appendChild(BookmarkButton({ type: SAVED_TYPES.COURSE, item: course, compact: true }));
      topbar.appendChild(ShareButton({ message: courseShareMessage(course), label: "Share" }));
      card.appendChild(topbar);

      card.appendChild(el("h3", null, course.title));
      card.appendChild(el("span", `mmp-course-level ${course.level}`, course.level));
      card.appendChild(el("p", null, course.summary));
      const btn = el("button", "mmp-course-btn", "Start Learning");
      btn.addEventListener("click", () => {
        if (!isAuthenticated()) {
          renderToast("Please log in to access courses.", "warning");
          navigate("/login");
          return;
        }
        navigate(`/module/${course.id}`);
      });
      card.appendChild(btn);
      gridSection.appendChild(card);
    });
  }

  renderCourses();
  return root;
}

export { CoursesView };
export default CoursesView;
