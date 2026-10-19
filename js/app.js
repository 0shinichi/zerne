// Зерне — корзина, предзаказ, фильтры меню, формы и мелкая анимация. Без библиотек.
(function () {
  const MENU = window.ZERNE_MENU || [];
  const CATS = window.ZERNE_CATS || [];
  const OPT = window.ZERNE_OPTIONS || { milk: [], syrup: [] };
  const byId = Object.fromEntries(MENU.map(i => [i.id, i]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const icon = (name, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="img/icons.svg#${name}"/></svg>`;
  const money = n => n.toFixed(2).replace('.', ',') + ' BYN';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- Хранилище: localStorage, а если оно недоступно — память страницы
  const mem = {};
  const store = {
    get(k, def) { try { const v = localStorage.getItem('zerne.' + k); return v === null ? def : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : def; } },
    set(k, v) { mem[k] = v; try { localStorage.setItem('zerne.' + k, JSON.stringify(v)); } catch (e) { /* приватный режим */ } },
  };

  // ---------- Часы работы
  const HOURS = { weekday: [8, 21], weekend: [9, 21] };
  function hoursFor(d) { const wd = d.getDay(); return (wd === 0 || wd === 6) ? HOURS.weekend : HOURS.weekday; }
  function openState(now = new Date()) {
    const [o, c] = hoursFor(now); const h = now.getHours() + now.getMinutes() / 60;
    if (h >= o && h < c) return { open: true, text: `Открыто до ${c}:00` };
    if (h < o) return { open: false, text: `Откроемся в ${o}:00` };
    const t = new Date(now); t.setDate(t.getDate() + 1);
    return { open: false, text: `Откроемся завтра в ${hoursFor(t)[0]}:00` };
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  // Время выдачи: ближайшие 15-минутные слоты в часы работы
  function timeSlots(count = 4) {
    const now = new Date(); const st = openState(now); const slots = [];
    let t = new Date(now); let prefix = '';
    if (!st.open || now.getHours() + now.getMinutes() / 60 > hoursFor(now)[1] - 0.5) {
      if (now.getHours() >= hoursFor(now)[0]) { t.setDate(t.getDate() + 1); prefix = 'завтра '; }
      t.setHours(hoursFor(t)[0], 15, 0, 0);
    } else {
      slots.push({ value: 'asap', label: 'Как можно скорее' });
      t = new Date(now.getTime() + 15 * 60000);
      t.setMinutes(Math.ceil(t.getMinutes() / 15) * 15, 0, 0);
    }
    for (let i = 0; slots.length < count + 1 && i < 12; i++) {
      if (t.getHours() + t.getMinutes() / 60 <= hoursFor(t)[1] - 0.25) slots.push({ value: t.toISOString(), label: prefix + t.getHours() + ':' + pad(t.getMinutes()) });
      t = new Date(t.getTime() + 15 * 60000);
    }
    return slots;
  }
  function slotLabel(v) { if (!v || v === 'asap') return 'через 7–10 минут'; const d = new Date(v); return d.getHours() + ':' + pad(d.getMinutes()); }

  // ---------- Корзина
  let cart = store.get('cart', []);
  const lineKey = l => [l.id, l.milk || '', l.syrup || ''].join('|');
  const optName = (group, id) => (OPT[group].find(o => o.id === id) || {}).name;
  const unitPrice = l => { const it = byId[l.id]; if (!it) return 0; let p = it.price; if (l.milk) p += (OPT.milk.find(o => o.id === l.milk) || {}).add || 0; if (l.syrup) p += (OPT.syrup.find(o => o.id === l.syrup) || {}).add || 0; return p; };
  const lineOpts = l => { const it = byId[l.id]; const parts = []; const vol = (it.desc.match(/\d+ мл/) || [])[0]; if (vol) parts.push(vol); if (l.milk && l.milk !== 'cow') parts.push(optName('milk', l.milk).toLowerCase() + ' молоко'); if (l.syrup && l.syrup !== 'none') parts.push(optName('syrup', l.syrup).toLowerCase()); return parts.join(' · ') || (it.food ? 'завтрак' : ''); };
  const cartCount = () => cart.reduce((s, l) => s + l.qty, 0);
  const cartTotal = () => cart.reduce((s, l) => s + unitPrice(l) * l.qty, 0);
  function saveCart() { cart = cart.filter(l => l.qty > 0 && byId[l.id]); store.set('cart', cart); renderCartEverywhere(); }
  function addToCart(id, milk, syrup, qty = 1) {
    const l = { id, milk: milk || null, syrup: syrup || null, qty }; const k = lineKey(l);
    const ex = cart.find(x => lineKey(x) === k); if (ex) ex.qty += qty; else cart.push(l);
    saveCart(); toast(`${byId[id].name} — в заказе`);
  }
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return n + ' ' + (m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c); };

  function renderCartEverywhere() {
    const n = cartCount();
    $$('.js-cart-count').forEach(el => { el.textContent = n || ''; el.toggleAttribute('data-zero', !n); });
    renderCartPanel(); renderCartBar(); renderSummary();
  }
  function linesHTML(editable) {
    return cart.map((l, i) => { const it = byId[l.id]; return `
      <div class="line">
        <img src="img/${it.img}.jpg" alt="" width="64" height="64" loading="lazy">
        <div class="line__info"><b>${esc(it.name)}</b><span class="small muted">${esc(lineOpts(l))}</span><span class="small"><b>${money(unitPrice(l) * l.qty)}</b></span></div>
        ${editable ? `<div class="stepper"><button type="button" data-step="-1" data-i="${i}" aria-label="Убрать одну">${icon('minus')}</button><span>${l.qty}</span><button type="button" data-step="1" data-i="${i}" aria-label="Добавить ещё">${icon('plus')}</button></div>` : `<span class="small muted">× ${l.qty}</span>`}
      </div>`; }).join('');
  }
  const emptyHTML = `<div class="cart-empty"><svg aria-hidden="true"><use href="img/icons.svg#bean"/></svg><b style="color:var(--espresso)">Пока пусто</b><span class="small">Нажми «+» у напитка — и он появится здесь.</span></div>`;

  function renderCartPanel() {
    const box = $('#cart'); if (!box) return;
    const n = cartCount(); const time = store.get('time', null);
    if (!n) { box.innerHTML = `<div class="panel__head"><h2 class="h3">Твой заказ</h2></div>${emptyHTML}`; return; }
    const slots = timeSlots(3);
    const cur = slots.some(s => s.value === time) ? time : slots[0].value;
    box.innerHTML = `
      <div class="panel__head"><h2 class="h3">Твой заказ</h2><span class="small muted">${plural(n, 'позиция', 'позиции', 'позиций')}</span></div>
      <div class="cart-lines">${linesHTML(true)}</div>
      <div class="divider"></div>
      <div class="opt"><span class="opt__title">Когда заберёшь?</span>
        <div class="chips" role="radiogroup" aria-label="Время выдачи">${slots.map(s => `<button type="button" class="chip chip--outline" role="radio" aria-checked="${s.value === cur}" data-time="${s.value}">${s.label}</button>`).join('')}</div></div>
      <div class="divider"></div>
      <div class="kv kv--total"><span>Итого</span><b>${money(cartTotal())}</b></div>
      <a class="btn btn--primary btn--block" href="checkout.html">Оформить заказ</a>
      <p class="small muted">Готовим около 7 минут · оплата онлайн или на месте</p>`;
    if (time !== cur) store.set('time', cur);
  }
  function renderCartBar() {
    const bar = $('#cart-bar'); if (!bar) return;
    const n = cartCount(); bar.classList.toggle('is-visible', n > 0);
    const t = store.get('time', 'asap'); const tOk = timeSlots(5).some(s => s.value === t);
    if (n) bar.innerHTML = `<div><small>${plural(n, 'позиция', 'позиции', 'позиций')} · ${slotLabel(tOk ? t : 'asap')}</small><span class="price">${money(cartTotal())}</span></div><a class="btn btn--light btn--m" href="checkout.html">Оформить</a>`;
  }

  // ---------- Тост
  let toastTimer;
  function toast(text) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    const onMenu = !!$('#cart');
    t.innerHTML = `${icon('check')}<span>${esc(text)}</span>${onMenu ? '' : '<a href="menu.html#cart">Корзина</a>'}`;
    requestAnimationFrame(() => t.classList.add('is-visible'));
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-visible'), 2600);
  }

  // ---------- Окно выбора напитка
  let sheet, sheetState;
  function openSheet(id) {
    const it = byId[id]; if (!it) return;
    if (it.food) { addToCart(id); return; }
    sheetState = { id, milk: it.milk ? 'cow' : null, syrup: 'none', qty: 1 };
    if (!sheet) { sheet = document.createElement('div'); sheet.className = 'sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); document.body.appendChild(sheet);
      sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('.sheet__close')) closeSheet(); });
    }
    const group = (key, title) => `<div class="opt"><span class="opt__title">${title}</span><div class="chips" role="radiogroup">${OPT[key].map(o => `<button type="button" class="chip chip--outline" role="radio" data-opt="${key}" data-val="${o.id}" aria-checked="${sheetState[key] === o.id}">${o.name}${o.add ? ` +${o.add.toFixed(2).replace('.', ',')}` : ''}</button>`).join('')}</div></div>`;
    sheet.innerHTML = `<div class="sheet__box" aria-labelledby="sheet-title">
      <div class="sheet__img"><img src="img/${it.img}.jpg" alt="${esc(it.name)}"><button class="sheet__close" type="button" aria-label="Закрыть">${icon('close')}</button></div>
      <div class="sheet__body">
        <div><h2 class="h3" id="sheet-title">${esc(it.name)}</h2><p class="small muted">${esc(it.desc)}</p></div>
        ${it.milk ? group('milk', 'Молоко') : ''}${group('syrup', 'Сироп')}
        <div class="sheet__foot"><div class="stepper"><button type="button" data-sq="-1" aria-label="Меньше">${icon('minus')}</button><span id="sq">1</span><button type="button" data-sq="1" aria-label="Больше">${icon('plus')}</button></div>
        <button type="button" class="btn btn--primary" id="sheet-add"></button></div>
      </div></div>`;
    updateSheet(); sheet.classList.add('is-open'); document.body.style.overflow = 'hidden';
    setTimeout(() => $('#sheet-add', sheet).focus(), 50);
  }
  function updateSheet() {
    const p = unitPrice(sheetState) * sheetState.qty;
    $('#sheet-add', sheet).textContent = `Добавить · ${money(p)}`; $('#sq', sheet).textContent = sheetState.qty;
    $$('[data-opt]', sheet).forEach(b => b.setAttribute('aria-checked', sheetState[b.dataset.opt] === b.dataset.val));
  }
  function closeSheet() { if (!sheet) return; sheet.classList.remove('is-open'); document.body.style.overflow = ''; }

  // ---------- Делегирование кликов
  document.addEventListener('click', e => {
    const add = e.target.closest('[data-add]'); if (add) { e.preventDefault(); openSheet(add.dataset.add); return; }
    if (sheet && sheet.contains(e.target)) {
      const o = e.target.closest('[data-opt]'); if (o) { sheetState[o.dataset.opt] = o.dataset.val; updateSheet(); return; }
      const q = e.target.closest('[data-sq]'); if (q) { sheetState.qty = Math.max(1, Math.min(9, sheetState.qty + +q.dataset.sq)); updateSheet(); return; }
      if (e.target.closest('#sheet-add')) { addToCart(sheetState.id, sheetState.milk, sheetState.syrup === 'none' ? null : sheetState.syrup, sheetState.qty); closeSheet(); return; }
    }
    const st = e.target.closest('[data-step]'); if (st) { const l = cart[+st.dataset.i]; if (l) { l.qty = Math.max(0, l.qty + +st.dataset.step); saveCart(); } return; }
    const tm = e.target.closest('[data-time]'); if (tm) { store.set('time', tm.dataset.time); renderCartEverywhere(); return; }
    const radio = e.target.closest('.js-radio [role="radio"]'); if (radio) { $$('[role="radio"]', radio.parentElement).forEach(b => b.setAttribute('aria-checked', b === radio)); return; }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSheet(); closeNav(); } });
  document.addEventListener('input', e => { const fl = e.target.closest && e.target.closest('.field.is-invalid'); if (fl) fl.classList.remove('is-invalid'); });

  // ---------- Шапка: статус, бургер
  function initHeader() {
    const st = openState();
    $$('.js-open-badge').forEach(b => { b.textContent = st.text; b.classList.toggle('is-closed', !st.open); });
    $$('.js-open-badge-full').forEach(b => { b.textContent = st.text + ' · ул. Замковая, 12'; b.classList.toggle('is-closed', !st.open); });
    const nav = $('#mobile-nav');
    $$('.js-burger').forEach(b => b.addEventListener('click', () => { nav.classList.add('is-open'); nav.setAttribute('aria-hidden', 'false'); }));
    $$('.js-nav-close, #mobile-nav a').forEach(b => b.addEventListener('click', closeNav));
  }
  function closeNav() { const nav = $('#mobile-nav'); if (nav) { nav.classList.remove('is-open'); nav.setAttribute('aria-hidden', 'true'); } }

  // ---------- Появление при прокрутке
  function initReveal() {
    const els = $$('.reveal'); if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(e => io.observe(e));
  }

  // ---------- Карточки напитков
  function cardHTML(it) {
    return `<article class="card reveal" data-cat="${it.cat}" data-milk="${it.milk}" data-new="${!!it.isNew}">
      <div class="card__img"><img src="img/${it.img}.jpg" alt="${esc(it.name)}" loading="lazy" width="384" height="260"></div>
      ${it.isNew ? '<span class="tag hand">новинка!</span>' : ''}
      <div class="card__body"><h3 class="h3">${esc(it.name)}</h3><p class="small muted">${esc(it.desc)}</p>
        <div class="card__foot"><span class="price">${money(it.price)}</span><button class="icon-btn" type="button" data-add="${it.id}" aria-label="Добавить: ${esc(it.name)}">${icon('plus')}</button></div></div>
    </article>`;
  }
  function initPopular() {
    const box = $('#popular'); if (!box) return;
    box.innerHTML = MENU.filter(i => i.popular).sort((a, b) => a.popular - b.popular).map(cardHTML).join('');
    $$('#popular-filters .chip').forEach(ch => ch.addEventListener('click', () => {
      $$('#popular-filters .chip').forEach(c => c.setAttribute('aria-pressed', c === ch));
      const f = ch.dataset.filter;
      $$('#popular .card').forEach(c => { c.hidden = !(f === 'all' || (f === 'coffee' && c.dataset.cat !== 'nocoffee') || (f === 'nocoffee' && c.dataset.cat === 'nocoffee') || (f === 'nomilk' && c.dataset.milk === 'false') || (f === 'new' && c.dataset.new === 'true')); });
    }));
  }

  // ---------- Страница меню
  function initMenu() {
    const box = $('#catalog'); if (!box) return;
    box.innerHTML = CATS.map(c => {
      const items = MENU.filter(i => i.cat === c.id);
      const body = c.id === 'breakfast'
        ? `<ul class="list">${items.map(it => `<li class="reveal" data-milk="${it.milk}" data-new="false"><div><b>${esc(it.name)}</b><span class="small muted">${esc(it.desc)}</span></div><div class="list-add"><span class="price">${money(it.price)}</span><button class="icon-btn" type="button" data-add="${it.id}" aria-label="Добавить: ${esc(it.name)}">${icon('plus')}</button></div></li>`).join('')}</ul>`
        : `<div class="grid">${items.map(cardHTML).join('')}</div>`;
      return `<section class="cat" id="cat-${c.id}" data-cat="${c.id}"><div class="cat__head"><h2 class="h3">${c.name}</h2><span class="small muted">${plural(items.length, 'позиция', 'позиции', 'позиций')}</span></div>${body}</section>`;
    }).join('') + '<p class="empty" id="empty" hidden>Под эти фильтры ничего не нашлось. Попробуй убрать «Без молока» или «Новинки».</p>';
    const state = { cat: 'all', nomilk: false, isnew: false };
    function apply() {
      let any = false;
      $$('.cat', box).forEach(sec => {
        const showCat = state.cat === 'all' || state.cat === sec.dataset.cat; let vis = 0;
        $$('.card, .list li', sec).forEach(el => { const ok = showCat && (!state.nomilk || el.dataset.milk === 'false') && (!state.isnew || el.dataset.new === 'true'); el.hidden = !ok; if (ok) vis++; });
        sec.hidden = !vis; if (vis) any = true;
      });
      $('#empty').hidden = any;
    }
    $$('[data-cat-filter]').forEach(ch => ch.addEventListener('click', () => { state.cat = ch.dataset.catFilter; $$('[data-cat-filter]').forEach(c => c.setAttribute('aria-pressed', c === ch)); apply(); }));
    $$('[data-toggle]').forEach(ch => ch.addEventListener('click', () => { const k = ch.dataset.toggle; state[k] = !state[k]; ch.setAttribute('aria-pressed', state[k]); apply(); }));
    const hash = location.hash.replace('#', ''); if (CATS.some(c => 'cat-' + c.id === hash)) { const b = $(`[data-cat-filter="${hash.slice(4)}"]`); if (b) b.click(); }
  }

  // ---------- Оформление
  function renderSummary() {
    const box = $('#summary-lines'); if (!box) return;
    const n = cartCount();
    $('#checkout-empty').hidden = !!n; $('#checkout').hidden = !n;
    if (!n) return;
    box.innerHTML = linesHTML(true);
    const total = money(cartTotal());
    $$('.js-total').forEach(el => el.textContent = total);
    const pay = $('input[name="pay"]:checked'); $('#pay-btn').textContent = pay && pay.value === 'online' ? `Оплатить ${total}` : `Оформить заказ · ${total}`;
  }
  function initCheckout() {
    const form = $('#checkout'); if (!form) return;
    const f = form.elements;
    const slots = timeSlots(5); const saved = store.get('time', null);
    const cur = slots.some(s => s.value === saved) ? saved : slots[0].value;
    $('#time-chips').innerHTML = slots.map(s => `<button type="button" class="chip chip--outline" role="radio" aria-checked="${s.value === cur}" data-time="${s.value}">${s.label}</button>`).join('');
    store.set('time', cur);
    const updNote = () => { const v = store.get('time', 'asap'); $('#time-note').textContent = v === 'asap' ? 'Начнём готовить сразу — обычно это 7–10 минут' : `Начнём готовить заранее — кофе будет горячим к ${slotLabel(v)}`; $$('#time-chips [data-time]').forEach(b => b.setAttribute('aria-checked', b.dataset.time === v)); };
    updNote(); $('#time-chips').addEventListener('click', () => setTimeout(updNote));
    const saved2 = store.get('guest', {}); if (saved2.name) f['name'].value = saved2.name; if (saved2.phone) f['phone'].value = saved2.phone;
    form.addEventListener('change', renderSummary);
    f['phone'].addEventListener('input', () => { const d = f['phone'].value.replace(/\D/g, '').replace(/^375/, '').slice(0, 9); let s = '+375'; if (d.length) s += ' ' + d.slice(0, 2); if (d.length > 2) s += ' ' + d.slice(2, 5); if (d.length > 5) s += '-' + d.slice(5, 7); if (d.length > 7) s += '-' + d.slice(7, 9); f['phone'].value = s; });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = f['name'].value.trim(); const phoneOk = f['phone'].value.replace(/\D/g, '').length === 12;
      f['name'].closest('.field').classList.toggle('is-invalid', !name);
      f['phone'].closest('.field').classList.toggle('is-invalid', !phoneOk);
      if (!name || !phoneOk) { (name ? f['phone'] : f['name']).focus(); return; }
      store.set('guest', { name, phone: f['phone'].value });
      const order = { no: String(Math.floor(Math.random() * 900) + 100), name, time: store.get('time', 'asap'), pay: f['pay'].value, comment: f['comment'].value.trim(), lines: cart.map(l => ({ ...l })), total: cartTotal(), at: Date.now() };
      store.set('order', order); cart = []; saveCart();
      location.href = 'success.html';
    });
  }

  // ---------- Заказ принят
  function initSuccess() {
    const box = $('#done'); if (!box) return;
    const o = store.get('order', null);
    if (!o) { $('#done-title').textContent = 'Заказов пока нет'; $('#done-text').textContent = 'Загляни в меню и собери свой первый предзаказ.'; $('#done-info').hidden = true; $('#progress').hidden = true; return; }
    const names = o.lines.map(l => byId[l.id] && byId[l.id].name).filter(Boolean).map(n => n[0].toLowerCase() + n.slice(1));
    const what = names.length === 1 ? `Твой ${names[0]} будет готов` : `Твой заказ (${names.join(', ')}) будет готов`;
    $('#done-text').innerHTML = `${esc(what)} ${o.time === 'asap' ? 'через 7–10 минут' : 'к ' + slotLabel(o.time)}.<br>Мы подпишем стаканчик: «${esc(o.name)}».`;
    $('#d-no').textContent = '№ ' + o.no; $('#d-time').textContent = o.time === 'asap' ? 'через 7–10 минут' : 'сегодня в ' + slotLabel(o.time);
    $('#d-pay-k').textContent = o.pay === 'online' ? 'Оплачено' : 'К оплате у стойки'; $('#d-pay').textContent = money(o.total);
    const steps = $$('#progress li:not(.bar)'); let i = 1;
    const tick = () => { steps.forEach((s, j) => { s.classList.toggle('is-done', j < i); s.classList.toggle('is-now', j === i); }); };
    tick(); setTimeout(() => { i = 2; tick(); }, 6000); setTimeout(() => { i = 3; tick(); $('#done-hand').textContent = 'готово — забирай!'; }, 12000);
  }

  // ---------- Бронь
  function initBooking() {
    const form = $('#booking-form'); if (!form) return;
    const d = $('#b-date'); if (d) { const t = new Date(); d.min = t.toISOString().slice(0, 10); if (!d.value) d.value = d.min; }
    form.addEventListener('submit', e => {
      e.preventDefault(); let ok = true;
      [['b-name', v => v.trim().length > 0], ['b-phone', v => v.replace(/\D/g, '').length >= 9]].forEach(([id, test]) => { const el = $('#' + id); const good = test(el.value); el.closest('.field').classList.toggle('is-invalid', !good); if (!good && ok) { el.focus(); ok = false; } });
      if (!ok) return;
      const g = $('.js-radio [aria-checked="true"]', form); const done = $('#booking-done');
      done.querySelector('span').textContent = `Готово! Ждём тебя ${new Date(d.value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в ${$('#b-time').value}, гостей: ${g ? g.textContent : 2}. Подтвердим в Telegram.`;
      done.classList.add('is-visible'); form.reset(); if (d) d.value = d.min;
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHeader(); initPopular(); initMenu(); initCheckout(); initSuccess(); initBooking();
    renderCartEverywhere(); initReveal();
    const y = $('.js-year'); if (y) y.textContent = new Date().getFullYear();
  });
})();
