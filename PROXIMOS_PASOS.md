# PRÓXIMOS PASOS: Integración de Autenticación en App Móvil

## ✅ QUÉ YA ESTÁ HECHO

### 1. Servicio de Autenticación (`AuthService.ts`)
- ✅ Login/logout
- ✅ Almacenamiento de token en AsyncStorage
- ✅ Decodificación manual de JWT
- ✅ Extracción de rol y gym_id

### 2. Contexto de Autenticación (`AuthContext.tsx`)
- ✅ Provider que envuelve la app
- ✅ Hook `useAuth()` para acceder desde componentes
- ✅ Restauración automática de sesión al iniciar la app

### 3. Interceptor de API (`sedes.api.config.ts`) ⚠️ **CRÍTICO**
- ✅ Inyecta `Authorization: Bearer <token>` en TODOS los requests
- ✅ Desempaqueta automáticamente el envelope `{ success, data, timestamp }`
- ✅ Manejo de errores 401/403

### 4. App.tsx Actualizado
- ✅ Envuelve la aplicación con `<AuthProvider>`

---

## ⚠️ PRÓXIMOS PASOS REQUERIDOS

### PASO 1: Crear la pantalla de Login (URGENTE)
```bash
mkdir -p apps/mobile/resources/views/auth
touch apps/mobile/resources/views/auth/LoginScreen.tsx
```
**Copiar contenido desde:** `EJEMPLO_LOGIN_SCREEN.tsx`

**Ubicación:** `apps/mobile/resources/views/auth/LoginScreen.tsx`

---

### PASO 2: Actualizar RootNavigator.tsx
**Ubicación:** `apps/mobile/routes/RootNavigator.tsx`

**Copiar contenido desde:** `GUIA_INTEGRACION_ROOTNAVIGATOR.ts`

**Lo que hace:**
- Si `isAuthenticated = true` → Muestra AppTabs (pantallas principales)
- Si `isAuthenticated = false` → Muestra LoginScreen
- Mientras se restaura la sesión → Muestra un loader

---

### PASO 3: Probar la Conexión
1. **Compilar y ejecutar la app:**
   ```bash
   cd apps/mobile
   npm start
   ```

2. **Intentar login con credenciales reales:**
   - Email: `usuario@ejemplo.com`
   - Password: `contraseña_correcta`

3. **Verificar logs:**
   - Buscar `[AuthService]` para confirmar que el login se intenta
   - Buscar `[Sedes API]` para confirmar que el token se inyecta
   - Buscar `Bearer token inyectado` en los logs

4. **Esperado después del login:**
   - ✅ La app muestra AppTabs (pantallas principales)
   - ✅ Las peticiones a `/api/gyms` tienen `Authorization: Bearer <token>`
   - ✅ Los datos de sedes se cargan correctamente

---

## 🔧 CONFIGURACIÓN IMPORTANTE

### `apps/mobile/.env`
```
EXPO_PUBLIC_API_BASE_URL=http://10.26.0.47:3000
```

**Verificar que:**
- La IP y puerto corresponden a donde está el backend
- El backend está escuchando en ese puerto
- No hay firewall bloqueando la conexión

---

## 🐛 DEBUGGING

Si las peticiones siguen dando timeout:

### 1. Verificar que el token se guarda
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
const token = await AsyncStorage.getItem('@gymsync_token');
console.log('Token guardado:', token);
```

### 2. Verificar que el token se envía
Los logs deben mostrar:
```
[Sedes API] Bearer token inyectado en request
[Sedes API] GET /api/gyms
```

### 3. Si aparece error 401 Unauthorized
**Causa:** El token es inválido o expiró
**Solución:** Volver a hacer login

### 4. Si aparece error 403 Forbidden
**Causa:** El usuario no tiene permiso para este recurso (falta gym_id o rol incorrecto)
**Solución:** Verificar que el JWT contiene `role` y `gym_id` correctos

### 5. Si aparece timeout
**Causa probable:** Backend no está respondiendo o la URL es incorrecta
**Solución:**
- Verificar `EXPO_PUBLIC_API_BASE_URL` en `.env`
- Verificar que el backend está ejecutándose
- Verificar CORS en el backend

---

## 📝 CHECKLIST FINAL

- [ ] `LoginScreen.tsx` creado en `apps/mobile/resources/views/auth/`
- [ ] `RootNavigator.tsx` actualizado
- [ ] `App.tsx` tiene `<AuthProvider>` (ya debe estar)
- [ ] `sedes.api.config.ts` inyecta Bearer token (ya debe estar)
- [ ] `.env` tiene URL correcta del backend
- [ ] Backend está ejecutándose en `EXPO_PUBLIC_API_BASE_URL`
- [ ] App compila sin errores
- [ ] Login funciona (sin timeout)
- [ ] Logs muestran "Bearer token inyectado"
- [ ] Peticiones a `/api/gyms` retornan datos correctamente

---

## 🎯 RESUMEN DEL CAMBIO DE ARQUITECTURA

### Antes (API plana, sin autenticación):
```
App → Petición directa a /api/gyms → Respuesta directa
```

### Ahora (Multi-tenant con JWT):
```
App → Login → Backend retorna JWT
↓
Token guardado en AsyncStorage
↓
Todas las peticiones llevan: Authorization: Bearer <token>
↓
Backend valida token y retorna datos según role/gym_id
↓
Interceptor desempaqueta: { success, data, timestamp } → data
```

**El error de timeout ocurrió porque el backend empezó a rechazar peticiones sin token.**
**La solución es inyectar el token en TODOS los requests (ya hecho).**

---

## 📞 SOPORTE

Si encuentras errores:

1. **Revisa los logs en el emulador/dispositivo**
2. **Verifica que todos los archivos se crearon correctamente**
3. **Asegúrate de que el AuthProvider envuelve la app**
4. **Comprueba que la ruta del Backend es correcta**
5. **Intenta hacer login con credenciales que SABES que son válidas**
