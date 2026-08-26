(function () {
  "use strict";

  const SKU_COLORS = { original: "#2C3B66", nature: "#F2621B", sache: "#F5C518" };
  const SKU_LABELS = { original: "Original", nature: "Nature", sache: "Sachê" };
  const STORE_LABELS = { barra: "Guanabara Barra", recreio: "Guanabara Recreio" };

  let DATA = null;
  let state = { store: "all", period: "all" };
  let charts = {};

  fetch("data.json")
    .then((r) => r.json())
    .then((data) => {
      DATA = data;
      document.getElementById("lastUpdated").textContent =
        "Atualizado em " + formatDateLong(data.meta.generated);
      renderNotes(data.meta.notes);
      wireControls();
      renderAll();
    })
    .catch((err) => {
      console.error("Falha ao carregar data.json", err);
    });

  function wireControls() {
    document.querySelectorAll("#storeFilter .pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#storeFilter .pill").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.store = btn.dataset.store;
        renderAll();
      });
    });
    document.querySelectorAll("#periodFilter .pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#periodFilter .pill").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.period = btn.dataset.period;
        renderAll();
      });
    });
  }

  // ---------- helpers ----------
  function formatDateLong(iso) {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  }
  function formatDateShort(iso) {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }
  function dayCountInMonth(startISO, endISO, month) {
    let d = new Date(startISO + "T12:00:00");
    const end = new Date(endISO + "T12:00:00");
    let count = 0;
    while (d <= end) {
      if (d.getMonth() + 1 === month) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  }
  function weekMonth(week) {
    const jul = dayCountInMonth(week.start, week.end, 7);
    const ago = dayCountInMonth(week.start, week.end, 8);
    return ago > jul ? "ago" : "jul";
  }
  function weekMatchesPeriod(week) {
    if (state.period === "all") return true;
    return weekMonth(week) === state.period;
  }
  function storesForFilter() {
    return state.store === "all" ? ["barra", "recreio"] : [state.store];
  }
  function filteredWeeks() {
    return DATA.weeks_real.filter(weekMatchesPeriod);
  }
  function weekSkuTotal(week, sku) {
    return storesForFilter().reduce((sum, st) => sum + (week[st] ? week[st][sku] : 0), 0);
  }
  function weekTotal(week) {
    return storesForFilter().reduce((sum, st) => sum + (week[st] ? week[st].total : 0), 0);
  }

  function isDateInRange(dateISO, start, end) {
    return dateISO >= start && dateISO <= end;
  }
  function dateMonthMatchesPeriod(dateISO) {
    if (state.period === "all") return true;
    const month = parseInt(dateISO.slice(5, 7), 10);
    return (state.period === "jul" && month === 7) || (state.period === "ago" && month === 8);
  }

  function formSumForWeek(week, field) {
    const stores = storesForFilter();
    let sum = 0;
    let count = 0;
    DATA.daily_form.forEach((rec) => {
      if (!isDateInRange(rec.date, week.start, week.end)) return;
      if (!stores.includes(rec.store)) return;
      if (rec[field] === null || rec[field] === undefined) return;
      sum += rec[field];
      count++;
    });
    return { sum, count };
  }

  // ---------- render orchestration ----------
  function safe(fn, label) {
    try { fn(); } catch (err) { console.error("Falha ao renderizar: " + label, err); }
  }
  function renderAll() {
    safe(renderKPIs, "KPIs");
    safe(renderWeeklyChart, "gráfico semanal");
    safe(renderMixChart, "mix de produto");
    safe(renderForecastChart, "previsão x real");
    safe(renderTable, "tabela detalhada");
  }

  // ---------- KPIs ----------
  function renderKPIs() {
    const weeks = filteredWeeks();

    // Vendas reais
    const vendasReais = weeks.reduce((s, w) => s + weekTotal(w), 0);
    setKpi("kpiVendas", vendasReais);

    // Abordagens (from form) — sum, tracking estimated count
    let abordSum = 0, abordEstCount = 0, abordRealCount = 0;
    const stores = storesForFilter();
    DATA.daily_form.forEach((rec) => {
      if (!stores.includes(rec.store)) return;
      if (!dateMonthMatchesPeriod(rec.date)) return;
      if (rec.abordagens === null) return;
      abordSum += rec.abordagens;
      if (rec.abordagens_estimated) abordEstCount++; else abordRealCount++;
    });
    setKpi("kpiAbordagens", abordSum);
    const sub = document.getElementById("kpiAbordagensSub");
    sub.textContent = abordEstCount > 0
      ? `${abordRealCount} dias com nº exato + ${abordEstCount} dias estimados (~50, resp. "Bastante")`
      : `${abordRealCount} dias com número exato registrado`;

    // Previsão
    let prevSum = 0;
    DATA.daily_form.forEach((rec) => {
      if (!stores.includes(rec.store)) return;
      if (!dateMonthMatchesPeriod(rec.date)) return;
      if (rec.previsao_total === null) return;
      prevSum += rec.previsao_total;
    });
    setKpi("kpiPrevisao", prevSum);

    // Gap: day-matched comparison only (real daily sales exist only for weeks 3-5,
    // and only where the form was also filled that same day) — avoids the bias of
    // comparing a partial week of form answers against a full week of real sales.
    const realDailyMap = {};
    DATA.daily_coverage.forEach((r) => {
      if (r.vendas !== undefined && r.vendas !== null) realDailyMap[r.date + "|" + r.store] = r.vendas;
    });
    let gapPrev = 0, gapReal = 0, matchedDays = 0;
    DATA.daily_form.forEach((rec) => {
      if (!stores.includes(rec.store)) return;
      if (rec.previsao_total === null) return;
      if (!dateMonthMatchesPeriod(rec.date)) return;
      const key = rec.date + "|" + rec.store;
      if (!(key in realDailyMap)) return;
      gapPrev += rec.previsao_total;
      gapReal += realDailyMap[key];
      matchedDays++;
    });
    const gap = gapPrev - gapReal;
    const gapCard = document.getElementById("kpiGap");
    gapCard.querySelector(".kpi-number").textContent = matchedDays > 0 ? ((gap >= 0 ? "+" : "") + gap) : "—";
    gapCard.querySelector(".kpi-sub").textContent = matchedDays > 0
      ? `comparação dia a dia, só nos ${matchedDays} dias com previsão e venda real registradas`
      : "sem dias com previsão e venda real cruzáveis neste filtro";

    // Degustações servidas — métrica nova, disponível só a partir de 20/08/2026
    let degustSum = 0, degustDays = 0;
    DATA.daily_form.forEach((rec) => {
      if (!stores.includes(rec.store)) return;
      if (!dateMonthMatchesPeriod(rec.date)) return;
      if (rec.degustacoes === null || rec.degustacoes === undefined) return;
      degustSum += rec.degustacoes;
      degustDays++;
    });
    const degustCard = document.getElementById("kpiDegustacoes");
    const degustSub = document.getElementById("kpiDegustacoesSub");
    degustCard.querySelector(".kpi-number").textContent = degustDays > 0 ? degustSum.toLocaleString("pt-BR") : "—";
    degustSub.textContent = degustDays > 0
      ? `registrado em ${degustDays} dia${degustDays > 1 ? "s" : ""} · métrica nova desde 20/08/2026`
      : "métrica nova, disponível a partir de 20/08/2026 (sem dados no filtro atual)";
  }

  function formSumForWeekStore(week, store, field) {
    let sum = 0, count = 0;
    DATA.daily_form.forEach((rec) => {
      if (rec.store !== store) return;
      if (!isDateInRange(rec.date, week.start, week.end)) return;
      if (rec[field] === null || rec[field] === undefined) return;
      sum += rec[field];
      count++;
    });
    return { sum, count };
  }

  function setKpi(id, value) {
    document.getElementById(id).querySelector(".kpi-number").textContent =
      value.toLocaleString("pt-BR");
  }

  // ---------- Weekly evolution chart ----------
  function renderWeeklyChart() {
    const weeks = filteredWeeks();
    const labels = weeks.map((w) => w.label);
    const stores = storesForFilter();

    let datasets;
    if (state.store === "all") {
      datasets = [
        { label: "Guanabara Barra", data: weeks.map((w) => w.barra.total), backgroundColor: "#3F5590", borderRadius: 6 },
        { label: "Guanabara Recreio", data: weeks.map((w) => w.recreio.total), backgroundColor: "#F2621B", borderRadius: 6 },
      ];
    } else {
      datasets = [
        { label: STORE_LABELS[state.store], data: weeks.map((w) => w[state.store].total), backgroundColor: "#3F5590", borderRadius: 6 },
      ];
    }

    renderChart("chartWeekly", "bar", {
      data: { labels, datasets },
      options: baseBarOptions("Unidades vendidas"),
    });
  }

  // ---------- Mix donut ----------
  function renderMixChart() {
    const weeks = filteredWeeks();
    const totals = { original: 0, nature: 0, sache: 0 };
    weeks.forEach((w) => {
      Object.keys(totals).forEach((sku) => { totals[sku] += weekSkuTotal(w, sku); });
    });
    renderChart("chartMix", "doughnut", {
      data: {
        labels: Object.keys(totals).map((k) => SKU_LABELS[k]),
        datasets: [{
          data: Object.values(totals),
          backgroundColor: Object.keys(totals).map((k) => SKU_COLORS[k]),
          borderWidth: 2,
          borderColor: "#fff",
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: { position: "bottom", labels: { font: { family: "Source Sans 3", size: 12.5 }, padding: 16, usePointStyle: true } },
          tooltip: tooltipStyle(),
        },
      },
    });
  }

  // ---------- Forecast vs real ----------
  function renderForecastChart() {
    const weeks = filteredWeeks();
    const stores = storesForFilter();
    const labels = weeks.map((w) => w.label);
    const realData = weeks.map((w) => weekTotal(w));
    const forecastData = weeks.map((w) => {
      let sum = 0;
      stores.forEach((st) => { sum += formSumForWeekStore(w, st, "previsao_total").sum; });
      return sum;
    });
    const hasForm = weeks.map((w) => stores.some((st) => formSumForWeekStore(w, st, "previsao_total").count > 0));

    renderChart("chartForecast", "bar", {
      data: {
        labels,
        datasets: [
          { label: "Previsão (promotoras)", data: forecastData, backgroundColor: forecastData.map((v, i) => hasForm[i] ? "#F2621B" : "#EFEFEF"), borderRadius: 6 },
          { label: "Vendas reais", data: realData, backgroundColor: "#2C3B66", borderRadius: 6 },
        ],
      },
      options: baseBarOptions("Unidades"),
    });
  }

  function baseBarOptions(yLabel) {
    return {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: "IBM Plex Mono", size: 11 } } },
        y: { beginAtZero: true, grid: { color: "#EEF0F7" }, ticks: { font: { family: "IBM Plex Mono", size: 11 } }, title: { display: !!yLabel, text: yLabel, font: { family: "Source Sans 3", size: 11.5 } } },
      },
      plugins: {
        legend: { position: "bottom", labels: { font: { family: "Source Sans 3", size: 12.5 }, padding: 16, usePointStyle: true } },
        tooltip: tooltipStyle(),
      },
    };
  }
  function tooltipStyle() {
    return {
      backgroundColor: "#2C3B66",
      titleFont: { family: "Source Sans 3", weight: "700" },
      bodyFont: { family: "IBM Plex Mono" },
      padding: 10,
      cornerRadius: 8,
    };
  }

  function renderChart(canvasId, type, config) {
    const canvas = document.getElementById(canvasId);
    if (typeof Chart === "undefined") {
      const p = document.createElement("p");
      p.style.cssText = "color:#C0392B;font-size:13px;padding:20px;";
      p.textContent = "Não foi possível carregar a biblioteca de gráficos. Recarregue a página (Ctrl+Shift+R).";
      canvas.replaceWith(p);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (charts[canvasId]) charts[canvasId].destroy();
    charts[canvasId] = new Chart(ctx, { type, ...config });
  }

  // ---------- Weekly table ----------
  function renderTable() {
    const tbody = document.querySelector("#weeklyTable tbody");
    tbody.innerHTML = "";
    const weeks = filteredWeeks();
    const stores = storesForFilter();

    weeks.forEach((week, idx) => {
      stores.forEach((store) => {
        const s = week[store];
        const prevWeek = DATA.weeks_real[DATA.weeks_real.indexOf(week) - 1];
        let growthHtml = "—";
        if (prevWeek && prevWeek[store] && prevWeek[store].total > 0) {
          const growth = ((s.total - prevWeek[store].total) / prevWeek[store].total) * 100;
          const cls = growth >= 0 ? "growth-up" : "growth-down";
          growthHtml = `<span class="${cls}">${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%</span>`;
        }
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${week.label}</td>
          <td>${STORE_LABELS[store]}</td>
          <td>${s.original}</td>
          <td>${s.nature}</td>
          <td>${s.sache}</td>
          <td><strong>${s.total}</strong></td>
          <td>${growthHtml}</td>`;
        tbody.appendChild(tr);
      });
    });

    // total row
    const totalOriginal = weeks.reduce((sum, w) => sum + weekSkuTotal(w, "original"), 0);
    const totalNature = weeks.reduce((sum, w) => sum + weekSkuTotal(w, "nature"), 0);
    const totalSache = weeks.reduce((sum, w) => sum + weekSkuTotal(w, "sache"), 0);
    const totalAll = weeks.reduce((sum, w) => sum + weekTotal(w), 0);
    const trTotal = document.createElement("tr");
    trTotal.className = "total-row";
    trTotal.innerHTML = `
      <td colspan="2">TOTAL DO PERÍODO</td>
      <td>${totalOriginal}</td>
      <td>${totalNature}</td>
      <td>${totalSache}</td>
      <td>${totalAll}</td>
      <td>—</td>`;
    tbody.appendChild(trTotal);
  }

  // ---------- Notes ----------
  function renderNotes(notes) {
    const ul = document.getElementById("notesList");
    ul.innerHTML = "";
    notes.forEach((n) => {
      const li = document.createElement("li");
      li.textContent = n;
      ul.appendChild(li);
    });
  }
})();
