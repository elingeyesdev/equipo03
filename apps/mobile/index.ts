import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent hace el trabajo de expo/AppEntry.js pero resolviendo 
// la ruta del App.js de forma local para nuestro monorepo.
registerRootComponent(App);
