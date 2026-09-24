// ================== IMPORT & INIT ==================
import supabase from "../supabaseClient.js";

console.log("Supabase client loaded:", supabase);

// Total number of modules
const TOTAL_MODULES = 15;

// DOM Ready
document.addEventListener("DOMContentLoaded", async () => {
  // Get current user
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    // Redirect unauthenticated users
    const protectedPaths = ["dashboard.html", "mybusiness.html", "addBusiness.html"];
    if (protectedPaths.some(path => window.location.pathname.includes(path))) {
      window.location.href = "../index.html";
    }
  }

  const user = authData?.user;

  // =============== 1. LOGIN HANDLER ===============
  const loginForm = document.querySelector("#loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[type="email"]')?.value;
      const password = loginForm.querySelector('input[type="password"]')?.value;

      if (!email || !password) {
        alert("Please enter email and password.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert("Login failed: " + error.message);
      } else {
        window.location.href = "../PAGES/dashboard.html";
      }
    });
  }

// =============== FORGOT PASSWORD HANDLER ===============
const forgotPasswordForm = document.querySelector("#forgotPasswordForm");
const messageEl = document.getElementById("message");

if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    // Set correct redirect URL
    const redirectTo = window.location.hostname === "localhost"
      ? "http://127.0.0.1:5501/reset.html"
      : "https://mapbiz.netlify.app/reset.html  ";  // Remove spaces

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        messageEl.textContent = "Error: " + error.message;
        messageEl.style.color = "red";
      } else {
        messageEl.textContent = "Password reset link sent! Check your email.";
        messageEl.style.color = "green";
      }
    } catch (err) {
      messageEl.textContent = "An unexpected error occurred.";
      messageEl.style.color = "red";
    }
  });
}

// =============== RESET PASSWORD HANDLER ===============
const formEl = document.getElementById("resetPasswordForm");
const statusEl = document.getElementById("message");

// Only run on reset page
if (formEl && window.location.pathname.includes("reset.html")) {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    statusEl.textContent = "Invalid or expired reset link.";
    statusEl.style.color = "red";
    formEl.style.display = "none";
    return;
  }

  // Verify recovery token
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: "recovery"
  });

  if (verifyError) {
    statusEl.textContent = "Invalid or expired link: " + verifyError.message;
    statusEl.style.color = "red";
    formEl.style.display = "none";
    return;
  }

  statusEl.textContent = "Token verified — set a new password.";
  statusEl.style.color = "green";

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pwd = document.getElementById("newPassword").value.trim();

    if (pwd.length < 6) {
      statusEl.textContent = "Password must be at least 6 characters.";
      statusEl.style.color = "red";
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: pwd });

    if (error) {
      statusEl.textContent = "Error: " + error.message;
      statusEl.style.color = "red";
    } else {
      statusEl.textContent = "Password updated! Redirecting to login…";
      statusEl.style.color = "green";
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1000);
    }
  });
}

  // =============== 2. LOGOUT HANDLER ===============
  document.getElementById("logoutBtn")?.addEventListener("click", async (e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to log out?")) {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Sign out error:", error.message);
      window.location.href = "../index.html";
    }
  });

  // =============== 3. USER PROFILE & GREETING ===============
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("full_name, phone, email")
      .eq("id", user.id)
      .single();

    const displayName = profile?.full_name || user.email || user.phone || "users";
    const firstName = displayName.split(" ")[0];

    const greetingEl = document.querySelector(".greeting");
    if (greetingEl) {
      greetingEl.textContent = `WELCOME Back, ${firstName.toUpperCase()}!`;
    }

    const userNameDisplay = document.getElementById("userNameDisplay");
    if (userNameDisplay) {
      userNameDisplay.textContent = firstName;
    } else {
      console.warn("Element #userNameDisplay not found");
    }
  }

  // =============== 4. EDIT PROFILE ===============
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      alert("Please log in to edit your profile.");
      window.location.href = "../index.html";
      return;
    }

    // Fetch user profile from DB
    const { data: profile, error: dbError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (dbError) throw dbError;

    // Populate form fields
    if (profile) {
      document.getElementById("fullName").value = profile.full_name || "";
      document.getElementById("phoneNumber").value = profile.phone || "";
      document.getElementById("email").value = profile.email || "";
      document.getElementById("location").value = profile.location || ""; // optional field
      document.getElementById("saId").value = profile.sa_id || "";
    }

    // Optional: Set username in navbar
    document.getElementById("userNameDisplay").textContent = profile.full_name || "User";

  } catch (err) {
    console.error("Load error:", err);
    alert("Failed to load profile: " + err.message);
  }
});

// =============== 2. SAVE PROFILE ===============
document.getElementById("saveBtn")?.addEventListener("click", async () => {
  const name = document.getElementById("fullName").value.trim();
  const phone = document.getElementById("phoneNumber").value.trim();
  const email = document.getElementById("email").value.trim();
  const location = document.getElementById("location").value.trim();
  const saId = document.getElementById("saId").value.trim();

  if (!name || !phone || !email || !saId) {
    alert("Please fill in all required fields.");
    return;
  }

  // Validate SA ID (13 digits)
  if (!/^\d{13}$/.test(saId)) {
    alert("South African ID must be exactly 13 digits.");
    return;
  }

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to update your profile.");
      return;
    }

    // ✅ Step 1: Update Auth User
    const { error: authError } = await supabase.auth.updateUser({
      email,
      phone,
      data: {
        full_name: name,
        sa_id: saId,
      },
    });

    if (authError) {
      throw new Error("Auth update failed: " + authError.message);
    }

    // ✅ Step 2: Update user_profile table
    const { error: dbError } = await supabase
      .from("user_profile") // ✅ Correct table name
      .update({
        full_name: name,
        sa_id: saId,
        phone: phone,
        email: email,
        location: location, // ✅ Added location
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (dbError) {
      throw new Error("Profile update failed: " + dbError.message);
    }

    alert("✅ Your information has been updated!");
    window.location.href = "../PAGES/dashboard.html";

  } catch (err) {
    console.error("Update error:", err);
    alert("Error: " + err.message);
  }
});

// =============== 3. DELETE PROFILE ===============
document.getElementById("deleteBtn")?.addEventListener("click", async () => {
  if (!confirm("⚠️ Are you sure? This will PERMANENTLY delete your account and all data.")) {
    return;
  }

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("No user logged in.");
      return;
    }

    // ✅ Step 1: Delete from user_profile
    const { error: deleteProfileError } = await supabase
      .from("user_profile")
      .delete()
      .eq("id", user.id);

    if (deleteProfileError) {
      throw new Error("Failed to delete profile: " + deleteProfileError.message);
    }

    // ✅ Step 2: Sign out (client-safe — doesn't delete auth user)
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      throw new Error("Failed to sign out: " + signOutError.message);
    }

    alert("✅ Your profile has been deleted. You have been logged out.");
    window.location.href = "../index.html";

  } catch (err) {
    console.error("Delete error:", err);
    alert("Error: " + err.message);
  }
});
  // =============== 5. USER PROFILE DROPDOWN ===============
  const userProfile = document.getElementById("userProfile");
  const dropdownMenu = document.getElementById("dropdownMenu");
  if (userProfile && dropdownMenu) {
    userProfile.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
    });
    document.addEventListener("click", () => {
      dropdownMenu.style.display = "none";
    });
    dropdownMenu.addEventListener("click", (e) => e.stopPropagation());
  }

  // =============== 6. NAVIGATION BUTTONS ===============
  document.querySelector(".back-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    history.back();
  });

  document.querySelector(".next-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    alert("Loading next lesson...");
  });

  document.getElementById("nu1m")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "../PAGES/course.html";
  });

  document.querySelectorAll("[id^='num']").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const num = btn.id.replace("num", "");
      window.location.href = `../Modules/module${num}.html`;
    });
  });

  document.querySelector(".btn-bussiness")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "../PAGES/addBusiness.html";
  });

  document.querySelector(".btn-addt")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "../PAGES/registerBusiness.html";
  });
  document.querySelector(".btn-list")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "../PAGES/mybusiness.html";
  });

  document.querySelector(".btn-add")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "../PAGES/business.html";
  });

  // =============== 7. PASSWORD TOGGLE ===============
  document.querySelectorAll(".toggle-password").forEach((icon) => {
    icon.addEventListener("click", () => {
      const input = document.getElementById(icon.dataset.target);
      if (input) {
        input.type = input.type === "password" ? "text" : "password";
        icon.style.color = input.type === "text" ? "#2ec4b6" : "#888";
      }
    });
  });

  // =============== 8. COURSE FILTERING ===============
  const searchInput = document.querySelector(".search-bar input");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const clearBtn = document.querySelector(".clear-filters");
  const courses = document.querySelectorAll(".course-card");

  function filterCourses(level = "all") {
    const searchTerm = searchInput?.value.toLowerCase() || "";
    courses.forEach((course) => {
      const title = course.querySelector("h3")?.textContent.toLowerCase() || "";
      const courseLevel = course.dataset.level;
      course.style.display =
        (level === "all" || courseLevel === level) && title.includes(searchTerm)
          ? "block"
          : "none";
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filterCourses(btn.dataset.level);
    });
  });

  searchInput?.addEventListener("input", () => {
    const activeBtn = document.querySelector(".filter-btn.active");
    filterCourses(activeBtn ? activeBtn.dataset.level : "all");
  });

  clearBtn?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    filterButtons.forEach((b) => b.classList.remove("active"));
    document.querySelector('.filter-btn[data-level="all"]')?.classList.add("active");
    filterCourses("all");
  });

  filterCourses("all");

  // =============== 9. PROGRESS TRACKER ===============
  async function loadProgress() {
    if (!user) return [];
    const { data, error } = await supabase
      .from("user_progress")
      .select("module_id")
      .eq("user_id", user.id);
    if (error) {
      console.error("Error loading progress:", error.message);
      return [];
    }
    return data.map(row => row.module_id);
  }

  async function updateProgressUI() {
    const completed = await loadProgress();
    const completedCount = completed.length;
    const percentage = ((completedCount / TOTAL_MODULES) * 100).toFixed(2);

    const bar = document.getElementById("progressBar");
    const text = document.getElementById("progressText");
    if (bar) bar.style.width = `${percentage}%`;
    if (text) {
      text.innerHTML = `${percentage}%<br>${completedCount} of ${TOTAL_MODULES} modules completed`;
    }

    const continueLearning = document.querySelector('.metric-card h2 ~ p');
    if (continueLearning) {
      continueLearning.textContent = `${completedCount}/${TOTAL_MODULES}`;
    }

    const list = document.querySelector(".metric-card ul");
    if (list) {
      list.innerHTML = "";
      for (let i = 1; i <= TOTAL_MODULES; i++) {
        const moduleId = `Module ${i}`;
        const isCompleted = completed.includes(moduleId);
        const li = document.createElement("li");
        li.innerHTML = `<span class="checkmark">${isCompleted ? '✔' : '○'}</span> ${moduleId}`;
        list.appendChild(li);
      }
    }
  }

  if (window.location.pathname.includes("dashboard.html")) {
    await updateProgressUI();
  }

  window.markModuleAsCompleted = async function (moduleId) {
    const { error } = await supabase
      .from("user_progress")
      .insert(
        { user_id: user.id, module_id: moduleId },
        { onConflict: "user_id, module_id" }
      );
    if (error) {
      console.error("Failed to save progress:", error.message);
    } else {
      await updateProgressUI();
    }
  };

  window.saveLastModule = async function (moduleId) {
    localStorage.setItem("lastOpenedModule", moduleId);
  };

  // =============== 10. BUSINESS MANAGEMENT ===============
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function showMessage(text, type) {
    const msgEl = document.getElementById("message");
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = `message ${type}`;
    msgEl.style.display = "block";
  }

  // Load businesses
  async function loadBusinesses() {
    if (!user) return;
    const { data: businesses, error } = await supabase
      .from("user_businesses")
      .select("*")
      .eq("user_id", user.id);
    if (error) {
      console.error("Error loading businesses:", error.message);
      return;
    }

    const container = document.getElementById("businessList");
    const emptyState = document.getElementById("emptyState");

    if (businesses.length === 0) {
      if (emptyState) emptyState.style.display = "block";
      if (container) container.innerHTML = "";
      return;
    }

    if (emptyState) emptyState.style.display = "none";
    if (!container) return;

    container.innerHTML = "";
    businesses.forEach(biz => {
      const card = document.createElement("div");
      card.className = "business-card";
      card.innerHTML = `
        <h3>${escapeHtml(biz.name)}</h3>
        <p class="category">Category: ${escapeHtml(biz.category)}</p>
        <p><strong>Location:</strong> ${escapeHtml(biz.location)}</p>
        ${biz.phone ? `<p><strong>Phone:</strong> ${escapeHtml(biz.phone)}</p>` : ""}
        ${biz.email ? `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(biz.email)}">${escapeHtml(biz.email)}</a></p>` : ""}
        ${biz.description ? `<p><strong>About:</strong> ${escapeHtml(biz.description)}</p>` : ""}
        <div class="actions">
          <button class="btn-delete" data-id="${biz.id}">Delete</button>
        </div>
      `;
      container.appendChild(card);
    });

    document.querySelectorAll(".btn-delete").forEach(button => {
      button.addEventListener("click", async () => {
        const id = Number(button.getAttribute("data-id"));
        const { error } = await supabase
          .from("user_businesses")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);
        if (error) {
          alert("Delete failed: " + error.message);
        } else {
          loadBusinesses();
        }
      });
    });
  }

  if (window.location.pathname.includes("mybusiness.html")) {
    await loadBusinesses();
  }

  // Add new business
  const addBusinessForm = document.getElementById("businessForm");
  if (addBusinessForm) {
    addBusinessForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const category = document.getElementById("category").value;
      const location = document.getElementById("location").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const email = document.getElementById("email").value.trim();
      const description = document.getElementById("description").value.trim();

      if (!name || !category || !location) {
        showMessage("Please fill in all required fields.", "error");
        return;
      }

      const { error } = await supabase
        .from("user_businesses")
        .insert([{ user_id: user.id, name, category, location, phone, email, description }]);

      if (error) {
        showMessage("Failed to add business: " + error.message, "error");
      } else {
        showMessage("✅ Business added successfully!", "success");
        setTimeout(() => {
          window.location.href = "../PAGES/mybusiness.html";
        }, 1500);
      }
    });
  }

  // =============== 11. BUSINESS PLAN SELECTION ===============
  const planCards = document.querySelectorAll(".plan-card");
  const createButton = document.querySelector(".btn-bussiness");
  const manageButton = document.querySelector(".btn-list");

  if (planCards.length > 0 && user) {
    let selectedPlan = null;
    planCards.forEach(card => {
      const button = card.querySelector(".select-plan-btn");
      button?.addEventListener("click", function (e) {
        e.stopPropagation();
        planCards.forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        selectedPlan = card.dataset.plan;
      });
      card.addEventListener("click", () => {
        card.querySelector(".select-plan-btn")?.click();
      });
    });

    createButton?.addEventListener("click", () => {
      if (!selectedPlan) {
        alert("Please select a plan first!");
        return;
      }
      alert(`You selected the ${selectedPlan} plan. Redirecting to setup...`);
    });
  }
});
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("legalModal");
  const closeBtn = modal.querySelector(".close");
  const agreeCheckbox = document.getElementById("agreeCheckbox");
  const acceptBtn = document.getElementById("acceptLegalBtn");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const modalBody = document.querySelector(".modal-body");

  const openTerms = document.getElementById("openTerms");
  const openPrivacy = document.getElementById("openPrivacy");
  const openPopia = document.getElementById("openPopia");

  // Optional: enforce on signup pages that have #signupForm
  const signupForm = document.getElementById("signupForm");
  let pendingSubmit = false;

  /* ---------- Footer links open modal ---------- */
  if (openTerms) openTerms.addEventListener("click", e => { e.preventDefault(); openModal("terms"); });
  if (openPrivacy) openPrivacy.addEventListener("click", e => { e.preventDefault(); openModal("privacy"); });
  if (openPopia) openPopia.addEventListener("click", e => { e.preventDefault(); openModal("popia"); });

  /* ---------- Intercept signup submit (if present) ---------- */
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      // Only gate if not already accepted this submit
      if (!pendingSubmit) {
        e.preventDefault();
        pendingSubmit = true; // mark intent; we'll actually submit after Accept
        openModal("terms");
      }
    });
  }

  /* ---------- Modal controls ---------- */
  function openModal(tabName) {
    modal.style.display = "flex";
    acceptBtn.disabled = true;
    agreeCheckbox.checked = false;
    showTab(tabName || "terms");
    // If content doesn't scroll (short text), treat as already at bottom
    enableIfEligible();
  }

  function closeModal() {
    modal.style.display = "none";
  }

  function showTab(tabName) {
    tabButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabName));
    tabContents.forEach(content => {
      content.style.display = (content.id === `tab-${tabName}`) ? "block" : "none";
    });
    modalBody.scrollTop = 0;
    enableIfEligible();
  }

  tabButtons.forEach(btn => btn.addEventListener("click", () => showTab(btn.dataset.tab)));

  closeBtn.addEventListener("click", closeModal);
  window.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  /* ---------- Enable Accept: must be scrolled + checked ---------- */
  function atBottom(el) {
    // also returns true if content doesn't need scrolling
    return (el.scrollHeight <= el.clientHeight) ||
           (el.scrollHeight - el.scrollTop <= el.clientHeight + 5);
  }

  function enableIfEligible() {
    acceptBtn.disabled = !(agreeCheckbox.checked && atBottom(modalBody));
  }

  modalBody.addEventListener("scroll", enableIfEligible);
  agreeCheckbox.addEventListener("change", enableIfEligible);

  /* ---------- Accept behavior ---------- */
  acceptBtn.addEventListener("click", () => {
    if (acceptBtn.disabled) return;
    closeModal();
    // If we intercepted a signup submit, submit it now
    if (signupForm && pendingSubmit) {
      // slight delay to ensure modal closes smoothly
      setTimeout(() => { signupForm.submit(); pendingSubmit = false; }, 50);
    }
  });

});
document.getElementById("profileImage").addEventListener("change", function(e) {
  const file = e.target.files[0];
  const preview = document.getElementById("imagePreview");

  if (!file) {
    preview.innerHTML = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    preview.innerHTML = `<img src="${event.target.result}" alt="Profile Preview">`;
  };
  reader.readAsDataURL(file);
});
