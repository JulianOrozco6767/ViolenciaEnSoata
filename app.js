(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const total = slides.length;
  let current = 0;
  let editMode = false;
  const $ = id => document.getElementById(id);
  const prevBtn = $('prevBtn'), nextBtn = $('nextBtn'), currentSlide = $('currentSlide'), totalSlides = $('totalSlides');
  const progressBar = $('progressBar'), editBtn = $('editBtn'), overviewBtn = $('overviewBtn'), fullscreenBtn = $('fullscreenBtn');
  const overviewModal = $('overviewModal'), overviewGrid = $('overviewGrid'), closeOverview = $('closeOverview'), toast = $('toast');
  const storageKey = 'soata_violencia_slides_edits_v1';
  totalSlides.textContent = String(total).padStart(2, '0');
  slides.forEach((slide, i) => { const n = slide.querySelector('.page-number'); if (n) n.textContent = `${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`; });

  function updateSlide(index) {
    if (index < 0 || index >= total) return;
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
      slide.style.zIndex = i === index ? 2 : 1;
      if (i === index) { const canvas = slide.querySelector('.canvas'); if (canvas) canvas.scrollTop = 0; }
    });
    current = index;
    currentSlide.textContent = String(current + 1).padStart(2, '0');
    progressBar.style.width = `${((current + 1) / total) * 100}%`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
    document.title = `${slides[current].dataset.title || 'Presentación'} · Violencia en Soatá`;
  }
  const next = () => updateSlide(Math.min(current + 1, total - 1));
  const prev = () => updateSlide(Math.max(current - 1, 0));
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  function toggleEdit() {
    editMode = !editMode;
    document.body.classList.toggle('edit-active', editMode);
    document.querySelectorAll('.editable').forEach(el => el.contentEditable = editMode ? 'true' : 'false');
    editBtn.style.color = editMode ? '#c2a36d' : '';
    showToast(editMode ? 'Modo edición activado' : 'Modo edición desactivado');
  }
  function saveEdits() {
    const edits = {};
    document.querySelectorAll('.editable').forEach((el, i) => edits[i] = el.innerHTML);
    try { localStorage.setItem(storageKey, JSON.stringify(edits)); } catch (_) { showToast('No se pudieron guardar los cambios en este navegador'); }
  }
  function restoreEdits() {
    try {
      const edits = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!edits) return;
      document.querySelectorAll('.editable').forEach((el, i) => { if (edits[i] !== undefined) el.innerHTML = edits[i]; });
    } catch (_) {}
  }
  document.addEventListener('input', e => { if (editMode && e.target.classList.contains('editable')) saveEdits(); });
  editBtn.addEventListener('click', toggleEdit);

  function buildOverview() {
    overviewGrid.innerHTML = '';
    slides.forEach((slide, i) => {
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'overview-card';
      const number = document.createElement('span'); number.textContent = String(i + 1).padStart(2, '0');
      const title = document.createElement('b'); title.textContent = slide.dataset.title || 'Diapositiva';
      card.append(number, title);
      card.addEventListener('click', () => { updateSlide(i); closeOverviewModal(); });
      overviewGrid.appendChild(card);
    });
  }
  function openOverview() { buildOverview(); overviewModal.classList.add('open'); }
  function closeOverviewModal() { overviewModal.classList.remove('open'); }
  overviewBtn.addEventListener('click', openOverview);
  closeOverview.addEventListener('click', closeOverviewModal);
  overviewModal.addEventListener('click', e => { if (e.target === overviewModal) closeOverviewModal(); });
  async function toggleFullscreen() {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); }
    catch (_) { showToast('Pantalla completa no disponible en este navegador'); }
  }
  fullscreenBtn.addEventListener('click', toggleFullscreen);
  document.addEventListener('keydown', e => {
    if (e.target && e.target.isContentEditable) { if (e.key === 'Escape') e.target.blur(); return; }
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); next(); }
    if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
    if (e.key === 'Home') { e.preventDefault(); updateSlide(0); }
    if (e.key === 'End') { e.preventDefault(); updateSlide(total - 1); }
    if (e.key.toLowerCase() === 'e') toggleEdit();
    if (e.key.toLowerCase() === 'o') openOverview();
    if (e.key.toLowerCase() === 'f') toggleFullscreen();
    if (e.key === 'Escape') closeOverviewModal();
  });
  let touchStartX = null, touchStartY = null;
  document.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; touchStartY = e.changedTouches[0].screenY; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (touchStartX === null || touchStartY === null) return;
    const dx = e.changedTouches[0].screenX - touchStartX, dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.2) dx < 0 ? next() : prev();
    touchStartX = null; touchStartY = null;
  }, { passive: true });
  function showToast(message) {
    toast.textContent = message; toast.classList.add('show');
    clearTimeout(window.soataToastTimer);
    window.soataToastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }
  restoreEdits(); updateSlide(0);
  window.presentation = { next, prev, updateSlide, openOverview, toggleEdit };
})();
