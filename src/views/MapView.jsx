import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { navigate } from "../router/index.js";
import { el } from "../utils/dom.js";
import { getAllBusinesses } from "../services/business.service.js";
import { getTourismExperiences } from "../services/tourism.service.js";
import { waChatLink, bookingRequestMessage } from "../utils/wa-share.js";
import { formatZar, formatDuration, filterExperiences, TOURISM_ACTIVITIES } from "../data/tourism.js";

const STYLES = `
  .mmp-map-page { display: flex; flex-direction: column; min-height: calc(100vh - 220px); }
  .mmp-map-container { position: relative; flex: 1; height: calc(100vh - 220px); min-height: 520px; }
  #map { height: 100%; width: 100%; z-index: 1; }
  .mmp-map-panel { position: absolute; top: 12px; left: 12px; z-index: 1000; background: rgba(255,255,255,0.95); padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); width: 280px; text-align: left; }
  .mmp-map-panel select { width: 100%; padding: 10px; border: 1px solid #B8D8D8; border-radius: 8px; }
  .mmp-map-panel__note { font-size: 0.8rem; color: #475569; margin: 10px 0 0; line-height: 1.4; }
  .mmp-map-panel__link { display: inline-block; margin-top: 10px; font-size: 0.8rem; color: #0A8791; font-weight: 600; }
  .mmp-sidebar { position: absolute; top: 0; right: -420px; width: 380px; height: 100%; background: #fff; box-shadow: -4px 0 12px rgba(0,0,0,0.1); transition: right 0.3s ease; padding: 24px; overflow-y: auto; z-index: 1200; text-align: left; }
  .mmp-sidebar.open { right: 0; }
  .mmp-sidebar .close-btn { position: absolute; top: 16px; right: 16px; background: #f0f4f8; border: none; font-size: 24px; cursor: pointer; border-radius: 50%; width: 36px; height: 36px; }
  .mmp-back-btn { position: absolute; top: 12px; right: 12px; z-index: 1000; background: #fff; border: 1px solid #B8D8D8; border-radius: 8px; padding: 8px 16px; cursor: pointer; font-weight: 600; }
  .mmp-detail__media { border-radius: 12px; overflow: hidden; margin-bottom: 16px; background: #f1f5f9; aspect-ratio: 16 / 10; }
  .mmp-detail__media img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .mmp-detail__thumbs { display: flex; gap: 6px; margin-top: 6px; }
  .mmp-detail__thumbs img { width: 54px; height: 40px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid transparent; }
  .mmp-detail__thumbs img.active { border-color: #0A8791; }
  .mmp-detail__badges { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 12px; }
  .mmp-detail__badge { font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: #e0f2f1; color: #0A8791; }
  .mmp-detail__badge--verified { background: #dcfce7; color: #15803d; }
  .mmp-detail__price { font-size: 1.3rem; font-weight: 800; color: #1a3b5d; }
  .mmp-detail__rating { color: #ca8a04; font-weight: 700; }
  .mmp-detail__rows { margin: 16px 0; }
  .mmp-detail__row { display: flex; gap: 8px; font-size: 0.85rem; color: #334155; margin-bottom: 8px; line-height: 1.4; }
  .mmp-detail__row strong { color: #1a3b5d; }
  .mmp-detail__list { margin: 8px 0 16px; padding-left: 20px; font-size: 0.85rem; color: #334155; line-height: 1.5; }
  .mmp-detail__actions { display: flex; flex-wrap: wrap; gap: 8px; }
  @media (max-width: 768px) {
    .mmp-sidebar { width: 100%; right: -110%; }
    .mmp-map-panel { width: calc(100% - 24px); }
  }
`;

const SAMPLE_BUSINESSES = [
  { id: "s1", name: "Cape Town Restaurant", category: "food", lat: -33.9249, lng: 18.4241, description: "Seafood & wine.", location: "Cape Town" },
  { id: "s2", name: "Durban Craft Market", category: "crafts", lat: -29.8587, lng: 31.0218, description: "Handmade souvenirs.", location: "Durban" },
  { id: "s3", name: "Johannesburg Market", category: "shops", lat: -26.2041, lng: 28.0473, description: "Local shopping.", location: "Sandton" },
  { id: "s4", name: "Kruger Safari Lodge", category: "nature", lat: -24.0167, lng: 31.4858, description: "Safari tours.", location: "Kruger Park" },
  { id: "s5", name: "Pretoria Kitchen", category: "food", lat: -25.7479, lng: 28.2293, description: "Home-style meals.", location: "Pretoria" },
  { id: "s6", name: "Stellenbosch Winery", category: "food", lat: -33.9344, lng: 18.8602, description: "Wine tasting.", location: "Stellenbosch" },
];

/**
 * Returns whether a map point carries tourism experience fields.
 *
 * @param {Object} point - A business or experience record.
 * @returns {boolean}
 */
function isExperience(point) {
  return Boolean(point && (point.included || point.activity || point.availability));
}

/**
 * Creates a labelled detail row for the sidebar.
 *
 * @param {string} emoji - Leading emoji.
 * @param {string} label - Row label.
 * @param {string} value - Row value.
 * @returns {HTMLElement|null} The row, or null when the value is missing.
 */
function detailRow(emoji, label, value) {
  if (!value) return null;
  const row = el("div", "mmp-detail__row");
  const icon = el("span", null, emoji);
  const text = el("span");
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  text.appendChild(strong);
  text.appendChild(document.createTextNode(String(value)));
  row.appendChild(icon);
  row.appendChild(text);
  return row;
}

/**
 * Builds the sidebar content for a marker. Tourists get the full bookable
 * detail — photos, price, inclusions, availability, safety and a booking
 * action — while plain businesses get the original summary view.
 *
 * @param {Object} point - A business or experience record.
 * @returns {HTMLElement} The sidebar content element.
 */
function buildDetail(point = {}) {
  const content = el("div", "mmp-detail");

  const images = (Array.isArray(point.images) ? point.images : []).filter(Boolean);
  if (point.image) images.unshift(point.image);
  const uniqueImages = [...new Set(images.filter(Boolean))];

  if (uniqueImages.length) {
    const media = el("div", "mmp-detail__media");
    const main = document.createElement("img");
    main.src = uniqueImages[0];
    main.alt = point.name || "Listing photo";
    media.appendChild(main);

    if (uniqueImages.length > 1) {
      const thumbs = el("div", "mmp-detail__thumbs");
      uniqueImages.slice(0, 4).forEach((src, index) => {
        const thumb = document.createElement("img");
        thumb.src = src;
        thumb.alt = `${point.name || "Listing"} photo ${index + 1}`;
        thumb.className = index === 0 ? "active" : "";
        thumb.addEventListener("click", () => {
          main.src = src;
          thumbs.querySelectorAll("img").forEach((img) => img.classList.remove("active"));
          thumb.classList.add("active");
        });
        thumbs.appendChild(thumb);
      });
      media.appendChild(thumbs);
    }
    content.appendChild(media);
  }

  content.appendChild(el("h2", null, point.name || "Business"));

  const badges = el("div", "mmp-detail__badges");
  if (point.host) badges.appendChild(el("span", "mmp-detail__badge", `Hosted by ${point.host}`));
  if (point.activity) {
    const match = TOURISM_ACTIVITIES.find((item) => item.value === point.activity);
    badges.appendChild(el("span", "mmp-detail__badge", match ? `${match.emoji} ${match.label}` : point.activity));
  }
  if (point.province) badges.appendChild(el("span", "mmp-detail__badge", `📍 ${point.town ? `${point.town}, ` : ""}${point.province}`));
  if (point.verified) {
    const verified = el("span", "mmp-detail__badge mmp-detail__badge--verified", "✔ Verified host");
    verified.title = "Host ID and business registration confirmed";
    badges.appendChild(verified);
  }
  if (badges.children.length) content.appendChild(badges);

  if (Number(point.rating) > 0) {
    const rating = el("p", "mmp-detail__rating");
    const rounded = Math.round(Number(point.rating));
    rating.textContent =
      `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)} ${Number(point.rating).toFixed(1)}` +
      (point.reviewsCount ? ` · ${point.reviewsCount} reviews` : "");
    content.appendChild(rating);
  }

  if (point.price) {
    const price = el("p", "mmp-detail__price");
    price.textContent = `${formatZar(point.price)}${point.priceUnit ? ` ${point.priceUnit}` : ""}`;
    content.appendChild(price);
  }

  if (point.description) content.appendChild(el("p", null, point.description));

  if (isExperience(point)) {
    const rows = el("div", "mmp-detail__rows");
    [
      ["⏱️", "Duration", point.durationHours ? formatDuration(point.durationHours) : ""],
      ["👥", "Group size", point.groupSizeMax ? `Up to ${point.groupSizeMax} people` : ""],
      ["🗓️", "Availability", point.availability],
      ["🚌", "Getting there", point.transport],
      ["📶", "Cell coverage", point.cellCoverage],
      ["🛡️", "Safety", point.safety],
      ["📍", "Location", point.location],
    ].forEach(([emoji, label, value]) => {
      const row = detailRow(emoji, label, value);
      if (row) rows.appendChild(row);
    });
    if (rows.children.length) content.appendChild(rows);
  } else {
    const rows = el("div", "mmp-detail__rows");
    [
      ["📍", "Location", point.location],
      ["🗂️", "Category", point.category],
    ].forEach(([emoji, label, value]) => {
      const row = detailRow(emoji, label, value);
      if (row) rows.appendChild(row);
    });
    if (rows.children.length) content.appendChild(rows);
  }

  if (Array.isArray(point.included) && point.included.length) {
    const list = el("div", null, "What's included");
    list.style.fontWeight = "700";
    content.appendChild(list);
    const items = document.createElement("ul");
    items.className = "mmp-detail__list";
    point.included.forEach((item) => items.appendChild(el("li", null, item)));
    content.appendChild(items);
  }

  if (point.reviewSnippet) {
    const review = el("p", null, `“${point.reviewSnippet}”`);
    review.style.fontStyle = "italic";
    content.appendChild(review);
    if (point.reviewAuthor) content.appendChild(el("p", null, `— ${point.reviewAuthor}`));
  }

  const actions = el("div", "mmp-detail__actions");
  const digits = String(point.whatsapp || point.phone || "").replace(/[^\d]/g, "");

  if (isExperience(point)) {
    const bookBtn = el("button", "mmp-tourism-btn mmp-tourism-btn--primary", "Book now");
    bookBtn.type = "button";
    bookBtn.addEventListener("click", () => {
      const date = window.prompt(`Which date would you like to book "${point.name}" for?`, "");
      if (date === null) return;
      const guests = window.prompt("How many guests?", "2");
      if (guests === null) return;
      if (!digits) {
        window.alert("This host has not added a WhatsApp number yet.");
        return;
      }
      window.open(
        waChatLink(digits, bookingRequestMessage(point, { date: date.trim(), guests: guests.trim() })),
        "_blank",
        "noopener,noreferrer",
      );
    });
    actions.appendChild(bookBtn);
  }

  if (digits) {
    const waLink = el("a", "mmp-tourism-btn mmp-tourism-btn--whatsapp", "💬 WhatsApp");
    waLink.href = waChatLink(digits, `Hi, I found "${point.name}" on Map My Biz.`);
    waLink.target = "_blank";
    waLink.rel = "noopener noreferrer";
    actions.appendChild(waLink);
  }

  if (point.email) {
    const mail = el("a", "mmp-tourism-btn mmp-tourism-btn--ghost", "✉️ Email");
    mail.href = `mailto:${point.email}`;
    actions.appendChild(mail);
  }

  if (actions.children.length) content.appendChild(actions);
  return content;
}

function MapView({ query = {} } = {}) {
  if (!document.getElementById("mmp-map-styles")) {
    const s = document.createElement("style");
    s.id = "mmp-map-styles";
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  const root = el("div", "mmp-map-page");
  const container = el("main", "mmp-map-container");
  const mapDiv = el("div");
  mapDiv.id = "map";
  container.appendChild(mapDiv);

  const panel = el("div", "mmp-map-panel");
  panel.innerHTML = `<label for="categoryFilter">Explore by Category</label>`;
  const select = el("select");
  select.id = "categoryFilter";
  [
    ["all", "All Businesses"],
    ["food", "Food & Eats"],
    ["crafts", "Crafts & Artisans"],
    ["shops", "Local Shops"],
    ["nature", "Nature & Outdoors"],
    ["services", "Services"],
    ["tourism", "Tourism"],
    ["retail", "Retail"],
  ].forEach(([value, label]) => {
    const o = document.createElement("option");
    o.value = value;
    o.textContent = label;
    if (value === (query.category || "all")) o.selected = true;
    select.appendChild(o);
  });
  panel.appendChild(select);

  const note = el(
    "p",
    "mmp-map-panel__note",
    query.category === "tourism"
      ? "Showing bookable rural experiences. Tap a pin for photos, price, availability and booking."
      : "Tap a pin for photos, prices and contact details.",
  );
  panel.appendChild(note);

  const backToTourism = el("a", "mmp-map-panel__link", "← Back to rural experiences");
  backToTourism.href = "#/tourism";
  backToTourism.setAttribute("data-go", "/tourism");
  panel.appendChild(backToTourism);
  panel.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (!go) return;
    e.preventDefault();
    navigate(go.getAttribute("data-go"));
  });

  container.appendChild(panel);

  const sidebar = el("div", "mmp-sidebar");
  const closeBtn = el("button", "close-btn", "×");
  closeBtn.addEventListener("click", () => sidebar.classList.remove("open"));
  const sidebarContent = el("div");
  sidebar.appendChild(closeBtn);
  sidebar.appendChild(sidebarContent);
  container.appendChild(sidebar);

  const backBtn = el("button", "mmp-back-btn", "← Back");
  backBtn.addEventListener("click", () => {
    if (window.history.length > 1) window.history.back();
    else navigate("/");
  });
  container.appendChild(backBtn);
  root.appendChild(container);

  requestAnimationFrame(() => initMap(mapDiv, select, sidebar, sidebarContent, query));
  return root;
}

async function initMap(mapDiv, select, sidebar, sidebarContent, query = {}) {
  if (!mapDiv.isConnected) return;
  if (mapDiv._leaflet_id) {
    mapDiv._leaflet_id = undefined;
    mapDiv.innerHTML = "";
  }

  const map = L.map(mapDiv, {
    center: [-30.5595, 22.9375],
    zoom: 6,
    minZoom: 4,
    maxZoom: 14,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  setTimeout(() => map.invalidateSize(), 200);

  /**
   * Opens the detail sidebar for a map point.
   *
   * @param {Object} point - The business or experience behind the marker.
   * @returns {void}
   */
  const openSidebar = (point) => {
    sidebarContent.innerHTML = "";
    sidebarContent.appendChild(buildDetail(point));
    sidebar.classList.add("open");
  };

  let points = [];

  if (query.category === "tourism") {
    try {
      const { data } = await getTourismExperiences();
      const filters = {
        search: query.q || "",
        province: query.province || "",
        activity: query.activity || "",
      };
      points = filterExperiences(data || [], filters).filter(
        (experience) => experience.lat != null && experience.lng != null,
      );
    } catch (err) {
      console.warn("Tourism data unavailable, showing sample experiences:", err);
      points = [];
    }
  } else {
    try {
      const { data } = await getAllBusinesses();
      const businesses = (data || []).filter((b) => b.lat != null && b.lng != null);
      points = businesses.length ? businesses : SAMPLE_BUSINESSES;
    } catch (err) {
      console.warn("Map data unavailable, showing sample businesses:", err);
      points = SAMPLE_BUSINESSES;
    }
  }

  if (!points.length) {
    sidebarContent.innerHTML = "";
    sidebarContent.appendChild(
      el(
        "p",
        null,
        query.category === "tourism"
          ? "No experiences match that search yet. Try clearing the filters on the tourism page."
          : "No businesses to show yet.",
      ),
    );
    sidebar.classList.add("open");
  }

  const markerLayers = {};
  points.forEach((point) => {
    const marker = L.marker([point.lat, point.lng]).on("click", () => openSidebar(point));
    markerLayers[point.id] = { marker, data: point };
    marker.addTo(map);
  });

  select.addEventListener("change", (e) => {
    const val = e.target.value;
    Object.values(markerLayers).forEach(({ marker, data: point }) => {
      const show = val === "all" || point.category === val;
      if (show && !map.hasLayer(marker)) marker.addTo(map);
      if (!show && map.hasLayer(marker)) map.removeLayer(marker);
    });
  });
}

export { MapView };
export default MapView;
