# Requerimientos - Sheets con Xubio

## 🎯 Objetivo Principal

El sistema debe permitir:
1. **Generar facturas** y obtener el comprobante en formato PDF
2. **Generar cobranzas** asociadas a facturas y obtener el comprobante en formato PDF

### Flujo Esperado

#### Flujo 1: Generación de Factura
1. El usuario prepara los datos de la factura (cliente, productos/servicios, importes, etc.)
2. El sistema genera la factura en Xubio mediante `POST /comprobanteVentaBean`
3. El sistema obtiene el `transaccionId` de la respuesta
4. El sistema obtiene la URL del PDF mediante `GET /imprimirPDF` con `idtransaccion` y `tipoimpresion`
5. El sistema descarga y almacena el PDF del comprobante generado

#### Flujo 2: Generación de Cobranza
1. El usuario selecciona una factura existente
2. El sistema genera la cobranza asociada a esa factura mediante `POST /cobranzaBean`
3. El sistema obtiene el `transaccionId` de la respuesta
4. El sistema obtiene la URL del PDF mediante `GET /imprimirPDF` con `idtransaccion` y `tipoimpresion`
5. El sistema descarga y almacena el PDF del comprobante de cobranza generado

### 📄 Obtención de PDFs

**Endpoint disponible:** `GET /imprimirPDF`

**Parámetros requeridos:**
- `idtransaccion` (int64): ID de la transacción del comprobante (factura o cobranza)
- `tipoimpresion` (int32): Tipo de impresión (valor a determinar según documentación o pruebas)

**Respuesta:**
- `nombrexml`: Nombre del XML asociado
- `datasource`: Fuente de datos
- `urlPdf`: URL para descargar el archivo PDF

**Nota:** Tanto los comprobantes de venta (facturas) como las cobranzas devuelven un `transaccionId` al ser creados, que puede usarse para obtener el PDF correspondiente.

#### 🔍 Investigación sobre `tipoimpresion`

**Estado:** ⚠️ **Información no disponible públicamente**

**Resultados de la investigación:**
- La documentación oficial de Xubio (`https://xubio.com/API/documentation/index.html`) no especifica los valores posibles para `tipoimpresion`
- No se encontraron ejemplos de código público que muestren valores específicos
- El parámetro es requerido pero su significado y valores aceptados no están documentados

**Acciones recomendadas:**
1. **Pruebas empíricas**: Probar con valores comunes como `1`, `2`, `3` para determinar cuál funciona
2. **Consultar soporte**: Contactar al soporte técnico de Xubio para obtener la documentación específica
3. **Revisar respuestas**: Analizar si el endpoint devuelve errores descriptivos que indiquen valores válidos
4. **Valor por defecto**: Considerar usar `1` como valor por defecto (valor común en APIs similares para "impresión estándar")

**Hipótesis posibles** (requiere validación):
- `1` = Impresión estándar/normal
- `2` = Impresión duplicado
- `3` = Impresión triplicado
- O podría ser un código que identifica el formato/tipo de comprobante

#### 🧪 Herramienta de Testing

**Aplicación HTML creada:** `test-imprimir-pdf/index.html`

**Características implementadas:**
- ✅ **Autenticación completa**: Obtener token con credenciales, guardar en localStorage, renovación automática
- ✅ **Flujo completo de facturas**: Crear factura → Obtener PDF → Visualizar/Descargar
- ✅ **Flujo completo de cobranzas**: Crear cobranza → Obtener PDF → Visualizar/Descargar
- ✅ **Visualización de PDF**: Iframe para ver PDFs directamente en la página
- ✅ **Descarga de PDF**: Botones para descargar o abrir en nueva pestaña
- ✅ **Prueba de tipoimpresion**: Botones rápidos para probar valores comunes (1, 2, 3, 0)
- ✅ **Manejo de errores**: Detección de token expirado y renovación automática
- ✅ **Interfaz intuitiva**: Secciones claras para cada flujo de trabajo

**Uso:**
1. Abrir `index.html` en el navegador (localmente o desde GitHub Pages)
2. Ingresar credenciales y obtener token (se guarda automáticamente)
3. Probar flujos completos o solo obtener PDFs de comprobantes existentes
4. Documentar valores válidos de `tipoimpresion` encontrados

**Ventajas:**
- No requiere servidor ni instalación
- Funciona localmente o en GitHub Pages
- Prueba end-to-end de todos los flujos
- Manejo automático de token y errores
- Interfaz simple y clara

---

## 📋 Requerimientos Detallados

### Por definir...

