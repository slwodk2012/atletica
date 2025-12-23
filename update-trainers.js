const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

// Обновляем Мурада
const murad = data.products.find(p => p.title === 'Мурад');
if (murad) {
  murad.description = 'Персональный тренер по кроссфиту';
  murad.category = 'Кроссфит';
  murad.specialization = [
    'силовой тренинг',
    'набор мышечной массы',
    'снижение веса',
    'постановка техники выполнения упражнений',
    'тренировки с подростками и людьми старшей возрастной группы'
  ];
}

// Обновляем Шамиля
const shamil = data.products.find(p => p.title === 'Шамиль');
if (shamil) {
  shamil.description = 'Персональный тренер по кроссфиту';
  shamil.category = 'Кроссфит';
  shamil.specialization = [
    'функциональный и силовой тренинг',
    'увеличение выносливости',
    'повышение работоспособности и устойчивой мотивации к занятиям',
    'восстановление после операций (коленный сустав, позвоночник)',
    'снижение веса',
    'консультации по питанию'
  ];
}

// Обновляем Шамиля 2
const shamil2 = data.products.find(p => p.title === 'Шамиль 2');
if (shamil2) {
  shamil2.description = 'Персональный тренер по фитнесу';
  shamil2.category = 'Фитнес';
  shamil2.specialization = [
    'функциональный и силовой тренинг',
    'набор мышечной массы',
    'увеличение выносливости',
    'улучшение общей физической подготовки',
    'рекомендации по питанию'
  ];
}

// Добавляем Арслана (новый тренер)
const arslan = {
  id: 'prod-013',
  title: 'Арслан',
  description: 'Персональный тренер по фитнесу',
  category: 'Фитнес',
  experience: 'Стаж 5 лет',
  price: 2500,
  currency: 'RUB',
  image: '',
  imageAlt: 'Тренер Арслан',
  images: [],
  detailedDescription: 'Персональный тренер по фитнесу.',
  specialization: [
    'функциональный и силовой тренинг',
    'набор мышечной массы',
    'увеличение выносливости',
    'увеличение силовых показателей',
    'подбор программы под любую комплектацию (тела)',
    'советы по питанию'
  ],
  education: ''
};

// Проверяем, нет ли уже Арслана
if (!data.products.find(p => p.title === 'Арслан')) {
  data.products.push(arslan);
}

fs.writeFileSync('data/products.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Данные обновлены!');
