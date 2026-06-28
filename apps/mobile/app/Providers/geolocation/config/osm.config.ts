export const OSMConfig = {
  tileUrlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  
  // Atribución requerida por la licencia ODbL de OSM
  attribution: '© OpenStreetMap contributors',

  // Configuración por defecto del mapa
  defaults: {
    // Centro inicial: Santa Cruz de la Sierra, Bolivia
    initialRegion: {
      latitude: -17.783,
      longitude: -63.182,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    },
    minZoom: 10,
    maxZoom: 19,
  },

  // Configuración de tiles
  tiles: {
    maximumZ: 19,
    minimumZ: 1,
    tileSize: 256,
    flipY: false,
  },
} as const;
