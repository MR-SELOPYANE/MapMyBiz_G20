import "./styles/style.css";
import "./styles/toast.css";
import { init as initRouter, navigate } from "./router/index.js";
import { setUser, isAuthenticated } from "./store/auth.store.js";
import { getCurrentUser as getSupabaseUser } from "./services/auth.service.js";
import supabase from "./services/supabase.js";
import { renderToast } from "./components/ToastContainer.jsx";
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
};

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
];

async function clearStaleServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((reg) => reg.unregister()));
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (err) {
    console.warn("Could not clear service workers", err);
  }
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

function renderView(viewName, params = {}) {
  const ViewComponent = viewRegistry[viewName] || viewRegistry.home;
  if (!viewRoot) return;
  viewRoot.innerHTML = "";
  window.scrollTo(0, 0);

  const viewElement = ViewComponent({ ...params, view: viewName });
  if (viewElement) {
    viewElement.classList.add("mmp-view");
    viewRoot.appendChild(viewElement);
  }
}

function initAuthListener() {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.user_metadata?.full_name || "",
        phone: session.user.user_metadata?.phone || "",
        saId: session.user.user_metadata?.sa_id || "",
      });
    } else if (event === "SIGNED_OUT") {
      setUser(null);
    }
  });
}

async function checkSession() {
  try {
    const { user, error } = await getSupabaseUser();
    if (error || !user) return;
    setUser({
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name || "",
      phone: user.user_metadata?.phone || "",
      saId: user.user_metadata?.sa_id || "",
    });
  } catch (err) {
    console.warn("Session check error:", err);
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

  if (!isAuthenticated() && !PUBLIC_VIEWS.includes(view)) {
    navigate("/login");
    return;
  }

  renderView(view, route.params);
}

export async function initApp() {
  if (appInitialized) return;
  appInitialized = true;

  await clearStaleServiceWorkers();
  window.addEventListener("error", (event) => {
    console.error("Global error:", event.error);
    renderToast("An unexpected error occurred. Please try again.", "error");
  });
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled rejection:", event.reason);
  });

  await checkSession();
  initAuthListener();

  const appRoot = document.getElementById("app-root") || document.body;
  buildShell(appRoot);
  initRouter(onRouteChange);

  return { navigate };
}

if (typeof window !== "undefined") {
  initApp().catch((err) => {
    console.error("Failed to initialize app:", err);
    renderToast("Failed to initialize application", "error");
  });
}

export { navigate };
