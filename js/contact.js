(function () {
  const form = document.querySelector(".inquiry-card");
  if (!form) return;
  const status = form.querySelector(".form-status");
  const btn = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Sending...";
    status.className = "form-status";
    btn.disabled = true;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Something went wrong.");
      form.reset();
      status.textContent = "Thank you. Your inquiry has been sent and we will be in touch shortly.";
      status.classList.add("is-success");
    } catch (err) {
      status.textContent = err.message;
      status.classList.add("is-error");
    } finally {
      btn.disabled = false;
    }
  });
})();