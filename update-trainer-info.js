// Script to update trainer info in Firebase
// Run with: node update-trainer-info.js (or open in browser console on the site)

const updates = [
  {
    name: 'Газимагомед',
    category: 'Фитнес, Бодибилдинг',
    description: 'Персональный тренер по фитнесу и бодибилдингу'
  },
  {
    name: 'Али',
    category: 'Бокс, Кикбоксинг',
    description: 'Персональный тренер по боксу и кикбоксингу'
  },
  {
    name: 'Мурад',
    category: 'Фитнес',
    description: 'Старший тренер. Персональный тренер по фитнесу'
  },
  {
    name: 'Магомедов Шамиль',
    category: 'Единоборства',
    description: 'Старший тренер. Персональный тренер по единоборствам'
  }
];

// This will be run in browser console
async function updateTrainers() {
  const { FirebaseManager } = await import('./js/firebase.js');
  const firebase = new FirebaseManager();
  const trainers = await firebase.loadTrainers();
  
  for (const update of updates) {
    const trainer = trainers.find(t => t.title.includes(update.name));
    if (trainer) {
      trainer.category = update.category;
      trainer.description = update.description;
      await firebase.saveTrainer(trainer);
      console.log('Updated:', trainer.title);
    } else {
      console.log('Not found:', update.name);
    }
  }
  console.log('Done!');
}

// Export for browser
if (typeof window !== 'undefined') {
  window.updateTrainers = updateTrainers;
}
