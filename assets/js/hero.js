(() => {
  const { API_BASE_URL, HERO_ENDPOINT } = window.APP_CONFIG || {};

  const heroBgImg = document.getElementById("heroBgImg");
  const heroDots = document.getElementById("heroDots");
  const heroSubtitle = document.getElementById("heroSubtitle");
  const heroBtn = document.getElementById("heroBtn");
  const typingEl = document.getElementById("typingText");
  const heroBadge = document.getElementById("heroBadge");

  let slides = [];
  let i = 0;
  let autoSlide = null;
  let typingTimeout = null;

  const fullUrl = (u) => {
    if (!u) return "";
    return u.startsWith("http") ? u : `${API_BASE_URL}${u}`;
  };

  /* =========================
     TYPEWRITER
  ========================= */
  function typeWriter(text) {
    if (!typingEl) return;

    clearTimeout(typingTimeout);
    typingEl.innerHTML = "";
    let index = 0;

    function type() {
      if (index < text.length) {
        const ch = text.charAt(index);
        typingEl.innerHTML += ch === "\n" ? "<br>" : ch;
        index++;
        typingTimeout = setTimeout(type, 40);
      }
    }

    type();
  }

  /* =========================
     DOTS
  ========================= */
  function renderDots() {
    if (!heroDots) return;

    heroDots.innerHTML = slides.map((_, idx) => {
      return `<button class="dot ${idx === i ? "active" : ""}" data-i="${idx}"></button>`;
    }).join("");

    heroDots.querySelectorAll(".dot").forEach((btn) => {
      btn.addEventListener("click", () => {
        i = Number(btn.dataset.i);
        showSlide();
        restartAuto();
      });
    });
  }

  /* =========================
     SHOW SLIDE
  ========================= */
  function showSlide() {
    if (!slides.length) return;

    const s = slides[i];

    // title
    typeWriter(s.title || "");

    // subtitle
    if (heroSubtitle) {
      heroSubtitle.textContent = s.subtitle || "";
    }

    // button text
    const btnText =
      typeof s.buttonText === "string" && s.buttonText.trim()
        ? s.buttonText
        : "Contact Us";

    if (heroBtn) {
      heroBtn.textContent = btnText;

      if (s.buttonLink) {
        const isHttp = /^https?:\/\//i.test(s.buttonLink);
        heroBtn.href = isHttp ? s.buttonLink : `https://${s.buttonLink}`;
        heroBtn.target = "_blank";
      } else {
        heroBtn.href = "#contact";
        heroBtn.removeAttribute("target");
      }
    }

    // badge
    if (heroBadge) {
      heroBadge.textContent = s.badgeText || "Premium Grade · Fresh Stock";
    }

    // background image transition
    if (heroBgImg && s.imgUrl) {
      heroBgImg.classList.remove("hero-fade-in");
      heroBgImg.classList.add("hero-fade-out");

      setTimeout(() => {
        heroBgImg.src = s.imgUrl;
        heroBgImg.classList.remove("hero-fade-out");
        heroBgImg.classList.add("hero-fade-in");
      }, 250);
    }

    renderDots();
  }

  function nextSlide() {
    i = (i + 1) % slides.length;
    showSlide();
  }

  function restartAuto() {
    if (autoSlide) clearInterval(autoSlide);
    autoSlide = setInterval(nextSlide, 5000);
  }

  /* =========================
     LOAD HERO API
  ========================= */
  async function loadHero() {
    try {
      const url = `${API_BASE_URL}${HERO_ENDPOINT}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("Hero API failed");
      }

      const json = await res.json();

      slides = (json?.data || []).map((item) => {
        const attrs = item.attributes || item; // dono case support

        let imageUrl = "";

        // Strapi v4/v5 possible structures support
        if (attrs?.heroImage?.[0]?.url) {
          imageUrl = attrs.heroImage[0].url;
        } else if (attrs?.heroImage?.data?.[0]?.attributes?.url) {
          imageUrl = attrs.heroImage.data[0].attributes.url;
        } else if (attrs?.heroImage?.data?.attributes?.url) {
          imageUrl = attrs.heroImage.data.attributes.url;
        }

        return {
          title: attrs?.title || "",
          subtitle: attrs?.subtitle || "",
          buttonText: attrs?.buttonText || "Contact Us",
          buttonLink: attrs?.buttonLink || "",
          badgeText: attrs?.badgeText || "Premium Grade · Fresh Stock",
          imgUrl: fullUrl(imageUrl),
        };
      }).filter((slide) => slide.imgUrl);

      if (!slides.length) return;

      i = 0;
      heroBgImg.src = slides[0].imgUrl;
      heroBgImg.classList.add("hero-fade-in");

      showSlide();
      restartAuto();
    } catch (err) {
      console.error("Hero load error:", err);
    }
  }

  loadHero();
})();
