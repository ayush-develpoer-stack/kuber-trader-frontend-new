document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("ktCheckout");
  if (!modal) return;

  const img = document.getElementById("ktCOImg");
  const nameEl = document.getElementById("ktCOName");
  const priceEl = document.getElementById("ktCOPrice");
  const qtyEl = document.getElementById("ktCOQty");
  const totalEl = document.getElementById("ktCOTotal");
  const form = document.getElementById("ktOrderForm");
  const submitBtn = form?.querySelector(".kt-co-submit");

  const imgWrap = modal.querySelector(".kt-modal-imgwrap");
  const prevBtn = document.getElementById("ktCOPrev");
  const nextBtn = document.getElementById("ktCONext");
  const countEl = document.getElementById("ktCOCount");

  const CFG = window.APP_CONFIG || {};
  const EJ = CFG.EMAILJS || {};

  const BASE = (CFG.API_BASE_URL || "").replace(/\/$/, "");
  const ORDERS_ENDPOINT = CFG.ORDERS_ENDPOINT || "/api/orders";

  if (window.emailjs && EJ.PUBLIC_KEY) {
    emailjs.init(EJ.PUBLIC_KEY);
  }

  let current = {
    name: "",
    price: 0,
    unit: 1,
    img: "",
    images: []
  };

  let currentImageIndex = 0;

  const open = () => {
    modal.classList.add("kt-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    modal.classList.remove("kt-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  modal.addEventListener("click", (e) => {
    if (e.target.dataset.close) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("kt-open")) close();

    if (!modal.classList.contains("kt-open")) return;

    if (e.key === "ArrowLeft") showPrevImage();
    if (e.key === "ArrowRight") showNextImage();
  });

  function updateModalImage() {
    const total = current.images.length;

    if (!total) {
      img.src = current.img || "https://via.placeholder.com/900x600?text=Chilli";
      imgWrap?.classList.add("is-single");
      if (countEl) countEl.textContent = "1 / 1";
      return;
    }

    if (currentImageIndex < 0) currentImageIndex = total - 1;
    if (currentImageIndex >= total) currentImageIndex = 0;

    img.src = current.images[currentImageIndex];
    img.alt = `${current.name} image ${currentImageIndex + 1}`;

    if (countEl) {
      countEl.textContent = `${currentImageIndex + 1} / ${total}`;
    }

    imgWrap?.classList.toggle("is-single", total <= 1);
  }

  function showPrevImage() {
    if (current.images.length <= 1) return;
    currentImageIndex--;
    updateModalImage();
  }

  function showNextImage() {
    if (current.images.length <= 1) return;
    currentImageIndex++;
    updateModalImage();
  }

  prevBtn?.addEventListener("click", showPrevImage);
  nextBtn?.addEventListener("click", showNextImage);

  function calcTotal() {
    const qty = Math.max(1, Number(qtyEl.value || 1));
    const price = Number(current.price || 0);
    totalEl.value = `₹${Math.round(price * qty)}`;
  }

  qtyEl.addEventListener("input", calcTotal);

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-order='1']");
    if (!btn) return;

    e.preventDefault();

    let parsedImages = [];
    try {
      parsedImages = JSON.parse(decodeURIComponent(btn.dataset.images || "[]"));
    } catch (err) {
      parsedImages = [];
    }

    current = {
      name: btn.dataset.name || "Product",
      price: Number(btn.dataset.price || 0),
      unit: Number(btn.dataset.unit || 1),
      img: btn.dataset.img || "",
      images: parsedImages.length ? parsedImages : [btn.dataset.img || "https://via.placeholder.com/900x600?text=Chilli"]
    };

    currentImageIndex = 0;

    nameEl.textContent = current.name;
    priceEl.textContent = `₹${current.price}/${current.unit}kg`;

    qtyEl.value = 1;
    calcTotal();
    updateModalImage();
    open();
  });

  async function postToStrapiOrder(payload) {
    if (!BASE) throw new Error("API_BASE_URL missing");

    const body = {
      data: {
        name: payload.name,
        phone: Number(payload.phone || 0),
        city: payload.city,
        note: payload.note,
        product: payload.product,
        price_per_unit: Number(payload.price_per_unit || 0),
        unit: payload.unit,
        qty: Number(payload.qty || 1),
        total: payload.total,
        statu: "new",
      },
    };

    const res = await fetch(`${BASE}${ORDERS_ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Strapi error:", json);
      throw new Error(json?.error?.message || "Strapi order create failed");
    }
    return json;
  }

  async function sendEmail(payload) {
    if (!window.emailjs) throw new Error("EmailJS CDN not loaded");
    if (!EJ.SERVICE_ID || !EJ.TEMPLATE_ID) {
      throw new Error("EmailJS SERVICE_ID/TEMPLATE_ID missing");
    }

    await emailjs.send(EJ.SERVICE_ID, EJ.TEMPLATE_ID, payload);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);

    if (fd.get("website")) return;

    const qty = Math.max(1, Number(fd.get("qty") || 1));
    const total = `₹${Math.round(Number(current.price || 0) * qty)}`;

    const phoneStr = String(fd.get("phone") || "").replace(/\D/g, "");
    if (phoneStr.length < 10) {
      alert("❌ Please enter a valid phone number");
      return;
    }

    const payload = {
      name: String(fd.get("name") || ""),
      phone: phoneStr,
      city: String(fd.get("city") || ""),
      note: String(fd.get("note") || ""),
      time: new Date().toLocaleString("en-IN"),
      product: current.name,
      price_per_unit: Number(current.price || 0),
      unit: `${current.unit}kg`,
      qty,
      total,
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }

    try {
      await sendEmail(payload);
      await postToStrapiOrder(payload);

      alert("✅ Order submitted! We’ll contact you soon.");
      form.reset();
      close();
    } catch (err) {
      console.error(err);
      alert("❌ Submit failed. Please try again.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Place Order";
      }
    }
  });
});