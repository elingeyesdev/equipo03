const fs = require('fs');
const seederPath = 'src/scripts/seeder.ts';
let content = fs.readFileSync(seederPath, 'utf8');

const targets = ['Elevación de Piernas Colgado', 'Dominadas (Pull-ups)', 'Plancha (Plank)', 'Burpees', 'Crossover en Polea'];

targets.forEach(t => {
    let match = content.match(new RegExp(`.*name:\\s*['"]${t.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}['"].*`));
    if (match) console.log(match[0].trim());
});
