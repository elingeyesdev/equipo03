import { AppDataSource } from '../config/data-source.cli';
import { Role } from '../roles/domain/role.entity';

async function run() {
  const dataSource = await AppDataSource.initialize();
  const roleRepo   = dataSource.getRepository(Role);

  const before = await roleRepo.count({ where: { name: 'USER' } });
  console.log(`[patch] Registros con name='USER' antes del parche: ${before}`);

  if (before === 0) {
    console.log('[patch] Nada que hacer — la tabla roles no contiene registros USER.');
  } else {
    const result = await roleRepo.update({ name: 'USER' }, { name: 'CLIENTE' });
    console.log(`[patch] UPDATE ejecutado. Filas afectadas: ${result.affected ?? 'n/a'}`);
  }

  const after = await roleRepo.count({ where: { name: 'USER' } });
  if (after === 0) {
    console.log('[patch] CONFIRMADO: La tabla roles ya no contiene ningun registro llamado USER.');
  } else {
    console.error(`[patch] ERROR: Aun quedan ${after} registros con name='USER'. Revisa permisos o constraints.`);
    process.exitCode = 1;
  }

  await dataSource.destroy();
}

run().catch((err) => {
  console.error('[patch] Error fatal:', err);
  process.exit(1);
});
