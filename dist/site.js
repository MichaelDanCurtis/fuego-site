const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
menu?.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!expanded));
  navigation?.classList.toggle('is-open', !expanded);
});
navigation?.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    menu?.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    menu.setAttribute('aria-expanded', 'false');
    navigation?.classList.remove('is-open');
    menu.focus();
  }
});

const tabs = [...document.querySelectorAll('[data-step]')];
function selectStep(step, focusTab = false) {
  const selected = tabs.find(tab => tab.dataset.step === step);
  if (!selected) return;
  tabs.forEach(tab => {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
  });
  if (focusTab) selected.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectStep(tab.dataset.step));
  tab.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectStep(tabs[next].dataset.step, true); }
  });
});
document.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => {
  selectStep(button.dataset.next);
  document.getElementById(`panel-${button.dataset.next}`).focus({ preventScroll: true });
}));
