DEVNOTES: OpenTelemetry peer-deps fix
Motivo:
• La CI fallaba con npm ERESOLVE: conflicto entre @vercel/otel (peer @opentelemetry/api-logs >=0.46.0 <0.200.0) y @opentelemetry/api-logs@^0.207.0 en frontend/package.json.
Cambios aplicados:
• frontend/package.json: se bajó @opentelemetry/api-logs a 0.57.2 y se añadió “overrides” forzando 0.57.2.
• frontend/package-lock.json: regenerado (ver pasos abajo).
• .github/workflows/ci-cd.yml: se añadió –legacy-peer-deps a las invocaciones de npm ci como mitigación temporal.
Nota:
• El flag –legacy-peer-deps en CI es temporal. Revertir cuando las dependencias estén alineadas o actualizar @vercel/otel a una versión que soporte @opentelemetry/api-logs@0.207.x.
