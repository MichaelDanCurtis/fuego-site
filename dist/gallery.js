(() => {
  const tablist = document.querySelector('.gallery-tabs');
  if (!tablist) return;
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));

  function selectCapture(index, moveFocus = false) {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
    if (moveFocus) tabs[index].focus({ preventScroll: true });
  }

  tabs.forEach((tab, index) => {
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    panels[index].tabIndex = 0;
    tab.addEventListener('click', () => selectCapture(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectCapture(next, true); }
    });
  });
  selectCapture(0);
  tablist.hidden = false;

  const dialog = document.getElementById('capture-dialog');
  if (typeof dialog?.showModal !== 'function') return;
  const image = dialog.querySelector('img');
  const title = document.getElementById('capture-dialog-title');
  const zoom = dialog.querySelector('.capture-zoom');
  const scrollArea = dialog.querySelector('.capture-dialog-scroll');
  let opener;

  function resetZoom() {
    dialog.classList.remove('is-zoomed');
    zoom.setAttribute('aria-pressed', 'false');
    zoom.textContent = 'Actual size';
    scrollArea.scrollTop = 0;
    scrollArea.scrollLeft = 0;
  }

  document.querySelectorAll('[data-capture]').forEach(link => {
    link.addEventListener('click', event => {
      // Modified clicks retain the normal full-image link behavior.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const source = link.querySelector('img');
      image.src = link.href;
      image.alt = source.alt;
      image.width = Number(source.getAttribute('width'));
      image.height = Number(source.getAttribute('height'));
      title.textContent = link.closest('figure').querySelector('h3').textContent;
      opener = link;
      resetZoom();
      dialog.showModal();
      document.documentElement.classList.add('capture-is-open');
    });
  });

  zoom.addEventListener('click', () => {
    const active = dialog.classList.toggle('is-zoomed');
    zoom.setAttribute('aria-pressed', String(active));
    zoom.textContent = active ? 'Fit to window' : 'Actual size';
    scrollArea.scrollTop = 0;
    scrollArea.scrollLeft = 0;
  });
  dialog.querySelector('.capture-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('capture-is-open');
    resetZoom();
    opener?.focus({ preventScroll: true });
  });
})();
