// 1) Categories cards animation
const cards = document.querySelectorAll(".kt-cat-card");

if (cards.length) {
  const catObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = "running";
        catObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  cards.forEach((c) => {
    c.style.animationPlayState = "paused";
    catObserver.observe(c);
  });
}

// 2) Reveal animation (About / other sections)
// reveal animation
const revealEls = document.querySelectorAll(".kt-reveal");

if (revealEls.length) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("kt-show");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  revealEls.forEach((el) => revealObserver.observe(el));
}

// subtle bg parallax (works even if section short)
const about = document.querySelector(".kt-about");
const bg = document.querySelector(".kt-about-bg");

if (about && bg) {
  window.addEventListener("scroll", () => {
    const rect = about.getBoundingClientRect();
    const vh = window.innerHeight;

    if (rect.top < vh && rect.bottom > 0) {
      const progress = (vh - rect.top) / (vh + rect.height); // 0..1 range approx
      const y = (progress - 0.5) * 30; // adjust strength
      bg.style.transform = `scale(1.08) translateY(${y}px)`;
    }
  }, { passive: true });
}


document.addEventListener("DOMContentLoaded", () => {
  const els = document.querySelectorAll(".kt-reveal");
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("kt-show");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "80px" });

  els.forEach(el => io.observe(el));
});



document.addEventListener("DOMContentLoaded", () => {
  const els = document.querySelectorAll(".kt-reveal");
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("kt-show");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "90px" });

  els.forEach(el => io.observe(el));
});


document.addEventListener("DOMContentLoaded", () => {
  const els = document.querySelectorAll(".kt-reveal");
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("kt-show");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "90px" });

  els.forEach(el => io.observe(el));
});


document.addEventListener("DOMContentLoaded", () => {
  const els = document.querySelectorAll(".kt-reveal");
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("kt-show");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "90px" });

  els.forEach(el => io.observe(el));
});




document.addEventListener("DOMContentLoaded", () => {
  const els = document.querySelectorAll(".kt-whyCard__num[data-count]");
  if (!els.length) return;

  function run(el){
    const raw = String(el.textContent || "");
    const suffix = raw.includes("%") ? "%" : raw.includes("+") ? "+" : "";
    const target = Number(el.dataset.count || 0);

    const duration = 1000;
    const start = performance.now();

    function frame(now){
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      el.textContent = val.toLocaleString("en-IN") + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        els.forEach(run);
        io.disconnect();
      }
    });
  }, { threshold: 0.35 });

  io.observe(document.getElementById("why") || els[0]);
});




document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.querySelector("#testimonials");
  if (!wrap) return;

  const track = wrap.querySelector(".kt-testi__track");
  const prev = wrap.querySelector(".kt-prev");
  const next = wrap.querySelector(".kt-next");
  const dotsWrap = wrap.querySelector(".kt-testi__dots");

  if (!track) return;

  const slides = Array.from(track.children);
  const isMobile = () => window.matchMedia("(max-width: 980px)").matches;

  let index = 0;
  let timer = null;

  // how many cards visible at once
  const perView = () => (isMobile() ? 1 : 2);

  // build dots (one dot per "page")
  function pagesCount() {
    return Math.max(1, Math.ceil(slides.length / perView()));
  }

  function buildDots() {
    dotsWrap.innerHTML = "";
    const n = pagesCount();
    for (let i = 0; i < n; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "kt-dot" + (i === 0 ? " is-active" : "");
      b.addEventListener("click", () => {
        index = i;
        goTo(index);
        restart();
      });
      dotsWrap.appendChild(b);
    }
  }

  function setActiveDot(i) {
    const dots = Array.from(dotsWrap.children);
    dots.forEach((d, k) => d.classList.toggle("is-active", k === i));
  }

  function slideWidth() {
    // distance between start of slide 0 to slide 1
    const first = slides[0];
    const second = slides[1];
    if (!first) return 0;
    if (!second) return first.getBoundingClientRect().width;
    return second.getBoundingClientRect().left - first.getBoundingClientRect().left;
  }

  function goTo(i) {
    const w = slideWidth();
    const shift = i * perView() * w;
    track.style.transform = `translateX(${-shift}px)`;
    setActiveDot(i);
  }

  function nextPage() {
    const n = pagesCount();
    index = (index + 1) % n;
    goTo(index);
  }

  function prevPage() {
    const n = pagesCount();
    index = (index - 1 + n) % n;
    goTo(index);
  }

  function start() {
    stop();
    timer = setInterval(nextPage, 1500); // auto slide speed
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function restart() {
    start();
  }

  // controls
  next?.addEventListener("click", () => { nextPage(); restart(); });
  prev?.addEventListener("click", () => { prevPage(); restart(); });

  // pause on hover
  wrap.addEventListener("mouseenter", stop);
  wrap.addEventListener("mouseleave", start);

  // init
  buildDots();
  goTo(0);
  start();

  // on resize re-calc
  window.addEventListener("resize", () => {
    const oldPages = dotsWrap.children.length;
    buildDots();
    const n = pagesCount();
    if (index >= n) index = 0;
    goTo(index);
    if (dotsWrap.children.length !== oldPages) restart();
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const els = document.querySelectorAll(".ab-why-kt-reveal");
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("ab-why-kt-show");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.16, rootMargin: "80px" });

  els.forEach(el => io.observe(el));
});



document.addEventListener("DOMContentLoaded", () => {
  const els = document.querySelectorAll(".kt-mapPro-reveal");
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("kt-mapPro-show");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "100px" });

  els.forEach(el => io.observe(el));
});