# ContactShip Mini

Microservicio de gestión de leads con sincronización automática, soporte de IA y cache distribuido.

## 🚀 Requisitos Previos

- Node.js (v18+)
- Docker y Docker Compose
- API Key de OpenAI (Opcional, el sistema usará un Mock si no se provee)

## 🛠 Instalación y Ejecución

1.  **Clonar y configurar entorno:**
    ```bash
    cp .env .env.local # (Opcional, configurar credenciales si se desea)
    npm install
    ```

2.  **Levantar infraestructura (Postgres & Redis):**
    ```bash
    docker-compose up -d
    ```

3.  **Iniciar la aplicación:**
    ```bash
    # Desarrollo
    npm run start:dev

    # Producción
    npm run build
    npm run start:prod
    ```

## 🔑 Seguridad

La API está protegida por una API Key. Debe enviarse en los headers de cada petición.
Por defecto en el `.env` provisto:
`x-api-key: test_api_keyAFx-NhzdV<tNnpSEC~ZBeTS~DVR>m7)f`

## 📡 Endpoints Principales

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/create-lead` | Crear un lead manualmente. |
| `GET` | `/leads` | Listar todos los leads. |
| `GET` | `/leads/:id` | Obtener detalle de lead (Cacheado en Redis 5m). |
| `POST` | `/leads/:id/summarize` | Generar resumen con IA (Asíncrono/Cola). |

**Nota:** La sincronización de leads externos ocurre automáticamente cada hora (CRON).

## 🏗 Decisiones Técnicas

*   **NestJS & TypeScript:** Framework robusto y tipado para escalabilidad.
*   **PostgreSQL (TypeORM):** Persistencia relacional estándar. Se incluyó `docker-compose` para facilitar el entorno.
*   **Redis:** Utilizado doblemente:
    1.  **Cache:** Para el endpoint de detalle (`/leads/:id`).
    2.  **Colas (BullMQ):** Para procesar la generación de resúmenes de IA fuera del ciclo de petición/respuesta principal.
*   **Arquitectura:** Modular (`LeadsModule`, `Auth`).
*   **Sincronización:** Se implementó una estrategia de deduplicación basada en `email` y `external_id` (UUID de randomuser).

## 🧪 Testing

Para probar la generación de IA sin gastar créditos, el sistema detecta si falta la `OPENAI_API_KEY` y utiliza un servicio Mock que simula la respuesta.

## OpenAPI / Swagger

La documentación estará disponible en http://localhost:3000/api una vez inicies la aplicación.
