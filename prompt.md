Quiero consolidar mis bases en programación y quisiera usar la ia para crear un proyecto de un juego que me enseñe, patrones de diseño, buenas practicas, enfocado a el flujo de datos como si desarrollar una api se tratara, enfocado en Back-end developer. No en algoritmos, mas bien bien enfocado en lo que te comenté, como desarrollar proyecto reales.

Necesito que desarrolles un backend para un videojuego estilo ARPG (similar a Diablo II) pero simplificado, con enfoque en arquitectura de software, patrones de diseño y buenas prácticas para backend. El proyecto se llamará "DARKFALL"

## REQUISITOS DEL PROYECTO

### Tecnologías
- Lenguaje: TypeScript (Node.js) v24.16.0
- Framework: Express
- Validación: class-validator + class-transformer
- Testing: Jest + Supertest
- Logging: Winston
- Persistencia: Base de datos MySQL
- Documentación: Swagger/OpenAPI

### Estructura de Carpetas (Arquitectura Limpia) src/
├── domain/ # Entidades y reglas de negocio (sin dependencias externas)
│ ├── entities/ # Hero, Item, Enemy, Dungeon, Room
│ ├── value-objects/ # Stats, Position, Rarity, ItemType
│ ├── enums/ # Rarity, ItemType, EnemyType
│ └── errors/ # Excepciones de dominio personalizadas
├── application/ # Casos de uso (orquestan el dominio)
│ ├── services/ # CombatService, LootService, InventoryService, DungeonService
│ ├── commands/ # EquipItemCommand, AttackEnemyCommand, MoveRoomCommand
│ ├── events/ # EnemyKilledEvent, ItemLootedEvent, HeroLevelUpEvent
│ └── ports/ # Interfaces para repositorios (IRepository<Hero>, IRepository<Item>)
├── infrastructure/ # Implementaciones concretas
│ ├── repositories/ # JsonHeroRepository, JsonItemRepository
│ ├── persistence/ # FileSystemService (lectura/escritura JSON)
│ └── logger/ # WinstonLoggerAdapter
├── interfaces/ # Capa de entrada (API)
│ ├── controllers/ # HeroController, DungeonController, InventoryController
│ ├── dtos/ # CreateHeroDTO, EquipItemDTO, CombatResultDTO
│ ├── middlewares/ # ErrorHandler, ValidationMiddleware, LoggerMiddleware
│ ├── routes/ # Definición de rutas Express
│ └── docs/ # Configuración de Swagger
└── index.ts # Punto de entrada

### Funcionalidades del Juego

#### 1. Sistema de Héroe
- Atributos: strength, dexterity, vitality, energy (valores iniciales: 10 cada uno)
- Nivel: comienza en 1, máximo 50
- Experiencia: fórmula de XP necesaria = nivel * 100 + (nivel^2 * 10)
- Subida de nivel: al subir, otorga 5 puntos de atributo para distribuir
- Vida = vitality * 10
- Mana = energy * 5
- Daño base = strength * 2

#### 2. Sistema de Items
- Tipos: WEAPON, ARMOR, HELMET, SHIELD, RING, AMULET, POTION
- Rarezas: COMMON (blanco), MAGIC (azul), RARE (amarillo), UNIQUE (naranja)
- Atributos de items: name, type, rarity, levelRequired, stats (bonificaciones), value (oro)
- Los items pueden tener mods: +strength, +dexterity, +vitality, +energy, +damage, +defense, +fireResist, +coldResist, +lightningResist
- Los items únicos tienen nombres propios y stats fijas (ej: "Espada de los Caídos" → +15 damage, +10 strength)

#### 3. Sistema de Inventario
- Grid de 4x4 (16 celdas)
- Cada item ocupa 1 celda (simplificado, no variante de tamaño)
- El héroe puede equipar: 1 arma, 1 escudo, 1 casco, 1 armadura, 2 anillos, 1 amuleto
- Validaciones: no equipar si no tienes nivel requerido, no equipar si no tienes suficiente fuerza para armas pesadas

#### 4. Sistema de Mazmorras
- Cada mazmorra tiene 5 habitaciones
- Cada habitación tiene 1-3 enemigos
- Al limpiar una habitación, se desbloquea la siguiente
- Al limpiar la última habitación (boss), se completa la mazmorra
- Generación procedural: los enemigos y loot deben ser generados aleatoriamente

#### 5. Sistema de Combate
- Por turnos: el héroe ataca → el enemigo contraataca
- Fórmula de daño del héroe = daño_base + (strength * 0.5) + bonificaciones_de_items
- Fórmula de daño del enemigo = daño_fijo_del_enemigo
- Resistencia: daño_recibido = daño * (1 - resistencia/100)
- Experiencia al matar enemigo = nivel_enemigo * 50
- Loot al matar enemigo: probabilidad de drop (30% normal, 15% mágico, 5% raro, 1% único)

#### 6. Sistema de Persistencia
- Guardar estado del héroe (stats, nivel, experiencia, inventario, equipamiento)
- Guardar progreso de mazmorra (habitación actual, enemigos vivos/muertos)
- Cargar partida desde archivo JSON
- Cada acción importante debe guardar automáticamente

#### 7. API REST Endpoints POST /api/hero - Crear nuevo héroe (nombre, clase opcional)
GET /api/hero/:id - Obtener estado completo del héroe
PUT /api/hero/:id/level-up - Subir nivel y distribuir puntos (body: { strength: 2, dexterity: 1, ... })
POST /api/hero/:id/equip - Equipar item (body: { itemId: string })
POST /api/hero/:id/unequip - Desequipar item (body: { slot: "WEAPON" | "ARMOR" | ... })
POST /api/hero/:id/dungeon/enter - Entrar a una mazmorra (body: { dungeonLevel: number })
GET /api/hero/:id/dungeon - Obtener estado de la mazmorra actual
POST /api/hero/:id/dungeon/room/:roomId/combat - Atacar al enemigo en la sala
POST /api/hero/:id/dungeon/room/:roomId/loot - Recoger loot de la sala (si hay)
GET /api/hero/:id/inventory - Ver inventario completo
POST /api/hero/:id/save - Guardar partida manualmente
GET /api/hero/:id/saves - Listar partidas guardadas
POST /api/hero/:id/load/:saveId - Cargar una partida guardada

text

### Patrones de Diseño a Implementar (OBLIGATORIOS)

1. **Factory Pattern**: Para crear items de diferentes rarezas (ItemFactory)
2. **Builder Pattern**: Para construir items complejos con múltiples mods (ItemBuilder)
3. **Repository Pattern**: Para acceso a datos (HeroRepository, ItemRepository)
4. **Strategy Pattern**: Para diferentes estrategias de ataque de enemigos (MeleeStrategy, RangedStrategy, AOEStrategy)
5. **Decorator Pattern**: Para items con sockets o mejoras (opcional pero valorado)
6. **Observer Pattern**: Para eventos (cuando matas un enemigo, se dispara el evento y se actualiza experiencia/loot)
7. **Command Pattern**: Para encapsular acciones del jugador (EquipCommand, AttackCommand, MoveCommand)
8. **DTO Pattern**: Para transferir datos entre capas (no exponer entidades directamente)
9. **Dependency Injection**: Para inyectar dependencias en servicios (repositorios, logger, etc.)
10. **Singleton Pattern**: Para el Logger (una única instancia en toda la app)

### Requisitos de Calidad y Buenas Prácticas

- ✅ Tests unitarios con Jest (mínimo 70% de cobertura)
- ✅ Tests de integración para endpoints principales
- ✅ Manejo global de errores con excepciones personalizadas
- ✅ Logging estructurado (cada acción del usuario debe quedar registrada)
- ✅ Validaciones de entrada con class-validator
- ✅ Documentación Swagger completa
- ✅ Código tipado al 100% (sin uso de 'any')
- ✅ Middleware de autenticación básica (API Key en headers, opcional)
- ✅ Rate limiting para prevenir abusos
- ✅ Variables de entorno con dotenv

### Extras (Opcionales pero valorados)

- Sistema de "replay" de partidas usando eventos guardados
- WebSockets para notificar cambios en tiempo real (opcional)
- Sistema de logros (ej: "Matar 100 esqueletos", "Equipar item único")
- CLI para jugar desde la terminal (sin frontend)

## REQUISITOS DE ENTREGA

El código debe incluir:
1. README.md con: descripción, arquitectura, patrones usados, cómo ejecutar, cómo testear
2. package.json con scripts: start, dev, test, test:coverage, build
3. Ejemplo de archivo JSON de guardado
4. Colección de Postman con todas las peticiones
5. Archivo .env.example con variables necesarias

## RESTRICCIONES

- NO usar frameworks de juego (Phaser, Unity, etc.) - esto es 100% backend
- NO preocuparse por frontend (solo API REST)
- EL FOCO debe estar en: arquitectura limpia, patrones de diseño, flujo de datos, tests, y buenas prácticas

## NIVEL DE DETALLE ESPERADO

- El código debe ser PRODUCTION-READY (como si fuera a desplegarse en un entorno real)
- Cada clase debe tener su respectivo test unitario
- Los servicios deben tener tests de integración
- Debe haber ejemplos claros de uso de cada patrón de diseño en la documentación
 Quiero el mismo proyecto pero desarrollado por MÓDULOS. 
Empieza solo con el sistema de héroe (crear, stats, nivel, XP) y sus tests. 
Luego en siguiente interacción añadimos items, luego inventario, luego combate.
Quiero que mientras desarrollas, expliques en comentarios:
- ¿Qué patrón estás usando y por qué?
- ¿Qué decisión arquitectónica tomaste y por qué?
- ¿Qué alternativas consideraste y por qué las descartaste?
​