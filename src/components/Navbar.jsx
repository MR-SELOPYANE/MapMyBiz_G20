/**
 * Site header matching the original landing-page layout.
 */
import { navigate } from "../router/index.js";
import { getCurrentUser, subscribe, isAuthenticated } from "../store/auth.store.js";
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
    a.addEventListener("click", (e) => {
      e.preventDefault();
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

  function renderAuth() {
    authSlot.innerHTML = "";
    const user = getCurrentUser();

    if (!isAuthenticated()) {
      const login = document.createElement("a");
      login.href = "#/login";
      login.className = "cta-button";
      login.textContent = "Log In";
      login.addEventListener("click", (e) => {
        e.preventDefault();
        navigate("/login");
      });
      authSlot.appendChild(login);
      return;
    }

    const userProfile = document.createElement("div");
    userProfile.className = "user-profile";
    userProfile.setAttribute("role", "button");
    userProfile.tabIndex = 0;

    const userIcon = document.createElement("div");
    userIcon.className = "user-icon";
    userIcon.textContent = "👤";

    const userNameDisplay = document.createElement("span");
    userNameDisplay.id = "userNameDisplay";
    userNameDisplay.textContent = user?.fullName || user?.email || "Account";

    const dropdown = document.createElement("ul");
    dropdown.className = "dropdown";
    dropdown.style.display = "none";

    const items = [
      { label: "Dashboard", path: "/dashboard" },
      { label: "My businesses", path: "/my-business" },
      { label: "Edit personal info", path: "/update-info" },
    ];
    items.forEach((item) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${item.path}`;
      a.textContent = item.label;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        dropdown.style.display = "none";
        navigate(item.path);
      });
      li.appendChild(a);
      dropdown.appendChild(li);
    });

    const logoutLi = document.createElement("li");
    const logoutLink = document.createElement("a");
    logoutLink.href = "#";
    logoutLink.textContent = "Logout";
    logoutLink.addEventListener("click", async (e) => {
      e.preventDefault();
      dropdown.style.display = "none";
      if (!confirm("Are you sure you want to log out?")) return;
      const { error } = await signOut();
      if (error) {
        renderToast("Logout failed: " + error.message, "error");
      } else {
        renderToast("You have been logged out.", "success");
        navigate("/");
      }
    });
    logoutLi.appendChild(logoutLink);
    dropdown.appendChild(logoutLi);

    userProfile.appendChild(userIcon);
    userProfile.appendChild(userNameDisplay);
    userProfile.appendChild(dropdown);

    const toggle = () => {
      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    };
    userProfile.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle();
    });
    document.addEventListener("click", () => {
      dropdown.style.display = "none";
    });

    authSlot.appendChild(userProfile);
  }

  renderAuth();
  const unsubscribe = subscribe(renderAuth);
  header._cleanup = () => unsubscribe();

  header.appendChild(logoContainer);
  header.appendChild(nav);
  header.appendChild(langSelector);
  header.appendChild(authSlot);

  loadGoogleTranslateOnce();
  return header;
}

export { Navbar };
export default Navbar;
