# PersonalMediaTracker

Aplicación de escritorio para llevar un registro personal de libros leídos, en progreso y pendientes.

---

## Para el usuario

### ¿Qué hace esta app?

PersonalMediaTracker es una agenda personal de lectura. Permite registrar todos los libros que has leído, que estás leyendo o que quieres leer, con información detallada de cada uno. Los datos se guardan localmente en tu computador; no necesitas cuenta, ni suscripción, ni conexión a internet para usarla.

### Agregar un libro

Al agregar o editar un libro, los campos están organizados en dos secciones colapsables. Cada sección muestra un ✓ cuando sus campos están completos.

**Sección 1 — Información del libro**

| Campo | Para qué sirve |
|---|---|
| **Título** | Nombre del libro |
| **Autor** | Nombre completo del autor |
| **ISBN** | Código identificador del libro (10 o 13 dígitos, está en la contraportada o solapa) |
| **Categoría** | Tipo de libro: Novela · Novela corta · Cuento · Poesía · Ensayo · Crónica · Historia · Filosofía · Biografía · Ciencia · Autoayuda · Infantil / Juvenil · Académico · Cómic / Novela gráfica · Otro |
| **Año de publicación** | Año en que se publicó el libro |

**Sección 2 — Estadísticas**

| Campo | Para qué sirve |
|---|---|
| **Páginas** | Número de páginas del libro (obligatorio) |
| **Líneas por página** | Promedio de líneas por página, usado para estimar palabras (obligatorio) |
| **Puntuación** | Valoración del libro de 1 a 5 (solo visible al editar un libro finalizado) |

### Estados de un libro

El estado de un libro se calcula automáticamente a partir del historial de lecturas (`readings`) y no se almacena. Las reglas de derivación son:

- Sin lecturas registradas → **Pendiente**
- Última lectura sin fecha de fin → **En progreso**
- Alguna lectura marcada como terminada → **Finalizado** (tiene prioridad sobre cualquier otra condición, excepto *En progreso* activo)
- Última lectura con fecha de fin pero ninguna marcada como terminada → **Abandonado**

Las transiciones se disparan desde el panel de detalle:

```
         ┌─────────────┐
         │  Pendiente  │
         └──────┬──────┘
                │ Iniciar lectura
                ▼
         ┌─────────────┐  Terminar (no terminé)   ┌────────────┐
         │ En progreso │─────────────────────────▶│ Abandonado │
         │             │◀──────── Reanudar ───────│            │
         └──────┬──────┘                          └────────────┘
                │ Terminar
                │ (sí terminé)
                ▼
           ┌──────────┐
           │Finalizado│◀──────────────────────┐
           └────┬─────┘                       │ Terminar
                │ Releer                      │ (terminé o no)
                ▼                             │
         ┌─────────────┐                      │
         │ En progreso │──────────────────────┘
         └─────────────┘
```

Cada ciclo de Releer o Reanudar añade una nueva entrada al historial de lecturas. La lectura abandonada nunca se modifica: queda registrada tal como fue.

Cada transición abre un formulario inline dentro del panel de detalle:

| Transición | Acción | Datos que pide |
|---|---|---|
| Pendiente → En progreso | **Iniciar lectura** | Fecha de inicio |
| En progreso → Finalizado | **Terminar lectura** | Fecha de fin + toggle *sí terminé* + puntuación |
| En progreso → Abandonado | **Terminar lectura** | Fecha de fin + toggle *no terminé* |
| Abandonado → En progreso | **Reanudar** | Fecha de inicio de la nueva lectura |
| Finalizado → En progreso | **Releer** | Fecha de inicio de la nueva lectura |

El historial completo de lecturas queda en la pestaña **Lecturas** del panel de detalle. Cada entrada muestra fecha de inicio, fecha de fin, número de días y si esa lectura fue terminada o abandonada. Para lecturas en curso, el conteo de días se calcula hasta hoy.

### Vistas

El catálogo tiene dos vistas que se alternan con los íconos de la esquina superior derecha. En ambas puedes:

- **Buscar** por título o autor en tiempo real.
- **Filtrar** por estado con los botones del toolbar: Todos · En progreso · Finalizado · Abandonado · Pendiente.
- **Ordenar** por inicio, fin, título, autor, estado, año o puntuación. Por defecto los libros aparecen ordenados por fecha de inicio, del más reciente al más antiguo.
- **Ver el detalle** de un libro haciendo clic en su fila o tarjeta.
- **Agregar** un nuevo libro con el botón de la esquina superior derecha.

**Vista de tabla** — cada libro ocupa una fila con las columnas: estado, título, autor, año, fecha de inicio, fecha de fin y puntuación. Haz clic en el encabezado de cualquier columna para ordenar; un segundo clic invierte el orden.

**Vista de cuadrícula** — cada libro se muestra como una tarjeta con portada (o letra inicial como placeholder), badge de estado, puntuación (si está finalizado), título, autor y año. Para ordenar, usa el selector desplegable del toolbar; el botón junto a él alterna entre ascendente y descendente.

### Panel de estadísticas

El panel de estadísticas se muestra encima del catálogo y se puede ocultar con el toggle **Estadísticas** en la esquina superior derecha. Las estadísticas se calculan siempre sobre la colección completa, independientemente del filtro activo en el catálogo.

**Indicadores (KPIs)**

| Indicador | Qué mide |
|---|---|
| Libros terminados | Libros con al menos una lectura marcada como terminada |
| Páginas leídas | Suma de páginas × número de lecturas terminadas por libro |
| ~Palabras leídas | Estimado: páginas × líneas por página × 9 palabras por línea |
| Autores leídos | Autores únicos con al menos un libro terminado |

**Gráfica: Palabras por día**

Muestra el ritmo de lectura a lo largo del tiempo. Cada lectura registrada aparece como un segmento horizontal cuya posición en Y representa las palabras por día estimadas (palabras del libro ÷ días transcurridos entre inicio y fin) y cuya extensión horizontal abarca desde la fecha de inicio hasta la fecha de fin.

- **Azul** — lectura terminada
- **Cian discontinuo** — lectura en progreso (la fecha de fin es hoy)

Interacción:
- **Hover** sobre un segmento — muestra tooltip con título, autor, palabras/día, duración y rango de fechas.
- **Rueda del ratón** sobre la gráfica — zoom en el eje X centrado en el cursor. Mínimo visible: 30 días.
- **Barra de desplazamiento** (aparece al hacer zoom) — arrastra el thumb o haz clic en la pista para navegar en el tiempo.
- **↺** — restablece la vista al último año.

La vista inicial muestra los últimos 12 meses. Si todo el historial cabe en menos de un año, se muestra completo.

### ¿Qué muestra el panel de detalle?

Al hacer clic en un libro se abre un panel con toda su información:

- Portada del libro (si fue encontrada) o letra inicial como placeholder
- Título, autor y año
- Estado actual (badge de color)
- Fecha de inicio y fin
- ISBN y categoría
- Título original, sinopsis y número de páginas (si fueron encontrados desde internet)
- Historial de lecturas en la pestaña **Lecturas** (visible cuando hay más de una)
- Botones de acción según el estado: Iniciar lectura · Terminar lectura · Reanudar · Releer
- Botones para editar, eliminar y buscar información adicional del libro

### Obtener información adicional de un libro

Desde el panel de detalle puedes hacer clic en el ícono de descarga para que la app busque automáticamente en internet información adicional sobre el libro:

- **Portada** — imagen de la tapa
- **Título original** — título de la primera publicación
- **Sinopsis** — descripción del libro
- **Páginas** — número de páginas de la edición

La búsqueda usa el ISBN del libro como identificador principal y el título y autor como respaldo. La información encontrada queda guardada localmente y no vuelve a buscarse a menos que lo pidas de nuevo.

Si no se encuentra portada, se genera automáticamente un placeholder con el título y el autor.

### Actualizar los metadatos de todos los libros

Desde el ícono **ⓘ** de la esquina superior derecha puedes lanzar una actualización masiva que borra el caché actual y vuelve a buscar portada, título original, sinopsis y páginas para cada libro, uno por uno. Una barra de progreso muestra cuántos libros lleva procesados y el título del libro en curso. Los libros sin ISBN se buscan por título y autor.

### ¿Dónde se guardan los datos?

Los datos se guardan en tu computador en archivos locales. No se envía nada a internet salvo cuando usas los botones de búsqueda de información adicional. Puedes ver la ruta exacta y abrir la carpeta desde el ícono **ⓘ** en la esquina superior derecha.

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

**`src/main/`** — proceso principal (Node.js). Tiene acceso completo al sistema de archivos y al SO. Gestiona las ventanas, lee y escribe los archivos JSON de datos, realiza las peticiones HTTP a las APIs externas, y expone todas las operaciones al renderer mediante canales IPC.

**`src/preload/`** — puente de seguridad. Corre antes de que cargue el renderer y expone al browser únicamente las funciones autorizadas del proceso main, usando `contextBridge`. El renderer no puede llamar a Node.js directamente.

**`src/renderer/`** — proceso renderer (Chromium + React). Es un browser que no tiene acceso al SO. Toda interacción con archivos o red pasa por las funciones expuestas desde el preload.

```
src/
├── main/
│   └── index.ts          # IPC handlers, lectura/escritura de archivos, fetch de APIs
├── preload/
│   └── index.ts          # contextBridge: expone window.electron
├── renderer/
│   └── src/
│       ├── App.tsx        # Componente raíz, estado global, tabla y cuadrícula
│       ├── main.tsx       # Punto de entrada React
│       ├── index.css      # Estilos globales (dark theme, componentes)
│       ├── env.d.ts       # Tipado de window.electron para el renderer
│       ├── utils.ts       # Helpers compartidos: formatDate, formatAuthor
│       └── components/
│           ├── BookForm.tsx    # Modal de agregar / editar (tabs: Libro, Lectura)
│           ├── BookDetail.tsx  # Modal de detalle con metadatos
│           ├── BookCard.tsx    # Tarjeta para la vista de cuadrícula
│           └── InfoModal.tsx   # Modal de información y fuentes de datos
└── shared/
    └── types/             # Tipos compartidos entre main y renderer
        ├── book.ts
        ├── book-category.ts
        ├── book-status.ts
        ├── book-meta.ts
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
  readings: Reading[]  // historial completo de lecturas
  pages?: number       // páginas, ingresado manualmente
  linesPerPage?: number
  score?: number       // puntuación 1–5 con un decimal
}

interface Reading {
  startDate: string    // formato YYYY-MM-DD
  endDate?: string
  completed?: boolean  // true = terminada, false = abandonada
}
```

**`BookMeta`**

Información enriquecida obtenida desde APIs externas. Se persiste en un archivo separado (`books-meta.json`) indexado por el `id` del libro, de modo que los datos del libro y sus metadatos pueden actualizarse de forma independiente.

```ts
interface BookMeta {
  cover?: string         // URL de imagen o data URI del placeholder SVG
  originalTitle?: string
  description?: string
  pages?: number
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

El estado de un libro (`'pending' | 'abandoned' | 'in-progress' | 'finished'`) no se almacena: se calcula en tiempo de ejecución con la función `getStatus(book)` a partir del array `readings`.

### Persistencia de datos

Los datos se guardan en dos archivos JSON cuya ubicación varía según el entorno:

| Archivo | Contenido | Ruta (dev) |
|---|---|---|
| `books.json` | Array de libros | `<raíz del proyecto>/data/books.json` |
| `books-meta.json` | Metadatos por ID de libro | `<raíz del proyecto>/data/books-meta.json` |

En producción ambos archivos se ubican en `~/Library/Application Support/PersonalMediaTracker/data/`.

El proceso main lee y escribe los archivos completos en cada operación usando `fs` de Node.js. No hay base de datos ni ORM.

### Canales IPC

La comunicación renderer → main se realiza a través de `ipcRenderer.invoke` / `ipcMain.handle`.

| Canal | Parámetros | Retorno | Descripción |
|---|---|---|---|
| `get-books` | — | `Book[]` | Lee books.json |
| `add-book` | `Omit<Book, 'id'>` | `Book[]` | Agrega con UUID generado en main |
| `update-book` | `Book` | `Book[]` | Reemplaza por id |
| `delete-book` | `id: string` | `Book[]` | Filtra y sobreescribe |
| `get-data-dir` | — | `string` | Ruta de la carpeta de datos |
| `open-data-dir` | — | `void` | Abre la carpeta en Finder |
| `get-book-meta` | `id: string` | `BookMeta \| null` | Lee caché local sin red |
| `fetch-book-meta` | `id: string` | `BookMeta` | Consulta APIs, guarda en caché |
| `fetch-all-meta` | — | `void` | Borra caché y actualiza todos los libros; emite eventos de progreso `fetch-all-meta-progress` |

Las operaciones de CRUD devuelven el array completo actualizado para que el renderer mantenga su estado sincronizado sin una segunda llamada.

El canal `fetch-all-meta` emite eventos de progreso al renderer mediante `event.sender.send('fetch-all-meta-progress', { done, total, currentTitle })` después de cada libro procesado. El renderer los recibe con `ipcRenderer.on` y los desuscribe con `ipcRenderer.removeAllListeners` al desmontar.

### Metadatos externos

El canal `fetch-book-meta` ejecuta en paralelo dos consultas a APIs públicas y mergea los resultados:

**Open Library** (fuente primaria)
1. `GET /api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data` — obtiene cover, pages y clave de la obra
2. `GET /works/{key}.json` — obtiene originalTitle y description
3. Fallback: `GET /search.json?title=...&author=...` si el ISBN no retorna resultado

**Google Books** (complementa campos faltantes)
1. `GET /books/v1/volumes?q=isbn:{isbn}` — búsqueda por ISBN
2. Fallback: `q=intitle:...+inauthor:...` si faltan cover o description

El merge da prioridad a Open Library; cada campo se rellena con el primer valor encontrado. Si ninguna API retorna portada, se genera un **placeholder SVG** (200×300 px) con el título y el autor, codificado como `data:image/svg+xml;base64,...`. Todas las peticiones usan `AbortSignal.timeout()` para evitar bloqueos.

### Vista de cuadrícula

El estado `viewMode: 'table' | 'grid'` en `App.tsx` controla qué vista se renderiza. Ambas vistas consumen el mismo array `filtered` (búsqueda + filtro + sort), por lo que los controles del toolbar funcionan de forma idéntica en las dos.

**`BookCard`** — cada tarjeta carga sus metadatos de forma independiente con `window.electron.getBookMeta(book.id)` en un `useEffect`, leyendo únicamente el caché local sin peticiones de red.

**`SortDropdown`** — componente interno de `App.tsx` que reemplaza al `<select>` nativo en la vista de cuadrícula. Muestra el campo de orden activo y un botón de dirección en un control pill compuesto; al hacer clic abre un menú flotante posicionado con `position: absolute`. Un `backdrop` transparente con `position: fixed` captura los clics fuera para cerrar el menú.

### Comandos

```bash
npm run dev        # Abre la app en modo desarrollo con hot reload
npm run dist:mac   # Compila y genera el instalador .dmg para macOS
```
