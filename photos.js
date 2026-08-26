(function () {
  "use strict";

  let DATA = null;
  let flatPhotos = [];
  let currentIndex = 0;

  fetch("photos-data.json")
    .then((r) => r.json())
    .then((data) => {
      DATA = data;
      render();
      wireLightbox();
    })
    .catch((err) => console.error("Falha ao carregar photos-data.json", err));

  function render() {
    const container = document.getElementById("galleryWeeks");
    container.innerHTML = "";
    flatPhotos = [];

    // most recent week first
    const weeksOrdered = [...DATA.weeks].reverse();

    weeksOrdered.forEach((week) => {
      const photosThisWeek = DATA.photos.filter((p) => p.week === week.id);
      if (photosThisWeek.length === 0) return;

      const section = document.createElement("section");
      section.className = "week-section";

      const header = document.createElement("div");
      header.className = "week-header";
      header.innerHTML = `<h2>Semana ${week.label}</h2><span class="week-count">${photosThisWeek.length} foto${photosThisWeek.length > 1 ? "s" : ""}</span>`;
      section.appendChild(header);

      const grid = document.createElement("div");
      grid.className = "photo-grid";

      photosThisWeek.forEach((p) => {
        const globalIndex = flatPhotos.length;
        flatPhotos.push(p);

        const thumb = document.createElement("div");
        thumb.className = "photo-thumb";
        thumb.innerHTML = `
          <img src="assets/gallery/thumbs/${p.file}" alt="${p.caption}" loading="lazy">
          <span class="photo-thumb-caption">${p.caption}</span>`;
        thumb.addEventListener("click", () => openLightbox(globalIndex));
        grid.appendChild(thumb);
      });

      section.appendChild(grid);
      container.appendChild(section);
    });
  }

  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    document.getElementById("lightbox").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    document.getElementById("lightbox").classList.remove("open");
    document.body.style.overflow = "";
  }
  function updateLightbox() {
    const p = flatPhotos[currentIndex];
    document.getElementById("lightboxImg").src = "assets/gallery/full/" + p.file;
    document.getElementById("lightboxImg").alt = p.caption;
    document.getElementById("lightboxCaption").textContent = `${p.caption} — Semana ${p.weekLabel}`;
  }
  function nextPhoto() { currentIndex = (currentIndex + 1) % flatPhotos.length; updateLightbox(); }
  function prevPhoto() { currentIndex = (currentIndex - 1 + flatPhotos.length) % flatPhotos.length; updateLightbox(); }

  function wireLightbox() {
    document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
    document.getElementById("lightboxNext").addEventListener("click", nextPhoto);
    document.getElementById("lightboxPrev").addEventListener("click", prevPhoto);
    document.getElementById("lightbox").addEventListener("click", (e) => {
      if (e.target.id === "lightbox") closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (!document.getElementById("lightbox").classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "ArrowLeft") prevPhoto();
    });
  }
})();
