/**
 * Legal Modal component - returns DOM element.
 */

const TERMS_CONTENT = `
<section>
  <h3>1. Introduction</h3>
  <p>Welcome to Map My Biz. By accessing or using our website, learning platform, or services, you agree to comply with these Terms and Conditions. If you do not agree, please do not use our services.</p>
  <h3>2. Purpose of Map My Biz</h3>
  <ul>
    <li>Provides accredited learning modules to aspiring entrepreneurs through kiosks.</li>
    <li>Showcases certified businesses on a smart map for tourists.</li>
    <li>Enables tourists to discover, support, and donate to rural businesses.</li>
  </ul>
  <h3>3. Use of Services</h3>
  <ul>
    <li>Entrepreneurs must register truthfully and complete modules to be listed.</li>
    <li>Businesses listed on the smart map are responsible for the accuracy of their information.</li>
    <li>Tourists use the website at their own discretion when engaging with businesses or making donations.</li>
  </ul>
  <h3>4. Donations and Payments</h3>
  <ul>
    <li>Donations made through Map My Biz go directly to the chosen business.</li>
    <li>Map My Biz does not guarantee the use of donations once received by businesses.</li>
    <li>Map My Biz is not liable for disputes between donors and entrepreneurs.</li>
  </ul>
  <h3>5. Intellectual Property</h3>
  <p>All content on the Map My Biz platform — including text, design, software, and logos — is owned by or licensed to Map My Biz. Users may not copy, modify, or distribute materials without permission.</p>
  <h3>6. Limitation of Liability</h3>
  <ul>
    <li>Map My Biz provides services "as is."</li>
    <li>We are not liable for business performance, tourist experiences, or third-party interactions.</li>
    <li>We are not responsible for technical issues beyond our control.</li>
  </ul>
  <h3>7. Changes to Terms</h3>
  <p>We may update these Terms at any time. Continued use of the platform means acceptance of the revised Terms.</p>
</section>
`;

const PRIVACY_CONTENT = `
<section>
  <h3>1. Introduction</h3>
  <p>Map My Biz respects your privacy and is committed to protecting your personal information.</p>
  <h3>2. Information We Collect</h3>
  <ul>
    <li><strong>Entrepreneurs:</strong> Name, contact details, business information, learning progress.</li>
    <li><strong>Tourists/Users:</strong> Basic browsing data, voluntary donations, and booking interactions.</li>
    <li><strong>Kiosk Data:</strong> Learning results stored locally, then securely backed up.</li>
  </ul>
  <h3>3. How We Use Your Information</h3>
  <ul>
    <li>To deliver learning modules and track progress.</li>
    <li>To verify businesses before listing them on the smart map.</li>
    <li>To process donations and display business information to tourists.</li>
    <li>To improve our platform and ensure accessibility.</li>
  </ul>
  <h3>4. Sharing of Information</h3>
  <ul>
    <li>We do not sell or trade personal information.</li>
    <li>Business information (e.g., location, description, images) will be publicly visible on the smart map.</li>
    <li>Donation transactions are processed securely through third-party providers.</li>
  </ul>
  <h3>5. Data Security</h3>
  <ul>
    <li>Data collected at kiosks is encrypted and backed up regularly.</li>
    <li>We take reasonable steps to protect personal data, but no system is completely secure.</li>
  </ul>
  <h3>6. User Rights</h3>
  <ul>
    <li>Access and correct your personal data.</li>
    <li>Request removal of your information from our platform.</li>
    <li>Opt out of marketing communication.</li>
  </ul>
  <h3>7. Changes to This Policy</h3>
  <p>We may update this Privacy Policy from time to time. Updates will be posted on our website.</p>
</section>
`;

const POPIA_CONTENT = `
<section>
  <h3>POPIA Compliance (South Africa)</h3>
  <p>The Protection of Personal Information Act (POPIA) gives you rights over your personal data.</p>
  <ul>
    <li><strong>Right to Access:</strong> Request what data we hold.</li>
    <li><strong>Right to Correction:</strong> Update inaccurate information.</li>
    <li><strong>Right to Deletion:</strong> Ask us to delete your data.</li>
    <li><strong>Right to Object:</strong> Opt out of direct marketing.</li>
  </ul>
  <p>Contact us at support@mapmybiz.co.za to exercise these rights.</p>
</section>
`;

const TABS = [
  { id: "terms", label: "Terms & Conditions", content: TERMS_CONTENT },
  { id: "privacy", label: "Privacy Policy", content: PRIVACY_CONTENT },
  { id: "popia", label: "POPIA Compliance", content: POPIA_CONTENT },
];

function LegalModal() {
  const modal = document.createElement("div");
  modal.id = "legalModal";
  modal.className = "modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "modal-title");
  modal.style.display = "none";

  let activeTab = "terms";
  let agreed = false;
  let scrolledToBottom = false;
  let modalBodyEl = null;
  let acceptBtn = null;
  let agreeCheckbox = null;

  function showTab(tabName) {
    activeTab = tabName;
    // Update tab buttons
    modal.querySelectorAll(".tab-btn").forEach(btn => {
      const isActive = btn.dataset.tab === tabName;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive);
    });
    // Update tab panels
    modal.querySelectorAll(".modal-body").forEach(content => {
      const isActive = content.id === `tab-${tabName}`;
      content.hidden = !isActive;
      if (isActive) {
        modalBodyEl = content;
        content.scrollTop = 0;
      }
    });
    scrolledToBottom = false;
    checkScrollEligibility();
    enableAcceptIfEligible();
  }

  function checkScrollEligibility() {
    const body = modalBodyEl;
    if (!body) return;
    const atBottom = body.scrollHeight <= body.clientHeight ||
      (body.scrollHeight - body.scrollTop <= body.clientHeight + 5);
    scrolledToBottom = atBottom;
  }

  function enableAcceptIfEligible() {
    if (acceptBtn && agreeCheckbox) {
      acceptBtn.disabled = !(agreed && scrolledToBottom);
    }
  }

  function openModal(tabName = "terms") {
    showTab(tabName);
    agreed = false;
    if (agreeCheckbox) agreeCheckbox.checked = false;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    enableAcceptIfEligible();
  }

  function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }

  function handleAccept() {
    closeModal();
  }

  // Build modal content
  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.setAttribute("aria-label", "Close legal modal");
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", closeModal);

  const header = document.createElement("h2");
  header.id = "modal-title";
  header.className = "modal-header";
  header.textContent = "Legal Information";

  // Tab buttons
  const tabList = document.createElement("div");
  tabList.className = "modal-tabs";
  tabList.setAttribute("role", "tablist");
  tabList.setAttribute("aria-label", "Legal document sections");

  TABS.forEach(tab => {
    const btn = document.createElement("button");
    btn.className = `tab-btn ${tab.id === activeTab ? "active" : ""}`;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", tab.id === activeTab);
    btn.setAttribute("aria-controls", `tab-${tab.id}`);
    btn.id = `tab-btn-${tab.id}`;
    btn.dataset.tab = tab.id;
    btn.textContent = tab.label;
    btn.addEventListener("click", () => showTab(tab.id));
    tabList.appendChild(btn);
  });

  // Tab panels
  TABS.forEach(tab => {
    const panel = document.createElement("div");
    panel.className = "modal-body";
    panel.role = "tabpanel";
    panel.id = `tab-${tab.id}`;
    panel.setAttribute("aria-labelledby", `tab-btn-${tab.id}`);
    if (tab.id !== activeTab) panel.hidden = true;
    panel.innerHTML = tab.content;
    panel.addEventListener("scroll", checkScrollEligibility);
    modalContent.appendChild(panel);
    if (tab.id === activeTab) modalBodyEl = panel;
  });

  // Footer
  const footer = document.createElement("div");
  footer.className = "modal-footer";

  const label = document.createElement("label");
  label.className = "agree-label";

  agreeCheckbox = document.createElement("input");
  agreeCheckbox.type = "checkbox";
  agreeCheckbox.id = "agreeCheckbox";
  agreeCheckbox.setAttribute("aria-describedby", "agree-desc");
  agreeCheckbox.addEventListener("change", () => {
    agreed = agreeCheckbox.checked;
    enableAcceptIfEligible();
  });

  const agreeDesc = document.createElement("span");
  agreeDesc.id = "agree-desc";
  agreeDesc.innerHTML = 'I have read and agree to the <strong>Terms & Conditions</strong>, <strong>Privacy Policy</strong>, and <strong>POPIA Compliance</strong>.';

  label.appendChild(agreeCheckbox);
  label.appendChild(agreeDesc);

  acceptBtn = document.createElement("button");
  acceptBtn.id = "acceptLegalBtn";
  acceptBtn.className = "btn btn-primary";
  acceptBtn.disabled = true;
  acceptBtn.setAttribute("aria-describedby", "agree-desc");
  acceptBtn.textContent = "Accept & Continue";
  acceptBtn.addEventListener("click", handleAccept);

  footer.appendChild(label);
  footer.appendChild(acceptBtn);

  // Assemble
  modalContent.appendChild(closeBtn);
  modalContent.appendChild(header);
  modalContent.appendChild(tabList);
  modalContent.appendChild(footer);

  modal.appendChild(modalContent);

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Keyboard trap
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      return;
    }
    if (e.key === "Tab") {
      const focusables = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  if (!window.__mmbLegalDelegation) {
    window.__mmbLegalDelegation = true;
    document.addEventListener("click", (e) => {
      const terms = e.target.closest("#openTerms");
      const privacy = e.target.closest("#openPrivacy");
      const popia = e.target.closest("#openPopia");
      if (!terms && !privacy && !popia) return;
      e.preventDefault();
      const live = document.getElementById("legalModal");
      if (!live?.openModal) return;
      if (terms) live.openModal("terms");
      else if (privacy) live.openModal("privacy");
      else live.openModal("popia");
    });
  }

  // Expose openModal for external use
  modal.openModal = openModal;

  return modal;
}

export { LegalModal };
export default LegalModal;