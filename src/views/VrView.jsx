import { el } from "../utils/dom.js";
import { COURSES } from "../data/courses.js";
import { navigate } from "../router/index.js";

const STYLES = `
  .mmp-vr-page { font-family: inherit; color: #1a3b5d; }
  .mmp-vr-header { text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #0A8791, #1a3b5d); color: #fff; border-radius: 0 0 32px 32px; margin-bottom: 40px; }
  .mmp-vr-header h1 { font-size: 2.5rem; margin-bottom: 12px; font-weight: 700; }
  .mmp-vr-header p { font-size: 1.1rem; opacity: 0.9; }
  .mmp-vr-hero { max-width: 800px; margin: 0 auto 40px; text-align: center; padding: 0 20px; }
  .mmp-vr-hero img { max-width: 100%; border-radius: 16px; box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
  .mmp-vr-modules { max-width: 1200px; margin: 0 auto 60px; padding: 0 20px; }
  .mmp-vr-modules h2 { text-align: center; margin-bottom: 8px; }
  .mmp-vr-modules p.lead { text-align: center; color: #666; margin-bottom: 30px; }
  .mmp-vr-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
  .mmp-vr-card { background: #fff; border: 1px solid #B8D8D8; border-radius: 12px; padding: 24px; box-shadow: 0 4px 8px rgba(0,0,0,0.08); transition: transform 0.2s, border-color 0.2s; }
  .mmp-vr-card:hover { transform: translateY(-4px); border-color: #0A8791; }
  .mmp-vr-card h3 { margin: 0 0 12px; color: #1a3b5d; font-size: 1.2rem; }
  .mmp-vr-card p { color: #555; line-height: 1.5; margin-bottom: 16px; font-size: 0.9rem; }
  .mmp-vr-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; margin-bottom: 12px; }
  .mmp-vr-badge.beginner { background: #d4edda; color: #155724; }
  .mmp-vr-badge.intermediate { background: #fff3cd; color: #856404; }
  .mmp-vr-badge.advanced { background: #f8d7da; color: #721c24; }
  .mmp-vr-btn { display: inline-block; padding: 10px 24px; background: #FFC857; color: #1a3b5d; border: none; border-radius: 999px; font-weight: 700; cursor: pointer; text-decoration: none; }
  .mmp-vr-btn:hover { background: #e6b84a; }
`;

function VrView() {
  const styleId = "mmp-vr-styles";
  if (!document.getElementById(styleId)) {
    const s = document.createElement("style");
    s.id = styleId;
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  const root = el("div", "mmp-vr-page");

  const header = el("header", "mmp-vr-header");
  header.appendChild(el("h1", null, "VR Training"));
  header.appendChild(
    el(
      "p",
      null,
      "Practice customer service, stall layout, and pitching in a safe virtual environment."
    )
  );
  root.appendChild(header);

  const hero = el("section", "mmp-vr-hero");
  const img = document.createElement("img");
  img.src = "/assets/images/Vr.jpeg";
  img.alt = "VR training";
  hero.appendChild(img);
  root.appendChild(hero);

  const modules = el("section", "mmp-vr-modules");
  modules.innerHTML = "";
  modules.appendChild(el("h2", null, "Available Training Modules"));
  modules.appendChild(
    el(
      "p",
      "lead",
      "Select a module to enter the virtual training environment."
    )
  );

  const grid = el("div", "mmp-vr-grid");
  const vrModules = COURSES.slice(0, 6);
  vrModules.forEach((course) => {
    const card = el("article", "mmp-vr-card");
    const badge = el(
      "span",
      `mmp-vr-badge ${course.level}`,
      course.level.charAt(0).toUpperCase() + course.level.slice(1)
    );
    card.appendChild(badge);
    card.appendChild(el("h3", null, course.title));
    card.appendChild(el("p", null, course.summary));
    const btn = el("button", "mmp-vr-btn", "Enter VR Module");
    btn.addEventListener("click", () => {
      const canLaunch = confirm(
        `Launch "${course.title}" in VR Training mode?`
      );
      if (canLaunch) {
        navigate(`/module/${course.id}`);
      }
    });
    card.appendChild(btn);
    grid.appendChild(card);
  });
  modules.appendChild(grid);
  root.appendChild(modules);

  return root;
}

export { VrView };
export default VrView;
