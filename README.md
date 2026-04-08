# misiones_programa (backend)

Backend en Node.js (Express + TypeScript) con:
- Login/Register con `JWT`
- Base de datos `MySQL`
- Registro de eventos en tabla `historial`

## Paso 1: Configurar el proyecto
1. Crear el proyecto con `npm init -y`
2. Instalar dependencias
3. Configurar TypeScript y scripts (`dev/build/start`)

## Paso 2: Variables de entorno
Copia el archivo `.env.example` a `.env` y completa:
- `DB_*` para la conexión MySQL
- `JWT_SECRET` para firmar los tokens JWT

## Paso 3: Esquema de base de datos (MySQL)
El esquema inicial está en `src/db/schema.sql`.

1. Crear la base de datos `DB_NAME` (si no existe)
2. Ejecutar el SQL de `src/db/schema.sql` en MySQL

Incluye tablas `equipos`, `unidades`, `componentes` (con FK `componentes.codigo_unidad` → `unidades`). Si tu base ya existía sin esa FK, podés mantener solo la tabla `unidades` y alinear tipos a mano; el backend asume `codigo_unidad` numérico en ambas tablas.

Estructura de `historial` (según lo que pediste):
- `idhistorial` INT NOT NULL AUTO_INCREMENT,
- `historial_date` DATETIME NULL,
- `historial_user` VARCHAR(45) NULL,
- `historial_email` VARCHAR(45) NULL,
- `historial_evento` VARCHAR(255) NULL,

## Paso 4: Endpoints actuales
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/equipos`
- `GET /api/equipos/:codigo_equipo`
- `POST /api/equipos`
- `PUT /api/equipos/:codigo_equipo`
- `DELETE /api/equipos/:codigo_equipo`
- `GET /api/componentes`
- `GET /api/componentes/:codigo_componente`
- `POST /api/componentes`
- `PUT /api/componentes/:codigo_componente`
- `DELETE /api/componentes/:codigo_componente`
- `GET /api/unidades`
- `GET /api/unidades/:codigo_unidad`
- `GET /api/unidades/:codigo_unidad/componentes`
- `GET /api/unidades/:codigo_unidad/equipos`
- `GET /api/unidades/:codigo_unidad/agrupado`
- `POST /api/unidades`
- `PUT /api/unidades/:codigo_unidad`
- `DELETE /api/unidades/:codigo_unidad`
- `GET /api/usuarios/` (lista todos los usuarios)
- `GET /api/usuarios/perfil`
- `PUT /api/usuarios/email`
- `PUT /api/usuarios/password`
- `PUT /api/usuarios/reset-password/:id`

Ambos registran eventos breves en `historial` en base a:
`idhistorial`, `historial_date`, `historial_user`, `historial_email`, `historial_evento`.

### `POST /api/auth/register`
Body:
```json
{
  "email": "correo@ejemplo.com",
  "username": "usuario123",
  "password": "password123"
}
```
Respuestas:
- `201` con `{ "idusuario": ..., "username": "...", "email": "..." }`
- `409` si `username` o `email` ya existen

Se registra en `historial_evento` el texto: `se registró`.

### `POST /api/auth/login`
Body:
```json
{
  "username": "usuario123",
  "password": "password123"
}
```
Respuestas:
- `200` con `{ "token": "..." }`
- `401` si el usuario no existe o la contraseña no coincide

Cuando no exista el usuario, el mensaje indica que use `register`:
`Usuario no registrado. Usa /api/auth/register`.

Se registra en `historial_evento` el texto: `se logueó`.

## Paso 5: Ejecutar el servidor y probar
1. Completa `.env` (a partir de `.env.example`)
2. Levanta el servidor:
```bash
npm run dev
```
3. Probar con `curl`:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"correo@ejemplo.com","username":"usuario123","password":"password123"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"usuario123","password":"password123"}'
```

## Paso 6: Probar endpoints con Postman
Servidor esperado: `http://localhost:3000`

### `GET /health`
1. Método: `GET`
2. URL: `http://localhost:3000/health`
3. Headers: ninguno
4. Resultado esperado: `200` con `{ "ok": true }`

### `POST /api/auth/register`
1. Método: `POST`
2. URL: `http://localhost:3000/api/auth/register`
3. Headers:
   - `Content-Type: application/json`
4. Body:
   - Tipo: `raw`
   - Formato: `JSON`
   - Contenido:
```json
{
  "email": "correo@ejemplo.com",
  "username": "usuario123",
  "password": "password123"
}
```
5. Resultado esperado:
   - `201` con `{ "idusuario": ..., "username": "...", "email": "..." }`
   - `409` si `username` o `email` ya existen
Nota: este endpoint escribe el evento `se registró` en `historial`.

### `POST /api/auth/login`
1. Método: `POST`
2. URL: `http://localhost:3000/api/auth/login`
3. Headers:
   - `Content-Type: application/json`
4. Body:
   - Tipo: `raw`
   - Formato: `JSON`
   - Contenido:
```json
{
  "username": "usuario123",
  "password": "password123"
}
```
5. Resultado esperado:
   - `200` con `{ "token": "..." }`
   - `401` si no existe el usuario o la password es incorrecta
Nota: este endpoint escribe el evento `se logueó` en `historial`.

### Usar el token (para endpoints futuros)
Cuando agreguemos endpoints protegidos, envia el token así:
`Authorization: Bearer <token>`

## Usuarios (Perfil y Cuenta)

Requieren token JWT (`Authorization: Bearer <token>`).

### `GET /api/usuarios/`
- Obtiene la lista completa de usuarios.
- Respuesta: `[{ "idusuario": 1, "usuario": "usuario123", "correo": "correo@ejemplo.com" }, ...]`

### `GET /api/usuarios/perfil`
- Obtiene los datos del usuario logueado.
- Respuesta: `{ "idusuario": 1, "username": "usuario123", "email": "correo@ejemplo.com" }`

### `PUT /api/usuarios/email`
Body:
```json
{
  "email": "nuevo@correo.com"
}
```
- Respuesta: `200` con mensaje de éxito.
- Log en historial: `actualizó su correo`

### `PUT /api/usuarios/password`
Body:
```json
{
  "password": "nueva_password123"
}
```
- Respuesta: `200` con mensaje de éxito.
- Log en historial: `actualizó su password`

### `PUT /api/usuarios/reset-password/:id`
- Resetea la contraseña del usuario con el ID proporcionado a la contraseña por defecto: `Abc123456`.
- Respuesta: `200` con mensaje de confirmación.
- Log en historial: `reseteó contraseña de usuario ... a valor por defecto`

Completa esta tabla conforme pruebes:

| Fecha | Endpoint | Request (resumen) | Status | Respuesta / Notas |
|---|---|---|---|---|
|  | `GET /health` |  |  |  |
|  | `POST /api/auth/register` |  |  |  |
|  | `POST /api/auth/login` |  |  |  |

## Paso 7: CRUD de equipos y componentes
Relación:
- Un `equipo` puede tener varios `componentes`
- Un `componente` pertenece a un solo `equipo` por `codigo_equipo`
- Estos endpoints requieren token JWT (`Authorization: Bearer <token>`)

### Equipos

#### `GET /api/equipos`
- Lista todos los equipos
- También permite filtro por query param:
  - `GET /api/equipos?codigo_equipo=2`
- Respuesta:
  - `200` lista (sin query)
  - `200` equipo único (con `codigo_equipo`)
  - `404` si no existe el `codigo_equipo` enviado

#### `GET /api/equipos/:codigo_equipo`
- Obtiene un equipo por id
- Respuesta: `200` o `404`

#### `POST /api/equipos`
Body:
```json
{
  "equipo": "Notebook Dell"
}
```
- Respuesta: `201` con `{ "codigo_equipo": ..., "equipo": "..." }`
- Log en historial: `creó equipo X`

#### `PUT /api/equipos/:codigo_equipo`
Body:
```json
{
  "equipo": "Notebook Dell Actualizado"
}
```
- Respuesta: `200` o `404`
- Log en historial: `modificó equipo X`
- También soporta: `PUT /api/equipos?codigo_equipo=2`

#### `DELETE /api/equipos/:codigo_equipo`
- Respuesta: `204` o `404`
- Si tiene componentes asociados responde `409`
- Log en historial: `eliminó equipo X`
- También soporta: `DELETE /api/equipos?codigo_equipo=2`

### Componentes

#### `GET /api/componentes`
- Lista todos los componentes
- También permite filtro por query param:
  - `GET /api/componentes?codigo_componente=11177`
  - `GET /api/componentes?codigo_equipo=2`
  - `GET /api/componentes?codigo_unidad=3`
- Respuesta:
  - `200` lista (sin query)
  - `200` componente único (con `codigo_componente`)
  - `200` lista filtrada por equipo (con `codigo_equipo`)
  - `200` lista filtrada por unidad (con `codigo_unidad`)
  - `404` si no existe el `codigo_componente` enviado
  - `404` si no existe el `codigo_equipo` enviado
  - `404` si no existe el `codigo_unidad` enviado
- **Nota Importante**: Todas las respuestas de lectura de componentes incluyen ahora el campo **`equipo`** (nombre del equipo) obtenido mediante un `JOIN` con la tabla `equipos`.
- Si enviás más de un filtro en la misma petición, aplica el primero con prioridad: `codigo_componente` → `codigo_equipo` → `codigo_unidad`.

#### `GET /api/componentes/:codigo_componente`
- Obtiene un componente por id
- Respuesta: `200` o `404`

#### `POST /api/componentes`
Body:
```json
{
  "codigo_equipo": 1,
  "componente": "RAM 16GB",
  "serie": "ABC123",
  "total": 1,
  "codigo_unidad": 1,
  "ubicacion": "Depósito",
  "estado": "Activo",
  "Nro_alta": "ALT-2026-001",
  "Nro_baja": null,
  "lugar": "Oficina central",
  "clasificacion": "Hardware",
  "observacion": "Instalado en equipo principal"
}
```
- Respuesta: `201` con `codigo_componente`
- Si `codigo_equipo` no existe responde `409`
- Si enviás `codigo_unidad` y no existe en `unidades`, responde `409`
- Log en historial: `creó componente X`

#### `PUT /api/componentes/:codigo_componente`
Body igual a `POST /api/componentes`
- Respuesta: `200`, `404` o `409`
- Log en historial: `modificó componente X`
- También soporta: `PUT /api/componentes?codigo_componente=11177`

#### `DELETE /api/componentes/:codigo_componente`
- Respuesta: `204` o `404`
- Log en historial: `eliminó componente X`
- También soporta: `DELETE /api/componentes?codigo_componente=11177`

### Unidades

Relación con `componentes`: el campo `componentes.codigo_unidad` referencia `unidades.codigo_unidad`.

#### `GET /api/unidades`
- Lista todas las unidades
- Filtro opcional: `GET /api/unidades?codigo_unidad=3` devuelve una sola fila
- Respuesta: `200` o `404` si el código no existe (solo con query)

#### `GET /api/unidades/:codigo_unidad`
- Obtiene una unidad por id
- Respuesta: `200` o `404`

#### `GET /api/unidades/:codigo_unidad/componentes`
- Lista todos los **componentes** con ese `codigo_unidad`
- Respuesta: `200` (puede ser `[]`) o `404` si la unidad no existe

#### `GET /api/unidades/:codigo_unidad/equipos`
- Lista los **equipos distintos** que tienen al menos un componente asociado a esa unidad (join `componentes` → `equipos`)
- Respuesta: `200` (puede ser `[]`) o `404` si la unidad no existe

#### `GET /api/unidades/:codigo_unidad/agrupado`
- Devuelve la **unidad** solicitada y un arreglo **`equipos`**: cada equipo incluye **`componentes`**, solo los que tienen ese `codigo_unidad`.
- Los equipos vienen ordenados por `codigo_equipo`. Si un componente apuntara a un `codigo_equipo` inexistente en `equipos`, igual se lista el grupo con `equipo: null`.
- Ejemplo de forma de respuesta:
```json
{
  "unidad": {
    "codigo_unidad": 1,
    "unidad": "UOM-01",
    "nombre_de_la_unidad": "Unidad Operativa Móvil 1",
    "ambito": "Regional Norte"
  },
  "equipos": [
    {
      "codigo_equipo": 10,
      "equipo": "Notebook Dell",
      "componentes": [
        {
          "codigo_componente": 100,
          "codigo_equipo": 10,
          "codigo_unidad": 1,
          "componente": "RAM 16GB"
        }
      ]
    }
  ]
}
```
- Respuesta: `200` o `404` si la unidad no existe (`equipos` puede ser `[]` si no hay componentes para esa unidad).

#### `POST /api/unidades`
Body:
```json
{
  "unidad": "UOM-01",
  "nombre_de_la_unidad": "Unidad Operativa Móvil 1",
  "ambito": "Regional Norte"
}
```
- `ambito` puede ser `null` u omitirse
- Respuesta: `201` con `codigo_unidad`
- Log en historial: `creó unidad X`

#### `PUT /api/unidades/:codigo_unidad`
Body igual a `POST /api/unidades`
- También soporta: `PUT /api/unidades?codigo_unidad=3`
- Respuesta: `200` o `404`
- Log en historial: `modificó unidad X`

#### `DELETE /api/unidades/:codigo_unidad`
- Si hay componentes con ese `codigo_unidad`, responde `409`
- También soporta: `DELETE /api/unidades?codigo_unidad=3`
- Respuesta: `204` o `404`
- Log en historial: `eliminó unidad X`

## Registro de pruebas de endpoints (equipos/componentes)
| Fecha | Endpoint | Request (resumen) | Status | Respuesta / Notas |
|---|---|---|---|---|
|  | `GET /api/equipos` |  |  |  |
|  | `GET /api/equipos/:codigo_equipo` |  |  |  |
|  | `POST /api/equipos` |  |  |  |
|  | `PUT /api/equipos/:codigo_equipo` |  |  |  |
|  | `DELETE /api/equipos/:codigo_equipo` |  |  |  |
|  | `GET /api/componentes` |  |  |  |
|  | `GET /api/componentes?codigo_equipo=2` |  |  |  |
|  | `GET /api/componentes?codigo_unidad=3` |  |  |  |
|  | `GET /api/componentes/:codigo_componente` |  |  |  |
|  | `POST /api/componentes` |  |  |  |
|  | `PUT /api/componentes/:codigo_componente` |  |  |  |
|  | `DELETE /api/componentes/:codigo_componente` |  |  |  |

## Registro de pruebas de endpoints (unidades)
| Fecha | Endpoint | Request (resumen) | Status | Respuesta / Notas |
|---|---|---|---|---|
|  | `GET /api/unidades` |  |  |  |
|  | `GET /api/unidades?codigo_unidad=3` |  |  |  |
|  | `GET /api/unidades/3` |  |  |  |
|  | `GET /api/unidades/3/componentes` |  |  |  |
|  | `GET /api/unidades/3/equipos` |  |  |  |
|  | `GET /api/unidades/3/agrupado` |  |  |  |
|  | `POST /api/unidades` |  |  |  |
|  | `PUT /api/unidades/3` |  |  |  |
|  | `DELETE /api/unidades/3` |  |  |  |

## Postman (código de pruebas)
Configura en Postman una variable de colección:
- `baseUrl = http://localhost:3000`
- `token = <pegar token luego de login>`

Header para endpoints protegidos:
- `Authorization: Bearer {{token}}`
- `Content-Type: application/json`

### 1) Crear equipo
`POST {{baseUrl}}/api/equipos`
```json
{
  "equipo": "Notebook Dell"
}
```

### 2) Listar equipos
`GET {{baseUrl}}/api/equipos`

### 3) Obtener equipo por id
`GET {{baseUrl}}/api/equipos/1`

### 4) Actualizar equipo
`PUT {{baseUrl}}/api/equipos/1`
```json
{
  "equipo": "Notebook Dell Actualizado"
}
```

### 5) Eliminar equipo
`DELETE {{baseUrl}}/api/equipos/1`

### 6) Crear componente
`POST {{baseUrl}}/api/componentes`
```json
{
  "codigo_equipo": 1,
  "componente": "RAM 16GB",
  "serie": "ABC123",
  "total": 1,
  "codigo_unidad": 1,
  "ubicacion": "Depósito",
  "estado": "Activo",
  "Nro_alta": "ALT-2026-001",
  "Nro_baja": null,
  "lugar": "Oficina central",
  "clasificacion": "Hardware",
  "observacion": "Instalado en equipo principal"
}
```

### 7) Listar componentes
`GET {{baseUrl}}/api/componentes`

### 8) Listar componentes por equipo
`GET {{baseUrl}}/api/componentes?codigo_equipo=1`

### 9) Obtener componente por id
`GET {{baseUrl}}/api/componentes/1`

### 10) Actualizar componente
`PUT {{baseUrl}}/api/componentes/1`
```json
{
  "codigo_equipo": 1,
  "componente": "RAM 32GB",
  "serie": "ABC123-NEW",
  "total": 1,
  "codigo_unidad": 1,
  "ubicacion": "Depósito",
  "estado": "Activo",
  "Nro_alta": "ALT-2026-001",
  "Nro_baja": null,
  "lugar": "Oficina central",
  "clasificacion": "Hardware",
  "observacion": "Actualizado por mantenimiento"
}
```

### 11) Eliminar componente
`DELETE {{baseUrl}}/api/componentes/1`

### 12) Crear unidad
`POST {{baseUrl}}/api/unidades`
```json
{
  "unidad": "UOM-01",
  "nombre_de_la_unidad": "Unidad Operativa Móvil 1",
  "ambito": "Regional Norte"
}
```

### 13) Listar unidades
`GET {{baseUrl}}/api/unidades`

### 14) Obtener una unidad (por query)
`GET {{baseUrl}}/api/unidades?codigo_unidad=1`

### 15) Obtener una unidad (por path)
`GET {{baseUrl}}/api/unidades/1`

### 16) Componentes de una unidad
`GET {{baseUrl}}/api/unidades/1/componentes`
- Respuesta ahora incluye el campo `equipo`.

### 17) Equipos relacionados a una unidad (vía componentes)
`GET {{baseUrl}}/api/unidades/1/equipos`

### 17b) Unidad con equipos y componentes agrupados
`GET {{baseUrl}}/api/unidades/1/agrupado`

### 18) Actualizar unidad
`PUT {{baseUrl}}/api/unidades/1`
```json
{
  "unidad": "UOM-01",
  "nombre_de_la_unidad": "Unidad Operativa Móvil 1 (actualizada)",
  "ambito": "Regional Norte"
}
```

### 19) Eliminar unidad
`DELETE {{baseUrl}}/api/unidades/1`

### 20) Alternativa: componentes filtrados por unidad (misma API de componentes)
`GET {{baseUrl}}/api/componentes?codigo_unidad=1`
- Respuesta ahora incluye el campo `equipo`.

## Siguientes pasos
Cuando implementemos nuevas acciones que modifiquen la BD, se registrará un nuevo `historial_evento` en la tabla `historial`.

Tip: para el resto de cambios a la base de datos, usaremos el helper `writeHistorial()` en `src/db/historialRepo.ts`.

