const fs = require('fs');

const seederPath = 'src/scripts/seeder.ts';
let content = fs.readFileSync(seederPath, 'utf8');

// Replace any exercise line
content = content.replace(/\{\s*name:\s*(['"])([^'"]+)\1,(.*?)\}/g, (match, q, name, rest) => {
    // skip non-exercises
    if (!rest.includes('category:')) return match;

    // Remove existing logType if it's there
    let cleanedRest = rest.replace(/,\s*logType:\s*['"]([^'"]+)['"]/g, '');
    // Sometimes there's a trailing comma left over if logType was at the end, but regex `,\s*logType` takes care of it

    let categoryMatch = cleanedRest.match(/category:\s*'([^']+)'/);
    let category = categoryMatch ? categoryMatch[1] : '';
    
    let equipMatch = cleanedRest.match(/equipmentRequired:\s*'([^']*)'/);
    let equip = equipMatch ? equipMatch[1] : '';

    let isTimeOnly = name.includes('Plancha') || name.includes('Stretch') || name.includes('Cat-Cow') || name.includes('Pose');
    
    // Check if equipment implies weight
    let hasWeightEq = equip.includes('Mancuerna') || 
                      equip.includes('Barra') || 
                      equip.includes('Polea') || 
                      equip.includes('Máquina') || 
                      equip.includes('Kettlebell') || 
                      equip.includes('Disco') || 
                      equip.includes('Rueda abdominal') || 
                      equip.includes('Slam ball') || 
                      equip.includes('Llanta') || 
                      equip.includes('Balón medicinal');
    
    if (equip === 'Barra dominadas') hasWeightEq = false; // bodyweight
    if (equip === 'Paralelas') hasWeightEq = false; // bodyweight
    if (equip === 'Banco o silla') hasWeightEq = false; // bodyweight
    
    let logType = 'WEIGHT_REPS';

    if (category === 'CARDIO') {
        logType = 'TIME_DISTANCE';
    } else if (isTimeOnly) {
        logType = 'TIME_ONLY';
    } else if (!hasWeightEq) {
        logType = 'REPS_ONLY';
    } else {
        logType = 'WEIGHT_REPS';
    }

    return `{ name: ${q}${name}${q},${cleanedRest}, logType: '${logType}' }`;
});

fs.writeFileSync(seederPath, content, 'utf8');
console.log('Seeder updated with audited logic!');
