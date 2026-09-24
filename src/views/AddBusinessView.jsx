import { addBusiness } from "../services/business.service.js";
import { BUSINESS_CATEGORIES } from "../utils/constants.js";
import { getCurrentUser, isAuthenticated } from "../store/auth.store.js";
import { navigate } from "../router/index.js";
import { renderToast } from "../components/ToastContainer.jsx";
import { el } from "../utils/dom.js";

function AddBusinessView() {
  const root = el("div", "mmp-auth-card");
  root.style.maxWidth = "560px";
  root.appendChild(el("h2", null, "Register a business"));

  if (!isAuthenticated()) {
    root.appendChild(el("p", null, "You need to sign in before listing a business."));
    const btn = el("button", "mmp-login-btn", "Go to login");
    btn.addEventListener("click", () => navigate("/login"));
    root.appendChild(btn);
    return root;
  }

  const form = document.createElement("form");
  const fields = [
    { id: "biz-name", label: "Business name", type: "text", required: true },
    { id: "biz-location", label: "Location / town", type: "text" },
    { id: "biz-phone", label: "Phone", type: "tel" },
    { id: "biz-email", label: "Email", type: "email" },
  ];
  const inputs = {};
  fields.forEach((f) => {
    const group = el("div", "mmp-form-group");
    group.appendChild(el("label", null, f.label));
    const input = document.createElement("input");
    input.id = f.id;
    input.type = f.type;
    input.required = Boolean(f.required);
    group.appendChild(input);
    form.appendChild(group);
    inputs[f.id] = input;
  });

  const catGroup = el("div", "mmp-form-group");
  catGroup.appendChild(el("label", null, "Category"));
  const select = document.createElement("select");
  BUSINESS_CATEGORIES.forEach((c) => {
    const o = document.createElement("option");
    o.value = c.value;
    o.textContent = `${c.emoji} ${c.label}`;
    select.appendChild(o);
  });
  catGroup.appendChild(select);
  form.appendChild(catGroup);

  const descGroup = el("div", "mmp-form-group");
  descGroup.appendChild(el("label", null, "Description"));
  const desc = document.createElement("textarea");
  descGroup.appendChild(desc);
  form.appendChild(descGroup);

  const submit = el("button", "mmp-submit-btn", "Save listing");
  submit.type = "submit";
  form.appendChild(submit);
  root.appendChild(form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submit.disabled = true;
    const user = getCurrentUser();
    const { error } = await addBusiness({
      name: inputs["biz-name"].value.trim(),
      location: inputs["biz-location"].value.trim(),
      phone: inputs["biz-phone"].value.trim(),
      email: inputs["biz-email"].value.trim(),
      category: select.value,
      description: desc.value.trim(),
      userId: user?.id,
    });
    submit.disabled = false;
    if (error) {
      renderToast(error.message || "Could not save the business.", "error");
      return;
    }
    renderToast("Business submitted for listing.", "success");
    navigate("/my-business");
  });

  return root;
}

export { AddBusinessView };
export default AddBusinessView;
