# PersonalMediaTracker

Desktop app built with Electron + React + TypeScript.

## Comandos

```bash
npm run dev        # Abre la app en modo desarrollo con hot reload
npm run dist:mac   # Compila y genera el instalador .dmg para macOS
```

## Estructura del proyecto

```
src/
├── main/          # Proceso principal de Electron (Node.js)
├── preload/       # Puente entre main y renderer
└── renderer/      # La UI (React)
    └── src/
        ├── main.tsx   # Punto de entrada de React
        └── App.tsx    # Componente raíz
```

## Por qué tres carpetas

Electron corre dos procesos distintos, similar a una arquitectura cliente-servidor:

**`main/`** es el proceso servidor. Corre en Node.js y tiene acceso completo al sistema operativo: archivos, red, notificaciones, ventanas. Es el `index.ts` que llama a `new BrowserWindow(...)` y levanta la ventana.

**`renderer/`** es el proceso cliente. Es un navegador Chromium donde corre React. Por seguridad, no tiene acceso directo al sistema operativo, solo puede hacer cosas de browser. Aquí vive toda la UI.

**`preload/`** es el puente. Es un script que corre antes de que cargue el renderer y tiene acceso a ambos mundos. Se usa para exponer al renderer únicamente las APIs de Node.js que necesita, de forma controlada. Por ahora solo expone `platform` como ejemplo.

## Por qué React

React es una librería para construir interfaces como un árbol de componentes. Cada componente es una función TypeScript que retorna JSX (HTML dentro de TypeScript). `App.tsx` es el componente raíz, y desde ahí se compone toda la UI.

`main.tsx` es solo el punto de entrada que monta `<App />` en el `div#root` del `index.html`.

## Build

`electron-vite build` compila los tres procesos a la carpeta `out/`. `electron-builder` toma eso y lo empaqueta junto con el binario de Electron en un `.dmg` instalable.
