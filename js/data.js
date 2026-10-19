// Меню кофейни «Зерне». milk — в напитке есть молоко (тогда можно выбрать молоко), isNew — бейдж «новинка!».
window.ZERNE_MENU = [
  { id: 'espresso', cat: 'classic', name: 'Эспрессо', desc: 'плотный, с карамельной сладостью · 40 мл', price: 4.0, img: 'espresso', milk: false },
  { id: 'americano', cat: 'classic', name: 'Американо', desc: 'эспрессо и горячая вода · 300 мл', price: 4.5, img: 'americano', milk: false },
  { id: 'cappuccino', cat: 'classic', name: 'Капучино', desc: 'эспрессо, молоко, нежная пенка · 300 мл', price: 6.0, img: 'cappuccino', milk: true, popular: 1 },
  { id: 'flat-white', cat: 'classic', name: 'Флэт уайт', desc: 'двойной ристретто, бархатное молоко · 250 мл', price: 6.5, img: 'flat-white', milk: true, popular: 2 },
  { id: 'latte', cat: 'classic', name: 'Латте', desc: 'много молока и немного эспрессо · 350 мл', price: 6.5, img: 'latte', milk: true },
  { id: 'raf', cat: 'classic', name: 'Раф классический', desc: 'сливки, ванильный сахар · 300 мл', price: 7.0, img: 'raf', milk: true },
  { id: 'raf-lavender', cat: 'author', name: 'Раф «Лаванда»', desc: 'сливки, ваниль, лавандовый сироп · 300 мл', price: 7.5, img: 'raf-lavender', milk: true, isNew: true, popular: 3 },
  { id: 'espresso-tonic', cat: 'author', name: 'Эспрессо-тоник', desc: 'эспрессо, тоник, апельсиновая цедра · 300 мл', price: 7.0, img: 'espresso-tonic', milk: false, popular: 4 },
  { id: 'sea-buckthorn', cat: 'author', name: 'Облепиховый латте', desc: 'облепиха, мёд, молоко · 300 мл', price: 7.5, img: 'sea-buckthorn-latte', milk: true, isNew: true },
  { id: 'matcha', cat: 'nocoffee', name: 'Матча латте', desc: 'японская матча, молоко на выбор · 300 мл', price: 8.0, img: 'matcha', milk: true, popular: 5 },
  { id: 'cocoa', cat: 'nocoffee', name: 'Какао с маршмеллоу', desc: 'бельгийский шоколад, маршмеллоу · 300 мл', price: 6.5, img: 'cocoa', milk: true, popular: 6 },
  { id: 'thyme-tea', cat: 'nocoffee', name: 'Чай с чабрецом', desc: 'чёрный чай, чабрец, мёд · 400 мл', price: 5.0, img: 'thyme-tea', milk: false },
  { id: 'syrniki', cat: 'breakfast', name: 'Сырники со сметаной', desc: 'ягодный соус, свежая мята', price: 9.5, img: 'breakfast', milk: false, food: true },
  { id: 'granola', cat: 'breakfast', name: 'Гранола с йогуртом', desc: 'печёная груша, мёд, грецкий орех', price: 8.0, img: 'breakfast', milk: false, food: true },
  { id: 'croissant', cat: 'breakfast', name: 'Круассан с лососем', desc: 'сливочный сыр, огурец, укроп', price: 11.5, img: 'breakfast', milk: false, food: true },
  { id: 'toast', cat: 'breakfast', name: 'Тост с авокадо', desc: 'яйцо пашот, микрозелень, кунжут', price: 10.5, img: 'breakfast', milk: false, food: true },
];

window.ZERNE_CATS = [
  { id: 'classic', name: 'Кофе классика' },
  { id: 'author', name: 'Авторские' },
  { id: 'nocoffee', name: 'Не кофе' },
  { id: 'breakfast', name: 'Завтраки до 12:00' },
];

window.ZERNE_OPTIONS = {
  milk: [
    { id: 'cow', name: 'Обычное', add: 0 },
    { id: 'oat', name: 'Овсяное', add: 1.0 },
    { id: 'lactose-free', name: 'Безлактозное', add: 0.5 },
  ],
  syrup: [
    { id: 'none', name: 'Без сиропа', add: 0 },
    { id: 'vanilla', name: 'Ваниль', add: 1.0 },
    { id: 'caramel', name: 'Солёная карамель', add: 1.0 },
  ],
};
