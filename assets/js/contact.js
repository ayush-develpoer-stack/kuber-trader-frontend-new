document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("ktContactForm");
  if (!form) return;

  const submitBtn = form.querySelector("#ktContactSubmit") || form.querySelector("[type='submit']");

  const CFG = window.APP_CONFIG || {};
  const EJ = CFG.EMAILJS || {};

  const BASE = (CFG.API_BASE_URL || "").replace(/\/$/, "");
  const CONTACT_ENDPOINT = CFG.CONTACT_ENDPOINT || "/api/contact-messages";

  // ✅ EmailJS init
  if (window.emailjs && EJ.PUBLIC_KEY) {
    emailjs.init(EJ.PUBLIC_KEY);
  }

  const blocksFromText = (text) => ([
    {
      type: "paragraph",
      children: [{ type: "text", text: String(text || "") }],
    },
  ]);

  async function sendEmail(payload) {
    if (!window.emailjs) throw new Error("EmailJS CDN not loaded");
    if (!EJ.SERVICE_ID || !EJ.TEMPLATE_ID) throw new Error("EmailJS config missing");
    return emailjs.send(EJ.SERVICE_ID, EJ.TEMPLATE_ID, payload);
  }

  async function saveToStrapi(payload) {
    if (!BASE) throw new Error("API_BASE_URL missing");

    const res = await fetch(`${BASE}${CONTACT_ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          product: payload.product,

          // ✅ IMPORTANT: message is Rich text (Blocks)
          message: blocksFromText(payload.message),

          // ✅ your fields exist in Strapi screenshot
          source: "website",
          statu: "new",
        },
      }),
    });

    const json = await res.json().catch(() => ({}));

    // ✅ helpful debug
    if (!res.ok) {
      console.error("❌ Strapi error status:", res.status);
      console.error("❌ Strapi error response:", json);
      throw new Error(json?.error?.message || `Strapi create failed (HTTP ${res.status})`);
    }

    return json;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);

    // honeypot
    if (fd.get("website")) return;

    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").replace(/\D/g, "");
    const email = String(fd.get("email") || "").trim();
    const product = String(fd.get("product") || "").trim();
    const message = String(fd.get("message") || "").trim();

    if (!name || phone.length < 10 || !email || !product || !message) {
      alert("❌ Please fill all details properly.");
      return;
    }

    const time = new Date().toLocaleString("en-IN");

    // ✅ EmailJS payload (template vars)
    const emailPayload = {
      name,
      time,
      message,
      phone,
      email,
      product,
    };

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> SENDING...`;
      }

      // ✅ send email
      await sendEmail(emailPayload);

      // ✅ save in Strapi
      await saveToStrapi({ name, phone, email, product, message });

      alert("✅ Message sent! We'll contact you soon.");
      form.reset();
    } catch (err) {
      console.error(err);
      alert(`❌ Failed to send. ${err.message || "Please try again."}`);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> SEND MESSAGE`;
      }
    }
  });
});