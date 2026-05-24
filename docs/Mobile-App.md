# App móvil (Capacitor)

TriageIA se empaqueta como app nativa para **Android** e **iOS** con [Capacitor](https://capacitorjs.com/). Reutiliza el mismo código React/Vite de la versión web.

## Requisitos

### Común
- Node.js 18+
- `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (se incluyen en el build)
- Dependencias instaladas: `npm install`

### Android
- [Android Studio](https://developer.android.com/studio) (SDK + emulador o dispositivo físico)
- JDK 17+

### iOS (solo macOS)
- [Xcode](https://developer.apple.com/xcode/) 15+
- CocoaPods: `sudo gem install cocoapods` (si no lo tienes)

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run build:mobile` | Build web en `dist/` |
| `npm run cap:sync` | Build + copia a proyectos nativos |
| `npm run cap:android` | Sync y abre Android Studio |
| `npm run cap:ios` | Sync y abre Xcode |
| `npm run cap:run:android` | Sync y ejecuta en emulador/dispositivo Android |
| `npm run cap:run:ios` | Sync y ejecuta en simulador/dispositivo iOS |

## Flujo de desarrollo

1. Configura `.env` con Supabase (o usa el fallback local `admin@triage.com / 123456`).
2. Ejecuta `npm run cap:sync`.
3. Abre el proyecto nativo:
   - Android: `npm run cap:android` → Run en Android Studio.
   - iOS: `npm run cap:ios` → Run en Xcode (elige simulador o iPhone).

Tras cambios en el código React, vuelve a ejecutar `npm run cap:sync` antes de probar en el dispositivo.

## Live reload (opcional)

Para recargar en caliente contra el servidor de Vite:

```bash
npm run dev
```

En `capacitor.config.json`, descomenta y ajusta temporalmente:

```json
"server": {
  "url": "http://TU_IP_LOCAL:4173",
  "cleartext": true
}
```

Luego `npx cap sync`. **No subas esta config a producción.**

## Publicación

- **Android:** en Android Studio, `Build > Generate Signed Bundle / APK`.
- **iOS:** en Xcode, configura signing team y `Product > Archive`.

## Estructura

- `capacitor.config.json` — configuración de la app nativa
- `android/` — proyecto Gradle (Android)
- `ios/` — proyecto Xcode (iOS)
- `src/lib/nativeApp.js` — inicialización de barra de estado, splash y teclado
- `src/hooks/useNativeBackButton.js` — botón atrás de Android integrado con React Router

## Notas

- La UI ya incluye navegación móvil (`MobileNav`, `MobileMenuDrawer`, safe areas).
- Supabase funciona en WebView; asegúrate de que la URL del proyecto permita el origen de la app si usas restricciones CORS estrictas.
- Iconos y splash usan los recursos por defecto de Capacitor; personalízalos con [@capacitor/assets](https://github.com/ionic-team/capacitor-assets) si lo necesitas.
