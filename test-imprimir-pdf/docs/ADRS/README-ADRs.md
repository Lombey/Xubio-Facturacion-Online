# Architecture Decision Records (ADRs)

Este directorio contiene los Architecture Decision Records (ADRs) del proyecto. Los ADRs documentan decisiones arquitectónicas importantes junto con su contexto, opciones consideradas y consecuencias.

## ¿Qué es un ADR?

Un ADR es un documento que captura:
- **Contexto:** Situación que motivó la decisión
- **Decisión:** Qué se decidió hacer
- **Opciones consideradas:** Alternativas evaluadas
- **Consecuencias:** Impacto positivo, negativo y neutral

## ADRs del Proyecto

### [ADR-001: Decisión de NO migrar a Next.js](./ADR-001-decision-no-migrar-nextjs.md)
**Estado:** Aceptado  
**Fecha:** 2024-12-19  
**Resumen:** Decisión de no migrar a Next.js y optar por optimizaciones incrementales con Vite, dado que el proyecto tiene solo 3 usuarios y el ROI de una migración completa no se justifica.

**Decisiones clave:**
- NO migrar a Next.js
- Implementar optimizaciones incrementales
- Usar Vite como build tool
- Refactor modular del código

### [ADR-002: Decisión de usar Vite y estructura modular](./ADR-002-decision-vite-y-estructura-modular.md)
**Estado:** Aceptado  
**Fecha:** 2024-12-19  
**Resumen:** Decisión de usar Vite como build tool y adoptar estructura modular separando utilidades, composables y componentes.

**Decisiones clave:**
- Usar Vite 5.0.0 como build tool
- Estructura modular: `utils/`, `composables/`, `components/`
- Aliases de imports para mejor DX
- Code splitting manual con lazy loading

## Formato de ADRs

Los ADRs siguen este formato estándar:

```markdown
# ADR-XXX: Título de la decisión

## Estado
[Aceptado | Rechazado | Propuesto | Deprecado | Reemplazado]

## Contexto
[Descripción de la situación que motivó la decisión]

## Decisión
[Qué se decidió hacer]

## Opciones Consideradas
[Alternativas evaluadas con pros/contras]

## Consecuencias
[Impacto positivo, negativo y neutral]

## Referencias
[Enlaces a documentación relacionada]
```

## Cuándo Crear un ADR

Crear un ADR cuando:
- ✅ Se toma una decisión arquitectónica importante
- ✅ Se elige una tecnología o herramienta nueva
- ✅ Se cambia el enfoque de desarrollo
- ✅ Se decide NO hacer algo importante

**NO crear un ADR para:**
- ❌ Decisiones triviales o obvias
- ❌ Cambios menores de implementación
- ❌ Bugs o fixes

## Proceso de Decisión

1. **Identificar necesidad:** Situación requiere decisión arquitectónica
2. **Evaluar opciones:** Investigar alternativas y sus trade-offs
3. **Documentar:** Crear ADR con análisis
4. **Decidir:** Equipo toma decisión
5. **Actualizar estado:** Marcar ADR como Aceptado/Rechazado
6. **Revisar periódicamente:** Evaluar si la decisión sigue siendo válida

## Mantenimiento

- **Revisar ADRs:** Cada 6 meses o cuando cambie el contexto
- **Deprecar:** Si una decisión ya no aplica, marcar como Deprecado
- **Reemplazar:** Si se toma nueva decisión, crear nuevo ADR y marcar el anterior como Reemplazado

## Referencias

- [ADR Template by Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR GitHub Organization](https://adr.github.io/)
- [Markdown ADR Tools](https://github.com/npryce/adr-tools)

