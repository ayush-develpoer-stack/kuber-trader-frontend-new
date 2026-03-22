document.addEventListener("DOMContentLoaded", async () => {
  const CFG = window.APP_CONFIG || {};
  const BASE = (CFG.API_BASE_URL || "").replace(/\/$/, "");
  const ENDPOINT = CFG.PREMIUM_PRODUCTS_ENDPOINT;

  const tabsWrap = document.querySelector(".kt-tabs");
  const indicator = document.querySelector(".kt-tab-indicator");
  const card = document.getElementById("ktProductCard");

  const elImg = document.getElementById("ktPImg");
  const elKicker = document.getElementById("ktPKicker");
  const elTitle = document.getElementById("ktPTitle");
  const elTag = document.getElementById("ktPTag");
  const elDesc = document.getElementById("ktPDesc");
  const elRead = document.getElementById("ktPRead");
  const elQuote = document.getElementById("ktPQuote");

  const elPrev = document.getElementById("ktPPrev");
  const elNext = document.getElementById("ktPNext");
  const elCount = document.getElementById("ktPCount");
  const imgWrap = document.querySelector(".kt-p-imgwrap");

  if (!tabsWrap || !card || !elImg || !elTitle) {
    initReveal();
    return;
  }

  if (!BASE || !ENDPOINT) {
    console.error("APP_CONFIG missing API_BASE_URL or PREMIUM_PRODUCTS_ENDPOINT");
    initReveal();
    return;
  }

  let items = [];
  let currentImages = [];
  let currentImageIndex = 0;

  try {
    const res = await fetch(`${BASE}${ENDPOINT}`);
    const json = await res.json();
    items = Array.isArray(json?.data) ? json.data : [];
    console.log("API JSON:", json);
    console.log("First item raw:", items[0]);
  } catch (err) {
    console.error("Premium products fetch failed:", err);
    initReveal();
    return;
  }

  if (!items.length) {
    console.warn("No premium products found.");
    initReveal();
    return;
  }

  function getAttrs(item) {
    if (!item) return {};
    return item.attributes ? item.attributes : item;
  }

  function absoluteUrl(url) {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return `${BASE}${url}`;
    return `${BASE}/${url}`;
  }

  function getSingleMediaUrl(mediaItem) {
    if (!mediaItem) return "";

    if (typeof mediaItem === "string") {
      return absoluteUrl(mediaItem);
    }

    if (mediaItem.url) {
      return absoluteUrl(mediaItem.url);
    }

    if (mediaItem.attributes?.url) {
      return absoluteUrl(mediaItem.attributes.url);
    }

    return "";
  }

  function getImageUrls(item) {
    const attrs = getAttrs(item);

    const mediaField =
      attrs.image ||
      attrs.images ||
      attrs.gallery ||
      attrs.photo ||
      attrs.img ||
      null;

    if (!mediaField) return [];

    let mediaList = [];

    /* Strapi relation: image.data = [...] */
    if (Array.isArray(mediaField.data)) {
      mediaList = mediaField.data;
    }
    /* Strapi relation: image.data = {...} */
    else if (mediaField.data) {
      mediaList = [mediaField.data];
    }
    /* direct array */
    else if (Array.isArray(mediaField)) {
      mediaList = mediaField;
    }
    /* direct single object */
    else {
      mediaList = [mediaField];
    }

    const urls = mediaList
      .map(getSingleMediaUrl)
      .filter(Boolean);

    return [...new Set(urls)];
  }

  function richTextToPlain(value) {
    if (value == null) return "";
    if (typeof value === "string") return value;

    if (Array.isArray(value)) {
      let out = "";
      value.forEach((block) => {
        if (block && Array.isArray(block.children)) {
          block.children.forEach((ch) => {
            if (typeof ch?.text === "string") out += ch.text;
          });
          out += "\n\n";
        } else if (typeof block?.text === "string") {
          out += block.text + "\n\n";
        }
      });
      return out.trim();
    }

    return "";
  }

  function updateImageUI() {
    const total = currentImages.length;

    if (!total) {
      elImg.removeAttribute("src");
      elImg.alt = "Product image";
      if (elCount) elCount.textContent = "0 / 0";
      if (imgWrap) imgWrap.classList.add("is-single");
      return;
    }

    if (currentImageIndex < 0) currentImageIndex = total - 1;
    if (currentImageIndex >= total) currentImageIndex = 0;

    const src = currentImages[currentImageIndex];
    console.log("Final image src:", src);

    elImg.src = src;
    elImg.alt = `${elTitle.textContent || "Product"} image ${currentImageIndex + 1}`;

    if (elCount) {
      elCount.textContent = `${currentImageIndex + 1} / ${total}`;
    }

    if (imgWrap) {
      imgWrap.classList.toggle("is-single", total <= 1);
    }
  }

  function showPrevImage() {
    if (currentImages.length <= 1) return;
    currentImageIndex--;
    updateImageUI();
  }

  function showNextImage() {
    if (currentImages.length <= 1) return;
    currentImageIndex++;
    updateImageUI();
  }

  function setIndicatorTo(btn) {
    if (!indicator || !btn || window.innerWidth <= 520) return;
    const wrap = tabsWrap.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    const centerX = (b.left - wrap.left) + b.width / 2;
    indicator.style.transform = `translateX(${centerX - 10}px)`;
  }

  function scrollTabIntoView(btn) {
    if (!btn || window.innerWidth > 520) return;

    const wrapRect = tabsWrap.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    const offset =
      (btnRect.left - wrapRect.left) - (wrapRect.width / 2) + (btnRect.width / 2);

    tabsWrap.scrollTo({
      left: tabsWrap.scrollLeft + offset,
      behavior: "smooth"
    });
  }

  function renderProduct(index) {
    const item = items[index];
    const attrs = getAttrs(item);

    const title = attrs.title || attrs.name || attrs.product_name || "";
    const kicker = attrs.kicker || attrs.subtitle || "";
    const tag = attrs.tag || attrs.category || "";
    const descPlain = richTextToPlain(attrs.description || attrs.desc || "");
    const read = attrs.read_link || attrs.read || "#read";
    const quote = attrs.quote_link || attrs.quote || "#quote";
    const imageUrls = getImageUrls(item);

    console.log("Render item raw:", item);
    console.log("Resolved real image URLs:", imageUrls);

    card.classList.remove("kt-swap-in");
    card.classList.add("kt-swap-out");

    setTimeout(() => {
      if (elKicker) elKicker.textContent = kicker;
      if (elTitle) elTitle.textContent = (title || "").toUpperCase();
      if (elTag) elTag.textContent = tag;
      if (elDesc) elDesc.textContent = descPlain;
      if (elRead) elRead.href = read;
      if (elQuote) elQuote.href = quote;

      currentImages = imageUrls;
      currentImageIndex = 0;
      updateImageUI();

      card.classList.remove("kt-swap-out");
      card.classList.add("kt-swap-in");
    }, 220);
  }

  function buildTabs() {
    tabsWrap.querySelectorAll(".kt-tab").forEach((b) => b.remove());

    items.forEach((item, idx) => {
      const attrs = getAttrs(item);
      const label = attrs.tab_label || attrs.title || attrs.name || `Product ${idx + 1}`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "kt-tab";
      btn.dataset.index = String(idx);
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", "false");
      btn.textContent = label;

      if (idx === 0) {
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
      }

      tabsWrap.insertBefore(btn, indicator);
    });
  }

  function initTabs() {
    buildTabs();

    const first =
      tabsWrap.querySelector(".kt-tab.active") || tabsWrap.querySelector(".kt-tab");

    if (first) {
      renderProduct(Number(first.dataset.index || 0));
      setIndicatorTo(first);
      scrollTabIntoView(first);
    }

    tabsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".kt-tab");
      if (!btn) return;

      tabsWrap.querySelectorAll(".kt-tab").forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });

      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      setIndicatorTo(btn);
      scrollTabIntoView(btn);
      renderProduct(Number(btn.dataset.index || 0));
    });

    window.addEventListener("resize", () => {
      const activeBtn = tabsWrap.querySelector(".kt-tab.active");
      setIndicatorTo(activeBtn);
      scrollTabIntoView(activeBtn);
    });
  }

  function initReveal() {
    const revealEls = document.querySelectorAll(".kt-reveal");
    if (!revealEls.length) return;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("kt-show");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  }

  elImg.addEventListener("error", function () {
    console.error("Image failed to load:", elImg.src);
  });

  if (elPrev) elPrev.addEventListener("click", showPrevImage);
  if (elNext) elNext.addEventListener("click", showNextImage);

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") showPrevImage();
    if (e.key === "ArrowRight") showNextImage();
  });

  initTabs();
  initReveal();
});