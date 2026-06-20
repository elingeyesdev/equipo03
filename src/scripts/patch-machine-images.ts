import { AppDataSource } from '../config/data-source.cli';

const MACHINE_IMAGES = {
    'Press de Banca Plano': 'https://m.media-amazon.com/images/I/61b17a6YgHL._AC_SL1500_.jpg',
    'Press de Banca Inclinado': 'https://m.media-amazon.com/images/I/71oYw2n7fTL._AC_SL1500_.jpg',
    'Aperturas con Mancuernas': 'https://m.media-amazon.com/images/I/71R2cE5L7pL._AC_SL1500_.jpg',
    'Fondos en Paralelas': 'https://m.media-amazon.com/images/I/61nFqXkR3fL._AC_SL1500_.jpg',
    'Crossover en Polea': 'https://m.media-amazon.com/images/I/71R0lq1Rk-L._AC_SL1500_.jpg',
    'Push-ups (Flexiones)': 'https://m.media-amazon.com/images/I/81xU-m-4s9L._AC_SL1500_.jpg', // Mat de yoga
    'Jalón al Pecho': 'https://m.media-amazon.com/images/I/71nIq3lG-hL._AC_SL1500_.jpg',
    'Remo con Barra': 'https://m.media-amazon.com/images/I/51r-E1wB90L._AC_SL1000_.jpg',
    'Remo con Mancuerna': 'https://m.media-amazon.com/images/I/71R2cE5L7pL._AC_SL1500_.jpg',
    'Dominadas (Pull-ups)': 'https://m.media-amazon.com/images/I/61gR+-9w7nL._AC_SL1500_.jpg',
    'Remo en Polea Baja': 'https://m.media-amazon.com/images/I/71X8kS1Y2JL._AC_SL1500_.jpg',
    'Pullover con Mancuerna': 'https://m.media-amazon.com/images/I/71R2cE5L7pL._AC_SL1500_.jpg',
    'Press Militar con Barra': 'https://m.media-amazon.com/images/I/51r-E1wB90L._AC_SL1000_.jpg',
    'Press de Hombros con Mancuernas': 'https://m.media-amazon.com/images/I/71R2cE5L7pL._AC_SL1500_.jpg',
    'Elevaciones Laterales': 'https://m.media-amazon.com/images/I/71R2cE5L7pL._AC_SL1500_.jpg',
    'Elevaciones Frontales': 'https://m.media-amazon.com/images/I/71R2cE5L7pL._AC_SL1500_.jpg',
    'Vuelos Posteriores': 'https://m.media-amazon.com/images/I/71R2cE5L7pL._AC_SL1500_.jpg',
    'Curl de Bíceps con Barra': 'https://m.media-amazon.com/images/I/61NlS2xX5xL._AC_SL1500_.jpg',
    'Curl con Mancuernas Alterno': 'https://m.media-amazon.com/images/I/71R2cE5L7pL._AC_SL1500_.jpg',
    'Curl en Polea Baja': 'https://m.media-amazon.com/images/I/71R0lq1Rk-L._AC_SL1500_.jpg',
    'Curl Martillo': 'https://m.media-amazon.com/images/I/71R2cE5L7pL._AC_SL1500_.jpg',
    'Curl Concentrado': 'https://m.media-amazon.com/images/I/71R2cE5L7pL._AC_SL1500_.jpg',
    'Press Francés': 'https://m.media-amazon.com/images/I/61NlS2xX5xL._AC_SL1500_.jpg', // Barra EZ
    'Extensiones en Polea Alta': 'https://m.media-amazon.com/images/I/71R0lq1Rk-L._AC_SL1500_.jpg',
    'Patada de Tríceps': 'https://m.media-amazon.com/images/I/71R2cE5L7pL._AC_SL1500_.jpg',
    'Sentadilla con Barra (Back Squat)': 'https://m.media-amazon.com/images/I/71v1m4J4XfL._AC_SL1500_.jpg', // Rack de sentadillas
    'Sentadilla Frontal (Front Squat)': 'https://m.media-amazon.com/images/I/71v1m4J4XfL._AC_SL1500_.jpg',
    'Prensa de Piernas': 'https://m.media-amazon.com/images/I/71xJ1yB-nSL._AC_SL1500_.jpg',
    'Zancadas (Lunges)': 'https://m.media-amazon.com/images/I/71R2cE5L7pL._AC_SL1500_.jpg',
    'Sentadilla Búlgara': 'https://m.media-amazon.com/images/I/71R2cE5L7pL._AC_SL1500_.jpg',
    'Extensión de Cuádriceps': 'https://m.media-amazon.com/images/I/71z3uC3oP-L._AC_SL1500_.jpg',
    'Peso Muerto (Deadlift)': 'https://m.media-amazon.com/images/I/51r-E1wB90L._AC_SL1000_.jpg',
    'Peso Muerto Rumano': 'https://m.media-amazon.com/images/I/51r-E1wB90L._AC_SL1000_.jpg',
    'Curl de Piernas (Máquina)': 'https://m.media-amazon.com/images/I/71H2b2a6e9L._AC_SL1500_.jpg',
    'Elevación de Gemelos de Pie': 'https://m.media-amazon.com/images/I/71mQhW3Zg9L._AC_SL1500_.jpg',
    'Elevación de Gemelos Sentado': 'https://m.media-amazon.com/images/I/71rP7G0aW7L._AC_SL1500_.jpg',
    'Crunch Abdominal': 'https://m.media-amazon.com/images/I/81xU-m-4s9L._AC_SL1500_.jpg',
    'Plancha (Plank)': 'https://m.media-amazon.com/images/I/81xU-m-4s9L._AC_SL1500_.jpg',
    'Elevación de Piernas Colgado': 'https://m.media-amazon.com/images/I/61gR+-9w7nL._AC_SL1500_.jpg',
    'Ab Wheel (Rueda Abdominal)': 'https://m.media-amazon.com/images/I/71XmGv1-B6L._AC_SL1500_.jpg', // Rueda abdominal aislada
    'Correr en Cinta': 'https://m.media-amazon.com/images/I/71+b5+gM4VL._AC_SL1500_.jpg',
    'Bicicleta Estática': 'https://m.media-amazon.com/images/I/71d1V71Rj1L._AC_SL1500_.jpg',
    'Elíptica': 'https://m.media-amazon.com/images/I/71v1kU9rDIL._AC_SL1500_.jpg',
    'Remo en Máquina (Rowing)': 'https://m.media-amazon.com/images/I/71H1h3V9PCL._AC_SL1500_.jpg'
};

(async () => {
    try {
        const ds = await AppDataSource.initialize();
        let count = 0;
        for (const [name, url] of Object.entries(MACHINE_IMAGES)) {
            const result = await ds.query(
                'UPDATE exercises SET image_url = $1 WHERE name = $2',
                [url, name]
            );
            if (result[1] > 0) count++;
        }
        console.log(`Se actualizaron exitosamente ${count} imágenes de maquinaria comercial.`);
        await ds.destroy();
    } catch (e) {
        console.error('Error:', e);
    }
})();
