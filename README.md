# PersonalMediaTracker v1.2.0

Aplicación de escritorio para llevar un registro personal de libros leídos, en progreso y pendientes.

---

## Para el usuario

### ¿Qué hace esta app?

PersonalMediaTracker es una agenda personal de lectura. Permite registrar todos los libros que has leído, que estás leyendo o que quieres leer, con información detallada de cada uno. Los datos se guardan localmente en tu computador; no necesitas cuenta, ni suscripción, ni conexión a internet para usarla.

### Ciclo de vida de un libro

#### Agregar y editar

El formulario de alta y edición organiza los campos en tres secciones colapsables.

**Sección 1 — Información básica** (obligatoria)

| Campo | Descripción |
|---|---|
| **Título** | Nombre del libro |
| **Autor** | Nombre completo del autor |
| **ISBN** | Código identificador de 10 o 13 dígitos (contraportada o solapa) |
| **Año de publicación** | Año de publicación; no puede ser mayor al año actual |

**Sección 2 — Información adicional** (opcional)

| Campo | Descripción |
|---|---|
| **Título original** | Título en el idioma de publicación original |
| **Idioma original** | Idioma en que fue escrito el libro originalmente |
| **Género** | Novela · Novela corta · Cuento · Poesía · Ensayo · Crónica · Historia · Filosofía · Memorias · Ciencia · Autoayuda · Infantil / Juvenil · Académico · Cómic / Novela gráfica · Otro |
| **Páginas** | Número de páginas del libro |
| **Líneas por página** | Promedio de líneas por página, usado para estimar palabras |

**Sección 3 — Puntuación** (solo al editar un libro finalizado)

| Campo | Descripción |
|---|---|
| **Puntuación** | Valoración de 1 a 5 con un decimal |

#### Estados y transiciones

El estado de un libro se calcula automáticamente a partir del historial de lecturas y no se almacena:

- Sin lecturas registradas → **Pendiente**
- Lectura activa (sin fecha de fin) → **En progreso**
- Al menos una lectura marcada como terminada → **Finalizado** (tiene prioridad, salvo que haya una lectura activa)
- Última lectura con fecha de fin pero ninguna marcada como terminada → **Abandonado**

Las transiciones se gestionan desde el panel de detalle del libro:

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
                │ Terminar (sí terminé)
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

| Transición | Datos que pide |
|---|---|
| Pendiente → En progreso | Fecha de inicio |
| En progreso → Finalizado | Fecha de fin + puntuación |
| En progreso → Abandonado | Fecha de fin |
| Abandonado → En progreso | Fecha de inicio de la nueva lectura |
| Finalizado → En progreso | Fecha de inicio de la nueva lectura |

Cada ciclo de releer o reanudar añade una nueva entrada al historial de lecturas sin modificar las anteriores.

#### Tags

Los tags son etiquetas de texto libre para clasificar los libros. Solo están disponibles para libros **Finalizados** y se gestionan desde la pestaña **Métricas** del panel de detalle. Al escribir un tag nuevo aparecen sugerencias filtradas de los tags ya existentes en la librería.

---

## Navegación

La app tiene una barra de navegación vertical fija en el lado izquierdo con cinco tabs y una **isla de acciones flotante** en la esquina inferior izquierda con los botones de agregar libro (**＋**) y ajustes (**⚙**), disponibles desde cualquier vista.

### Inicio

Vista de resumen de la actividad lectora, organizada en dos columnas:

```
┌─────────────────────────────────────────────────────────────┐
│                        Mi estantería                        │
├─────────────────┬───────────────────────────────────────────┤
│                 │  Así han ido mis últimos 6 meses          │
│  Lo que llevo   │  [ Línea del tiempo ]                     │
│  recorrido      ├───────────────────────────────────────────┤
│                 │  Mi ritmo día a día                       │
│  · Terminados   │  [ Mapa de calor ]                        │
│  · Autores      ├──────────────────────────┬────────────────┤
│  · Páginas      │  Volviendo a mis libros  │ Lo mejor que   │
│  · Días/libro   │  [ Carousel ]            │ he leído       │
│  · ~Palabras    │                          │ [ Podio ]      │
│  · ~WPD prom.   │                          │                │
└─────────────────┴──────────────────────────┴────────────────┘
```

**Columna izquierda — KPIs**

Seis indicadores sobre el total de lecturas terminadas: libros terminados, autores leídos, páginas leídas, días promedio por libro, palabras estimadas leídas y palabras por día promedio. Los valores marcados con `~` son estimados (páginas × líneas/página × 9 palabras/línea).

**Columna derecha — secciones**

- **Línea del tiempo** — muestra cada lectura de los últimos 6 meses como una barra proporcional a su duración. Las lecturas que se solapan en el tiempo se distribuyen en filas separadas. Las lecturas en progreso se distinguen de las finalizadas.

- **Mapa de calor** — cuadrícula de las últimas 80 semanas donde cada celda representa un día. La intensidad de color indica las palabras por día estimadas para ese día, considerando solo lecturas finalizadas o en progreso. Las columnas donde cambia el año están marcadas.

- **Volviendo a mis libros** — carousel de libros finalizados con portada registrada. Muestra la portada, estado, título, autor, año y sinopsis. Avanza automáticamente cada 10 segundos.

- **Lo mejor que he leído** — podio con los tres libros de mayor puntuación. Las columnas del podio tienen alturas proporcionales al ranking (1°, 2°, 3°). Requiere que los libros tengan puntuación asignada.

### Catálogo

Vista de cuadrícula con una tarjeta por libro que muestra portada (o placeholder con la inicial del título), estado, puntuación (si está finalizado), título, autor y año.

Controles del toolbar compartidos con la vista de tabla:

- **Buscar** por título o autor en tiempo real
- **Filtrar** por estado: Todos · En progreso · Finalizado · Abandonado · Pendiente
- **Filtrar** por tags: selección múltiple con lógica OR
- **Ordenar** por inicio, fin, título, autor, estado, año o puntuación (por defecto: inicio, más reciente primero)

### Tabla

Vista de filas con los mismos filtros y ordenamiento que el catálogo. Permite elegir una **métrica adicional** para mostrar en la columna derecha: días, páginas, palabras estimadas, ritmo en ~pal/día, puntuación, año, fecha de inicio, fecha de fin o número de lecturas. El ritmo se calcula sobre la lectura más reciente terminada o en progreso; los libros pendientes y abandonados no muestran valor.

### Estadísticas

Vista con KPIs globales y un carrusel de cuatro gráficas, todas calculadas sobre la colección completa independientemente del filtro activo en el catálogo:

- **Palabras por día** — cada lectura terminada o en progreso como un segmento horizontal. El eje X es tiempo, el eje Y son palabras por día estimadas.
- **Autores más leídos** — ranking por palabras totales estimadas (solo lecturas terminadas).
- **Géneros** — distribución de libros terminados por género.
- **Idioma original** — distribución de libros terminados por idioma.

### Tags

Muestra todos los libros agrupados por tag en secciones colapsables. Cada sección lista las tarjetas de los libros que comparten ese tag, ordenados por año. Los grupos están ordenados por número de libros de mayor a menor.

### Panel de detalle

Al hacer clic en cualquier libro (desde catálogo, tabla o tags) se abre un panel lateral con toda su información:

- Portada o placeholder generado con título y autor
- Título, título original, autor, año e ISBN
- Estado actual, fecha de inicio y fin
- Género e idioma original (si fueron ingresados)
- Sinopsis y temas (si fueron obtenidos desde internet)
- Pestaña **Métricas** (solo finalizados): páginas, líneas/página, palabras estimadas, tags y puntuación
- Pestaña **Lecturas** (visible cuando hay más de una): historial con fecha de inicio, fecha de fin, días y estado de cada lectura
- Botones de transición según el estado actual: Iniciar lectura · Terminar lectura · Reanudar · Releer
- Botones para editar, eliminar (con confirmación) y buscar información adicional del libro

### Ajustes

El panel de ajustes incluye:

- **Carpeta de datos** — ruta de los archivos JSON y botón para abrirla en Finder
- **Fuentes de metadatos** — muestra las APIs usadas (Open Library y Google Books) y permite ingresar una API key de Google Books para evitar errores de cuota
- **Metadatos** — botón para relanzar la búsqueda de portada, sinopsis y temas para todos los libros de la librería

### Obtener información adicional

Desde el panel de detalle se puede solicitar a la app que busque en internet la portada, sinopsis y hasta 5 temas temáticos del libro. La búsqueda usa primero el ISBN, luego el título original si falta algún campo, y finalmente el título en español. Si no se encuentra portada, la app genera un placeholder SVG con el título y el autor. La información queda guardada localmente.

### ¿Dónde se guardan los datos?

Los datos se guardan localmente en archivos JSON en el computador. No se envía nada a internet salvo cuando se usan los botones de búsqueda de información adicional. La ruta exacta y el botón para abrir la carpeta están disponibles en el panel de ajustes.

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

**`src/main/`** — proceso principal (Node.js). Gestiona las ventanas, lee y escribe los archivos JSON de datos, realiza peticiones HTTP a las APIs externas, y expone todas las operaciones al renderer mediante canales IPC.

**`src/preload/`** — puente de seguridad. Expone al renderer únicamente las funciones autorizadas del proceso main usando `contextBridge`.

**`src/renderer/`** — proceso renderer (Chromium + React). Toda interacción con archivos o red pasa por las funciones expuestas desde el preload.

```
src/
├── main/
│   └── index.ts          # IPC handlers, lectura/escritura de archivos, fetch de APIs
├── preload/
│   └── index.ts          # contextBridge: expone window.electron
├── renderer/
│   └── src/
│       ├── App.tsx        # Componente raíz, routing de tabs, isla de acciones
│       ├── main.tsx       # Punto de entrada React
│       ├── index.css      # Estilos globales (dark theme, componentes, animaciones)
│       ├── env.d.ts       # Tipado de window.electron para el renderer
│       ├── utils.ts       # Helpers: formatDate, formatAuthor, fmtWords, daysBetween, readingWPD
│       ├── icons.tsx      # Componentes de íconos SVG
│       └── components/
│           ├── HomeView.tsx      # Vista de inicio: hero, KPIs, timeline, heatmap, carousel, podio
│           ├── CatalogView.tsx   # Vista de cuadrícula con portadas
│           ├── TableView.tsx     # Vista de tabla con métricas seleccionables
│           ├── StatsView.tsx     # Panel de estadísticas: KPIs y carrusel de gráficas
│           ├── TagsView.tsx      # Vista de tags
│           ├── TagsSection.tsx   # Grupos colapsables con animación
│           ├── BookForm.tsx      # Modal de agregar / editar
│           ├── BookDetail.tsx    # Panel de detalle con tabs
│           ├── BookCard.tsx      # Tarjeta para la vista de cuadrícula
│           ├── ViewHeader.tsx    # Cabecera estándar de vistas
│           ├── SettingsModal.tsx # Modal de ajustes
│           └── charts/
│               ├── WPDChart.tsx      # Gráfica de palabras por día
│               ├── AuthorsChart.tsx  # Ranking de autores
│               ├── GenreChart.tsx    # Dona de géneros
│               └── LanguageChart.tsx # Dona de idiomas
└── shared/
    └── types/
        ├── book.ts
        ├── book-genre.ts
        ├── book-status.ts
        ├── book-meta.ts
        └── index.ts
```

### Tipos compartidos

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
  tags?: string[]         // etiquetas personalizadas (solo libros finalizados)
}

interface BookAdditionalData {
  originalTitle?: string
  originalLanguage?: string
  genre?: BookGenre
  pages?: number
  linesPerPage?: number
}

interface Reading {
  startDate: string       // formato YYYY-MM-DD
  endDate?: string
  completed?: boolean     // true = terminada, false = abandonada
}
```

**`BookMeta`** — información enriquecida desde APIs externas, persistida en `books-meta.json` indexada por `id`.

```ts
interface BookMeta {
  cover?: string         // URL de imagen o data URI del placeholder SVG
  description?: string
  subjects?: string[]
}
```

**`BookStatus`** — no se almacena; se calcula con `getStatus(book)` a partir de `readings`.

### Persistencia de datos

| Archivo | Contenido | Ruta (dev) |
|---|---|---|
| `books.json` | Array de libros | `<raíz del proyecto>/data/books.json` |
| `books-meta.json` | Metadatos por ID | `<raíz del proyecto>/data/books-meta.json` |
| `config.json` | Configuración (API keys) | `<raíz del proyecto>/data/config.json` |

En producción los archivos se ubican en `~/Library/Application Support/PersonalMediaTracker/data/`. El archivo `config.json` está excluido del repositorio.

### Canales IPC

| Canal | Parámetros | Retorno | Descripción |
|---|---|---|---|
| `get-books` | — | `Book[]` | Lee books.json |
| `add-book` | `Omit<Book, 'id'>` | `Book[]` | Agrega con UUID generado en main |
| `update-book` | `Book` | `Book[]` | Reemplaza por id |
| `delete-book` | `id: string` | `Book[]` | Filtra books.json y borra entrada en books-meta.json |
| `get-data-dir` | — | `string` | Ruta de la carpeta de datos |
| `open-data-dir` | — | `void` | Abre la carpeta en Finder |
| `open-external` | `url: string` | `void` | Abre una URL en el navegador del sistema |
| `get-book-meta` | `id: string` | `BookMeta \| null` | Lee caché local sin red |
| `fetch-book-meta` | `id: string` | `BookMeta` | Consulta APIs y guarda en caché |
| `fetch-all-meta` | — | `void` | Borra caché y actualiza todos; emite `fetch-all-meta-progress` |
| `get-api-key` | — | `string` | Lee Google Books API key |
| `set-api-key` | `key: string` | `void` | Guarda o borra la API key |

### Cálculo de WPD

La función `readingWPD(pages, linesPerPage, days)` en `utils.ts` es la fuente única de verdad para estimar palabras por día:

```ts
readingWPD = (pages × (linesPerPage ?? 30) × 9) / days
```

Se usa en cuatro sitios: `buildStats` (KPI de WPD promedio), `HomePaceMap` (intensidad del heatmap), `WPDChart` (gráfica de estadísticas) y `TableView` (columna de ritmo). La constante `WORDS_PER_LINE = 9` en `utils.ts` es el único parámetro que controla el estimado de palabras en toda la app.

### Comandos

```bash
npm run dev        # Abre la app en modo desarrollo con hot reload
npm run dist:mac   # Compila y genera el instalador .dmg para macOS
```

---

## Historial de versiones

### v1.2.0

**Nuevo: Vista de inicio**

Vista completamente nueva con panel de título, KPIs y cuatro secciones analíticas:

- Panel de título con efecto metálico interactivo.
- Seis KPIs de lectura en columna izquierda: libros terminados, autores, páginas, días/libro, ~palabras y ~WPD promedio.
- Línea del tiempo de los últimos 6 meses: una barra por lectura, con solapamiento en filas y distinción visual entre lecturas terminadas y en progreso.
- Mapa de calor de las últimas 80 semanas con intensidad proporcional a las palabras por día estimadas y marcas de cambio de año.
- Carousel de libros finalizados con portada, avance automático cada 10 segundos.
- Podio de los 3 libros mejor puntuados con portadas y columnas de altura proporcional al ranking.

**Nuevo: Sistema de navegación por tabs**

Las vistas existentes (catálogo, tabla y estadísticas) se reorganizaron en un sistema de tabs con barra de navegación vertical fija. Se añadieron la vista de inicio y la vista de tags como tabs nuevos.

**Nuevo: Vista de tags**

Vista dedicada que agrupa todos los libros por tag en secciones colapsables, ordenadas por número de libros. Complementa el filtro por tags ya existente en el toolbar del catálogo.

**Nuevo: Isla de acciones flotante**

Botones de agregar libro y ajustes fijos en la esquina inferior izquierda, disponibles desde cualquier vista. El tab de inicio tiene un estilo diferenciado del resto de tabs.

**Nuevo: Animaciones de interfaz**

- Animación de entrada al cambiar de tab.
- Los colapsables de la vista de tags se abren y cierran con transición suave.

**Correcciones**

- Las lecturas abandonadas ya no se incluyen en el cálculo de WPD del mapa de calor ni en la columna de ritmo de la vista de tabla.
- La columna de ritmo de la vista de tabla muestra `—` para libros pendientes y abandonados.

**Refactorización**

- Cálculo de WPD unificado en la función `readingWPD` en `utils.ts`; antes cada componente lo calculaba de forma independiente.

### v1.1.0

- Versión mostrada en el título de la ventana.
- Género renombrado desde "Categoría"; "Memorias" reemplaza a "Biografía".
- Modal de confirmación antes de eliminar un libro.
- Bug: al eliminar un libro, su entrada en `books-meta.json` ahora se elimina también.
- El dropdown de sugerencias de tags se abre al hacer foco en el campo.
- El campo de autor muestra autocompletado filtrado desde los autores existentes.

### v1.0.0

Primera versión estable.

- CRUD completo de libros con validación de campos obligatorios.
- Máquina de estados de lectura con historial completo.
- Vista de tabla y vista de cuadrícula con búsqueda, filtro y ordenamiento.
- Panel de estadísticas con KPIs y carrusel de gráficas.
- Sistema de tags con filtro multi-selección.
- Metadatos externos (portada, sinopsis, temas) desde Open Library y Google Books.
- Panel de ajustes: ruta de datos, API key y actualización masiva de metadatos.
