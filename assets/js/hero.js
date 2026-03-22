(() => {
  const { STRAPI_URL, API_BASE_URL, HERO_ENDPOINT } = window.APP_CONFIG || {};

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

  function fullUrl(u) {
    if (!u) return "";
    if (u.startsWith("http")) return u;
    return `${STRAPI_URL}${u}`;
  }

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

  function renderDots() {
    if (!heroDots) return;

    heroDots.innerHTML = slides
      .map((_, idx) => {
        return `<button class="dot ${idx === i ? "active" : ""}" data-i="${idx}"></button>`;
      })
      .join("");

    heroDots.querySelectorAll(".dot").forEach((btn) => {
      btn.addEventListener("click", () => {
        i = Number(btn.dataset.i);
        showSlide();
        restartAuto();
      });
    });
  }

  function showSlide() {
    if (!slides.length) return;

    const s = slides[i];

    typeWriter(s.title || "");

    if (heroSubtitle) {
      heroSubtitle.textContent = s.subtitle || "";
    }

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

    if (heroBadge) {
      heroBadge.textContent = s.badgeText || "Premium Grade · Fresh Stock";
    }

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

  function extractHeroImage(attrs) {
    if (Array.isArray(attrs?.heroImage) && attrs.heroImage[0]?.url) {
      return attrs.heroImage[0].url;
    }

    if (attrs?.heroImage?.url) {
      return attrs.heroImage.url;
    }

    if (attrs?.heroImage?.data?.[0]?.attributes?.url) {
      return attrs.heroImage.data[0].attributes.url;
    }

    if (attrs?.heroImage?.data?.attributes?.url) {
      return attrs.heroImage.data.attributes.url;
    }

    return "";
  }

  async function loadHero() {
    try {
      const url = `${API_BASE_URL}${HERO_ENDPOINT}`;
      console.log("Hero API URL:", url);

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Hero API failed: ${res.status}`);
      }

      const json = await res.json();
      console.log("Hero API JSON:", json);

      slides = (json?.data || [])
        .map((item) => {
          const attrs = item.attributes || item;
          const imageUrl = extractHeroImage(attrs);

          return {
            title: attrs?.title || "",
            subtitle: attrs?.subtitle || "",
            buttonText: attrs?.buttonText || "Contact Us",
            buttonLink: attrs?.buttonLink || "",
            badgeText: attrs?.badgeText || "Premium Grade · Fresh Stock",
            imgUrl: fullUrl(imageUrl),
          };
        })
        .filter((slide) => slide.imgUrl);

      console.log("Resolved hero slides:", slides);

      if (!slides.length) return;

      i = 0;
      if (heroBgImg) {
        heroBgImg.src = slides[0].imgUrl;
        heroBgImg.classList.add("hero-fade-in");
      }

      showSlide();
      restartAuto();
    } catch (err) {
      console.error("Hero load error:", err);
    }
  }

  loadHero();
})();