import { navigate } from "../router/index.js";
import { el } from "../utils/dom.js";
import { TourismCard } from "../components/TourismCard.jsx";
import { TourismFilters, EMPTY_TOURISM_FILTERS } from "../components/TourismFilters.jsx";
import { ShareButton } from "../components/ShareButton.jsx";
import { renderToast } from "../components/ToastContainer.jsx";
import { getTourismExperiences, subscribeToTourismDigest } from "../services/tourism.service.js";
import { SAVED_TYPES, listSaved, clearSaved } from "../services/saved.service.js";
import {
  SAMPLE_EXPERIENCES,
  ITINERARIES,
  SAFETY_TIPS,
  TOURISM_VALUE_PROPS,
  formatZar,
  filterExperiences,
  buildMapLink,
  filtersFromQuery,
} from "../data/tourism.js";

/** Hero photos, pulled from the images already in the project. */
const HERO_IMAGES = [
  "/assets/images/Turismo-rural-foto-1.png",
  "/assets/images/Village-Tourism.jpg",
  "/assets/images/Cultural-Festivals-and-Events-Celebrating-Diversity-in-African-Travel.png",
  "/assets/images/Lesedi-entrance.jpg",
];

/**
 * Creates a section heading with an optional lead paragraph.
 *
 * @param {string} title - Section title.
 * @param {string} [lead] - Lead paragraph.
 * @returns {HTMLElement} The heading block.
 */
function sectionHeading(title, lead) {
  const block = el("div", "mmp-tourism-heading");
  block.appendChild(el("h2", null, title));
  if (lead) block.appendChild(el("p", "mmp-tourism-heading__lead", lead));
  return block;
}

/**
 * Renders the itineraries section — curated multi-stop packages that turn a
 * directory into a bookable product.
 *
 * @param {Object[]} experiences - Loaded experiences, used to resolve stops.
 * @returns {HTMLElement} The itineraries section.
 */
function buildItineraries(experiences) {
  const section = el("section", "mmp-tourism-section mmp-tourism-itineraries");
  section.appendChild(
    sectionHeading(
      "Curated rural itineraries",
      "Ready-made routes built from verified hosts, so you can book a whole weekend in one go instead of piecing it together yourself.",
    ),
  );

  const grid = el("div", "mmp-tourism-itinerary-grid");
  ITINERARIES.forEach((itinerary) => {
    const card = el("article", "mmp-tourism-itinerary");

    const media = el("div", "mmp-tourism-itinerary__media");
    const img = document.createElement("img");
    img.src = itinerary.image;
    img.alt = itinerary.title;
    img.loading = "lazy";
    media.appendChild(img);
    card.appendChild(media);

    const body = el("div", "mmp-tourism-itinerary__body");
    body.appendChild(el("h3", null, itinerary.title));
    body.appendChild(el("p", "mmp-tourism-itinerary__meta", `${itinerary.duration} · ${itinerary.province} · from ${formatZar(itinerary.priceFrom)}`));
    body.appendChild(el("p", "mmp-tourism-itinerary__summary", itinerary.summary));

    const stops = el("ol", "mmp-tourism-itinerary__stops");
    itinerary.stops.forEach((stop) => {
      const match = experiences.find((experience) => experience.id === stop.experienceId);
      const li = el("li");
      li.appendChild(el("span", "mmp-tourism-itinerary__day", stop.day));
      li.appendChild(
        el("span", "mmp-tourism-itinerary__stop", match ? `${stop.activity} — ${match.name}` : stop.activity),
      );
      stops.appendChild(li);
    });
    body.appendChild(stops);

    const actions = el("div", "mmp-tourism-itinerary__actions");
    const enquireBtn = el("button", "mmp-tourism-btn mmp-tourism-btn--primary", "Enquire about this route");
    enquireBtn.type = "button";
    enquireBtn.addEventListener("click", () => {
      const message = [
        `Hi Map My Biz, I'd like details on the "${itinerary.title}" itinerary (${itinerary.duration}, ${itinerary.province}).`,
        "",
        itinerary.stops
          .map((stop) => `• ${stop.day}: ${stop.activity}`)
          .join("\n"),
      ].join("\n");
      window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer",
      );
    });
    actions.appendChild(enquireBtn);
    body.appendChild(actions);

    card.appendChild(body);
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

/**
 * Renders the safety and logistics block.
 *
 * @returns {HTMLElement} The safety section.
 */
function buildSafety() {
  const section = el("section", "mmp-tourism-section mmp-tourism-safety");
  section.appendChild(
    sectionHeading(
      "Know before you go",
      "Rural travel is rewarding and it asks a little preparation. These are the questions travellers ask us most, answered up front.",
    ),
  );

  const grid = el("div", "mmp-tourism-safety-grid");
  SAFETY_TIPS.forEach((tip) => {
    const card = el("div", "mmp-tourism-safety-card");
    card.appendChild(el("span", "mmp-tourism-safety-card__emoji", tip.emoji));
    card.appendChild(el("h3", null, tip.title));
    card.appendChild(el("p", null, tip.body));
    grid.appendChild(card);
  });
  section.appendChild(grid);
  return section;
}

/**
 * Renders the weekly digest signup form.
 *
 * @returns {HTMLElement} The digest section.
 */
function buildDigest() {
  const section = el("section", "mmp-tourism-section mmp-tourism-digest");
  const inner = el("div", "mmp-tourism-digest__inner");

  inner.appendChild(el("h2", null, "One email a week. Nothing else."));
  inner.appendChild(
    el(
      "p",
      null,
      "New rural experiences, festival dates and last-minute openings, sent every Friday. No spam, and one click to leave.",
    ),
  );

  const form = el("form", "mmp-tourism-digest__form");
  const input = document.createElement("input");
  input.type = "email";
  input.required = true;
  input.placeholder = "you@example.com";
  input.setAttribute("aria-label", "Email address for the weekly digest");
  form.appendChild(input);

  const submit = el("button", "mmp-tourism-btn mmp-tourism-btn--primary", "Send me the digest");
  submit.type = "submit";
  form.appendChild(submit);

  const note = el("p", "mmp-tourism-digest__note");
  form.appendChild(note);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    const { saved, error, offline } = await subscribeToTourismDigest(input.value);
    submit.disabled = false;
    if (error) {
      renderToast(error.message, "error");
      return;
    }
    if (saved) {
      input.value = "";
      note.textContent = offline
        ? "Saved on this device — we'll sync it when you're back online."
        : "You're on the list. First digest lands on Friday.";
      renderToast("Welcome aboard — check your inbox on Friday.", "success");
    }
  });

  inner.appendChild(form);
  section.appendChild(inner);
  return section;
}

/**
 * Renders the supply-side call to action for guesthouses and tour operators.
 *
 * @returns {HTMLElement} The host section.
 */
function buildHostCta() {
  const section = el("section", "mmp-tourism-section mmp-tourism-host");
  const inner = el("div", "mmp-tourism-host__inner");

  inner.appendChild(el("h2", null, "Run a guesthouse, lodge, tour or craft workshop?"));
  inner.appendChild(
    el(
      "p",
      null,
      "List your experience once and every traveller on Map My Biz can find, shortlist and book you. Listings are reviewed by our team, so you keep a Verified badge that actually means something.",
    ),
  );

  const list = el("ul", "mmp-tourism-host__list");
  [
    "Free to list — no commission on bookings",
    "Your own WhatsApp number, so you keep the relationship",
    "Photography, availability and pricing on your own dashboard",
    "Boosted placement when you upgrade to Gold",
  ].forEach((item) => list.appendChild(el("li", null, `✔ ${item}`)));
  inner.appendChild(list);

  const actions = el("div", "mmp-tourism-host__actions");
  const listBtn = el("button", "mmp-tourism-btn mmp-tourism-btn--primary", "List your experience");
  listBtn.type = "button";
  listBtn.addEventListener("click", () => navigate("/add-business?category=tourism"));
  actions.appendChild(listBtn);

  const plansBtn = el("button", "mmp-tourism-btn mmp-tourism-btn--ghost", "See listing plans");
  plansBtn.type = "button";
  plansBtn.addEventListener("click", () => navigate("/subscriptions"));
  actions.appendChild(plansBtn);

  inner.appendChild(actions);
  section.appendChild(inner);
  return section;
}

/**
 * Creates the tourism view.
 *
 * @param {Object} [options={}] - View options supplied by the router.
 * @param {Object} [options.query] - Parsed query params, so `/tourism?province=…` pre-filters.
 * @returns {HTMLElement} The view element.
 */
function TourismView({ query = {} } = {}) {
  const root = el("div", "mmp-tourism");

  // --- Hero ---
  const header = el("header", "mmp-tourism-header");
  const heroInner = el("div", "mmp-tourism-header__inner");
  const heroCopy = el("div", "mmp-tourism-header__copy");
  heroCopy.appendChild(el("p", "mmp-tourism-header__eyebrow", "Rural experiences, verified hosts"));
  heroCopy.appendChild(el("h1", null, "Discover Rural South Africa"));
  heroCopy.appendChild(
    el(
      "p",
      null,
      "Hidden gems, host-run guesthouses, guided bush walks and village workshops — booked directly with the people who live there. Your tourism spend stays in the community.",
    ),
  );

  const heroActions = el("div", "mmp-tourism-header__actions");
  const exploreBtn = el("button", "mmp-tourism-btn mmp-tourism-btn--gold", "Browse experiences");
  exploreBtn.type = "button";
  exploreBtn.addEventListener("click", () => {
    document.getElementById("tourism-experiences")?.scrollIntoView({ behavior: "smooth" });
  });
  heroActions.appendChild(exploreBtn);

  const mapBtn = el("button", "mmp-tourism-btn mmp-tourism-btn--outline", "🗺️ Open Smart Map");
  mapBtn.type = "button";
  mapBtn.addEventListener("click", () => navigate(buildMapLink().replace(/^#/, "")));
  heroActions.appendChild(mapBtn);

  heroCopy.appendChild(heroActions);
  heroInner.appendChild(heroCopy);

  const gallery = el("div", "mmp-tourism-header__gallery");
  HERO_IMAGES.forEach((src, index) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = ["Rural tourism in South Africa", "Village tourism", "Cultural festivals and events", "Guest lodge entrance"][index];
    img.loading = index < 2 ? "eager" : "lazy";
    gallery.appendChild(img);
  });
  heroInner.appendChild(gallery);
  header.appendChild(heroInner);
  root.appendChild(header);

  // --- Why travel local ---
  const value = el("section", "mmp-tourism-section mmp-tourism-value");
  value.appendChild(
    sectionHeading(
      "Why travel local with Map My Biz?",
      "We connect you directly with verified rural entrepreneurs. When you book through the platform, up to 85% of what you pay reaches the host, guide and community suppliers before it reaches us.",
    ),
  );
  const valueGrid = el("div", "mmp-tourism-value-grid");
  TOURISM_VALUE_PROPS.forEach((prop) => {
    const card = el("div", "mmp-tourism-value-card");
    card.appendChild(el("span", "mmp-tourism-value-card__emoji", prop.emoji));
    card.appendChild(el("h3", null, prop.title));
    card.appendChild(el("p", null, prop.body));
    valueGrid.appendChild(card);
  });
  value.appendChild(valueGrid);
  root.appendChild(value);

  // --- Experiences ---
  const listings = el("section", "mmp-tourism-section mmp-tourism-listings");
  listings.id = "tourism-experiences";
  listings.appendChild(
    sectionHeading(
      "Bookable experiences",
      "Every host is ID-checked and business-registered. Book on WhatsApp — no app, no card, no commission.",
    ),
  );

  const filtersHost = el("div", "mmp-tourism-listings__filters");
  listings.appendChild(filtersHost);

  const summary = el("p", "mmp-tourism-listings__status", "Loading experiences…");
  listings.appendChild(summary);

  const grid = el("div", "mmp-tourism-grid");
  listings.appendChild(grid);
  root.appendChild(listings);

  // --- Filter state ---
  let experiences = SAMPLE_EXPERIENCES;
  let filters = { ...EMPTY_TOURISM_FILTERS, ...filtersFromQuery(query) };

  /**
   * Re-renders the filter bar, result summary and card grid.
   *
   * @returns {void}
   */
  const renderListings = () => {
    const results = filterExperiences(experiences, filters);

    filtersHost.innerHTML = "";
    filtersHost.appendChild(
      TourismFilters({
        filters,
        resultCount: results.length,
        onChange: (next) => {
          filters = next;
          renderListings();
        },
      }),
    );

    summary.textContent = results.length
      ? `${results.length} experience${results.length === 1 ? "" : "s"} ready to book`
      : "No experiences match those filters yet — try widening your search.";

    grid.innerHTML = "";
    if (results.length) {
      results.forEach((experience) => grid.appendChild(TourismCard(experience)));
    } else {
      const empty = el("div", "mmp-tourism-empty");
      empty.appendChild(el("h3", null, "Nothing matches that yet"));
      empty.appendChild(
        el(
          "p",
          null,
          "We are onboarding rural hosts every week. Clear your filters, or tell us what you are looking for and we will match you when it lands.",
        ),
      );
      const clearBtn = el("button", "mmp-tourism-btn mmp-tourism-btn--ghost", "Clear filters");
      clearBtn.type = "button";
      clearBtn.addEventListener("click", () => {
        filters = { ...EMPTY_TOURISM_FILTERS };
        renderListings();
      });
      empty.appendChild(clearBtn);
      grid.appendChild(empty);
    }
  };

  renderListings();

  // --- Saved trip ---
  // Rendered through a function so clearing the shortlist does not need a
  // page reload. The marker comment keeps the section pinned between the
  // listings and the itineraries.
  const savedMarker = document.createComment("saved-trip");
  root.appendChild(savedMarker);

  /**
   * Rebuilds the saved-trip section from the current shortlist.
   *
   * @returns {void}
   */
  const renderSavedTrip = () => {
    const previous = root.querySelector(".mmp-tourism-saved");
    if (previous) previous.remove();

    const saved = listSaved(SAVED_TYPES.EXPERIENCE);
    if (!saved.length) return;

    const savedSection = el("section", "mmp-tourism-section mmp-tourism-saved");
    savedSection.appendChild(
      sectionHeading(
        `Your saved trip (${saved.length})`,
        "Experiences you saved are kept on this device, so you can send them to family or pick them up again later.",
      ),
    );

    const list = el("ul", "mmp-tourism-saved__list");
    saved.forEach((item) => list.appendChild(el("li", null, `♥ ${item.title}`)));
    savedSection.appendChild(list);

    const actions = el("div", "mmp-tourism-saved__actions");
    actions.appendChild(
      ShareButton({
        message: `My Map My Biz rural trip: ${saved.map((item) => item.title).join(", ")} — have a look at these experiences.`,
        label: "Share my trip",
        ariaLabel: "Share your saved trip on WhatsApp",
      }),
    );

    const clearBtn = el("button", "mmp-tourism-btn mmp-tourism-btn--ghost", "Start a new shortlist");
    clearBtn.type = "button";
    clearBtn.addEventListener("click", () => {
      clearSaved(SAVED_TYPES.EXPERIENCE);
      renderSavedTrip();
    });
    actions.appendChild(clearBtn);

    savedSection.appendChild(actions);
    root.insertBefore(savedSection, savedMarker);
  };

  renderSavedTrip();
  // Capture phase: BookmarkButton stops propagation on its own click, so a
  // bubbling listener on the page root would never see the toggle.
  root.addEventListener(
    "click",
    (event) => {
      if (event.target.closest(".mmp-bookmark-btn")) setTimeout(renderSavedTrip, 0);
    },
    true,
  );

  root.appendChild(buildItineraries(experiences));
  root.appendChild(buildSafety());
  root.appendChild(buildHostCta());
  root.appendChild(buildDigest());

  // --- Load live listings ---
  getTourismExperiences()
    .then(({ data }) => {
      if (Array.isArray(data) && data.length) {
        experiences = data;
        renderListings();
      }
    })
    .catch(() => {
      /* Seed listings already rendered — nothing to recover. */
    });

  return root;
}

export { TourismView };
export default TourismView;
