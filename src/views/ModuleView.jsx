import { getCourseById } from "../data/courses.js";
import { el } from "../utils/dom.js";
import { navigate } from "../router/index.js";
import { getCurrentUser, isAuthenticated } from "../store/auth.store.js";
import { markModuleCompleted, saveLastModule } from "../services/progress.service.js";
import { renderToast } from "../components/ToastContainer.jsx";

function ModuleView(opts = {}) {
  const course = getCourseById(opts.id);
  const root = el("article", "mmp-module-article");
  if (!course) {
    root.appendChild(el("h1", null, "Module not found"));
    const back = el("button", "mmp-submit-btn", "Back to courses");
    back.addEventListener("click", () => navigate("/courses"));
    root.appendChild(back);
    return root;
  }

  saveLastModule(course.id);
  root.appendChild(el("p", null, `Module ${course.id} · ${course.level}`));
  root.appendChild(el("h1", null, course.title));
  root.appendChild(el("p", null, course.summary));
  root.appendChild(el("p", null, "Work through this lesson at your own pace. When you are done, mark it complete so it appears on your dashboard."));
  root.appendChild(el("p", null, "Tip: apply one idea from this module to your business this week — a price check, a customer conversation, or a simple record of sales."));

  const completeBtn = el("button", "mmp-submit-btn", "Mark as complete");
  completeBtn.addEventListener("click", async () => {
    if (!isAuthenticated()) {
      renderToast("Log in to save your progress.", "warning");
      navigate("/login");
      return;
    }
    completeBtn.disabled = true;
    const user = getCurrentUser();
    const { error } = await markModuleCompleted(user.id, String(course.id));
    if (error) {
      renderToast(error.message || "Could not save progress.", "error");
      completeBtn.disabled = false;
      return;
    }
    renderToast("Module marked complete.", "success");
    navigate("/dashboard");
  });
  root.appendChild(completeBtn);
  return root;
}

export { ModuleView };
export default ModuleView;
