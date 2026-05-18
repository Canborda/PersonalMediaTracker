# PersonalMediaTracker

Aplicación de escritorio para llevar un registro personal de libros leídos, en progreso y pendientes.

---

## Para el usuario

### ¿Qué hace esta app?

PersonalMediaTracker es una agenda personal de lectura. Permite registrar todos los libros que has leído, que estás leyendo o que quieres leer, con información detallada de cada uno. Los datos se guardan localmente en tu computador; no necesitas cuenta, ni suscripción, ni conexión a internet para usarla.

### Agregar un libro

Al agregar o editar un libro, los campos están organizados en tres secciones colapsables. La primera sección muestra un ✓ cuando todos sus campos requeridos están completos.

**Sección 1 — Información básica** (todos los campos son obligatorios)

| Campo | Para qué sirve |
|---|---|
| **Título** | Nombre del libro |
| **Autor** | Nombre completo del autor |
| **ISBN** | Código identificador del libro (10 o 13 dígitos, está en la contraportada o solapa) |
| **Año de publicación** | Año en que se publicó el libro (no puede ser mayor al año actual) |

**Sección 2 — Información adicional** (todos los campos son opcionales)

| Campo | Para qué sirve |
|---|---|
| **Título original** | Título en el idioma de publicación original |
| **Idioma original** | Idioma en que fue escrito el libro originalmente |
| **Categoría** | Tipo de libro: Novela · Novela corta · Cuento · Poesía · Ensayo · Crónica · Historia · Filosofía · Biografía · Ciencia · Autoayuda · Infantil / Juvenil · Académico · Cómic / Novela gráfica · Otro |
| **Páginas** | Número de páginas del libro |
| **Líneas por página** | Promedio de líneas por página, usado para estimar palabras |

**Sección 3 — Puntuación** (solo visible al editar un libro finalizado)

| Campo | Para qué sirve |
|---|---|
| **Puntuación** | Valoración del libro de 1 a 5 con un decimal |

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
| Autores leídos | Autores únicos con al menos un libro terminado |
| Páginas leídas | Suma de páginas × número de lecturas terminadas por libro |
| Días / libro | Promedio de días entre inicio y fin por lectura terminada |
| ~Palabras leídas | Estimado: páginas × líneas por página × 9 palabras por línea |
| ~WPD prom. | Promedio de palabras por día estimadas por lectura terminada |

Los indicadores marcados con `~` son estimados. Hacer hover sobre cualquier KPI muestra una descripción breve.

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

**Gráfica: Autores más leídos**

Muestra un ranking horizontal de autores ordenado por palabras estimadas leídas (solo lecturas terminadas). Cada fila incluye el nombre del autor, una barra proporcional al total de palabras y el número de libros terminados.

- **Hover** sobre una fila — muestra tooltip con nombre del autor, número de libros terminados y estimado de palabras y páginas leídas.
- Si hay más autores de los que caben en el área visible, la lista tiene scroll vertical propio.

**Gráfica: Categorías**

Muestra la distribución de libros terminados por categoría como una dona SVG. Cada segmento corresponde a una categoría; si hay más de siete, el resto se agrupa en "Otros". La leyenda de colores aparece a la derecha de la dona y tiene scroll si hay muchas categorías.

- **Hover** sobre un segmento o una fila de la leyenda — resalta el segmento, muestra en el centro de la dona el número de libros y el porcentaje de esa categoría, y abre un tooltip con el nombre de la categoría, la cantidad de libros y el porcentaje.

**Gráfica: Idioma original**

Misma estructura de dona que Categorías, pero agrupa los libros terminados por el valor del campo **Idioma original**. Los libros sin ese campo se cuentan bajo "Sin datos". Si hay más de siete idiomas, el resto se agrupa en "Otros".

**Gráfica: Libros más largos**

Ranking horizontal de hasta 10 libros terminados con más palabras estimadas (páginas × líneas por página × 9 palabras por línea). Cada fila muestra el título, una barra proporcional al conteo y el estimado de palabras. Solo se incluyen libros terminados que tengan el campo **Páginas** registrado.

- **Hover** sobre una fila — muestra tooltip con título, autor, palabras estimadas y número de páginas.

El carrusel avanza automáticamente cada 10 segundos si el cursor no está sobre el panel de estadísticas. Las flechas `‹ ›` y los puntos de navegación cambian de gráfica con una animación de deslizamiento horizontal.

### ¿Qué muestra el panel de detalle?

Al hacer clic en un libro se abre un panel con toda su información:

- Portada del libro (si fue encontrada) o letra inicial como placeholder
- Título, título original (en paréntesis, si es diferente), autor, año e ISBN
- Estado actual (badge de color)
- Fecha de inicio y fin
- Categoría e idioma original (si fueron ingresados)
- Temas y sinopsis (si fueron encontrados desde internet)
- Historial de lecturas en la pestaña **Lecturas** (visible cuando hay más de una)
- Botones de acción según el estado: Iniciar lectura · Terminar lectura · Reanudar · Releer
- Botones para editar, eliminar y buscar información adicional del libro

### Obtener información adicional de un libro

Desde el panel de detalle puedes hacer clic en el ícono de descarga para que la app busque automáticamente en internet información adicional sobre el libro:

- **Portada** — imagen de la tapa
- **Sinopsis** — descripción del libro
- **Temas** — hasta 5 etiquetas de categorías temáticas

La búsqueda usa primero el ISBN (más preciso), luego el título original si aún faltan campos, y por último el título en español. La información encontrada queda guardada localmente y no vuelve a buscarse a menos que lo pidas de nuevo.

Si no se encuentra portada, se genera automáticamente un placeholder con el título y el autor.

### Actualizar los metadatos de todos los libros

Desde el ícono de ajustes ⚙ en la esquina superior derecha puedes lanzar una actualización masiva que borra el caché actual y vuelve a buscar portada, sinopsis y temas para cada libro, uno por uno. Una barra de progreso muestra cuántos libros lleva procesados y el título del libro en curso.

### Ajustes

El ícono ⚙ de la esquina superior derecha abre el panel de ajustes, que incluye:

- **Carpeta de datos** — ruta donde se guardan los archivos JSON; botón para abrirla en Finder.
- **Fuentes de metadatos** — muestra las APIs usadas (Open Library y Google Books). En la sección de Google Books se puede ingresar una API key personal para evitar errores de cuota (429). La key se guarda en `data/config.json` (excluido del repositorio) y se usa automáticamente en todas las búsquedas. Sin key las peticiones son anónimas.
- **Metadatos** — botón de actualización masiva con barra de progreso.

### ¿Dónde se guardan los datos?

Los datos se guardan en tu computador en archivos locales. No se envía nada a internet salvo cuando usas los botones de búsqueda de información adicional. Puedes ver la ruta exacta y abrir la carpeta desde el panel de ajustes.

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
│       ├── utils.ts       # Helpers compartidos: formatDate, formatAuthor, fmtWords
│       └── components/
│           ├── BookForm.tsx    # Modal de agregar / editar
│           ├── BookDetail.tsx  # Panel de detalle con tabs
│           ├── BookCard.tsx    # Tarjeta para la vista de cuadrícula
│           ├── SettingsModal.tsx # Modal de ajustes: carpeta de datos, API key, metadatos
│           ├── StatsView.tsx   # Panel de estadísticas: KPIs y carrusel de gráficas
│           └── charts/
│               ├── WPDChart.tsx          # Gráfica de palabras por día
│               ├── AuthorsChart.tsx      # Gráfica de autores más leídos
│               ├── CategoryChart.tsx     # Dona de distribución por categoría
│               ├── LanguageChart.tsx     # Dona de distribución por idioma original
│               └── LongestBooksChart.tsx # Ranking de libros más largos (terminados)
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
  id: string              // UUID generado en el proceso main
  title: string
  author: string
  year: number
  isbn: string
  readings: Reading[]     // historial completo de lecturas
  additionalData: BookAdditionalData
  score?: number          // puntuación 1–5 con un decimal
}

interface BookAdditionalData {
  originalTitle?: string
  originalLanguage?: string
  category?: BookCategory
  pages?: number
  linesPerPage?: number
}

interface Reading {
  startDate: string       // formato YYYY-MM-DD
  endDate?: string
  completed?: boolean     // true = terminada, false = abandonada
}
```

Los campos opcionales del libro se agrupan en `additionalData`, que siempre está presente aunque esté vacío. El orden de los campos en el JSON se garantiza mediante la función `normalizeBook()` en el proceso main, que reconstruye cada objeto en el orden definido por los tipos antes de escribirlo a disco.

**`BookMeta`**

Información enriquecida obtenida desde APIs externas. Se persiste en un archivo separado (`books-meta.json`) indexado por el `id` del libro, de modo que los datos del libro y sus metadatos pueden actualizarse de forma independiente.

```ts
interface BookMeta {
  cover?: string         // URL de imagen o data URI del placeholder SVG
  description?: string
  subjects?: string[]   // hasta 5 etiquetas temáticas
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

Los datos se guardan en archivos JSON cuya ubicación varía según el entorno:

| Archivo | Contenido | Ruta (dev) |
|---|---|---|
| `books.json` | Array de libros | `<raíz del proyecto>/data/books.json` |
| `books-meta.json` | Metadatos por ID de libro | `<raíz del proyecto>/data/books-meta.json` |
| `config.json` | Configuración (API keys) | `<raíz del proyecto>/data/config.json` |

En producción los tres archivos se ubican en `~/Library/Application Support/PersonalMediaTracker/data/`. El archivo `config.json` está excluido del repositorio.

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
| `get-api-key` | — | `string` | Lee la Google Books API key de config.json |
| `set-api-key` | `key: string` | `void` | Guarda o borra la API key en config.json |

Las operaciones de CRUD devuelven el array completo actualizado para que el renderer mantenga su estado sincronizado sin una segunda llamada.

El canal `fetch-all-meta` emite eventos de progreso al renderer mediante `event.sender.send('fetch-all-meta-progress', { done, total, currentTitle })` después de cada libro procesado. El renderer los recibe con `ipcRenderer.on` y los desuscribe con `ipcRenderer.removeAllListeners` al desmontar.

### Metadatos externos

El canal `fetch-book-meta` ejecuta en paralelo dos consultas a APIs públicas y mergea los resultados:

**Google Books** y **Open Library** usan la misma estrategia de búsqueda en tres pasos:
1. Buscar por **ISBN** — identificador exacto de la edición
2. Buscar por **título original** (si fue ingresado y aún faltan campos)
3. Buscar por **título en español** (si aún faltan campos)

El merge da prioridad a Google Books para cover y description. Los **temas** (`subjects`) se combinan y deduplican tomando primero los de Google Books y completando con los de Open Library. Si ninguna API retorna portada, se genera un **placeholder SVG** (200×300 px) con el título y el autor, codificado como `data:image/svg+xml;base64,...`.

Si se configura una **Google Books API key** en los ajustes, se añade como parámetro `&key=` en todas las peticiones a esa API, evitando errores 429 por cuota anónima compartida. Sin key las peticiones son anónimas. La key se persiste en `data/config.json` (excluido del repositorio). Todas las peticiones usan `AbortSignal.timeout()` para evitar bloqueos.

### Vista de cuadrícula

El estado `viewMode: 'table' | 'grid'` en `App.tsx` controla qué vista se renderiza. Ambas vistas consumen el mismo array `filtered` (búsqueda + filtro + sort), por lo que los controles del toolbar funcionan de forma idéntica en las dos.

**`BookCard`** — cada tarjeta carga sus metadatos de forma independiente con `window.electron.getBookMeta(book.id)` en un `useEffect`, leyendo únicamente el caché local sin peticiones de red.

**`SortDropdown`** — componente interno de `App.tsx` que reemplaza al `<select>` nativo en la vista de cuadrícula. Muestra el campo de orden activo y un botón de dirección en un control pill compuesto; al hacer clic abre un menú flotante posicionado con `position: absolute`. Un `backdrop` transparente con `position: fixed` captura los clics fuera para cerrar el menú.

### Comandos

```bash
npm run dev        # Abre la app en modo desarrollo con hot reload
npm run dist:mac   # Compila y genera el instalador .dmg para macOS
```
