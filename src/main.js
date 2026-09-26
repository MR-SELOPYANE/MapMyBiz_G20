import "./styles/style.css";
import "./styles/toast.css";
import "./styles/dashboard.css";
import { init as initRouter, navigate } from "./router/index.js";
import { setUser, clearUser, isAuthenticated, getCurrentUser } from "./store/auth.store.js";
import { isAdminUser } from "./utils/roles.js";
import { getSessionUser, watchAuthState, ensureUserProfile } from "./services/auth.service.js";
import { Navbar } from "./components/Navbar.jsx";
import { Footer } from "./components/Footer.jsx";
import { Chatbot } from "./components/Chatbot.jsx";
import { LegalModal } from "./components/LegalModal.jsx";
import { HomeView } from "./views/HomeView.jsx";
import { DashboardView } from "./views/DashboardView.jsx";
import { LoginView } from "./views/LoginView.jsx";
import { CoursesView } from "./views/CoursesView.jsx";
import { MapView } from "./views/MapView.jsx";
import { TourismView } from "./views/TourismView.jsx";
import { BusinessView } from "./views/BusinessView.jsx";
import { ModuleView } from "./views/ModuleView.jsx";
import { AddBusinessView } from "./views/AddBusinessView.jsx";
import { JobsView } from "./views/JobsView.jsx";
import { VrView } from "./views/VrView.jsx";
import { ProfileView } from "./views/ProfileView.jsx";
import { SubscriptionsView } from "./views/SubscriptionsView.jsx";
import { AdminDashboardView } from "./views/AdminDashboardView.jsx";

let appInitialized = false;
let viewRoot = null;

const viewRegistry = {
  home: HomeView,
  dashboard: DashboardView,
  login: LoginView,
  signup: LoginView,
  forgot: LoginView,
  reset: LoginView,
  courses: CoursesView,
  map: MapView,
  business: BusinessView,
  tourism: TourismView,
  profile: ProfileView,
  "update-info": ProfileView,
  "add-business": AddBusinessView,
  "my-business": DashboardView,
  module: ModuleView,
  jobs: JobsView,
  vr: VrView,
  subscriptions: SubscriptionsView,
  admin: AdminDashboardView,
};

/** Views only an authenticated admin may open. */
const ADMIN_VIEWS = ["admin"];

const PUBLIC_VIEWS = [
  "home",
  "map",
  "business",
  "courses",
  "jobs",
  "login",
  "signup",
  "forgot",
  "reset",
  "tourism",
  "vr",
  "subscriptions",
];

/**
 * Boots authentication from Supabase alone: hydrates the auth store from
 * the persisted session, repairs a missing `user_profiles` row, and keeps
 * the store in sync with sign-in / sign-out / token refresh events.
 *
 * @returns {Promise<void>}
 */
async function initAuth() {
  const { user } = await getSessionUser();
  if (user) {
    setUser(user);
    await ensureUserProfile(user);
  }

  watchAuthState((nextUser) => {
    if (nextUser) {
      setUser(nextUser);
    } else if (getCurrentUser()) {
      clearUser();
    }
  });
}

function buildShell(appRoot) {
  appRoot.innerHTML = "";
  appRoot.appendChild(Navbar());
  viewRoot = document.createElement("main");
  viewRoot.id = "view-root";
  appRoot.appendChild(viewRoot);
  appRoot.appendChild(Footer());
  appRoot.appendChild(LegalModal());
  appRoot.appendChild(Chatbot());
}

function renderView(viewName, params = {}, path = "", query = {}) {
  const ViewComponent = viewRegistry[viewName] || viewRegistry.home;
  if (!viewRoot) return;
  viewRoot.innerHTML = "";
  window.scrollTo(0, 0);

  const viewElement = ViewComponent({ ...params, view: viewName, path, query });
  if (viewElement) {
    viewElement.classList.add("mmp-view");
    viewRoot.appendChild(viewElement);
  }
}

function onRouteChange(route) {
  const hash = (window.location.hash || "").replace(/^#/, "");
  if (["about", "mission", "vision"].includes(hash)) {
    renderView("home");
    setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" }), 50);
    return;
  }

  let view = route.view || "home";
  if (!route.view) view = "home";

  const auth = isAuthenticated();
  if (!auth && !PUBLIC_VIEWS.includes(view)) {
    navigate("/login");
    return;
  }

  if (ADMIN_VIEWS.includes(view) && !isAdminUser(getCurrentUser())) {
    navigate("/dashboard");
    return;
  }

  renderView(view, route.params, route.path, route.query);
}

export async function initApp() {
  if (appInitialized) return;
  appInitialized = true;

  await initAuth();

  window.addEventListener("error", (event) => {
    console.error("Global error:", event.error);
  });
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled rejection:", event.reason);
  });

  const appRoot = document.getElementById("app-root") || document.body;
  buildShell(appRoot);
  initRouter(onRouteChange);

  return { navigate };
}

if (typeof window !== "undefined") {
  initApp().catch((err) => {
    console.error("Failed to initialize app:", err);
  });
}

export { navigate };