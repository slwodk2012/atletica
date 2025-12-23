// Скрипт для исправления localStorage
// Запустите в консоли браузера (F12)

console.log('🔧 Исправление localStorage...');

// 1. Загрузить данные из JSON
fetch('data/products.json')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Загружено из JSON:', data.products.length, 'тренеров');
    
    // 2. Сохранить в localStorage как массив
    localStorage.setItem('trainersData', JSON.stringify(data.products));
    console.log('✅ Сохранено в localStorage');
    
    // 3. Проверить
    const saved = JSON.parse(localStorage.getItem('trainersData'));
    console.log('✅ Проверка:', saved.length, 'тренеров в localStorage');
    
    console.log('🎉 Готово! Обновите страницу (F5)');
  })
  .catch(error => {
    console.error('❌ Ошибка:', error);
  });
