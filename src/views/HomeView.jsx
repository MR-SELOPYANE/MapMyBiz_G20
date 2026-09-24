import { navigate } from "../router/index.js";
import { el } from "../utils/dom.js";

function HomeView() {
  const root = el("div", "mmp-home");

  const hero = el("section", "hero-section");
  hero.innerHTML = `
    <div class="hero-content">
      <h1>Empowering Rural Entrepreneurs</h1>
      <p>Access mentorship, marketing tools, and practical learning — all in one place. Turn your dream into a thriving business.</p>
      <div class="hero-buttons">
        <a href="#/courses" class="btn-primary" data-go="/courses">Start Learning Free</a>
        <a href="#/tourism" class="btn-orange" data-go="/tourism">Join us as a tourist</a>
        <a href="#about" class="btn-secondary" data-scroll="about">Learn More</a>
      </div>
    </div>
  `;
  root.appendChild(hero);

  const about = el("section", "about-section");
  about.id = "about";
  about.innerHTML = `
    <h2>About Map My Biz</h2>
    <p>
      <span class="highlight">Map My Biz</span> is a revolutionary platform dedicated to transforming rural economies. We connect local entrepreneurs with essential <strong>marketing tools</strong>, <strong>mentorship</strong>, and <strong>learning resources</strong>, driving innovation and sustainable growth.
    </p>
    <p>
      With a focus on inclusivity and empowerment, we create pathways to prosperity for businesses and communities alike, ensuring no dream goes unsupported.
    </p>
  `;
  root.appendChild(about);

  const cards = el("div", "cards-container");
  cards.innerHTML = `
    <div class="card" id="mission">
      <h3>
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
          <path d="M2 17l10 5 10-5"></path>
          <path d="M2 12l10 5 10-5"></path>
        </svg>
        Our Mission
      </h3>
      <p>
        Empowering rural entrepreneurs through accessible mentorship, robust marketing support, and practical learning opportunities. We bridge the gap between local business minds and global markets.
      </p>
    </div>
    <div class="card" id="vision">
      <h3>
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
          <line x1="9" y1="9" x2="9.01" y2="9"></line>
          <line x1="15" y1="9" x2="15.01" y2="9"></line>
        </svg>
        Our Vision
      </h3>
      <p>
        To be the leading catalyst for sustainable economic growth in rural areas by nurturing entrepreneurship, sparking innovation, and building a thriving network of empowered business leaders.
      </p>
    </div>
  `;
  root.appendChild(cards);

  const cta = el("section", "cta-section");
  cta.innerHTML = `
    <h2>Ready to Grow Your Business?</h2>
    <p>
      Join thousands of rural entrepreneurs who are learning, growing, and succeeding with Map My Biz. No experience? No problem. We start with you — right where you are.
    </p>
    <a href="#/signup" class="cta-button" data-go="/signup">Join Free Today</a>
  `;
  root.appendChild(cta);

  root.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) {
      e.preventDefault();
      navigate(go.getAttribute("data-go"));
      return;
    }
    const scroll = e.target.closest("[data-scroll]");
    if (scroll) {
      e.preventDefault();
      document.getElementById(scroll.getAttribute("data-scroll"))?.scrollIntoView({ behavior: "smooth" });
    }
  });

  return root;
}

export { HomeView };
export default HomeView;
