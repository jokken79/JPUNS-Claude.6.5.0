# BASEDATEJP - Base de Datos de Importación (LEGACY)

## ⚠️ CARPETA LEGACY - USAR `base-datos/` EN SU LUGAR

Esta carpeta es mantenida por compatibilidad con versiones antiguas.

**Para nuevos desarrollos, usar**: `/base-datos/` (contiene los SQL de inicialización de PostgreSQL)

## 📋 Descripción

Esta carpeta históricamente contenía la base de datos Access para importación de candidatos al sistema UNS-ClaudeJP 5.2.

## 🗄️ Archivo de Base de Datos

- **Archivo**: `ユニバーサル企画㈱データベースv25.3.24.accdb`
- **Tipo**: Microsoft Access Database
- **Registros**: ~1,148 candidatos
- **Tablas principales**: `T_履歴書` (Rirekisho/CV japonés)

## ⚠️ Importante: Archivo excluido de Git

El archivo `.accdb` está excluido del repositorio por:

1. **Tamaño**: Archivos .accdb son muy grandes (>100MB)
2. **Seguridad**: Contiene datos personales sensibles de candidatos
3. **Privacidad**: Información confidencial de empleados y candidatos
4. **Formato**: Git no maneja eficientemente archivos binarios grandes

## 🔄 Uso en el Sistema

Los scripts de importación buscan automáticamente esta base de datos en:

1. `./base-datos/` (carpeta actual - **RECOMENDADO**)
2. `./BASEDATEJP/` (legacy, mantenido por compatibilidad)
3. `../base-datos/` (carpeta padre)
4. `../BASEDATEJP/` (carpeta padre - legacy)
5. `../../base-datos/` (carpeta abuelo)
6. `../../BASEDATEJP/` (carpeta abuelo - legacy)
7. `D:/BASEDATEJP/`
8. `D:/ユニバーサル企画㈱データベース/`
9. `~/BASEDATEJP/` (directorio home)

## 📝 Scripts que usan esta base de datos:

- `backend/scripts/import_all_from_databasejp.py` - Importación completa
- `backend/scripts/auto_extract_photos_from_databasejp.py` - Extracción de fotos
- `backend/scripts/unified_photo_import.py` - Importación unificada de fotos
- `backend/scripts/import_access_candidates.py` - Importación de candidatos
- `backend/scripts/export_access_to_json.py` - Exportación a JSON

## 🔐 Consideraciones de Seguridad

- **NUNCA** subir archivos `.accdb` a GitHub
- **NUNCA** incluir datos reales de candidatos en el repositorio
- **SIEMPRE** mantener la base de datos Access en entorno local seguro
- **SIEMPRE** usar datos de demostración para desarrollo

## 📂 Estructura esperada:

```
BASEDATEJP/
├── README.md                    # Este archivo
├── .gitignore                  # Excluye .accdb pero permite carpeta
└── ユニバーサル企画㈱データベースv25.3.24.accdb  # Base de datos (excluida)
```

## 🚀 Para usar:

1. Coloca el archivo `.accdb` en esta carpeta
2. Ejecuta los scripts de importación desde el backend
3. Los datos se importarán a PostgreSQL automáticamente

---
**Nota**: Esta carpeta está intencionalmente vacía en el repositorio por razones de seguridad y tamaño.