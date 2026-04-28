# Guía de Autenticación - App Móvil GymSync

## Cambios Realizados

Se ha implementado un **sistema de autenticación centralizado** en la app móvil para adaptarse a los nuevos requerimientos del backend (JWT enriquecido, autenticación obligatoria, scope de request).

### Archivos Creados

1. **`apps/mobile/app/Providers/auth/AuthService.ts`**
   - Servicio que maneja: login, logout, almacenamiento de token, decodificación de JWT
   - Métodos principales:
     - `login(email, password)` - Realiza login contra el backend
     - `getCurrentUser()` - Recupera el usuario actual de AsyncStorage
     - `getToken()` - Recupera el token JWT actual
     - `logout()` - Limpia la sesión
     - `isAuthenticated()` - Valida si hay sesión activa

2. **`apps/mobile/app/Providers/auth/AuthContext.tsx`**
   - Context de React que proporciona el estado de autenticación
   - Proveedor (`AuthProvider`) que debe envolver la aplicación
   - Hook `useAuth()` para acceder al contexto desde componentes
   - Maneja la restauración automática de sesión al iniciar la app

3. **`apps/mobile/app/Shared/hooks/useAuth.ts`**
   - Re-exporta el hook `useAuth()` desde AuthContext para facilitar importaciones

### Archivos Modificados

1. **`apps/mobile/app/Providers/geolocation/adapters/api/sedes.api.config.ts`**
   - ✅ **CRUCIAL**: Ahora inyecta el Bearer token en todos los requests
   - Desempaqueta automáticamente el envelope de respuesta `{ success, data, timestamp }`
   - Manejo mejorado de errores 401 (Unauthorized) y 403 (Forbidden)
   - Logging detallado en desarrollo

2. **`apps/mobile/app/Providers/geolocation/adapters/api/AxiosSedesApi.adapter.ts`**
   - Actualizado para trabajar con el nuevo interceptor que desempaqueta el envelope
   - Logging mejorado para debugging
   - Manejo de respuestas inválidas

3. **`apps/mobile/App.tsx`**
   - ✅ **CRÍTICO**: Envuelve la aplicación con `<AuthProvider>`
   - Esto hace que el contexto de autenticación esté disponible en toda la app

## Cómo Usar

### 1. Login

```typescript
import { useAuth } from '@/app/Shared/hooks/useAuth';

export const LoginScreen = () => {
  const { login, error, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const success = await login(email, password);
    if (success) {
      // Navegar a la pantalla principal
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } else {
      // Mostrar error
      Alert.alert('Error', error || 'Error al iniciar sesión');
    }
  };

  return (
    // ... JSX
  );
};
```

### 2. Acceder al Usuario Actual

```typescript
import { useAuth } from '@/app/Shared/hooks/useAuth';

export const ProfileScreen = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Text>No autenticado</Text>;
  }

  return (
    <View>
      <Text>Usuario ID: {user?.userId}</Text>
      <Text>Rol: {user?.role}</Text>
      <Text>Sede: {user?.gymId}</Text>
    </View>
  );
};
```

### 3. Logout

```typescript
import { useAuth } from '@/app/Shared/hooks/useAuth';

export const SettingsScreen = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <Button title="Cerrar sesión" onPress={handleLogout} />
  );
};
```

## Flujo de Autenticación

```
App.tsx monta
    ↓
AuthProvider restaura sesión (AsyncStorage)
    ↓
RootNavigator renderiza
    ↓
Usuario hace login (LoginScreen)
    ↓
AuthService.login() envía credenciales al backend
    ↓
Backend retorna JWT token + user data
    ↓
AuthContext guarda usuario y token en AsyncStorage
    ↓
API client (sedes.api.config.ts) inyecta token en todos los requests
    ↓
Todas las peticiones ahora tienen: Authorization: Bearer <token>
```

## Puntos Críticos Resueltos

| Problema | Solución |
|----------|----------|
| ❌ No se enviaba token en headers | ✅ Interceptor en `sedes.api.config.ts` inyecta Bearer token |
| ❌ No había servicio de auth centralizado | ✅ `AuthService.ts` + `AuthContext.tsx` |
| ❌ No se desempaquetaba el envelope | ✅ Interceptor desempaqueta automáticamente |
| ❌ No se restauraba sesión al iniciar | ✅ `useEffect` en `AuthProvider` restaura sesión |
| ❌ Error 401/403 sin manejo | ✅ Logging detallado e identificación de errores |

## Testing

Para probar que el token se envía correctamente:

1. Abrir DevTools/Logs en el emulador/dispositivo
2. Buscar logs `[Sedes API]` que muestren "Bearer token inyectado"
3. Si no aparece el log, verificar que:
   - El usuario ha hecho login exitoso
   - El token se guardó en AsyncStorage
   - El AuthProvider está envolviendo la app

## Notas

- El `.env` de la móvil apunta a `http://10.26.0.47:3000` - ajustar si el backend está en otro lugar
- La decodificación del JWT es manual ya que React Native no tiene `atob()` nativo
- Se soportan múltiples formatos de token en la respuesta: `accessToken`, `access_token`, `token`
- El timeout de peticiones es 10000ms - aumentar en `Env.API_TIMEOUT_MS` si es necesario

## Debugging

Si las peticiones siguen dando timeout:

1. Verificar logs de `[AuthService]` - ¿el login fue exitoso?
2. Verificar logs de `[Sedes API]` - ¿se está inyectando el token?
3. Verificar logs de backend - ¿qué error retorna?
4. Comprobar que `EXPO_PUBLIC_API_BASE_URL` es correcta en `.env`
5. Si 401: El token es inválido o expiró → hacer login nuevamente
6. Si 403: El usuario no tiene permisos para este recurso → verificar rol/gym_id
