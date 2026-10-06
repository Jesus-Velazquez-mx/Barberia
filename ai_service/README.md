# AI Service

Microservicio interno de inteligencia artificial para Barberia. Está construido con FastAPI y centraliza la comunicación con proveedores de modelos de lenguaje (LLM).

El servicio es **stateless**: no accede directamente a PostgreSQL ni a otra base de datos. El consumidor o cliente (en este caso el backend de la app de barbería) debe enviar en cada solicitud toda la información necesaria. La API está pensada para ser invocada por servicios
internos y se protege mediante la cabecera (HTTP header) `X-Internal-Api-Key`, excepto por el endpoint `/health`.

## Estado actual

Solo contiene el endpoint `/jd/analyze` para servir como referencia. Será eliminado posteriormente.

## Arquitectura

La aplicación se inicia desde `main.py` y monta un router interno bajo el prefijo `/internal/v1`.

```text
Cliente interno (backend)
			|
			| X-Internal-Api-Key
			v
FastAPI /internal/v1
			|
			+-- health ----------------------> respuesta {"status": "ok"}
			|
			+-- jd/analyze
							|
							+-- validacion de solicitud
							+-- servicio de analisis
							+-- LLM client factory
											|
											+-- ClaudeClient -> Anthropic API
```

Estructura principal:

- `app/api/`: routers HTTP.
- `app/services/`: lógica de negocio, construcción del prompt y validación del contenido recibido.
- `app/schemas/`: modelos Pydantic para solicitudes, respuestas y errores. Los nombres JSON se convierten a `camelCase`.
- `app/llm/`: interfaz de cliente LLM, cliente Anthropic, selección de proveedor y manejo de errores, reintentos y timeouts.
- `app/core/`: configuración desde entorno, autenticación y handlers de excepciones.
- `app/utils/`: utilidades para construir respuestas JSON uniformes.
- `app/test/`: pruebas automatizadas.

Las respuestas exitosas usan el formato común:

```json
{
	"data": {},
	"message": "..."
}
```

Los errores también se devuelven con `message` y, cuando aplica, una lista `errors` con el campo afectado y su detalle.

## Requisitos

- Python 3.13 o superior.
- `uv` para instalar dependencias y ejecutar el proyecto.

## Configuración

Crea un archivo `.env` dentro de `ai_service/` que contenga lo siguiente:

```env
AI_SERVICE_API_KEY=clave-interna-local
```

`AI_SERVICE_API_KEY` es obligatoria y puede ser el valor que tú quieras. Representa la "contraseña" que un consumidor debe proveer para acceder al servicio.

Las demás variables tienen valores predeterminados. No subas `.env` ni claves
reales al repositorio.

**Importante:** Si no colocas `ANTHROPIC_API_KEY` en el archivo `.env` y realizas una petición con `anthropic` como provider, será rechazada con un error `500 Internal Server Error`.

## Instalación y ejecución

Desde la carpeta `ai_service`:

**1. Crear y activar el entorno virtual (venv):**
```powershell
uv venv
.\.venv\Scripts\activate
```

**2. Descargar dependencias:**
```powershell
uv sync
```

**3. Ejecutar el programa:**

Opción 1
```powershell
uv run python main.py
```

Opción 2
```powershell
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

La documentación interactiva de FastAPI queda disponible en:

- `http://localhost:8000/docs`
- `http://localhost:8000/openapi.json`

### Comprobar salud

**Powershell**
```powershell
Invoke-RestMethod http://localhost:8000/internal/v1/health
```

**CMD**
```cmd
curl http://localhost:8000/internal/v1/health
```

**Thunder Client / Postman**
```powershell
GET http://localhost:8000/internal/v1/health
```

Respuesta esperada:

```json
{"status":"ok"}
```

### Analizar una descripción de puesto (solo de prueba, será eliminado después)

El endpoint requiere el HTTP header `X-Internal-Api-Key` y el proveedor `anthropic`:

**Powershell**
```powershell
$headers = @{ "X-Internal-Api-Key" = "clave-interna-local" }
$body = @{
	provider = "anthropic"
	data = @{
		jobTitle = "Senior Backend Engineer"
		jobDescriptionRaw = "Descripción del puesto con al menos 50 caracteres..."
		companyName = "Barberia"
		location = "Remote"
		workArrangement = "remote"
	}
} | ConvertTo-Json

Invoke-RestMethod `
	-Method Post `
	-Uri http://localhost:8000/internal/v1/jd/analyze `
	-Headers $headers `
	-ContentType "application/json" `
	-Body $body
```

**Thunder Client / Postman**
| Parámetro | Valor |
|---|---|
| Method | `GET` |
| URL | `http://localhost:8000/internal/v1/jd/analyze` |
| Headers | `X-Internal-Api-Key = [Valor de la API KEY definida en .env]`

Body:
```json
{
	"provider": "anthropic",
	"data": {
		"jobTitle": "Senior Backend Engineer",
		"jobDescriptionRaw": "Descripción del puesto con al menos 50 caracteres..."
	}
}
```

`jobTitle` debe tener al menos 5 caracteres y `jobDescriptionRaw` al menos 50. Los campos opcionales enviados por el usuario (`companyName`, `location` y `workArrangement`) prevalecen sobre los valores inferidos por el modelo.

## Pruebas

Ejecuta la suite desde `ai_service`:

```powershell
uv run pytest
```

Las pruebas de manejo de errores no necesitan credenciales reales porque usan clientes simulados. Para una prueba manual contra Anthropic sí son necesarias las variables del archivo `.env`.

## Solución de problemas

### `ValidationError` o el servicio no inicia

Comprueba que estás usando Python 3.13 o superior y que ejecutaste `uv sync`. También verifica que la variables obligatoria esté definida: `AI_SERVICE_API_KEY`.

### Respuesta `401 Invalid or missing API key`

El endpoint protegido no recibió `X-Internal-Api-Key` o su valor no coincide con `AI_SERVICE_API_KEY`. El endpoint `/internal/v1/health` no requiere esa cabecera.

### Respuesta `400 Request validation failed`

Revisa la forma del JSON. Debe incluir `provider` y `data`; dentro de `data` son obligatorios `jobTitle` y `jobDescriptionRaw`. Recuerda que la API usa campos JSON en `camelCase`.

### Respuesta `422`

La solicitud tiene una estructura válida, pero el contenido no es suficiente para analizar el puesto. Revisa `errors` para identificar los campos que no pudieron extraerse o las restricciones de longitud.

### Errores de Anthropic, timeout o rate limit

Verifica que `ANTHROPIC_API_KEY` sea válida, que el modelo configurado exista y que el entorno tenga salida de red. El cliente aplica reintentos para errores transitorios y límites de tasa hasta `LLM_MAX_ATTEMPTS`, dentro del presupuesto de `LLM_TIMEOUT`. Ajusta `LLM_TIMEOUT`, `BASE_BACKOFF_SECONDS` o `MAX_BACKOFF_SECONDS` si el entorno necesita más tiempo.

### `provider not supported`

Usa `"provider": "anthropic"`. Aunque `ollama` está definido en el esquema, su cliente todavía no está implementado en la fábrica de proveedores.

### El puerto 8000 ya está ocupado

Inicia Uvicorn con otro puerto y actualiza la URL de las pruebas manuales:

```powershell
uv run uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```
