// src/scripts/seed-video-urls.ts
// Actualiza video_url en exercise_catalog usando nombres exactos del catálogo.
// Ejecutar: npm run db:video-urls
import { AppDataSource } from '../config/data-source.cli';
import { ExerciseCatalog } from '../exercises/domain/exercise-catalog.entity';

const VIDEO_DATA: { name: string; videoUrl: string }[] = [
  // ── PECHO ─────────────────────────────────────────────────────────────────────
  { name: 'Press de Banca Plano',                      videoUrl: 'https://www.youtube.com/shorts/_XvyWBUeJwU' },
  { name: 'Press de Banca Inclinado',                  videoUrl: 'https://www.youtube.com/shorts/9IrOq4WapSQ' },
  { name: 'Aperturas con Mancuernas',                  videoUrl: 'https://www.youtube.com/shorts/UgmYbrytasw' },
  { name: 'Fondos en Paralelas',                       videoUrl: 'https://www.youtube.com/shorts/ZtONmh5a_fU' },
  { name: 'Crossover en Polea',                        videoUrl: 'https://www.youtube.com/shorts/Jokaz7dBJNg' },
  { name: 'Push-ups (Flexiones)',                      videoUrl: 'https://www.youtube.com/shorts/-m9buxRuWEc' },

  // ── DORSALES ──────────────────────────────────────────────────────────────────
  { name: 'Jalón al Pecho',                            videoUrl: 'https://www.youtube.com/shorts/trZQjegcRx0' },
  { name: 'Remo con Barra',                            videoUrl: 'https://www.youtube.com/shorts/pegqZPBqK_k' },
  { name: 'Remo con Mancuerna',                        videoUrl: 'https://www.youtube.com/shorts/H8jf3DwlIlo' },
  { name: 'Dominadas (Pull-ups)',                      videoUrl: 'https://www.youtube.com/shorts/cr5KmVftdbE' },
  { name: 'Remo en Polea Baja',                        videoUrl: 'https://www.youtube.com/shorts/8QuMq1GMMng' },
  { name: 'Pullover con Mancuerna',                    videoUrl: 'https://www.youtube.com/shorts/jCV5t9Cy4hI' },

  // ── HOMBROS ───────────────────────────────────────────────────────────────────
  { name: 'Press Militar con Barra',                   videoUrl: 'https://www.youtube.com/shorts/O8Z0gPBh4j8' },
  { name: 'Press de Hombros con Mancuernas',           videoUrl: 'https://www.youtube.com/shorts/2D0TyoHv_EY' },
  { name: 'Elevaciones Laterales',                     videoUrl: 'https://www.youtube.com/shorts/tGfZu2dwLXo' },
  { name: 'Elevaciones Frontales',                     videoUrl: 'https://www.youtube.com/shorts/h9xfpTrAvkE' },
  { name: 'Vuelos Posteriores',                        videoUrl: 'https://www.youtube.com/shorts/tt4cUiD8hR8' },

  // ── BÍCEPS ────────────────────────────────────────────────────────────────────
  { name: 'Curl de Bíceps con Barra',                  videoUrl: 'https://www.youtube.com/shorts/3v4Zc7iujIk' },
  { name: 'Curl con Mancuernas Alterno',               videoUrl: 'https://www.youtube.com/shorts/FHY_2t7R714' },
  { name: 'Curl en Polea Baja',                        videoUrl: 'https://www.youtube.com/shorts/W0Wz4wXIIrQ' },
  { name: 'Curl Martillo',                             videoUrl: 'https://www.youtube.com/shorts/NyW2fT2gQhM' },
  { name: 'Curl Concentrado',                          videoUrl: 'https://www.youtube.com/shorts/cHxRJdSVIkA' },

  // ── TRÍCEPS ───────────────────────────────────────────────────────────────────
  { name: 'Press Francés',                             videoUrl: 'https://www.youtube.com/shorts/O-vNLrJDTTM' },
  { name: 'Extensiones en Polea Alta',                 videoUrl: 'https://www.youtube.com/shorts/aHfbuBf1TJk' },
  { name: 'Extensiones con Mancuerna sobre la Cabeza', videoUrl: 'https://www.youtube.com/shorts/8FNGBJUHfsA' },
  { name: 'Patada de Tríceps',                         videoUrl: 'https://www.youtube.com/shorts/3Bv1n7-DN7c' },
  { name: 'Fondos para Tríceps',                       videoUrl: 'https://www.youtube.com/shorts/ZtONmh5a_fU' },

  // ── CUÁDRICEPS ────────────────────────────────────────────────────────────────
  { name: 'Sentadilla con Barra (Back Squat)',          videoUrl: 'https://www.youtube.com/shorts/H5VYU6t_w9o' },
  { name: 'Sentadilla Frontal (Front Squat)',           videoUrl: 'https://www.youtube.com/shorts/r6Z_h_WAX5o' },
  { name: 'Prensa de Piernas',                         videoUrl: 'https://www.youtube.com/shorts/MDtA7bI8uE4' },
  { name: 'Zancadas (Lunges)',                         videoUrl: 'https://www.youtube.com/shorts/_lSFEA3uYY0' },
  { name: 'Sentadilla Búlgara',                        videoUrl: 'https://www.youtube.com/shorts/lG3MsPmEQQk' },
  { name: 'Extensión de Cuádriceps',                   videoUrl: 'https://www.youtube.com/shorts/N32sIi1ktv4' },

  // ── ISQUIOTIBIALES ────────────────────────────────────────────────────────────
  { name: 'Peso Muerto (Deadlift)',                    videoUrl: 'https://www.youtube.com/shorts/ZaTM37cfiDs' },
  { name: 'Peso Muerto Rumano',                        videoUrl: 'https://www.youtube.com/shorts/8tTKm-3wX5s' },
  { name: 'Curl de Piernas (Máquina)',                 videoUrl: 'https://www.youtube.com/shorts/sy_uiKaFtFA' },
  { name: 'Buenos Días (Good Mornings)',               videoUrl: 'https://www.youtube.com/shorts/yihU2gFswpk' },

  // ── GEMELOS ───────────────────────────────────────────────────────────────────
  { name: 'Elevación de Gemelos de Pie',               videoUrl: 'https://www.youtube.com/shorts/yQZDGjL-xT4' },
  { name: 'Elevación de Gemelos Sentado',              videoUrl: 'https://www.youtube.com/shorts/4f_-CJVbyxg' },

  // ── CORE ──────────────────────────────────────────────────────────────────────
  { name: 'Crunch Abdominal',                          videoUrl: 'https://www.youtube.com/shorts/11iRiN7Sb5Q' },
  { name: 'Plancha (Plank)',                           videoUrl: 'https://www.youtube.com/shorts/hoeNgjheDHk' },
  { name: 'Elevación de Piernas Colgado',              videoUrl: 'https://www.youtube.com/shorts/WFAziRYp2bg' },
  { name: 'Russian Twist',                             videoUrl: 'https://www.youtube.com/shorts/u0-X63Fq7LU' },
  { name: 'Ab Wheel (Rueda Abdominal)',                videoUrl: 'https://www.youtube.com/shorts/WXGBYjIOcN4' },
  { name: 'Crunches en Polea',                         videoUrl: 'https://www.youtube.com/shorts/dkGwcfo9zto' },

  // ── CARDIO — Steady-State ─────────────────────────────────────────────────────
  { name: 'Correr en Cinta',                           videoUrl: 'https://www.youtube.com/shorts/S3N5cv5iKI8' },
  { name: 'Bicicleta Estática',                        videoUrl: 'https://www.youtube.com/shorts/z99qyGHnFLI' },
  { name: 'Elíptica',                                  videoUrl: 'https://www.youtube.com/shorts/dBMotc3AiVc' },
  { name: 'Remo en Máquina (Rowing)',                  videoUrl: 'https://www.youtube.com/shorts/978LzxkqJ0M' },
  { name: 'Caminata Rápida',                           videoUrl: 'https://www.youtube.com/shorts/17fJGOV6tG4' },

  // ── CARDIO — Intervalos ───────────────────────────────────────────────────────
  { name: 'Caminata con Inclinación Progresiva',       videoUrl: 'https://www.youtube.com/shorts/XBOX7qPKrIs' },
  { name: 'Sprint en Cinta',                           videoUrl: 'https://www.youtube.com/shorts/Tl_qu05p3R8' },
  { name: 'Cycling Intervals',                         videoUrl: 'https://www.youtube.com/shorts/6c_sfPfNvnc' },

  // ── FUNCIONAL — CrossFit ──────────────────────────────────────────────────────
  { name: 'Burpees',                                   videoUrl: 'https://www.youtube.com/shorts/RevoEOa_Esw' },
  { name: 'Box Jump (Salto al Cajón)',                 videoUrl: 'https://www.youtube.com/shorts/Z9Vw6MxOHP8' },
  { name: 'Kettlebell Swing',                          videoUrl: 'https://www.youtube.com/shorts/8tTKm-3wX5s' },
  { name: 'Wall Ball',                                 videoUrl: 'https://www.youtube.com/shorts/oPtoE61Oc04' },
  { name: 'Slam Ball',                                 videoUrl: 'https://www.youtube.com/shorts/uuIJroNfvdQ' },
  { name: 'Tire Flip (Volteo de Llanta)',              videoUrl: 'https://www.youtube.com/shorts/Zjt3RcaLd3Y' },

  // ── HIIT ──────────────────────────────────────────────────────────────────────
  { name: 'Tabata Squat',                              videoUrl: 'https://www.youtube.com/shorts/F3oJ0xomHDw' },
  { name: 'Tabata Push-ups',                           videoUrl: 'https://www.youtube.com/shorts/RIgmkSMbM4E' },
  { name: 'Mountain Climbers',                         videoUrl: 'https://www.youtube.com/shorts/EdeBTHMFLKY' },
  { name: 'Jump Rope (Saltar la Cuerda)',              videoUrl: 'https://www.youtube.com/shorts/OPd9NF1Xpl0' },

  // ── MOVILIDAD ─────────────────────────────────────────────────────────────────
  { name: 'Estiramiento de Cuádriceps',               videoUrl: 'https://www.youtube.com/shorts/Ztwz8rrDShk' },
  { name: 'Hip Flexor Stretch',                        videoUrl: 'https://www.youtube.com/shorts/41ReSOu0dh4' },
  { name: "World's Greatest Stretch",                  videoUrl: 'https://www.youtube.com/shorts/PE-UuERblwA' },
  { name: 'Cat-Cow Stretch',                           videoUrl: 'https://www.youtube.com/shorts/rbuptYr2CGM' },
  { name: 'Pigeon Pose',                               videoUrl: 'https://www.youtube.com/shorts/UlyMK4MJ1v4' },
  { name: 'Shoulder Stretch',                          videoUrl: 'https://www.youtube.com/shorts/PczacMV5HTw' },
];

async function main() {
  console.log('🎬 Actualizando URLs de video en exercise_catalog...\n');
  const ds   = await AppDataSource.initialize();
  const repo = ds.getRepository(ExerciseCatalog);

  let updated = 0;
  let skipped = 0;

  for (const item of VIDEO_DATA) {
    const ex = await repo.findOne({ where: { name: item.name } });

    if (ex) {
      ex.videoUrl = item.videoUrl;
      await repo.save(ex);
      console.log(`  ✓ ${ex.name}`);
      updated++;
    } else {
      console.warn(`  ✗ No encontrado en BD: "${item.name}"`);
      skipped++;
    }
  }

  console.log(`\n✅ Terminado: ${updated} actualizados, ${skipped} no encontrados.`);
  await ds.destroy();
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
