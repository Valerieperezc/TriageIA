# TriageIA Mobile

Este proyecto ya tiene contenedores nativos con Capacitor:

- Android: `android/`
- iOS: `ios/`

Comandos principales:

```bash
npm run dev
npm run build
npm run cap:sync
npm run cap:android
npm run cap:ios
```

Flujo recomendado:

1. Hacer cambios en la app web.
2. Ejecutar `npm run cap:sync`.
3. Abrir Android Studio con `npm run cap:android` o Xcode con `npm run cap:ios`.
4. Compilar desde el IDE para simulador o dispositivo real.

Notas:

- La UI web es la misma base para web, Android y iPhone.
- Si cambias iconos o splash, vuelve a ejecutar `npm run cap:sync`.
- Para publicar en stores, el siguiente paso es configurar firma, bundle id final, nombre comercial y permisos nativos.
