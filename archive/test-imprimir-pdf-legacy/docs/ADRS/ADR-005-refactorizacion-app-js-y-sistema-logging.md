# ADR-005: Refactorización de app.js y Sistema de Logging Estructurado

## Estado
**Propuesto** | Aceptado | Deprecado | Reemplazado por ADR-XXX

**Fecha**: 2025-01-02  
**Contexto**: Refactorización de archivo monolítico `app.js` (3523 líneas) con código de debug disperso

---

## Contexto

### Situación Actual

El archivo `app.js` presenta los siguientes problemas:

1. **Tamaño excesivo**: 3523 líneas en un solo archivo
2. **Código de debug disperso**: 
   - 118 llamadas a `console.log/debug/warn/error/info`
   - 17 comentarios de debug/TODO/FIXME/HACK
   - Logging inconsistente sin estructura
3. **Refactorización parcial**: 
   - Composables creados pero integración incompleta (fallbacks)
   - 29 métodos async aún en `app.js`
   - Lógica de negocio mezclada con UI
4. **Mantenibilidad**: 
   - Difícil localizar bugs
   - Sin trazabilidad de operaciones
   - Debugging reactivo (solo cuando hay problemas)

### Plan de Refactorización Existente

Ya existe un plan en `planes/refactor-app-js.md` con 8 fases:
- ✅ Fases 0-8: Estructura creada (composables, services, utils)
- ⚠️ Integración parcial: Composables creados pero no completamente migrados
- ⚠️ Código de debug: Aún disperso en `app.js`

---

## Preguntas Estratégicas para Decidir el Camino

### 1. Prioridad y Urgencia

**¿Cuál es el impacto actual del problema?**
- [ ] Bloquea desarrollo de nuevas features
- [ ] Dificulta debugging en producción
- [ ] Afecta performance
- [ ] Solo es deuda técnica acumulada

**¿Hay presión de tiempo para nuevas features?**
- [ ] Sí, necesitamos features rápido → Refactorización incremental
- [ ] No, podemos dedicar tiempo → Refactorización más agresiva

### 2. Estrategia de Logging

**¿Qué nivel de observabilidad necesitas?**

**Opción A: Logging Básico (Recomendado para MVP)**
- Reemplazar `console.log` por logger estructurado
- Niveles: DEBUG, INFO, WARN, ERROR
- Filtrado por entorno (dev vs prod)
- **Esfuerzo**: 2-4 horas
- **Beneficio**: Código más limpio, debugging más fácil

**Opción B: Observabilidad Completa**
- Logger estructurado + métricas + traces
- Integración con servicios externos (Sentry, LogRocket, etc.)
- Dashboard de monitoreo
- **Esfuerzo**: 1-2 semanas
- **Beneficio**: Visibilidad completa en producción

**¿Necesitas logs en producción?**
- [ ] Solo desarrollo → Logger simple con niveles
- [ ] Producción también → Sistema más robusto con persistencia

### 3. Estrategia de Refactorización

**¿Cómo quieres abordar la migración?**

**Opción A: Big Bang (Riesgoso)**
- Migrar todo de una vez
- **Riesgo**: Alto (rompe muchas cosas)
- **Tiempo**: 1-2 semanas
- **Recomendación**: ❌ No recomendado

**Opción B: Incremental con Feature Flags (Recomendado)**
- Migrar método por método
- Mantener fallbacks durante transición
- **Riesgo**: Bajo
- **Tiempo**: 2-4 semanas (paralelo a features)
- **Recomendación**: ✅ Recomendado

**Opción C: Estrangler Pattern**
- Crear nueva estructura en paralelo
- Migrar gradualmente
- Deprecar código viejo
- **Riesgo**: Muy bajo
- **Tiempo**: 4-6 semanas
- **Recomendación**: ✅ Si hay tiempo

### 4. Testing y Calidad

**¿Qué nivel de testing quieres?**

- [ ] Tests unitarios para funciones puras (ya implementado parcialmente)
- [ ] Tests de integración para composables
- [ ] Tests E2E para flujos críticos (facturas, cobranzas)
- [ ] Sin tests adicionales (solo manual)

**¿Hay regresiones frecuentes?**
- [ ] Sí → Más tests antes de refactorizar
- [ ] No → Refactorizar con validación manual

### 5. Equipo y Contexto

**¿Cuántas personas trabajan en este código?**
- [ ] Solo tú → Puedes ser más agresivo
- [ ] Equipo pequeño (2-3) → Coordinación necesaria
- [ ] Equipo grande → Documentación y comunicación crítica

**¿Es código legacy o nuevo?**
- [ ] Legacy (años de evolución) → Más cuidado
- [ ] Nuevo (6-12 meses) → Más flexibilidad

---

## Opciones Consideradas

### Opción 1: Sistema de Logging + Refactorización Incremental (RECOMENDADA)

**Descripción**:
1. Implementar logger estructurado primero (quick win)
2. Reemplazar todos los `console.log` por logger
3. Continuar refactorización incremental (método por método)
4. Migrar código de debug a composable `useDiagnostico` (ya existe)

**Pros**:
- ✅ Mejora inmediata en mantenibilidad
- ✅ Bajo riesgo (cambios pequeños)
- ✅ Permite desarrollo paralelo
- ✅ Código de debug centralizado
- ✅ Fácil de revertir si hay problemas

**Cons**:
- ⚠️ Toma tiempo (2-4 semanas)
- ⚠️ Requiere disciplina para mantener

**Esfuerzo**: 2-4 semanas (paralelo a features)

---

### Opción 2: Solo Sistema de Logging (Quick Win)

**Descripción**:
1. Implementar logger estructurado
2. Reemplazar `console.log` por logger
3. No tocar refactorización (dejar para después)

**Pros**:
- ✅ Quick win (1-2 días)
- ✅ Mejora debugging inmediatamente
- ✅ Bajo riesgo
- ✅ No bloquea features

**Cons**:
- ⚠️ No resuelve el problema del tamaño del archivo
- ⚠️ Deuda técnica sigue creciendo

**Esfuerzo**: 1-2 días

---

### Opción 3: Refactorización Agresiva + Logging

**Descripción**:
1. Migrar todo a composables de una vez
2. Implementar logger
3. Eliminar código legacy

**Pros**:
- ✅ Resuelve todo el problema
- ✅ Código limpio al final

**Cons**:
- ❌ Alto riesgo de regresiones
- ❌ Bloquea desarrollo durante migración
- ❌ Difícil de testear todo
- ❌ Puede romper funcionalidad existente

**Esfuerzo**: 2-3 semanas (bloqueante)

---

## Decisión

**Recomendación: Opción 1 - Sistema de Logging + Refactorización Incremental**

### Justificación

1. **Balance riesgo/beneficio**: Mejora sostenible sin alto riesgo
2. **Velocidad**: Permite desarrollo paralelo
3. **Trazabilidad**: Logger estructurado ayuda a debuggear durante migración
4. **Alineado con plan existente**: Complementa el plan de refactorización actual

### Implementación Recomendada

#### Fase 1: Sistema de Logging (1-2 días)

**Crear `utils/logger.js`**:
```javascript
/**
 * Logger estructurado para reemplazar console.log disperso
 * 
 * Niveles:
 * - DEBUG: Información detallada (solo desarrollo)
 * - INFO: Información general
 * - WARN: Advertencias
 * - ERROR: Errores
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const currentLevel = import.meta.env.DEV 
  ? LOG_LEVELS.DEBUG 
  : LOG_LEVELS.INFO;

export const logger = {
  debug: (message, context = {}) => {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, context);
    }
  },
  
  info: (message, context = {}) => {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.log(`[INFO] ${message}`, context);
    }
  },
  
  warn: (message, context = {}) => {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, context);
    }
  },
  
  error: (message, error = null, context = {}) => {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, { error, ...context });
    }
  }
};
```

**Migración gradual**:
- Reemplazar `console.log` → `logger.debug/info`
- Reemplazar `console.error` → `logger.error`
- Reemplazar `console.warn` → `logger.warn`

**Beneficios inmediatos**:
- ✅ Código más limpio
- ✅ Fácil filtrar logs por nivel
- ✅ Contexto estructurado
- ✅ Preparado para producción

---

#### Fase 2: Migrar Código de Debug a useDiagnostico (2-3 días)

**Estrategia**:
1. Identificar bloques de debug en `app.js`
2. Mover a `useDiagnostico` (ya existe)
3. Reemplazar llamadas inline por composable

**Ejemplo**:
```javascript
// ANTES (en app.js)
console.log('='.repeat(60));
console.log('FIX PARA PUNTO DE VENTA');
console.log('='.repeat(60));
console.log('Configuración encontrada:', this.campoIdActivo);

// DESPUÉS (usando composable)
this.diagnosticoComposable.agregarLog('FIX PARA PUNTO DE VENTA', true);
this.diagnosticoComposable.probarCampoId(this.puntoVentaSeleccionadoParaFactura, this.campoIdActivo);
```

**Reducción estimada**: ~150-200 líneas

---

#### Fase 3: Continuar Refactorización Incremental (2-4 semanas)

**Estrategia** (método por método):

1. **Identificar método candidato**:
   - Métodos async grandes (>50 líneas)
   - Métodos con lógica de negocio pura
   - Métodos con duplicación

2. **Migrar a composable**:
   - Extraer lógica a composable
   - Mantener método en `app.js` como wrapper (compatibilidad)
   - Agregar tests

3. **Validar**:
   - Tests pasan
   - Funcionalidad idéntica
   - Sin regresiones

4. **Limpiar**:
   - Remover método wrapper cuando no se use
   - Actualizar referencias

**Métodos prioritarios** (por impacto):
1. `flujoCompletoFactura()` → `useFacturas` (ya parcialmente migrado)
2. `flujoCompletoCobranza()` → `useCobranzas` (ya parcialmente migrado)
3. `obtenerPuntosDeVenta()` → `usePuntosDeVenta` (ya parcialmente migrado)
4. `listarProductos()` → Nuevo `useProductos`
5. `listarClientes()` → Nuevo `useClientes`

---

## Consecuencias

### Positivas

1. **Mantenibilidad**: Código más fácil de entender y modificar
2. **Debugging**: Logs estructurados facilitan encontrar problemas
3. **Testing**: Funciones puras más fáciles de testear
4. **Escalabilidad**: Estructura preparada para crecimiento
5. **Onboarding**: Nuevos desarrolladores entienden más rápido

### Negativas

1. **Tiempo inicial**: Inversión de 2-4 semanas
2. **Riesgo de regresiones**: Mitigado con tests y migración incremental
3. **Dualidad temporal**: Código viejo y nuevo coexisten durante transición

### Riesgos a Monitorear

1. **Regresiones funcionales**: Validar cada migración
2. **Performance**: Logger puede tener overhead (mínimo)
3. **Desincronización**: Código viejo y nuevo pueden divergir

### Mitigaciones

1. **Tests automáticos**: Cubrir funciones críticas
2. **Validación manual**: Probar flujos principales después de cada migración
3. **Commits atómicos**: Un cambio funcional por commit
4. **Feature flags**: Permitir rollback rápido si es necesario

---

## Referencias

- Plan de refactorización existente: `planes/refactor-app-js.md`
- Composable de diagnóstico: `composables/useDiagnostico.js`
- ADR-002: Decisiones sobre estructura modular
- ADR-004: Decisiones sobre tipos Vue/JSDoc

---

## Próximos Pasos

1. **Decidir estrategia**: Responder preguntas estratégicas
2. **Aprobar ADR**: Confirmar camino elegido
3. **Crear issues/tasks**: Descomponer en tareas accionables
4. **Implementar Fase 1**: Sistema de logging (quick win)
5. **Continuar con Fases 2-3**: Migración incremental

---

**Última actualización**: 2025-01-02  
**Autor**: Arquitecto de Software & Technical Lead
