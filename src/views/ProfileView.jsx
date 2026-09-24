import { updateUserProfile } from "../services/auth.service.js";
import { getCurrentUser, setUser, isAuthenticated } from "../store/auth.store.js";
import { navigate } from "../router/index.js";
import { renderToast } from "../components/ToastContainer.jsx";
import { el } from "../utils/dom.js";

function ProfileView() {
  const root = el("div", "mmp-auth-card");
  root.appendChild(el("h2", null, "Edit personal info"));

  if (!isAuthenticated()) {
    navigate("/login");
    root.appendChild(el("p", null, "Redirecting to login..."));
    return root;
  }

  const user = getCurrentUser() || {};
  const form = document.createElement("form");

  const nameGroup = el("div", "mmp-form-group");
  nameGroup.appendChild(el("label", null, "Full name"));
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = user.fullName || "";
  nameGroup.appendChild(nameInput);

  const phoneGroup = el("div", "mmp-form-group");
  phoneGroup.appendChild(el("label", null, "Phone"));
  const phoneInput = document.createElement("input");
  phoneInput.type = "tel";
  phoneInput.value = user.phone || "";
  phoneGroup.appendChild(phoneInput);

  form.appendChild(nameGroup);
  form.appendChild(phoneGroup);
  const submit = el("button", "mmp-submit-btn", "Save changes");
  submit.type = "submit";
  form.appendChild(submit);
  root.appendChild(form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submit.disabled = true;
    const { error } = await updateUserProfile({
      fullName: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
    });
    submit.disabled = false;
    if (error) {
      renderToast(error.message || "Could not update profile.", "error");
      return;
    }
    setUser({ ...user, fullName: nameInput.value.trim(), phone: phoneInput.value.trim() });
    renderToast("Profile updated.", "success");
  });

  return root;
}

export { ProfileView };
export default ProfileView;
