import { signIn, signUp, resetPassword } from "../services/auth.service.js";
import { setUser } from "../store/auth.store.js";
import { renderToast } from "../components/ToastContainer.jsx";
import { navigate } from "../router/index.js";
import { el } from "../utils/dom.js";
import { validateSAId } from "../utils/validators.js";

function field(labelText, inputAttrs) {
  const group = el("div", "mmp-form-group");
  const id = inputAttrs.id;
  const label = el("label", null, labelText);
  label.setAttribute("for", id);
  const input = document.createElement("input");
  Object.assign(input, inputAttrs);
  group.appendChild(label);
  group.appendChild(input);
  return { group, input };
}

function LoginView(opts = {}) {
  const mode = opts.view === "signup" ? "signup" : opts.view === "forgot" ? "forgot" : "login";
  const root = el("div", "mmp-auth-card");

  const titles = { login: "Sign In", signup: "Create your account", forgot: "Reset password" };
  root.appendChild(el("h2", null, titles[mode]));

  const errorEl = el("div", "mmp-login-error");
  errorEl.style.display = "none";
  root.appendChild(errorEl);

  const form = document.createElement("form");
  let fullNameInput;
  let saIdInput;
  let confirmInput;
  let emailInput;
  let passwordInput;

  if (mode === "signup") {
    fullNameInput = field("Full name", { id: "mmp-full-name", type: "text", required: true, placeholder: "Thandi Nkosi" });
    form.appendChild(fullNameInput.group);
  }

  const emailField = field("Email", { id: "mmp-login-email", type: "email", required: true, placeholder: "you@example.com" });
  emailInput = emailField.input;
  form.appendChild(emailField.group);

  if (mode === "signup") {
    saIdInput = field("South African ID", { id: "mmp-sa-id", type: "text", required: true, maxlength: 13, placeholder: "13-digit ID" });
    form.appendChild(saIdInput.group);
  }

  if (mode !== "forgot") {
    const passwordField = field("Password", { id: "mmp-login-password", type: "password", required: true, placeholder: "At least 6 characters" });
    passwordInput = passwordField.input;
    form.appendChild(passwordField.group);
  }

  if (mode === "signup") {
    confirmInput = field("Confirm password", { id: "mmp-confirm-password", type: "password", required: true, placeholder: "Repeat password" });
    form.appendChild(confirmInput.group);
  }

  const submitBtn = el("button", "mmp-login-btn", mode === "login" ? "Sign In" : mode === "signup" ? "Create account" : "Send reset link");
  submitBtn.type = "submit";
  form.appendChild(submitBtn);
  root.appendChild(form);

  const footerDiv = el("div", "mmp-login-footer");
  if (mode === "login") {
    footerDiv.innerHTML = `<a href="#/signup" data-go="/signup">Create an account</a> · <a href="#/forgot" data-go="/forgot">Forgot password?</a>`;
  } else {
    footerDiv.innerHTML = `<a href="#/login" data-go="/login">Back to sign in</a>`;
  }
  footerDiv.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (!go) return;
    e.preventDefault();
    navigate(go.getAttribute("data-go"));
  });
  root.appendChild(footerDiv);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.style.display = "none";
    submitBtn.disabled = true;
    const email = emailInput.value.trim();

    try {
      if (mode === "forgot") {
        const { error } = await resetPassword(email, window.location.origin + "/#/login");
        if (error) throw error;
        renderToast("If that email exists, a reset link is on its way.", "success");
        navigate("/login");
        return;
      }

      if (mode === "signup") {
        const password = passwordInput.value;
        const confirm = confirmInput.input.value;
        if (password !== confirm) throw new Error("Passwords do not match.");
        const saId = saIdInput.input.value.trim();
        const idCheck = validateSAId(saId);
        if (!idCheck.valid) throw new Error(idCheck.message);
        const { data, error } = await signUp({
          email,
          password,
          fullName: fullNameInput.input.value.trim(),
          saId,
        });
        if (error) throw error;
        if (data?.user) {
          setUser({
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.user_metadata?.full_name || fullNameInput.input.value.trim(),
          });
        }
        renderToast("Account created. Check your email if confirmation is required.", "success");
        navigate("/dashboard");
        return;
      }

      const { data, error } = await signIn(email, passwordInput.value);
      if (error) throw error;
      const user = data?.user;
      if (user) {
        setUser({
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || "",
          phone: user.user_metadata?.phone || "",
          saId: user.user_metadata?.sa_id || "",
        });
      }
      renderToast("Welcome back.", "success");
      if (opts.onSuccess) opts.onSuccess(data);
      navigate("/dashboard");
    } catch (err) {
      const message = err?.message || "Something went wrong. Please try again.";
      errorEl.textContent = message;
      errorEl.style.display = "block";
      renderToast(message, "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  return root;
}

export { LoginView };
export default LoginView;
