import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { navigate } from "../router/index.js";
import { el } from "../utils/dom.js";
import { getAllBusinesses } from "../services/business.service.js";

const STYLES = `
  .mmp-map-page { display: flex; flex-direction: column; min-height: calc(100vh - 220px); }
  .mmp-map-container { position: relative; flex: 1; height: calc(100vh - 220px); min-height: 520px; }
  #map { height: 100%; width: 100%; z-index: 1; }
  .mmp-map-panel { position: absolute; top: 12px; left: 12px; z-index: 1000; background: rgba(255,255,255,0.95); padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); width: 280px; text-align: left; }
  .mmp-map-panel select { width: 100%; padding: 10px; border: 1px solid #B8D8D8; border-radius: 8px; }
  .mmp-sidebar { position: absolute; top: 0; right: -420px; width: 380px; height: 100%; background: #fff; box-shadow: -4px 0 12px rgba(0,0,0,0.1); transition: right 0.3s ease; padding: 24px; overflow-y: auto; z-index: 1200; text-align: left; }
  .mmp-sidebar.open { right: 0; }
  .mmp-sidebar .close-btn { position: absolute; top: 16px; right: 16px; background: #f0f4f8; border: none; font-size: 24px; cursor: pointer; border-radius: 50%; width: 36px; height: 36px; }
  .mmp-back-btn { position: absolute; top: 12px; right: 12px; z-index: 1000; background: #fff; border: 1px solid #B8D8D8; border-radius: 8px; padding: 8px 16px; cursor: pointer; font-weight: 600; }
`;

const SAMPLE_BUSINESSES = [
  { id: "s1", name: "Cape Town Restaurant", category: "food", lat: -33.9249, lng: 18.4241, description: "Seafood & wine.", location: "Cape Town" },
  { id: "s2", name: "Durban Craft Market", category: "crafts", lat: -29.8587, lng: 31.0218, description: "Handmade souvenirs.", location: "Durban" },
  { id: "s3", name: "Johannesburg Market", category: "shops", lat: -26.2041, lng: 28.0473, description: "Local shopping.", location: "Sandton" },
  { id: "s4", name: "Kruger Safari Lodge", category: "nature", lat: -24.0167, lng: 31.4858, description: "Safari tours.", location: "Kruger Park" },
  { id: "s5", name: "Pretoria Kitchen", category: "food", lat: -25.7479, lng: 28.2293, description: "Home-style meals.", location: "Pretoria" },
  { id: "s6", name: "Stellenbosch Winery", category: "food", lat: -33.9344, lng: 18.8602, description: "Wine tasting.", location: "Stellenbosch" },
];

function MapView() {
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
    select.appendChild(o);
  });
  panel.appendChild(select);
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

  requestAnimationFrame(() => initMap(mapDiv, select, sidebar, sidebarContent));
  return root;
}

async function initMap(mapDiv, select, sidebar, sidebarContent) {
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

  try {
    const { data } = await getAllBusinesses();
    const businesses = (data || []).filter((b) => b.lat != null && b.lng != null);
    const points = businesses.length ? businesses : SAMPLE_BUSINESSES;

    const markerLayers = {};
    points.forEach((biz) => {
      const marker = L.marker([biz.lat, biz.lng]).on("click", () => {
        sidebarContent.innerHTML = `
        <h2>${biz.name || "Business"}</h2>
        <p><strong>Location:</strong> ${biz.location || "N/A"}</p>
        <p>${biz.description || ""}</p>
        <p><strong>Category:</strong> ${biz.category || "N/A"}</p>
      `;
        sidebar.classList.add("open");
      });
      markerLayers[biz.id] = { marker, data: biz };
      marker.addTo(map);
    });

    select.addEventListener("change", (e) => {
      const val = e.target.value;
      Object.values(markerLayers).forEach(({ marker, data: biz }) => {
        const show = val === "all" || biz.category === val;
        if (show && !map.hasLayer(marker)) marker.addTo(map);
        if (!show && map.hasLayer(marker)) map.removeLayer(marker);
      });
    });
  } catch (err) {
    console.warn("Map data unavailable, showing sample businesses:", err);
    SAMPLE_BUSINESSES.forEach((biz) => {
      const marker = L.marker([biz.lat, biz.lng]).on("click", () => {
        sidebarContent.innerHTML = `
        <h2>${biz.name || "Business"}</h2>
        <p><strong>Location:</strong> ${biz.location || "N/A"}</p>
        <p>${biz.description || ""}</p>
        <p><strong>Category:</strong> ${biz.category || "N/A"}</p>
      `;
        sidebar.classList.add("open");
      });
      marker.addTo(map);
    });
  }
}

export { MapView };
export default MapView;
