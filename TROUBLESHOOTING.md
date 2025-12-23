# 🔧 Решение проблем

## Проблема: Карточки тренеров не отображаются

### Решение 1: Проверка данных

1. Откройте `http://localhost:8000/test-debug.html`
2. Проверьте, загружаются ли данные
3. Если данные не загружаются, проверьте путь к `data/products.json`

### Решение 2: Очистка localStorage

1. Откройте консоль браузера (F12)
2. Выполните:
```javascript
localStorage.clear();
location.reload();
```

### Решение 3: Ручное исправление localStorage

1. Откройте консоль браузера (F12)
2. Скопируйте и выполните код из файла `fix-localStorage.js`
3. Обновите страницу (F5)

### Решение 4: Проверка в консоли

Откройте консоль (F12) и проверьте:

```javascript
// Проверить загрузку данных
fetch('data/products.json')
  .then(r => r.json())
  .then(d => console.log('Данные:', d.products.length));

// Проверить localStorage
const data = localStorage.getItem('trainersData');
console.log('localStorage:', data ? JSON.parse(data).length : 'пусто');
```

## Проблема: Гамбургер-меню не работает

### Решение 1: Проверка элементов

Откройте консоль (F12) и выполните:

```javascript
const hamburger = document.getElementById('hamburger');
const sideMenu = document.getElementById('sideMenu');
console.log('Hamburger:', hamburger);
console.log('Side Menu:', sideMenu);
```

Если элементы `null`, проверьте HTML.

### Решение 2: Проверка CSS

1. Откройте DevTools (F12) → Elements
2. Найдите элемент с классом `.hamburger`
3. Проверьте, что CSS загружен (должен быть желтый цвет границы)

### Решение 3: Проверка JavaScript

Откройте консоль и проверьте ошибки. Если есть ошибки импорта модулей, убедитесь, что:
- Сервер запущен (`python -m http.server 8000`)
- Файлы `.js` имеют правильные пути

### Решение 4: Ручной тест меню

Выполните в консоли:

```javascript
const hamburger = document.getElementById('hamburger');
const sideMenu = document.getElementById('sideMenu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  sideMenu.classList.toggle('active');
  console.log('Menu toggled!');
});

// Теперь кликните на гамбургер
```

## Проблема: Данные не сохраняются в админке

### Решение:

1. Проверьте, что вы вошли в систему (admin/admin123)
2. После сохранения обновите страницу (F5)
3. Проверьте localStorage:

```javascript
const data = localStorage.getItem('trainersData');
console.log('Сохранено тренеров:', JSON.parse(data).length);
```

## Общие команды для отладки

### Очистить все данные
```javascript
localStorage.clear();
location.reload();
```

### Проверить все данные
```javascript
console.log('localStorage keys:', Object.keys(localStorage));
console.log('trainersData:', localStorage.getItem('trainersData'));
console.log('siteSettings:', localStorage.getItem('siteSettings'));
console.log('visualEditorStyles:', localStorage.getItem('visualEditorStyles'));
```

### Загрузить данные заново
```javascript
fetch('data/products.json')
  .then(r => r.json())
  .then(d => {
    localStorage.setItem('trainersData', JSON.stringify(d.products));
    location.reload();
  });
```

## Проверка сервера

Убедитесь, что сервер запущен:

```bash
python -m http.server 8000
```

Затем откройте: `http://localhost:8000`

## Проверка файлов

Убедитесь, что все файлы на месте:

```
├── index.html
├── css/
│   ├── main.css
│   ├── cards.css
│   ├── admin.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── dataManager.js
│   ├── cardRenderer.js
│   ├── modal.js
│   └── visualEditor.js
└── data/
    └── products.json
```

## Контакты для помощи

Если проблемы продолжаются:
1. Откройте консоль (F12)
2. Сделайте скриншот ошибок
3. Проверьте вкладку Network на наличие 404 ошибок
