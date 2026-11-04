# Seguimiento de hábitos

Widget independiente de seguimiento semanal de hábitos, preparado para GitHub Pages. No utiliza código de la antigua aplicación.

## Funcionamiento

- Diseño verde menta, selector de hábitos, barras y porcentajes, mejor semana.
- S1, S2… son semanas consecutivas de lunes a domingo.
- Cada hábito se calcula sobre los días transcurridos de la semana (máximo 7), excluyendo hoy. Los días sin registro cuentan como no cumplidos.
- El promedio general es el promedio de los diez hábitos.
- El botón **Actualizar** recarga únicamente el último archivo `data.json` publicado; **no consulta directamente Notion**.
- La sincronización privada de Notion se inicia manualmente desde **Actions → Actualizar hábitos desde Notion → Run workflow**. Nunca se ejecuta automáticamente.

## Configuración inicial

1. Crear una integración interna de Notion y darle acceso de lectura a la base **Diario Integral**.
2. En **Settings → Secrets and variables → Actions**, crear dos secretos: `NOTION_TOKEN` (token de integración) y `NOTION_DATA_SOURCE_ID` (ID del data source de Diario Integral).
3. Ejecutar manualmente el workflow **Actualizar hábitos desde Notion**.
4. En **Settings → Pages**, seleccionar **GitHub Actions** como origen. El workflow **Publicar widget en GitHub Pages** publicará el sitio.
5. Incrustar la URL pública de GitHub Pages en Notion mediante `/embed`.

**Privacidad:** GitHub Pages es público y `data.json` contiene porcentajes agregados, no diarios personales. Cualquier visitante con el enlace podría ver los porcentajes. Si esto no es aceptable, no activar GitHub Pages.

El botón de actualización no puede disparar un workflow privado sin autenticación adicional. No introducir tokens de GitHub ni de Notion en código cliente.
