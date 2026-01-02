# test-imprimir-pdf (Archivado)

**Fecha**: 1 Enero 2026
**Razón**: Experimento completado - código útil migrado a raíz

## ¿Qué fue?

Subproyecto para probar el endpoint `/imprimirPDF` de Xubio API y validar parámetros de impresión.

## ¿Por qué se archivó?

1. Experimento exitoso completado
2. Duplicación de estructura (package.json, vercel.json, /api)
3. Confusión en Vercel sobre qué archivos usar
4. Simplificar mantenimiento

## ¿Qué se migró a raíz?

- `/apps-script` → `/apps-script` (scripts de Google Apps Script)
- `/sdk` → `/sdk` (si existía)
- `/docs` útiles → `/docs`

## Restaurar si necesario

```bash
git log --follow -- test-imprimir-pdf/
git checkout <commit-anterior> -- test-imprimir-pdf/
```
