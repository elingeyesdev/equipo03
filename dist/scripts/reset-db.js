"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function resetDatabase() {
    const client = new pg_1.Client({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '12345',
        database: process.env.DB_DATABASE || 'bdd_gym_sync',
    });
    try {
        await client.connect();
        console.log('✅ Conectado a PostgreSQL');
        console.log('🗑️  Ejecutando DROP SCHEMA public CASCADE...');
        await client.query('DROP SCHEMA public CASCADE;');
        console.log('🔨 Recreando schema public...');
        await client.query('CREATE SCHEMA public;');
        await client.query('GRANT ALL ON SCHEMA public TO postgres;');
        await client.query('GRANT ALL ON SCHEMA public TO public;');
        console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║  ✅  Base de datos reseteada exitosamente            ║
  ║──────────────────────────────────────────────────────║
  ║  Todas las tablas anteriores fueron eliminadas.      ║
  ║  Ahora ejecuta: npm run start:dev                   ║
  ║  TypeORM creará las 33 tablas nuevas automáticamente ║
  ╚══════════════════════════════════════════════════════╝
    `);
    }
    catch (error) {
        console.error('❌ Error al resetear la base de datos:', error.message);
        process.exit(1);
    }
    finally {
        await client.end();
    }
}
resetDatabase();
//# sourceMappingURL=reset-db.js.map