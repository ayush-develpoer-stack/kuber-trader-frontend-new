document.addEventListener("DOMContentLoaded", async () => {
  const CFG = window.APP_CONFIG || {};
  const BASE = (CFG.API_BASE_URL || "").replace(/\/$/, "");
  const ENDPOINT = CFG.PRODUCTS_ENDPOINT;

  const track = document.getElementById("ktDealsTrack");
  const bar = document.getElementById("ktDealsBar");
  const btnPrev = document.querySelector(".kt-deals-prev");
  const btnNext = document.querySelector(".kt-deals-next");

  if (!track || !BASE || !ENDPOINT) return;

  const attrsOf = (item) => item?.attributes ?? item ?? {};

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function absoluteUrl(url) {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return `${BASE}${url}`;
    return `${BASE}/${url}`;
  }

  function getSingleMediaUrl(mediaItem) {
    if (!mediaItem) return "";

    if (typeof mediaItem === "string") return absoluteUrl(mediaItem);
    if (mediaItem.url) return absoluteUrl(mediaItem.url);
    if (mediaItem.attributes?.url) return absoluteUrl(mediaItem.attributes.url);

    return "";
  }

  function getImageUrls(attrs) {
    const mediaField =
      attrs.images ||
      attrs.image ||
      attrs.gallery ||
      attrs.photo ||
      attrs.img ||
      null;

    if (!mediaField) return [];

    let mediaList = [];

    if (Array.isArray(mediaField.data)) {
      mediaList = mediaField.data;
    } else if (mediaField.data) {
      mediaList = [mediaField.data];
    } else if (Array.isArray(mediaField)) {
      mediaList = mediaField;
    } else {
      mediaList = [mediaField];
    }

    return [...new Set(mediaList.map(getSingleMediaUrl).filter(Boolean))];
  }

  const cardHTML = (attrs) => {
    const name = attrs.name || attrs.title || "Product";
    const price = Number(attrs.price || 0);
    const unit = Number(attrs.unit || 1);

    const allImages = getImageUrls(attrs);
    const firstImg = allImages[0] || "https://via.placeholder.com/800x500?text=Chilli";
    const allImagesJSON = encodeURIComponent(JSON.stringify(allImages));

    return `
      <article class="kt-deal-card">
        <div class="kt-deal-imgwrap">
          <img class="kt-deal-img" src="${firstImg}" alt="${escapeHtml(name)}" loading="lazy">
        </div>

        <div class="kt-deal-name">${escapeHtml(name)}</div>

        <div class="kt-deal-price">
          From <span>₹${price}/${unit}kg</span>
        </div>

        <a class="kt-deal-btn" href="#"
           data-order="1"
           data-name="${escapeHtml(name)}"
           data-price="${price}"
           data-unit="${unit}"
           data-img="${firstImg}"
           data-images="${allImagesJSON}">
          ORDER NOW
        </a>
      </article>
    `;
  };

  let items = [];
  try {
    const res = await fetch(`${BASE}${ENDPOINT}`);
    const json = await res.json();
    items = Array.isArray(json?.data) ? json.data : [];
  } catch (e) {
    console.error("Deals fetch failed:", e);
    track.innerHTML = `<div style="padding:18px;color:#6b7280">Deals load failed.</div>`;
    return;
  }

  if (!items.length) {
    track.innerHTML = `<div style="padding:18px;color:#6b7280">No products found.</div>`;
    return;
  }

  track.innerHTML = items.map((i) => cardHTML(attrsOf(i))).join("");

  function updateBar() {
    if (!bar) return;
    const max = track.scrollWidth - track.clientWidth;
    const pct = max > 0 ? track.scrollLeft / max : 0;
    const w = Math.max(18, (track.clientWidth / track.scrollWidth) * 100);
    bar.style.width = `${w}%`;
    bar.style.transform = `translateX(${pct * (100 - w)}%)`;
  }

  function scrollByCards(dir) {
    const card = track.querySelector(".kt-deal-card");
    const step = card ? (card.getBoundingClientRect().width + 14) * 2 : 420;
    track.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  btnPrev?.addEventListener("click", () => scrollByCards(-1));
  btnNext?.addEventListener("click", () => scrollByCards(1));
  track.addEventListener("scroll", updateBar, { passive: true });
  window.addEventListener("resize", updateBar);

  updateBar();
});