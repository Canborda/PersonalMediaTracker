# PersonalMediaTracker

Aplicación de escritorio para llevar un registro personal de libros leídos, en progreso y pendientes.

---

## Para el usuario

### ¿Qué hace esta app?

PersonalMediaTracker es una agenda personal de lectura. Permite registrar todos los libros que has leído, que estás leyendo o que quieres leer, con información detallada de cada uno y sin depender de ningún servicio externo ni conexión a internet. Todo se guarda localmente en tu computador.

### ¿Para qué sirve cada campo?

Al agregar un libro se piden los siguientes datos:

| Campo | Para qué sirve |
|---|---|
| **Título** | Nombre del libro |
| **Autor** | Nombre completo del autor |
| **ISBN** | Código identificador del libro (10 o 13 dígitos, está en la contraportada o solapa) |
| **Categoría** | Tipo de libro según una clasificación propia |
| **Año de publicación** | Año en que se publicó el libro |
| **Fecha de inicio** | Cuándo empezaste a leerlo |
| **Fecha de finalización** | Cuándo lo terminaste |
| **Relecturas** | Registro de veces que has vuelto a leer el libro, cada una con su fecha de inicio y fin |

### Estados de un libro

Cada libro tiene un estado que se calcula automáticamente según los datos ingresados:

- **Pendiente** — no tiene fecha de inicio. Todavía no lo has empezado.
- **En progreso** — tiene fecha de inicio pero no de finalización. Lo estás leyendo.
- **Finalizado** — tiene fecha de inicio y de finalización. Ya lo terminaste.
- **Abandonado** — marcado manualmente como abandonado. Lo empezaste pero decidiste no seguir.

El toggle de "Abandonado" solo aparece para libros que están en estado *Pendiente* o *Abandonado*.

### Categorías disponibles

Novela · Novela corta · Cuento · Poesía · Ensayo · Historia · Filosofía · Biografía · Ciencia · Autoayuda · Infantil / Juvenil · Académico · Cómic / Novela gráfica · Otro

### ¿Qué puedes hacer desde la lista principal?

- **Buscar** por título o nombre del autor en tiempo real.
- **Filtrar** por estado: todos, finalizado, en progreso, pendiente o abandonado.
- **Ordenar** la tabla haciendo clic en el encabezado de cualquier columna. Un segundo clic invierte el orden. Por defecto los libros aparecen ordenados por fecha de inicio, del más reciente al más antiguo.
- **Ver el detalle** de un libro haciendo clic en su fila.
- **Agregar** un nuevo libro con el botón de la esquina superior derecha.

### ¿Qué muestra el panel de detalle?

Al hacer clic en un libro se abre un panel con toda su información:

- Título, autor y año
- Estado actual (badge de color)
- Fecha de inicio y fin
- ISBN y categoría
- Lista de relecturas (si las hay)
- Botón para marcar o desmarcar como abandonado
- Botones para editar o eliminar el libro

### ¿Dónde se guardan los datos?

Los datos se guardan en tu computador, en un archivo local. No se envía nada a internet. Puedes ver la ruta exacta y abrir la carpeta desde **Settings** (ícono de engranaje en la esquina superior derecha).

---

## Implementación

### Stack

| Capa | Tecnología |
|---|---|
| Shell de escritorio | Electron |
| UI | React + TypeScript |
| Bundler | electron-vite |
| Empaquetado | electron-builder (.dmg para macOS) |
| Estilos | CSS puro con custom properties |

### Arquitectura Electron

Electron corre dos procesos aislados que se comunican mediante IPC (mensajes):

**`src/main/`** — proceso principal (Node.js). Tiene acceso completo al sistema de archivos y al SO. Gestiona las ventanas, lee y escribe los archivos JSON de datos, y expone una API de operaciones CRUD mediante canales IPC.

**`src/preload/`** — puente de seguridad. Corre antes de que cargue el renderer y expone al browser únicamente las funciones autorizadas del proceso main, usando `contextBridge`. El renderer no puede llamar a Node.js directamente.

**`src/renderer/`** — proceso renderer (Chromium + React). Es un browser que no tiene acceso al SO. Toda interacción con archivos pasa por las funciones expuestas desde el preload.

```
src/
├── main/
│   └── index.ts          # IPC handlers, lectura/escritura de archivos
├── preload/
│   └── index.ts          # contextBridge: expone window.electron
├── renderer/
│   └── src/
│       ├── App.tsx        # Componente raíz, estado global, tabla
│       ├── main.tsx       # Punto de entrada React
│       ├── index.css      # Estilos globales (dark theme, componentes)
│       ├── env.d.ts       # Tipado de window.electron para el renderer
│       └── components/
│           ├── BookForm.tsx    # Modal de agregar / editar
│           ├── BookDetail.tsx  # Modal de detalle
│           └── SettingsWindow.tsx
└── shared/
    └── types/             # Tipos compartidos entre main y renderer
        ├── book.ts
        ├── book-category.ts
        ├── book-status.ts
        └── index.ts
```

### Tipos compartidos

La carpeta `src/shared/types/` es la fuente única de verdad para los modelos de datos. Está incluida en ambos tsconfigs (`tsconfig.node.json` para main/preload y `tsconfig.web.json` para el renderer), lo que garantiza que main y renderer usen exactamente los mismos tipos sin duplicación.

**`Book`**

```ts
interface Book {
  id: string           // UUID generado en el proceso main
  title: string
  author: string
  year: number
  isbn: string
  category: BookCategory
  startDate?: string   // formato YYYY-MM-DD
  endDate?: string
  abandoned?: boolean
  rereads: ReadSession[]
}

interface ReadSession {
  startDate: string
  endDate?: string
}
```

**`BookCategory`**

Las categorías se definen como un array `as const` del que se deriva el tipo union, garantizando cobertura exhaustiva en los Records de labels:

```ts
const BOOK_CATEGORIES = ['novel', 'novella', 'short-story', ...] as const
type BookCategory = typeof BOOK_CATEGORIES[number]
```

Las claves internas están en inglés y en formato `lowercase-hyphenated`. Los labels de UI en español se gestionan mediante `CATEGORY_LABEL: Record<BookCategory, string>`.

**`BookStatus`**

El estado de un libro (`'pending' | 'abandoned' | 'in-progress' | 'finished'`) no se almacena: se calcula en tiempo de ejecución con la función `getStatus(book)` a partir de `startDate`, `endDate` y `abandoned`.

### Persistencia de datos

Los libros se guardan en un archivo `books.json` cuya ubicación varía según el entorno:

| Entorno | Ruta |
|---|---|
| Desarrollo | `<raíz del proyecto>/data/books.json` |
| Producción | `~/Library/Application Support/PersonalMediaTracker/data/books.json` |

El proceso main lee y escribe el archivo completo en cada operación usando `fs` de Node.js. No hay base de datos ni ORM.

### Canales IPC

La comunicación renderer → main se realiza a través de `ipcRenderer.invoke` / `ipcMain.handle`. Todas las operaciones devuelven el array de libros actualizado para que el renderer mantenga su estado sincronizado.

| Canal | Parámetros | Retorno |
|---|---|---|
| `get-books` | — | `Book[]` |
| `add-book` | `Omit<Book, 'id'>` | `Book[]` |
| `update-book` | `Book` | `Book[]` |
| `delete-book` | `id: string` | `Book[]` |
| `get-data-dir` | — | `string` |
| `open-data-dir` | — | `void` |
| `open-settings` | — | `void` |

### Ventana de Settings

Se abre como una `BrowserWindow` separada (480×200, no redimensionable) cargando la misma URL del renderer con el hash `#settings`. El componente raíz detecta `window.location.hash === '#settings'` y renderiza `<SettingsWindow>` en lugar de la app principal.

### Comandos

```bash
npm run dev        # Abre la app en modo desarrollo con hot reload
npm run dist:mac   # Compila y genera el instalador .dmg para macOS
```
