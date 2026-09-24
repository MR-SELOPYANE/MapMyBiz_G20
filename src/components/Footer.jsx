function Footer() {
  const footer = document.createElement("footer");
  footer.setAttribute("role", "contentinfo");

  const container = document.createElement("div");
  container.className = "footer-container";

  container.innerHTML = `
    <div class="footer-section">
      <h4>About Map My Biz</h4>
      <p>Map My Biz connects communities, entrepreneurs, and tourists by showcasing local businesses and providing accredited learning opportunities.</p>
    </div>
    <div class="footer-section">
      <h4>Legal</h4>
      <a href="#/legal/terms" id="openTerms" class="footer-link">Terms &amp; Conditions</a>
      <br>
      <a href="#/legal/privacy" id="openPrivacy" class="footer-link">Privacy Policy</a>
      <br>
      <a href="#/legal/popia" id="openPopia" class="footer-link">POPIA Compliance</a>
    </div>
    <div class="footer-section">
      <h4>Contact</h4>
      <p>Email: <a href="mailto:support@mapmybiz.co.za">support@mapmybiz.co.za</a></p>
      <p>Phone: <a href="tel:+27111234567">+27 11 123 4567</a></p>
    </div>
  `;

  const bottomBar = document.createElement("div");
  bottomBar.className = "bottom-bar";
  bottomBar.innerHTML = `&copy; <span id="currentYear">${new Date().getFullYear()}</span> Map My Biz. All rights reserved.`;

  footer.appendChild(container);
  footer.appendChild(bottomBar);
  return footer;
}

export { Footer };
export default Footer;
