document.addEventListener("DOMContentLoaded", async () => {
  const CFG = window.APP_CONFIG || {};
  const BASE = (CFG.API_BASE_URL || "").replace(/\/$/, "");
  const ENDPOINT = CFG.GALLERY_ENDPOINT || "/api/gallery-items?populate=*";

  const galleryGrid = document.getElementById("ktGalleryGrid");
  if (!galleryGrid) return;

  const fullUrl = (u) => {
    if (!u) return "";
    return u.startsWith("http") ? u : `${BASE}${u}`;
  };

  function escapeHtml(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getImageUrl(item) {
    if (item?.image?.url) return item.image.url;
    if (item?.image?.data?.attributes?.url) return item.image.data.attributes.url;
    if (item?.image?.data?.url) return item.image.data.url;
    return "";
  }

  function revealGalleryItems() {
    const revealEls = document.querySelectorAll(".kt-reveal");

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("kt-show");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealEls.forEach((el) => io.observe(el));
  }

  try {
    const res = await fetch(`${BASE}${ENDPOINT}`);
    if (!res.ok) throw new Error(`Gallery API failed: ${res.status}`);

    const json = await res.json();
    const rows = Array.isArray(json?.data) ? json.data : [];

    galleryGrid.innerHTML = "";

    if (!rows.length) {
      galleryGrid.innerHTML = `<p style="color:red;">Gallery data load nahi hua.</p>`;
      return;
    }

    rows.forEach((row) => {
      const item = row?.attributes || row;

      const title = escapeHtml(item?.title || "Gallery Item");
      const description = escapeHtml(item?.description || "");
      const imageUrl = fullUrl(getImageUrl(item));

      galleryGrid.insertAdjacentHTML("beforeend", `
        <figure class="kt-gItem kt-reveal">
          <img src="${imageUrl}" alt="${title}" loading="lazy">

          <figcaption class="kt-gItem__caption">
            <h3 class="kt-gItem__title">${title}</h3>
            <p class="kt-gItem__desc">${description}</p>
          </figcaption>
        </figure>
      `);
    });

    revealGalleryItems();
  } catch (error) {
    console.error("Gallery load error:", error);
    galleryGrid.innerHTML = `<p style="color:red;">Gallery data load nahi hua.</p>`;
  }
});