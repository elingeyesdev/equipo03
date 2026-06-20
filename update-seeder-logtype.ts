import * as fs from 'fs';

let content = fs.readFileSync('src/scripts/seeder.ts', 'utf8');

const repsOnlyList = [
  'Push-ups (Flexiones)', 
  'Dominadas (Pull-ups)', 
  'Elevación de Piernas Colgado', 
  'Crunch Abdominal', 
  'Plancha (Plank)'
];

content = content.replace(/\{\s*name:\s*'([^']+)',\s*muscleGroup:(.*?)\s*\}/g, (match, name, rest) => {
  let logType = "'WEIGHT_REPS'";
  if (rest.includes("category: 'CARDIO'")) {
    logType = "'TIME_DISTANCE'";
  } else if (repsOnlyList.includes(name)) {
    logType = "'REPS_ONLY'";
  }
  return `{ name: '${name}', muscleGroup:${rest}, logType: ${logType} }`;
});

fs.writeFileSync('src/scripts/seeder.ts', content, 'utf8');
console.log("seeder.ts updated!");
