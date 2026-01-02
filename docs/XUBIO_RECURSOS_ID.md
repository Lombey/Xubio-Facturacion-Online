# Registro de Recursos Xubio (IDs Reales)

Este documento centraliza los identificadores (IDs) técnicos obtenidos directamente de la API de Xubio. Su propósito es servir como **fuente de verdad** para la configuración de scripts en Google Apps Script y endpoints en Vercel, asegurando que las peticiones utilicen recursos existentes y activos en la cuenta.

**Importante:** No modificar estos IDs manualmente a menos que se confirme su vigencia mediante el script de Discovery.

---

## 🏢 Puntos de Venta (PuntoVentaBean)
*Actualizado: 2 de Enero 2026*

| ID Técnico | Nombre | Código | Nro PV | Modo | Estado |
|------------|--------|--------|--------|------|--------|
| **212819** | corvusweb srl | CORVUSWEB_SRL | 00004 | Automático | ✅ Activo |
| **213106** | n | N | 99999 | Editable Sugerido | ✅ Activo |

---

## 📦 Productos (ProductoBean)
*Actualizado: 2 de Enero 2026*

| ID Técnico | Nombre / Descripción | IVA | Observaciones |
|------------|----------------------|-----|---------------|
| **2751338** | CONECTIVIDAD ANUAL POR TOLVA | 21% | ID principal AGDP |
| **2851980** | ADICIONAL POR SERVICIO DE CONECTIVIDAD | 21% | - |
| **2922887** | CABLE CELDAS AZUL | 21% | - |
| **2751333** | CARGADOR PARA TABLET AGDP | 21% | - |
| **2850898** | DIFERENCIA TIPO DE CAMBIO | 21% | - |

---

## 👥 Clientes Frecuentes (OrganizacionBean)
*Actualizado: 2 de Enero 2026*

| ID Técnico | Nombre / Razón Social | CUIT | Tipo |
|------------|-----------------------|------|------|
| **8157173** | 2MCAMPO | - | Cliente |
| **8040501** | ABEL NATALIO LATTANZI | - | Cliente |
| **8794453** | ACEITERA GENERAL DEHEZA S.A. | - | Cliente |
| **8054569** | ACM LOGISTICA S.A.S | - | Cliente |
| **9419376** | ADALBERTO EZEQUIEL PISTONE | - | Cliente |

---

## 🏢 Centros de Costo (centroDeCostoBean)
*Actualizado: 2 de Enero 2026*

| ID Técnico | Nombre | Código |
|------------|--------|--------|
| **57329** | kit sistema agdp | KIT_SISTEMA_AGDP |

---

## 🏆 Golden Template (Factura de Referencia)
*ID: 67747886 (Exitoso)*

- **Condición de Pago**: 7
- **Circuito Contable**: -2
- **Depósito**: -2 (Requerido en raíz y en cada ítem)
- **Moneda**: -3 (Dólares)
- **Campos Críticos**: 
  - Usar `importetotal` en lugar de `total` en la raíz.
  - No incluir `centroDeCosto` en los ítems (según este modelo).
  - Incluir `precioconivaincluido: 0` en los ítems.
  - Incluir `transaccionPercepcionItems: []` y `transaccionCobranzaItems: []`.

---

## 🛠️ Instrucciones de Actualización
Para sumar o validar datos en este archivo, ejecutar las funciones de `apps-script/XubioTestConexion.js` y volcar los resultados exitosos aquí.
