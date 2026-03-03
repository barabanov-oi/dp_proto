(function () {
  // AOS
  if (window.AOS) {
    AOS.init({
      duration: 650,
      easing: "ease-out",
      once: true,
      offset: 80
    });
  }

  // Footer year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Helpers
  const formatRub = (n) => {
    const s = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${s} ₽`;
  };

  // Calculator
  const sliderEl = document.getElementById("budgetSlider");
  const budgetValueEl = document.getElementById("budgetValue");
  const savingValueEl = document.getElementById("savingValue");

  const min = 300000;
  const max = 1000000;
  const start = 700000;
  const ineff = 0.15; // 15% неэффективности — как в макете

  const setCalc = (budget) => {
    if (budgetValueEl) budgetValueEl.textContent = formatRub(budget);
    const saving = budget * ineff;
    if (savingValueEl) savingValueEl.textContent = formatRub(saving);
  };

  if (sliderEl && window.noUiSlider) {
    noUiSlider.create(sliderEl, {
      start: [start],
      connect: [true, false],
      range: { min, max },
      step: 10000
    });

    sliderEl.noUiSlider.on("update", (values) => {
      const budget = parseFloat(values[0]);
      setCalc(budget);
    });

    setCalc(start);
  } else {
    // fallback
    setCalc(start);
  }

  // CTA click (stub for analytics)
  window.addEventListener("cta:click", () => {
    // Здесь можно подключить метрику/GA/события
    // console.log("CTA clicked");
    const target = document.getElementById("cta");
    if (target) target.scrollIntoView({ behavior: "smooth" });
  });
})();