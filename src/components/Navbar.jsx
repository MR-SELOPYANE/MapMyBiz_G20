/**
 * Site header matching the original landing-page layout.
 */
import { navigate } from "../router/index.js";
import { getCurrentUser, subscribe, isAuthenticated, clearUser } from "../store/auth.store.js";
import { isAdminUser } from "../utils/roles.js";
import { signOut } from "../services/auth.service.js";
import { renderToast } from "./ToastContainer.jsx";

function loadGoogleTranslateOnce() {
  if (window.__mmbTranslateLoaded) return;
  window.__mmbTranslateLoaded = true;

  window.googleTranslateElementInit = function googleTranslateElementInit() {
    if (!window.google?.translate?.TranslateElement) return;
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: "af,zu,xh,st,tn,ss,ve,ts,en",
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false,
      },
      "google_translate_element",
    );

    const savedLang = localStorage.getItem("preferredLanguage");
    if (savedLang && savedLang !== "en") {
      setTimeout(() => {
        const select = document.querySelector(".goog-te-combo");
        if (select) {
          select.value = savedLang;
          select.dispatchEvent(new Event("change"));
        }
      }, 1000);
    }

    document.addEventListener("change", (e) => {
      if (e.target.classList.contains("goog-te-combo")) {
        localStorage.setItem("preferredLanguage", e.target.value);
      }
    });
  };

  const src = document.createElement("script");
  src.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  src.async = true;
  document.head.appendChild(src);
}

function Navbar() {
  const header = document.createElement("header");
  header.className = "header";
  header.setAttribute("role", "banner");

  const logoContainer = document.createElement("div");
  logoContainer.className = "logo-container";
  const logoLink = document.createElement("a");
  logoLink.href = "#/";
  logoLink.setAttribute("aria-label", "Map My Biz Home");
  logoLink.addEventListener("click", (e) => {
    e.preventDefault();
    navigate("/");
  });
  const logoImg = document.createElement("img");
  logoImg.src = "/assets/images/Lg.png";
  logoImg.alt = "Map My Biz";
  logoLink.appendChild(logoImg);
  logoContainer.appendChild(logoLink);

  const menuToggle = document.createElement("button");
  menuToggle.className = "menu-toggle";
  menuToggle.setAttribute("aria-label", "Toggle navigation menu");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.innerHTML = '<span class="menu-toggle-bar"></span><span class="menu-toggle-bar"></span><span class="menu-toggle-bar"></span>';
  menuToggle.style.webkitTapHighlightColor = "transparent";
  menuToggle.style.touchAction = "manipulation";
  menuToggle.addEventListener("click", () => {
    const expanded = header.classList.toggle("header-menu-open");
    menuToggle.setAttribute("aria-expanded", expanded);
  });
  menuToggle.addEventListener("touchstart", (e) => {
    e.stopPropagation();
  }, { passive: true });

  const nav = document.createElement("nav");
  nav.className = "nav-menu";
  nav.setAttribute("aria-label", "Main navigation");

  const links = [
    { path: "/", label: "Home" },
    { path: "/courses", label: "Courses" },
    { path: "/map", label: "Map" },
    { path: "/business", label: "Business" },
    { path: "/tourism", label: "Tourism" },
    { path: "/vr", label: "VR Training" },
    { path: "/jobs", label: "Jobs" },
  ];

  links.forEach((link) => {
    const a = document.createElement("a");
    a.href = `#${link.path}`;
    a.textContent = link.label;
    a.style.webkitTapHighlightColor = "transparent";
    a.style.touchAction = "manipulation";
    a.addEventListener("click", (e) => {
      e.preventDefault();
      header.classList.remove("header-menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
      navigate(link.path);
    });
    nav.appendChild(a);
  });

  const langSelector = document.createElement("div");
  langSelector.className = "language-selector";
  const googleTranslate = document.createElement("div");
  googleTranslate.id = "google_translate_element";
  langSelector.appendChild(googleTranslate);

  const authSlot = document.createElement("div");
  authSlot.className = "header-auth";

  /**
   * Keeps the session-aware nav links in sync: My dashboard for signed-in
   * users, Admin dashboard only for admins.
   *
   * @returns {void}
   */
  function syncAccountLinks() {
    nav.querySelectorAll("[data-account-link]").forEach((link) => link.remove());

    const user = getCurrentUser();
    if (!isAuthenticated()) return;

    // When signed in, replace the static "Home" link with "My Dashboard"
    // as the first nav item.
    const homeLink = nav.querySelector('a[href="#/"]');
    if (homeLink) homeLink.remove();

    const entries = [{ path: "/dashboard", label: "My Dashboard" }];
    if (isAdminUser(user)) entries.push({ path: "/admin", label: "Admin" });

    // Prepend in reverse so the final order is correct (My Dashboard first).
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      const a = document.createElement("a");
      a.href = `#${entry.path}`;
      a.textContent = entry.label;
      a.dataset.accountLink = "true";
      a.addEventListener("click", (e) => {
        e.preventDefault();
        header.classList.remove("header-menu-open");
        menuToggle.setAttribute("aria-expanded", "false");
        navigate(entry.path);
      });
      nav.insertBefore(a, nav.firstChild);
    }
  }

  /**
   * Renders the sign-in / sign-up buttons for signed-out visitors.
   *
   * @returns {HTMLElement}
   */
  function renderSignedOut() {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.gap = "12px";
    container.style.alignItems = "center";

    const signInBtn = document.createElement("a");
    signInBtn.href = "#/login";
    signInBtn.className = "cta-button";
    signInBtn.textContent = "Log In";
    signInBtn.style.webkitTapHighlightColor = "transparent";
    signInBtn.style.touchAction = "manipulation";
    signInBtn.addEventListener("click", (e) => {
      e.preventDefault();
      navigate("/login");
    });
    container.appendChild(signInBtn);

    const signUpBtn = document.createElement("a");
    signUpBtn.href = "#/signup";
    signUpBtn.className = "cta-button";
    signUpBtn.textContent = "Sign Up";
    signUpBtn.style.backgroundColor = "#ffb300";
    signUpBtn.style.webkitTapHighlightColor = "transparent";
    signUpBtn.style.touchAction = "manipulation";
    signUpBtn.addEventListener("click", (e) => {
      e.preventDefault();
      navigate("/signup");
    });
    container.appendChild(signUpBtn);

    return container;
  }

  /**
   * Renders the account menu for a signed-in Supabase user: name, links
   * to the profile / plans pages, and a sign-out button.
   *
   * @returns {HTMLElement}
   */
  function renderSignedIn(user) {
    const wrapper = document.createElement("div");
    wrapper.className = "mmb-account";

    const details = document.createElement("details");
    details.className = "mmb-account__menu";

    const summary = document.createElement("summary");
    summary.className = "mmb-account__summary";
    summary.title = user.email || "My account";
    summary.textContent = (user.fullName || user.email || "Account").slice(0, 22);
    details.appendChild(summary);

    const menu = document.createElement("div");
    menu.className = "mmb-account__dropdown";

    const entries = [
      { path: "/dashboard", label: "My dashboard" },
      { path: "/subscriptions", label: "Plans & subscription" },
      { path: "/profile", label: "My profile" },
    ];
    if (isAdminUser(user)) entries.push({ path: "/admin", label: "Admin dashboard" });

    entries.forEach((entry) => {
      const link = document.createElement("a");
      link.href = `#${entry.path}`;
      link.textContent = entry.label;
      link.addEventListener("click", (e) => {
        e.preventDefault();
        details.removeAttribute("open");
        navigate(entry.path);
      });
      menu.appendChild(link);
    });

    const signOutBtn = document.createElement("button");
    signOutBtn.type = "button";
    signOutBtn.className = "mmb-account__signout";
    signOutBtn.textContent = "Sign out";
    signOutBtn.addEventListener("click", async () => {
      signOutBtn.disabled = true;
      const { error } = await signOut();
      signOutBtn.disabled = false;
      if (error) {
        renderToast("Could not sign out. Please try again.", "error");
        return;
      }
      clearUser();
      renderToast("You have been signed out.", "success");
      navigate("/");
    });
    menu.appendChild(signOutBtn);

    details.appendChild(menu);
    wrapper.appendChild(details);
    return wrapper;
  }

  function renderAuth() {
    authSlot.innerHTML = "";
    const user = getCurrentUser();
    authSlot.appendChild(isAuthenticated() && user ? renderSignedIn(user) : renderSignedOut());
  }

  renderAuth();
  syncAccountLinks();
  const unsubscribe = subscribe(() => {
    renderAuth();
    syncAccountLinks();
  });
  header._cleanup = () => unsubscribe();

  header.appendChild(logoContainer);
  header.appendChild(menuToggle);
  header.appendChild(nav);
  header.appendChild(langSelector);
  header.appendChild(authSlot);

  loadGoogleTranslateOnce();
  return header;
}

export { Navbar };
export default Navbar;