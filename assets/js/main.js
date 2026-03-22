// js/reveal.js
document.addEventListener("DOMContentLoaded", () => {
  const revealEls = document.querySelectorAll(".kt-reveal");
  if (!revealEls.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("kt-show");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18 });

  revealEls.forEach(el => io.observe(el));
});


document.addEventListener("DOMContentLoaded", async () => {
  const CFG = window.APP_CONFIG || {};
  const BASE = (CFG.API_BASE_URL || "").replace(/\/$/, "");
  const ENDPOINT = CFG.PRODUCTS_ENDPOINT || "";

  const grid = document.getElementById("ktShopGrid");
  const empty = document.getElementById("ktShopEmpty");

  const searchEl = document.getElementById("ktShopSearch");
  const sortEl = document.getElementById("ktShopSort");
  const featuredEl = document.getElementById("ktShopFeatured");

  if (!grid) return;

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

  // ✅ pick first non-empty value
  const pick = (...vals) => {
    for (const v of vals) {
      if (v === 0) return 0;
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return undefined;
  };

  // ✅ extract image url from many possible shapes
  const getImageUrl = (obj) => {
    // Strapi v4 media: images.data[0].attributes.url
    const strapiUrl =
      obj?.images?.data?.[0]?.attributes?.url ||
      obj?.image?.data?.attributes?.url ||
      obj?.photo?.data?.attributes?.url ||
      obj?.thumbnail?.data?.attributes?.url;

    // Strapi / custom: images[0].url OR image.url
    const plainUrl =
      obj?.images?.[0]?.url ||
      obj?.images?.[0] ||
      obj?.image?.url ||
      obj?.image ||
      obj?.photo?.url ||
      obj?.photo ||
      obj?.thumbnail?.url ||
      obj?.thumbnail;

    const url = strapiUrl || plainUrl || "";

    if (!url) return "https://via.placeholder.com/900x650?text=Chilli";
    return url.startsWith("http") ? url : `${BASE}${url}`;
  };

  // ✅ normalize both Strapi & custom API shapes
  const normalize = (item) => {
    // Strapi v4 => item.attributes
    const a = item?.attributes ? item.attributes : item || {};

    const name = pick(
      a.name,
      a.title,
      a.productName,
      a.product_name,
      a.product_title
    );

    const price = pick(
      a.price,
      a.sellingPrice,
      a.selling_price,
      a.mrp,
      a.rate,
      a.productPrice,
      a.product_price
    );

    const unit = pick(
      a.unit,
      a.weight,
      a.qty,
      a.quantity,
      a.unitKg,
      a.unit_kg
    );

    const featured = !!pick(
      a.featured,
      a.isFeatured,
      a.is_featured,
      a.featuredOnly
    );

    return {
      id: item?.id ?? a?.id,
      name: name ?? "Chilli",
      price: Number(price ?? 0),
      unit: Number(unit ?? 1),
      featured,
      img: getImageUrl(a),
    };
  };

  const cardHTML = (p) => `
    <article class="kt-pcard">
      <div class="kt-pimg">
        ${p.featured ? `<div class="kt-badge">Featured</div>` : ``}
        <div class="frame">
          <img src="${p.img}" alt="${escapeHtml(p.name)}" loading="lazy" />
        </div>
      </div>

      <div class="kt-pbody">
        <p class="kt-pname">${escapeHtml(p.name)}</p>

        <div class="kt-priceRow">
          <div class="kt-price">${inr(p.price)}</div>
          <div class="kt-unit">/ ${p.unit}kg</div>
        </div>

        <div class="kt-pill">Free Delivery</div>

        <button class="kt-order"
          data-order="1"
          data-name="${escapeHtml(p.name)}"
          data-price="${p.price}"
          data-unit="${p.unit}"
          data-img="${p.img}">
          ORDER NOW
        </button>
      </div>
    </article>
  `;

  let ALL = [];

  function render(list) {
    if (!list.length) {
      grid.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    grid.innerHTML = list.map(cardHTML).join("");
  }

  function applyUI() {
    const q = (searchEl?.value || "").trim().toLowerCase();
    const sort = sortEl?.value || "reco";
    const onlyFeatured = !!featuredEl?.checked;

    let list = ALL.slice();

    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    if (onlyFeatured) list = list.filter((p) => p.featured);

    if (sort === "price_low") list.sort((a, b) => a.price - b.price);
    if (sort === "price_high") list.sort((a, b) => b.price - a.price);
    if (sort === "name_az") list.sort((a, b) => a.name.localeCompare(b.name));

    render(list);
  }

  try {
    if (!BASE || !ENDPOINT) throw new Error("APP_CONFIG missing BASE/ENDPOINT");

    const url = `${BASE}${ENDPOINT}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);

    const json = await res.json();
    console.log("✅ Products API response:", json);

    // ✅ handle different API wrappers
    const rows =
      Array.isArray(json?.data) ? json.data :
      Array.isArray(json?.data?.data) ? json.data.data :
      Array.isArray(json) ? json :
      [];

    ALL = rows.map(normalize);
    applyUI();
  } catch (e) {
    console.error("❌ Products fetch failed:", e);
    render([]);
  }

  [searchEl, sortEl, featuredEl].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", applyUI);
    el.addEventListener("change", applyUI);
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const list = document.querySelector(".kt-faq__list");
  if (!list) return;

  const items = Array.from(list.querySelectorAll(".kt-faqItem"));

  function closeItem(item){
    item.classList.remove("is-open");
    const btn = item.querySelector(".kt-faqQ");
    const ans = item.querySelector(".kt-faqA");
    if (btn) btn.setAttribute("aria-expanded", "false");
    if (ans) ans.style.maxHeight = "0px";
  }

  function openItem(item){
    item.classList.add("is-open");
    const btn = item.querySelector(".kt-faqQ");
    const ans = item.querySelector(".kt-faqA");
    if (btn) btn.setAttribute("aria-expanded", "true");
    if (ans) ans.style.maxHeight = ans.scrollHeight + "px";
  }

  // init heights (for default open)
  items.forEach(it => {
    const ans = it.querySelector(".kt-faqA");
    if (!ans) return;
    if (it.classList.contains("is-open")) {
      ans.style.maxHeight = ans.scrollHeight + "px";
      const btn = it.querySelector(".kt-faqQ");
      if (btn) btn.setAttribute("aria-expanded", "true");
    } else {
      ans.style.maxHeight = "0px";
    }
  });

  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".kt-faqQ");
    if (!btn) return;

    const item = btn.closest(".kt-faqItem");
    if (!item) return;

    const isOpen = item.classList.contains("is-open");

    // close all first (single open)
    items.forEach(closeItem);

    // open clicked if it was closed
    if (!isOpen) openItem(item);
  });

  // recalc open height on resize
  window.addEventListener("resize", () => {
    const open = list.querySelector(".kt-faqItem.is-open .kt-faqA");
    if (open) open.style.maxHeight = open.scrollHeight + "px";
  });
});



document.addEventListener("DOMContentLoaded", () => {
  const y = document.getElementById("ktYear");
  if (y) y.textContent = new Date().getFullYear();

  const f = document.getElementById("ktNewsForm");
  if (f) {
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = new FormData(f).get("email");
      alert("✅ Subscribed: " + email);
      f.reset();
    });
  }
});






  document.addEventListener("DOMContentLoaded", function () {
    const menuBtn = document.getElementById("menuBtn");
    const mobileMenu = document.getElementById("mobileMenu");

    if (!menuBtn || !mobileMenu) return;

    menuBtn.addEventListener("click", function () {
      mobileMenu.classList.toggle("kt-open");

      const isOpen = mobileMenu.classList.contains("kt-open");
      menuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      menuBtn.innerHTML = isOpen ? "✕" : "☰";
    });

    const mobileLinks = mobileMenu.querySelectorAll("a");
    mobileLinks.forEach((link) => {
      link.addEventListener("click", function () {
        mobileMenu.classList.remove("kt-open");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.innerHTML = "☰";
      });
    });
  });



  // video section

  const ktVideos = [
    "https://www.youtube.com/embed/fSqfR3SLgEY",
    "https://www.youtube.com/embed/R5SXLshT5jo",
    "https://www.youtube.com/embed/xvb2yAbSTHU",
    "https://www.youtube.com/embed/NaF324I3F9w",
    "https://www.youtube.com/embed/30bik6AMRWQ"
  ];

  const ktVideoFrame = document.getElementById("ktProcessVideo");
  const ktPrevBtn = document.getElementById("ktPrevVideo");
  const ktNextBtn = document.getElementById("ktNextVideo");
  const ktDotsWrap = document.getElementById("ktVideoDots");

  let ktCurrentVideo = 0;

  function ktRenderDots() {
    ktDotsWrap.innerHTML = "";
    ktVideos.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.className = "kt-videoDot" + (index === ktCurrentVideo ? " active" : "");
      dot.addEventListener("click", () => {
        ktCurrentVideo = index;
        ktUpdateVideo();
      });
      ktDotsWrap.appendChild(dot);
    });
  }

  function ktUpdateVideo() {
    ktVideoFrame.src = ktVideos[ktCurrentVideo];
    ktRenderDots();
  }

  ktPrevBtn.addEventListener("click", () => {
    ktCurrentVideo = (ktCurrentVideo - 1 + ktVideos.length) % ktVideos.length;
    ktUpdateVideo();
  });

  ktNextBtn.addEventListener("click", () => {
    ktCurrentVideo = (ktCurrentVideo + 1) % ktVideos.length;
    ktUpdateVideo();
  });

  ktUpdateVideo();
