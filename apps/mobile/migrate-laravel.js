const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const baseDir = __dirname;

const LaravelDirs = {
  Controllers: path.join(baseDir, 'app', 'Http', 'Controllers'),
  Providers: path.join(baseDir, 'app', 'Providers'),
  Views: path.join(baseDir, 'resources', 'views'),
  Routes: path.join(baseDir, 'routes'),
  Shared: path.join(baseDir, 'app', 'Shared'),
};

// Crear directorios
Object.values(LaravelDirs).forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

// Mapa de origen -> destino para tener registro y poder arreglar imports luego
const fileMap = [];

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const allFiles = fs.existsSync(srcDir) ? walkDir(srcDir) : [];

function determineDestination(filePath) {
  const relPath = path.relative(srcDir, filePath);
  
  if (relPath.includes('viewmodels') || relPath.endsWith('viewmodel.ts')) {
    // Controller
    let newName = path.basename(relPath).replace('use', '').replace('ViewModel', 'Controller').replace('viewmodel', 'Controller');
    if (!newName.includes('Controller')) newName = newName.replace('.ts', 'Controller.ts').replace('ControllerController', 'Controller');
    newName = newName[0].toUpperCase() + newName.slice(1);
    const modMatch = relPath.match(/modules\/([^\/]+)/);
    const mod = modMatch ? modMatch[1] : '';
    return path.join(LaravelDirs.Controllers, mod, newName);
  }
  
  if (relPath.includes('components')) {
    // Views
    const modMatch = relPath.match(/modules\/([^\/]+)/);
    const subpathMatch = relPath.match(/components\/(.*)/);
    const mod = modMatch ? modMatch[1] : '';
    const sub = subpathMatch ? subpathMatch[1] : path.basename(relPath);
    return path.join(LaravelDirs.Views, mod, sub);
  }

  if (relPath.includes('navigation') || relPath.startsWith('navigation')) {
    // Routes
    const name = path.basename(relPath);
    return path.join(LaravelDirs.Routes, name);
  }

  if (relPath.includes('infrastructure') || relPath.includes('di')) {
    // Providers
    const modMatch = relPath.match(/modules\/([^\/]+)\/infrastructure\/(.*)/);
    if (modMatch) return path.join(LaravelDirs.Providers, modMatch[1], modMatch[2]);
    return path.join(LaravelDirs.Providers, path.basename(relPath));
  }

  if (relPath.includes('shared')) {
    return path.join(LaravelDirs.Shared, path.relative(path.join('shared'), relPath));
  }

  // Fallback
  return path.join(LaravelDirs.Shared, 'misc', path.basename(relPath));
}

// 1. Mapear y Mover (copiar por seguridad y luego borrar src)
allFiles.forEach(file => {
  const dest = determineDestination(file);
  fileMap.push({ src: file, dest: dest });
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
});

// 2. Modificar App.tsx y el viejo index.ts
if (fs.existsSync(path.join(baseDir, 'App.tsx'))) {
  let appContent = fs.readFileSync(path.join(baseDir, 'App.tsx'), 'utf8');
  // RootNavigator solía estar en src/navigation/RootNavigator
  appContent = appContent.replace(/'\.\/src\/navigation\/RootNavigator'/g, "'./routes/RootNavigator'");
  fs.writeFileSync(path.join(baseDir, 'App.tsx'), appContent);
}

// 3. Arreglar Imports en todos los archivos movidos
// Esta es una solución heurística. En JS/TS los imports son relativos a donde están.
function fixImports(fileObj) {
  let content = fs.readFileSync(fileObj.dest, 'utf8');
  const currentDir = path.dirname(fileObj.dest);
  
  // Encontrar todo lo que importe de src/ u otras rutas viejas relativas (ej. ../../)
  content = content.replace(/from\s+['"]([^'"]+)['"]/g, (match, importPath) => {
    if (importPath.startsWith('.') || importPath.startsWith('@/')) {
        // Resolver ruta absoluta del import original
        let oldAbsoluteTarget = path.resolve(path.dirname(fileObj.src), importPath);
        // Si no tiene extension, probar con ts, tsx, etc (se simplifica asumiendo que el importPath no tiene ext pero matcheará en fileMap origin)
        let exactMatch = fileMap.find(f => {
            return f.src === oldAbsoluteTarget || f.src.startsWith(oldAbsoluteTarget + '.ts') || f.src.startsWith(oldAbsoluteTarget + '.tsx') || f.src.startsWith(oldAbsoluteTarget + '/index.ts');
        });

        // Si se trata de RootNavigator o algo asi
        if (!exactMatch) {
             const baseName = path.basename(importPath);
             exactMatch = fileMap.find(f => path.basename(f.src).includes(baseName));
        }

        if (exactMatch) {
            let newRelative = path.relative(currentDir, exactMatch.dest);
            if (!newRelative.startsWith('.')) newRelative = './' + newRelative;
            // Quitar extensión .ts .tsx
            newRelative = newRelative.replace(/\.tsx?$/, '');
            return `from '${newRelative}'`;
        }
    }
    return match;
  });

  // Re-mapear uso de funciones hook renombradas (ej. usePerfilViewModel a PerfilController)
  content = content.replace(/use([A-Za-z]+)ViewModel/g, "$1Controller");
  content = content.replace(/([A-Za-z]+)ViewModel/g, "$1Controller");

  fs.writeFileSync(fileObj.dest, content);
}

fileMap.forEach(fixImports);

// Renombrar las funciones exportadas dentro de los nuevos controladores para que coincidan con sus nombres de archivo
fileMap.filter(f => f.dest.includes('Controllers')).forEach(f => {
   let c = fs.readFileSync(f.dest, 'utf-8');
   c = c.replace(/export const use([A-Za-z]+)ViewModel/g, 'export const $1Controller');
   c = c.replace(/export const ([A-Za-z]+)ViewModel/g, 'export const $1Controller');
   c = c.replace(/function use([A-Za-z]+)ViewModel/g, 'function $1Controller');
   fs.writeFileSync(f.dest, c);
});

console.log("Migración completada con éxito. Archivos procesados:", fileMap.length);
