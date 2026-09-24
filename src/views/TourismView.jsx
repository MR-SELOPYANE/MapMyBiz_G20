import { navigate } from "../router/index.js";
import { el } from "../utils/dom.js";

function TourismView() {
  const root = el("div", "mmp-tourism");
  root.innerHTML = `
    <header class="mmp-tourism-header" style="background:linear-gradient(135deg,#0A8791,#1a3b5d);color:#fff;padding:80px 20px;text-align:center;border-radius:0 0 32px 32px;margin-bottom:40px;">
      <h1>Discover Rural South Africa</h1>
      <p>Explore hidden gems, support local artisans, and experience authentic culture off the beaten path.</p>
      <a href="#/map" class="mmp-btn-map" data-go="/map" style="background:#FFC857;color:#1a3b5d;padding:16px 36px;border-radius:999px;font-weight:700;display:inline-block;">Open Smart Map</a>
    </header>
    <section style="max-width:1000px;margin:0 auto 60px;padding:0 20px;text-align:center;">
      <h2>Why Travel Local?</h2>
      <p>Map My Biz connects you directly with verified rural entrepreneurs. When you use our platform, your tourism spend reaches the communities that need it most.</p>
    </section>
  `;
  root.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (!go) return;
    e.preventDefault();
    navigate(go.getAttribute("data-go"));
  });
  return root;
}

export { TourismView };
export default TourismView;
