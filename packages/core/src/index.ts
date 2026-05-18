// Exportando Value Objects
export * from './domain/value-objects/Aforo.vo';
export * from './domain/value-objects/Coordenadas.vo';
export * from './domain/value-objects/Distancia.vo';
export * from './domain/value-objects/HorariosSede.vo';
export * from './domain/value-objects/RestriccionMedica.vo';
export * from './domain/value-objects/MetodoAcceso.vo';
export * from './domain/value-objects/EstadoAcceso.vo';

// Exportando Entidades
export * from './domain/entities/Sede.entity';
export * from './domain/entities/PerfilDeportivo.entity';
export * from './domain/entities/Acceso.entity';

// Exportando Errores de Dominio
export * from './domain/errors/UbicacionNoDisponible.error';
export * from './domain/errors/SedeNoEncontrada.error';

// Exportando Puertos de la Capa de Aplicación
export * from './application/ports/input/CalcularRuta.use-case';
export * from './application/ports/input/FiltrarSedes.use-case';
export * from './application/ports/input/ObtenerSedesCercanas.use-case';
export * from './application/ports/input/SuscribirseUbicacion.use-case';
export * from './application/ports/input/ConsultarHistorialAccesos.use-case';

export * from './application/ports/output/IGeolocationService.port';
export * from './application/ports/output/ISedesApiService.port';
export * from './application/ports/output/IStorageService.port';
export * from './application/ports/output/INavigationService.port';
export * from './application/ports/output/IAccessApiService.port';

// Exportando Servicios de Dominio
export * from './domain/services/CalculadoraDistancia.service';
export * from './domain/services/ValidadorUbicacion.service';

// Exportando Shared Kernel
export * from './shared/kernel/Either';
export * from './shared/kernel/Identifier';
export * from './shared/kernel/Result';
export * from './shared/kernel/DomainEvent';
