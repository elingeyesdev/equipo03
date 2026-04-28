# QUICK REFERENCE: Autenticación App Móvil

## 🚀 INICIO RÁPIDO

### 1. Crear LoginScreen
```bash
mkdir -p apps/mobile/resources/views/auth
```
Copiar contenido de: `EJEMPLO_LOGIN_SCREEN.tsx`

### 2. Actualizar RootNavigator
Copiar contenido de: `GUIA_INTEGRACION_ROOTNAVIGATOR.ts`

### 3. Ejecutar
```bash
cd apps/mobile && npm start
```

---

## 💻 USO EN COMPONENTES

### Login
```typescript
import { useAuth } from '@/app/Shared/hooks/useAuth';

export const MyComponent = () => {
  const { login, error, isLoading } = useAuth();
  
  const handleLogin = async () => {
    const success = await login('email@ejemplo.com', 'password');
    if (success) {
      // Login exitoso - RootNavigator actualiza automáticamente
    }
  };
};
```

### Acceder al Usuario
```typescript
const { user, isAuthenticated } = useAuth();

if (!isAuthenticated) return <Text>No autenticado</Text>;
return <Text>{user?.userId} - {user?.role}</Text>;
```

### Logout
```typescript
const { logout } = useAuth();

const handleLogout = async () => {
  await logout();
  // RootNavigator vuelve a LoginScreen automáticamente
};
```

---

## 📝 ARCHIVOS IMPORTANTES

| Archivo | Propósito |
|---------|-----------|
| `AuthService.ts` | Login/token/logout |
| `AuthContext.tsx` | Context + Hook |
| `sedes.api.config.ts` | ⚠️ **Inyecta Bearer token** |
| `LoginScreen.tsx` | Pantalla de login (CREAR) |
| `RootNavigator.tsx` | Router (ACTUALIZAR) |

---

## 🔍 DEBUGGING

### Ver logs de autenticación
```
[AuthService] Login exitoso
[AuthService] Error: ...
```

### Ver logs de API
```
[Sedes API] Bearer token inyectado ✅
[Sedes API] GET /api/gyms
[Sedes API Error] 401 Unauthorized
```

### Verificar token guardado
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
const token = await AsyncStorage.getItem('@gymsync_token');
console.log('Token:', token);
```

---

## ⚙️ CONFIGURACIÓN

### `.env`
```
EXPO_PUBLIC_API_BASE_URL=http://10.26.0.47:3000
```

### Timeout
Modificar en `Env` si es necesario (por defecto 10000ms)

---

## ❌ ERRORES COMUNES

| Error | Causa | Solución |
|-------|-------|----------|
| Timeout 10000ms | Backend no responde | Verificar URL en .env |
| 401 Unauthorized | Token inválido | Hacer login nuevamente |
| 403 Forbidden | Sin permisos | Verificar role/gym_id |
| "No hay token" | No se hizo login | Login primero |

---

## 📊 FLUJO COMPLETO

```
1. App inicia
   ↓
2. AuthProvider restaura sesión
   ↓
3. ¿Hay token? → Mostrar App | ¿No? → Mostrar Login
   ↓
4. Usuario hace login
   ↓
5. AuthService → Backend retorna token
   ↓
6. Token guardado en AsyncStorage
   ↓
7. Todas las peticiones llevan token
   ↓
8. Backend retorna datos filtrados por role/gym_id
```

---

## 🔐 SEGURIDAD

- ✅ Token guardado en AsyncStorage (almacenamiento seguro)
- ✅ Token enviado SOLO en header Authorization
- ✅ Token limpiado en logout
- ✅ Backend valida en cada petición

---

## ✅ CHECKLIST

- [ ] LoginScreen creado
- [ ] RootNavigator actualizado
- [ ] App compila sin errores
- [ ] Login funciona (sin timeout)
- [ ] Logs muestran "Bearer token inyectado"
- [ ] /api/gyms retorna datos
- [ ] Logout funciona

---

## 📞 REFERENCIAS RÁPIDAS

**Archivos de documentación:**
- `AUTENTICACION_MOBILE.md` - Documentación completa
- `PROXIMOS_PASOS.md` - Checklist detallado
- `RESUMEN_EJECUTIVO.md` - Explicación de cambios
