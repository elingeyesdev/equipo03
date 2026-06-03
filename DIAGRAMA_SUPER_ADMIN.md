# 📊 Diagramas de Flujo de Trabajo: `SUPER_ADMIN`

El diagrama anterior representaba la estructura modular del sistema. Sin embargo, para cumplir con el propósito de la actividad de **"conocer el flujo de trabajo (workflow) operativo e identificar posibles fallos en la experiencia de usuario (UX)"**, es mucho más valioso modelar los **procesos lógicos y secuenciales** que realiza el `SUPER_ADMIN` en su día a día.

A continuación, tienes el diagrama de flujo reestructurado por procesos operativos, diseñado de forma sencilla y directa (sin validaciones técnicas complejas), ideal para visualizar con tu extensión **Mermaid Preview**.

---

## 🗺️ Flujo de Trabajo Operacional (Mermaid)

Este diagrama representa los dos procesos más importantes que sigue el Super Administrador en la vida real del sistema:
1. **Flujo de Configuración y Delegación:** Desde registrar una marca corporativa hasta dejar el local operando bajo un Gerente.
2. **Flujo de Monitoreo y Auditoría de Seguridad:** Desde vigilar el aforo y GPS en el mapa hasta sancionar o corregir cuentas de usuario.

```mermaid
flowchart TD
    %% Estilos de Nodos
    classDef startNode fill:#00D9FF,stroke:#00B6D6,stroke-width:2px,color:#0F0F12,font-weight:bold;
    classDef decisionNode fill:#BF5AF2,stroke:#A24BD3,stroke-width:1.5px,color:#FFFFFF,font-weight:bold;
    classDef actionNode fill:#1C1C1E,stroke:#3A3A3C,stroke-width:1px,color:#E5E5EA;
    classDef alertNode fill:#FF453A,stroke:#D32F2F,stroke-width:1.5px,color:#FFFFFF,font-weight:bold;
    classDef successNode fill:#30D158,stroke:#24A142,stroke-width:1.5px,color:#FFFFFF,font-weight:bold;

    %% Entrada Principal
    Inicio([🟢 INICIO: Sesión Iniciada como SUPER_ADMIN]) :::startNode --> MenuPrincipal{"¿Qué proceso operativo realizará?"} :::decisionNode

    %% ==========================================
    %% FLUJO A: CONFIGURACIÓN Y EXPANSIÓN
    %% ==========================================
    MenuPrincipal -->|"1. Configurar Nueva Sede / Local"| CrearSede["🏢 Paso 1: Registrar Sede Principal (Marca corporativa, maxCapacity=0)"] :::actionNode
    CrearSede --> CrearSucursal["🏪 Paso 2: Crear Sucursal física asociada a la Marca"] :::actionNode
    CrearSucursal --> MapPicker["📍 Paso 3: Ubicar coordenadas con MapPicker (Autocompletar Dirección)"] :::actionNode
    MapPicker --> ConfigHorarios["📅 Paso 4: Configurar Horarios de atención de la sucursal"] :::actionNode
    ConfigHorarios --> CrearGerente["👥 Paso 5: Crear cuenta de usuario con Rol GERENTE"] :::actionNode
    CrearGerente --> AsignarSede{"¿Asignar la sede física al Gerente?"} :::decisionNode
    
    %% Fallo de UX Mapeado en el Flujo
    AsignarSede -- "No (Olvido del Admin)" --> AlertGerente["⚠️ Fallo de UX detectado: Gerente sin local asignado (Error de scope en App móvil)"] :::alertNode --> AsignarSede
    AsignarSede -- "Sí (Asignación Única)" --> DelegacionExitosa["✅ Flujo Completado: Local Operativo y Delegado con Éxito"] :::successNode --> Fin

    %% ==========================================
    %% FLUJO B: AUDITORÍA, VIGILANCIA Y SEGURIDAD
    %% ==========================================
    MenuPrincipal -->|"2. Monitorear y Auditar Seguridad"| MapaRed["🌐 Paso 1: Inspeccionar Aforo y Estado en el Mapa de Red"] :::actionNode
    MapaRed --> ComprobarAforo{"¿Detecta Aforo saturado o GPS incorrecto?"} :::decisionNode
    ComprobarAforo -- "No" --> OperacionNormal["🟢 Estado: Red Operando Normal"] :::successNode --> Fin
    
    ComprobarAforo -- "Sí" --> AuditoriaGrid["🛡️ Paso 2: Ir a Auditoría y filtrar accesos por Local / Estado"] :::actionNode
    AuditoriaGrid --> InvestigarCheckin{"¿Se detectaron accesos indebidos o fallos?"} :::decisionNode
    InvestigarCheckin -- "No" --> OperacionNormal
    
    InvestigarCheckin -- "Sí" --> GestionUsuarios["👥 Paso 3: Ir a Gestión de Usuarios"] :::actionNode
    GestionUsuarios --> ModificarUsuario["✏️ Desactivar cuenta, cambiar rol o corregir permisos"] :::actionNode
    ModificarUsuario --> Resuelto["✅ Seguridad Restablecida y Aforo Normalizado"] :::successNode --> Fin

    %% Fin del Workflow
    Fin([🏁 Fin de Operaciones]) :::successNode
```

---

## 🔍 Análisis de Fallos de UX Identificados a partir de estos Flujos

Al analizar estos dos flujos de trabajo, podemos identificar dos puntos críticos donde la experiencia del usuario (UX) o la lógica del sistema podrían fallar, y cómo solucionarlos a tiempo:

### 🚨 Punto Crítico A: "El Gerente Huérfano"
* **El Problema en el Flujo:** Al dar de alta una nueva sucursal y contratar a un Gerente, si el `SUPER_ADMIN` olvida asignar el ID de la sucursal al perfil del usuario, el Gerente se creará pero al ingresar a la App móvil o Web obtendrá errores de red (403 Forbidden o 401 Unauthorized) porque sus consultas no tienen alcance (scope) físico.
* **Solución Preventiva de UX:** En la interfaz de creación de usuarios, si se selecciona el rol de `GERENTE`, el sistema debe obligar a seleccionar una sede física del dropdown antes de permitir presionar el botón "Guardar".

### 🚨 Punto Crítico B: "La Sucursal Fantasma"
* **El Problema en el Flujo:** Si el `SUPER_ADMIN` crea una sucursal física pero olvida marcar las coordenadas GPS con el MapPicker (o quedan por defecto en `0, 0`), el local existirá en la base de datos pero será invisible para los usuarios en el **Mapa de Red**.
* **Solución Preventiva de UX:** El dashboard de **Mapa de Red** muestra de manera proactiva un banner naranja persistente indicando cuántos locales tienen coordenadas incorrectas, sirviendo de recordatorio directo de mantenimiento.
