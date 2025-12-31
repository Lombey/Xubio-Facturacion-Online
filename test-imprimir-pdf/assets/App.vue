<template>
  <div class="container">
    <h1>🧪 Test Xubio - Imprimir PDF</h1>
    <p class="subtitle">Prueba completa: Facturas y Cobranzas con obtención de PDF</p>

    <!-- Sección 1: Autenticación -->
    <div class="section">
      <h2>1. Autenticación</h2>
      <div class="info">
        💡 Las credenciales están en el archivo <code>.xubio-credentials.md</code><br>
        ✅ Desplegado en Vercel - El proxy API funciona automáticamente
      </div>
      <form @submit.prevent="handleTokenSubmit" novalidate>
        <div class="form-group">
          <label for="clientId">Client ID:</label>
          <input type="text" id="clientId" v-model="clientId" placeholder="Ingresa tu Client ID" autocomplete="username">
        </div>
        <div class="form-group">
          <label for="secretId">Secret ID:</label>
          <input type="password" id="secretId" v-model="secretId" placeholder="Ingresa tu Secret ID" autocomplete="current-password">
        </div>
        <div class="checkbox-group">
          <input type="checkbox" id="guardarCredenciales" v-model="guardarCredenciales">
          <label for="guardarCredenciales" style="font-weight: normal; margin: 0;">Guardar credenciales en localStorage</label>
        </div>
        <button type="button" @click.prevent="handleTokenSubmit($event)" :disabled="isLoading">Obtener Token</button>
        <button type="button" class="btn-danger" @click="limpiarCredenciales()" :disabled="isLoading">Limpiar Credenciales</button>
      </form>
      <div v-if="isLoading === true && loadingContext && typeof loadingContext === 'string' && loadingContext.includes('token')" class="info">
        ⏳ <span v-text="loadingContext"></span>
      </div>
      <div v-if="tokenResult.visible" :class="['result', tokenResult.type]" v-html="formatoMensaje(tokenResult.message)"></div>
    </div>

    <!-- Sección 2: Productos y Lista de Precios -->
    <div class="section">
      <h2>2. Productos y Lista de Precios</h2>
      <div class="info">
        💡 Los productos se cargan automáticamente. Selecciona los que quieras incluir en la factura.
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <button @click="listarProductos(true)" :disabled="isLoading" class="test-btn" title="Forzar actualización desde la API">🔄 Actualizar desde API</button>
      </div>
      <div style="font-size: 12px; color: #666; margin-top: 5px;">
        💡 Se cargan automáticamente desde cache al iniciar. Usa "Actualizar" si necesitas datos frescos.
      </div>
      <div v-if="productosListResult.visible" :class="['result', productosListResult.type]" v-html="formatoMensaje(productosListResult.message)"></div>
      
      <div v-if="productosList.length > 0" style="margin-top: 15px;">
        <producto-selector
          :productos="productosList"
          :productos-seleccionados="productosSeleccionados"
          @select-producto="agregarProducto"
          @remove-producto="eliminarProducto"
        />
      </div>
    </div>

    <!-- Sección 2.5: Clientes -->
    <div class="section">
      <h2>2.5. Clientes</h2>
      <div class="info">
        💡 Los clientes se cargan automáticamente. Selecciona el que quieras usar en la factura.
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <button @click="listarClientes(true)" :disabled="isLoading" class="test-btn" title="Forzar actualización desde la API">🔄 Actualizar desde API</button>
      </div>
      <div style="font-size: 12px; color: #666; margin-top: 5px;">
        💡 Se cargan automáticamente desde cache al iniciar. Usa "Actualizar" si necesitas datos frescos.
      </div>
      <div v-if="clientesListResult.visible" :class="['result', clientesListResult.type]" v-html="formatoMensaje(clientesListResult.message)"></div>
      
      <div v-if="clientesList.length > 0" style="margin-top: 15px;">
        <cliente-selector
          :clientes="clientesList"
          :cliente-seleccionado="clienteSeleccionado"
          @select-cliente="seleccionarClienteDelDropdown"
        />
      </div>
    </div>

    <!-- Sección 2.6: Puntos de Venta -->
    <div class="section">
      <h2>2.6. Puntos de Venta</h2>
      <div class="info">
        💡 Los puntos de venta se cargan automáticamente. Solo se muestran puntos editable-sugerido (válidos para facturas). Se preselecciona automáticamente el punto de venta ID 212819 o valor 00004.
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <button @click="listarPuntosDeVenta(true)" :disabled="isLoading" class="test-btn" title="Obtener puntos de venta desde la API">🔄 Actualizar desde API</button>
      </div>
      <div style="font-size: 12px; color: #666; margin-top: 5px;">
        💡 Se cargan automáticamente desde cache al iniciar. Usa "Actualizar" si necesitas datos frescos.
      </div>
      <div v-if="puntosDeVentaResult.visible" :class="['result', puntosDeVentaResult.type]" v-html="formatoMensaje(puntosDeVentaResult.message)"></div>
      
      <div v-if="puntosDeVenta.length > 0" style="margin-top: 15px;">
            <PuntoVentaSelector
              :puntos-de-venta="puntosDeVenta"
              :punto-venta-seleccionado="puntoVentaSeleccionadoParaFactura"
              @select-punto-venta="seleccionarPuntoVentaDelDropdown"
            />
            
            <!-- 🧪 CONTROLES DE LABORATORIO (Solo para diagnóstico) -->
            <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border: 1px dashed #6c757d; border-radius: 4px;">
              <strong style="font-size: 12px; display: block; margin-bottom: 5px;">🧪 Estrategia de Envío (Prueba):</strong>
              <div style="display: flex; gap: 15px; font-size: 12px;">
                <label style="cursor: pointer; display: flex; align-items: center;">
                  <input type="radio" v-model="estrategiaPuntoVenta" value="normal" name="estrategiaPV">
                  <span style="margin-left: 4px;">🔵 Normal (API)</span>
                </label>
                <label style="cursor: pointer; display: flex; align-items: center;">
                  <input type="radio" v-model="estrategiaPuntoVenta" value="forzar" name="estrategiaPV">
                  <span style="margin-left: 4px;">🔴 Forzar Editable</span>
                </label>
                <label style="cursor: pointer; display: flex; align-items: center;">
                  <input type="radio" v-model="estrategiaPuntoVenta" value="soloId" name="estrategiaPV">
                  <span style="margin-left: 4px;">🟠 Solo ID</span>
                </label>
              </div>
              <div style="font-size: 11px; color: #666; margin-top: 5px; font-style: italic;">
                {{ descripcionEstrategia }}
              </div>
            </div>
            <!-- FIN CONTROLES -->

            <div v-if="mostrarDatosCrudosPV && puntoVentaSeleccionadoParaFactura"
                 style="margin-top: 10px; padding: 15px; background: #1e1e1e; border-radius: 8px; overflow-x: auto;">
              <pre style="color: #d4d4d4; margin: 0; font-size: 12px; white-space: pre-wrap;">{{ JSON.stringify(puntoVentaSeleccionadoParaFactura, null, 2) }}</pre>
            </div>
            <div v-else-if="mostrarDatosCrudosPV && !puntoVentaSeleccionadoParaFactura"
                 style="margin-top: 10px; padding: 10px; background: #f8d7da; border-radius: 4px; color: #721c24;">
              ⚠️ No hay punto de venta seleccionado. Selecciona uno primero.
            </div>
      </div>

      <!-- Estado actual de validación -->
      <div style="margin-top: 15px; padding: 15px; border-radius: 8px;"
           :style="diagnosticoPVResultado.valido ? 'background: #d4edda; border: 1px solid #28a745;' : 'background: #f8d7da; border: 1px solid #dc3545;'">
        <div style="font-weight: bold; margin-bottom: 10px;">
          {{ diagnosticoPVResultado.valido ? '✅ VÁLIDO' : '❌ INVÁLIDO' }} - Estado actual
        </div>
        <div style="font-size: 13px;">
          <div><strong>ID encontrado:</strong> {{ diagnosticoPVResultado.idEncontrado || 'ninguno' }}</div>
          <div><strong>Campo ID usado:</strong> {{ diagnosticoPVResultado.campoIdUsado || 'ninguno' }}</div>
          <div><strong>Es Editable:</strong> {{ diagnosticoPVResultado.esEditable ? '✅ Sí' : '❌ No' }}</div>
          <div><strong>Es Sugerido:</strong> {{ diagnosticoPVResultado.esSugerido ? '✅ Sí' : '❌ No' }}</div>
          <div><strong>Campo Editable usado:</strong> {{ diagnosticoPVResultado.campoEditableUsado || 'ninguno' }}</div>
        </div>
      </div>

      <!-- Selector de campo ID a probar -->
      <div style="margin-top: 15px;">
        <label style="font-weight: bold; display: block; margin-bottom: 8px;">🆔 Probar Campo ID:</label>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          <button v-for="campo in camposIdPosibles" :key="campo.campo"
                  @click="probarCampoId(campo.campo)"
                  :class="['test-btn', { 'btn-success': campoIdActivo === campo.campo }]"
                  :style="campoIdActivo === campo.campo ? 'background: #28a745; color: white;' : ''">
            {{ campo.label }}
            <span v-if="campo.valor !== undefined" style="font-size: 10px; display: block;">
              = {{ campo.valor === null || campo.valor === undefined ? 'null' : campo.valor }}
            </span>
          </button>
        </div>
      </div>

      <!-- Selector de campo editable/sugerido a probar -->
      <div style="margin-top: 15px;">
        <label style="font-weight: bold; display: block; margin-bottom: 8px;">✏️ Probar Campo Editable/Sugerido:</label>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          <button v-for="campo in camposEditablePosibles" :key="campo.campo"
                  @click="probarCampoEditable(campo.campo)"
                  :class="['test-btn', { 'btn-success': campoEditableActivo === campo.campo }]"
                  :style="campoEditableActivo === campo.campo ? 'background: #28a745; color: white;' : ''">
            {{ campo.label }}
            <span v-if="campo.valor !== undefined" style="font-size: 10px; display: block;">
              = {{ campo.valor === null || campo.valor === undefined ? 'null' : String(campo.valor) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Aplicar configuración encontrada -->
      <div v-if="diagnosticoPVResultado.valido" style="margin-top: 20px; padding: 15px; background: #d4edda; border-radius: 8px; border: 2px solid #28a745;">
        <div style="font-weight: bold; color: #155724; margin-bottom: 10px;">
          🎉 ¡Encontraste la configuración correcta!
        </div>
        <div style="font-size: 13px; color: #155724; margin-bottom: 10px;">
          Campo ID: <code>{{ campoIdActivo }}</code> | Campo Editable: <code>{{ campoEditableActivo }}</code>
        </div>
        <button @click="aplicarConfiguracionPV" class="btn-secondary" style="background: #28a745;">
          💾 Aplicar esta configuración permanentemente
        </button>
      </div>

      <!-- Log de pruebas -->
      <div v-if="logDiagnosticoPV.length > 0" style="margin-top: 15px;">
        <label style="font-weight: bold; display: block; margin-bottom: 8px;">📋 Log de pruebas:</label>
        <div style="max-height: 150px; overflow-y: auto; padding: 10px; background: #f8f9fa; border-radius: 4px; font-size: 12px;">
          <div v-for="(log, index) in logDiagnosticoPV" :key="index"
               :style="log.exito ? 'color: #28a745;' : 'color: #dc3545;'">
            {{ log.mensaje }}
          </div>
        </div>
        <button @click="limpiarLogDiagnostico" class="test-btn" style="margin-top: 5px;">🗑️ Limpiar log</button>
      </div>

    <!-- Toggle para mostrar/ocultar diagnóstico -->
    <div style="text-align: center; margin: 10px 0;">
      <button @click="mostrarDiagnosticoPV = !mostrarDiagnosticoPV"
              class="test-btn"
              style="background: #6c757d; color: white;">
        {{ mostrarDiagnosticoPV ? '🔽 Ocultar' : '🔧 Mostrar' }} Diagnóstico de Punto de Venta
      </button>
    </div>
    </div>

    <!-- Sección 3: Flujo Completo - Factura -->
    <div class="section">
      <h2>3. Flujo Completo: Factura → PDF</h2>
      <div class="info">
        💡 Este flujo crea una factura y automáticamente obtiene su PDF
      </div>
      
      <!-- Cliente ID oculto (funcional pero no visible) -->
      <input 
        type="hidden" 
        id="facturaClienteId" 
        v-model="facturaClienteId" 
        @input="formatearCUITInput($event)">
      
      <!-- Card de Cliente Seleccionado -->
      <div v-if="clienteSeleccionadoParaFactura" style="margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">👤 Cliente</div>
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">
              {{ clienteSeleccionadoParaFactura.razonSocial || clienteSeleccionadoParaFactura.nombre || 'Sin nombre' }}
            </div>
            <div style="font-size: 14px; opacity: 0.9;">
              <strong>CUIT:</strong> {{ formatearCUIT(clienteSeleccionadoParaFactura.cuit || clienteSeleccionadoParaFactura.identificacionTributaria?.numero || '') || 'N/A' }}
            </div>
          </div>
          <button 
            @click="limpiarClienteFactura()" 
            style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;"
            title="Cambiar cliente">
            ✕ Cambiar
          </button>
        </div>
      </div>
      
      <!-- Mensaje si no hay cliente seleccionado -->
      <div v-if="!clienteSeleccionadoParaFactura" style="margin-bottom: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; color: #856404;">
        <div style="font-weight: bold; margin-bottom: 5px;">⚠️ No hay cliente seleccionado</div>
        <div style="font-size: 14px;">Por favor, selecciona un cliente desde la sección "2.5. Clientes" arriba.</div>
      </div>
      
      <!-- Card de Productos Seleccionados -->
      <div v-if="productosSeleccionados.length > 0" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px;">
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #495057;">
          📦 Productos en la Factura ({{ productosSeleccionados.length }})
        </div>
        <div style="max-height: 200px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #dee2e6;">
                <th style="text-align: left; padding: 8px; font-size: 12px; color: #6c757d;">Producto</th>
                <th style="text-align: right; padding: 8px; font-size: 12px; color: #6c757d;">Cant.</th>
                <th style="text-align: right; padding: 8px; font-size: 12px; color: #6c757d;">Precio Unit.</th>
                <th style="text-align: right; padding: 8px; font-size: 12px; color: #6c757d;">IVA (21%)</th>
                <th style="text-align: right; padding: 8px; font-size: 12px; color: #6c757d;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in productosSeleccionados" :key="index" style="border-bottom: 1px solid #e9ecef;">
                <td style="padding: 8px; font-size: 14px;">{{ item.producto.nombre || item.producto.codigo || 'Sin nombre' }}</td>
                <td style="text-align: right; padding: 8px; font-size: 14px;">{{ item.cantidad }}</td>
                <td style="text-align: right; padding: 8px; font-size: 14px;">${{ formatearPrecio(item.precio) }}</td>
                <td style="text-align: right; padding: 8px; font-size: 14px;">${{ formatearPrecio(calcularIVA(item)) }}</td>
                <td style="text-align: right; padding: 8px; font-size: 14px; font-weight: bold;">${{ formatearPrecio(item.cantidad * item.precio) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style="border-top: 2px solid #dee2e6;">
                <td colspan="4" style="text-align: right; padding: 8px; font-weight: bold; font-size: 16px;">Total:</td>
                <td style="text-align: right; padding: 8px; font-weight: bold; font-size: 16px; color: #28a745;">
                  ${{ formatearPrecio(totalProductosSeleccionados) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <!-- Resumen de Totales -->
        <div class="resumen-totales" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-top: 2px solid #dee2e6; text-align: right;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: 500;">Subtotal sin IVA:</span>
            <span>${{ formatearPrecio(subtotalSinIVA) }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: 500;">IVA (21%):</span>
            <span>${{ formatearPrecio(totalIVA) }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #dee2e6; margin-top: 10px;">
            <span style="font-weight: bold; font-size: 18px;">Total:</span>
            <span style="font-weight: bold; font-size: 18px; color: #28a745;">${{ formatearPrecio(totalProductosSeleccionados) }}</span>
          </div>
        </div>
      </div>
      
      <!-- Valores por Defecto -->
      <div class="valores-default" style="margin-bottom: 20px; padding: 15px; background: #f0f7ff; border: 1px solid #2196F3; border-radius: 8px;">
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #1976d2;">
          ⚙️ Valores por Defecto que se Usarán:
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 14px;">
          <div>
            <strong>Centro de Costo:</strong><br>
            <span style="color: #666;">{{ centroDeCostoSeleccionado.nombre || 'No disponible' }}</span>
          </div>
          <div>
            <strong>Depósito:</strong><br>
            <span style="color: #666;">{{ depositoSeleccionado.nombre || 'No disponible' }}</span>
          </div>
          <div>
            <strong>Vendedor:</strong><br>
            <span style="color: #666;">{{ vendedorSeleccionado.nombre || 'No disponible' }}</span>
          </div>
          <div>
            <strong>Punto de Venta:</strong><br>
            <span style="color: #666;">{{ puntoVentaSeleccionado.puntoVenta || puntoVentaSeleccionado.codigo || puntoVentaSeleccionado.nombre || 'No disponible' }}</span>
          </div>
          <div>
            <strong>Circuito Contable:</strong><br>
            <span style="color: #666;">{{ circuitoContableSeleccionado.nombre || 'No disponible' }}</span>
          </div>
        </div>
      </div>
      
      <!-- Mensaje si no hay productos -->
      <div v-if="productosSeleccionados.length === 0" style="margin-bottom: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; color: #856404;">
        <div style="font-weight: bold; margin-bottom: 5px;">⚠️ No hay productos seleccionados</div>
        <div style="font-size: 14px;">Por favor, selecciona productos desde la sección "2. Productos y Lista de Precios" arriba.</div>
      </div>
      <div class="form-group">
        <label for="facturaTipoimpresion">
          Tipo Impresión (para PDF):
          <span class="tooltip" title="Tipo de formato de impresión. Valor recomendado: 1">❓</span>
        </label>
        <input type="number" id="facturaTipoimpresion" v-model="facturaTipoimpresion" placeholder="Ej: 1">
        <div class="test-values">
          <button class="test-btn" @click="facturaTipoimpresion = '1'">1</button>
          <button class="test-btn" @click="facturaTipoimpresion = '2'">2</button>
          <button class="test-btn" @click="facturaTipoimpresion = '3'">3</button>
        </div>
      </div>
      <div class="form-group">
        <label for="facturaMoneda">Moneda:</label>
        <select id="facturaMoneda" v-model="facturaMoneda" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
          <option v-if="monedasList.length === 0" value="" disabled>Cargando monedas...</option>
          <option v-for="moneda in monedasList" :key="moneda.id || moneda.ID" :value="moneda.codigo">
            {{ moneda.codigo }} - {{ moneda.nombre }}
          </option>
        </select>
        <div v-if="monedasList.length > 0 && facturaMoneda" style="font-size: 11px; color: #28a745; margin-top: 3px;">
          ✅ {{ monedasList.length }} monedas cargadas. <strong>{{ facturaMoneda }}</strong> seleccionada.
        </div>
      </div>
      <div class="form-group" v-if="facturaMoneda && facturaMoneda !== 'ARS' && facturaMoneda !== 'PESOS_ARGENTINOS'">
        <label for="facturaCotizacion">Cotización ({{ facturaMoneda }}):</label>
        <div style="display: flex; gap: 10px; align-items: center;">
          <input type="number" id="facturaCotizacion" v-model.number="facturaCotizacion" step="0.01" min="0.01" placeholder="Ej: 1.00" style="flex: 1;">
          <button class="test-btn" @click="obtenerCotizacionDolar()" :disabled="isLoading">
            💱 Actualizar
          </button>
        </div>
        <div style="font-size: 12px; color: #666; margin-top: 5px;">
          💡 Cotización del dólar. Se actualiza automáticamente al cargar la página. Última actualización: <span v-if="cotizacionActualizada">{{ cotizacionActualizada }}</span><span v-else>No disponible</span>
        </div>
      </div>
      <div class="form-group">
        <label for="facturaDescripcion">Descripción de la Factura (opcional):</label>
        <input 
          type="text"
          id="facturaDescripcion" 
          v-model="facturaDescripcion" 
          placeholder="Ej: Servicios de consultoría mes de Diciembre 2024"
          style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; font-size: 14px;">
        <div style="font-size: 12px; color: #666; margin-top: 5px;">
          📝 Campo documentado en la API - Descripción general del comprobante
        </div>
      </div>
      <div class="form-group">
        <label for="facturaCondicionPago">Condición de Pago:</label>
        <select id="facturaCondicionPago" v-model="facturaCondicionPago" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
          <option :value="1">Cuenta Corriente</option>
          <option :value="2">Contado</option>
        </select>
      </div>
      <div class="form-group">
        <label for="facturaFechaVto">Fecha de Vencimiento:</label>
        <input 
          type="date" 
          id="facturaFechaVto" 
          v-model="facturaFechaVto" 
          style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      <div class="checkbox-group" style="margin-bottom: 15px;">
        <input type="checkbox" id="modoAvanzado" v-model="modoAvanzado">
        <label for="modoAvanzado" style="font-weight: normal; margin: 0;">
          🔧 Modo avanzado (JSON manual)
        </label>
      </div>
      <div v-if="!modoAvanzado" class="info" style="margin-bottom: 15px;">
        💡 Para casos especiales, activa el modo avanzado para editar el JSON completo de la factura.
      </div>
      <div v-if="modoAvanzado" class="form-group">
        <label for="facturaJson">JSON de Factura (modo avanzado):</label>
        <textarea 
          id="facturaJson" 
          v-model="facturaJson" 
          placeholder='JSON completo del payload. Esto sobrescribirá los productos seleccionados.'
          rows="8"
          style="font-family: 'Courier New', monospace; font-size: 12px;">
        </textarea>
        <div class="info" style="margin-top: 5px;">
          ⚠️ El modo avanzado permite sobrescribir completamente el payload de la factura. 
          Solo para casos especiales. Si llenas este campo, se ignorarán los productos seleccionados.
        </div>
      </div>
      <!-- Preview de Factura -->
      <div v-if="clienteSeleccionadoParaFactura && productosSeleccionados.length > 0" 
           class="preview-factura" 
           style="margin-bottom: 20px; padding: 20px; background: white; border: 2px solid #2196F3; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <h3 style="margin-bottom: 15px; color: #2196F3; font-size: 18px;">
          📄 Resumen de Factura a Crear
        </h3>
        
        <!-- Sección Cliente -->
        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold; margin-bottom: 5px;">👤 Cliente:</div>
          <div>{{ clienteSeleccionadoParaFactura.razonSocial || clienteSeleccionadoParaFactura.nombre || 'Sin nombre' }}</div>
          <div style="font-size: 12px; color: #666;">
            CUIT: {{ formatearCUIT(clienteSeleccionadoParaFactura.cuit || clienteSeleccionadoParaFactura.identificacionTributaria?.numero || '') || 'N/A' }}
          </div>
        </div>
        
        <!-- Sección Configuración -->
        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold; margin-bottom: 5px;">⚙️ Configuración:</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px;">
            <div><strong>Moneda:</strong> {{ facturaMoneda || 'Cargando...' }}</div>
            <div v-if="facturaMoneda && facturaMoneda !== 'ARS' && facturaMoneda !== 'PESOS_ARGENTINOS'"><strong>Cotización:</strong> ${{ formatearPrecio(facturaCotizacion) }}</div>
            <div><strong>Fecha:</strong> {{ new Date().toISOString().split('T')[0] }}</div>
            <div><strong>Vencimiento:</strong> {{ fechaVencimiento }}</div>
            <div><strong>Punto de Venta:</strong> 
              <span :style="puntoVentaValido ? '' : 'color: #dc3545; font-weight: bold;'">
                {{ puntoVentaSeleccionado.puntoVenta || puntoVentaSeleccionado.codigo || puntoVentaSeleccionado.nombre || 'No disponible' }}
              </span>
              <span v-if="!puntoVentaValido" style="color: #dc3545; font-size: 11px; margin-left: 5px;">⚠️ Inválido</span>
            </div>
          </div>
        </div>
        
        <!-- Sección Productos -->
        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold; margin-bottom: 10px;">📦 Productos ({{ productosSeleccionados.length }}):</div>
          <div style="max-height: 150px; overflow-y: auto;">
            <div v-for="(item, index) in productosSeleccionados" :key="index" 
                 style="padding: 5px 0; font-size: 13px; border-bottom: 1px solid #f0f0f0;">
              <strong>{{ item.producto.nombre || item.producto.codigo }}</strong>
              - Cant: {{ item.cantidad }} 
              - ${{ formatearPrecio(item.precio) }} c/u 
              - Subtotal: ${{ formatearPrecio(item.cantidad * item.precio) }}
            </div>
          </div>
        </div>
        
        <!-- Sección Totales -->
        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold; margin-bottom: 10px;">💰 Totales:</div>
          <div style="text-align: right; font-size: 14px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Subtotal sin IVA:</span>
              <span>${{ formatearPrecio(subtotalSinIVA) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>IVA (21%):</span>
              <span>${{ formatearPrecio(totalIVA) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #2196F3; margin-top: 10px; font-weight: bold; font-size: 16px;">
              <span>Total:</span>
              <span style="color: #2196F3;">${{ formatearPrecio(totalProductosSeleccionados) }} {{ facturaMoneda }}</span>
            </div>
          </div>
        </div>
        
        <!-- Sección Valores por Defecto -->
        <div style="font-size: 12px; color: #666;">
          <div style="font-weight: bold; margin-bottom: 5px; color: #333;">Valores por Defecto:</div>
          <div>Centro de Costo: {{ centroDeCostoSeleccionado.nombre }}</div>
          <div>Depósito: {{ depositoSeleccionado.nombre }}</div>
          <div>Vendedor: {{ vendedorSeleccionado.nombre }}</div>
          <div>Punto de Venta: {{ puntoVentaSeleccionado.puntoVenta || puntoVentaSeleccionado.codigo || puntoVentaSeleccionado.nombre }}</div>
        </div>
      </div>
      
      <div class="flow-buttons">
                    <button class="btn-secondary" @click="flujoCompletoFactura()" :disabled="isLoading || !puedeCrearFactura">🚀 Crear Factura y Obtener PDF</button>
                    <button @click="soloCrearFactura()" :disabled="isLoading || !puedeCrearFactura">Solo Crear Factura</button>
                    
                    <!-- 🕵️ DIAGNÓSTICO DE BLOQUEO (Solo visible si no se puede crear factura) -->
                    <div v-if="!puedeCrearFactura && !isLoading" style="margin-top: 15px; padding: 10px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; font-size: 11px;">
                      <strong>⚠️ No se puede crear la factura. Verifica:</strong>
                      <ul style="margin: 5px 0 0 20px; padding: 0;">
                        <li :style="{ color: tokenValido ? '#28a745' : '#dc3545' }">
                          {{ tokenValido ? '✅' : '❌' }} Token de acceso válido
                        </li>
                        <li :style="{ color: (clienteSeleccionadoParaFactura && facturaClienteId) ? '#28a745' : '#dc3545' }">
                          {{ (clienteSeleccionadoParaFactura && facturaClienteId) ? '✅' : '❌' }} Cliente seleccionado (ID: {{ facturaClienteId || 'N/A' }})
                        </li>
                        <li :style="{ color: (productosSeleccionados.length > 0 || facturaJson.trim()) ? '#28a745' : '#dc3545' }">
                          {{ (productosSeleccionados.length > 0 || facturaJson.trim()) ? '✅' : '❌' }} Productos seleccionados ({{ productosSeleccionados.length }})
                        </li>
                        <li :style="{ color: facturaMoneda ? '#28a745' : '#dc3545' }">
                          {{ facturaMoneda ? '✅' : '❌' }} Moneda seleccionada
                        </li>
                        <li :style="{ color: puntoVentaValido ? '#28a745' : '#dc3545' }">
                          {{ puntoVentaValido ? '✅' : '❌' }} Punto de venta activo con ID válido
                          <div v-if="!puntoVentaValido" style="font-size: 10px; margin-left: 22px; color: #666; margin-top: 2px;">
                            Verifica que el punto de venta seleccionado:<br>
                            • Tenga un ID válido (puntoVentaId)<br>
                            • Esté activo en Xubio
                          </div>
                        </li>
                      </ul>
                    </div>      </div>
      <!-- Mensaje informativo cuando los botones están deshabilitados -->
      <div v-if="!puedeCrearFactura && !isLoading" style="margin-top: 10px; padding: 10px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; color: #856404; font-size: 13px;">
        <div style="font-weight: bold; margin-bottom: 5px;">⚠️ No se puede crear la factura. Verifica:</div>
        <ul style="margin: 0; padding-left: 20px;">
          <li v-if="!tokenValido">❌ Token de acceso válido</li>
          <li v-if="!clienteSeleccionadoParaFactura || !facturaClienteId">❌ Cliente seleccionado</li>
          <li v-if="!facturaJson.trim() && productosSeleccionados.length === 0">❌ Productos seleccionados o JSON manual</li>
          <li v-if="!facturaMoneda">❌ Moneda seleccionada</li>
          <li v-if="!puntosDeVenta || puntosDeVenta.length === 0">❌ Puntos de venta cargados (usa "Listar Puntos de Venta" en la sección 2.6)</li>
          <li v-if="puntosDeVenta && puntosDeVenta.length > 0 && !puntoVentaValido">
            ❌ Punto de venta activo con ID válido
            <div style="margin-left: 20px; margin-top: 5px; font-size: 12px; color: #856404;">
              Verifica que el punto de venta seleccionado:<br>
              • Tenga un ID válido (puntoVentaId)<br>
              • Esté activo en Xubio
            </div>
          </li>
          <li v-if="facturaMoneda && facturaMoneda !== 'ARS' && facturaMoneda !== 'PESOS_ARGENTINOS' && (!facturaCotizacion || parseFloat(facturaCotizacion) <= 0)">
            ❌ Cotización válida para moneda extranjera
          </li>
        </ul>
      </div>
      <div v-if="facturaResult.visible" :class="['result', facturaResult.type]" v-html="formatoMensaje(facturaResult.message)"></div>
      <div v-if="facturaPdfViewerVisible" class="pdf-viewer" v-html="facturaPdfViewerHtml"></div>
    </div>

    <!-- Sección 4: Flujo Completo - Cobranza -->
    <div class="section">
      <h2>3. Flujo Completo: Cobranza → PDF</h2>
      <div class="info">
        💡 Este flujo crea una cobranza asociada a una factura y automáticamente obtiene su PDF
      </div>
      <div class="form-group">
        <label for="cobranzaClienteId">Cliente ID:</label>
        <input 
          type="text" 
          id="cobranzaClienteId" 
          v-model="cobranzaClienteId" 
          placeholder="ID del cliente (usa la búsqueda de clientes arriba)"
          @input="formatearCUITInput($event)"
          style="width: 100%;">
      </div>
      <div class="form-group">
        <button @click="obtenerFacturasPendientes(cobranzaClienteId)" 
                :disabled="isLoading || !cobranzaClienteId"
                class="test-btn">
          🔍 Buscar Facturas Pendientes
        </button>
      </div>
      <div v-if="mostrarFacturasPendientes && facturasPendientes.length > 0" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Seleccionar Factura:</label>
        <div style="position: relative;">
          <select 
            @change="seleccionarFacturaPendiente($event)"
            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">-- Selecciona una factura --</option>
            <option v-for="factura in facturasPendientes" 
                    :key="factura.id || factura.ID" 
                    :value="JSON.stringify(factura)">
              {{ factura.numeroComprobante || factura.numero }} - 
              {{ factura.fecha }} - 
              Saldo: ${{ formatearPrecio(factura.saldo || factura.saldoPendiente || factura.importeTotal) }}
            </option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label for="cobranzaIdComprobante">ID Comprobante (Factura a cobrar):</label>
        <input 
          type="number" 
          id="cobranzaIdComprobante" 
          v-model="cobranzaIdComprobante" 
          @blur="obtenerDatosFactura(cobranzaIdComprobante)"
          placeholder="ID de la factura a cobrar">
      </div>
      <div v-if="facturaParaCobrar" 
           class="preview-factura-cobranza"
           style="margin-bottom: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px;">
        
        <div style="font-weight: bold; margin-bottom: 10px; color: #856404;">
          📄 Información de la Factura a Cobrar:
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px;">
          <div><strong>Número:</strong> {{ facturaParaCobrar.numeroComprobante || facturaParaCobrar.numero || 'N/A' }}</div>
          <div><strong>Fecha:</strong> {{ facturaParaCobrar.fecha || 'N/A' }}</div>
          <div><strong>Cliente:</strong> {{ facturaParaCobrar.cliente?.razonSocial || facturaParaCobrar.cliente?.nombre || 'N/A' }}</div>
          <div><strong>Monto Total:</strong> ${{ formatearPrecio(facturaParaCobrar.importeTotal || facturaParaCobrar.total || 0) }}</div>
          <div><strong>Saldo Pendiente:</strong> 
            <span style="color: #28a745; font-weight: bold;">
              ${{ formatearPrecio(facturaParaCobrar.saldo || facturaParaCobrar.saldoPendiente || facturaParaCobrar.importeTotal || 0) }}
            </span>
          </div>
          <div><strong>Moneda:</strong> {{ facturaParaCobrar.moneda?.codigo || 'ARS' }}</div>
        </div>
        
        <div v-if="cobranzaImporte && parseFloat(cobranzaImporte) > parseFloat(facturaParaCobrar.saldo || facturaParaCobrar.saldoPendiente || facturaParaCobrar.importeTotal || 0)"
             style="margin-top: 10px; padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
          ⚠️ El importe a aplicar (${{ formatearPrecio(cobranzaImporte) }}) excede el saldo pendiente (${{ formatearPrecio(facturaParaCobrar.saldo || facturaParaCobrar.saldoPendiente || facturaParaCobrar.importeTotal || 0) }})
        </div>
      </div>
      <div class="form-group">
        <label for="cobranzaImporte">Importe a Aplicar:</label>
        <input type="number" id="cobranzaImporte" v-model="cobranzaImporte" placeholder="Ej: 1000" step="0.01">
      </div>
      <div class="form-group">
        <label for="cobranzaFormaPago">Forma de Pago:</label>
        <select id="cobranzaFormaPago" v-model="cobranzaFormaPago" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="efectivo">Efectivo</option>
          <option value="cheque">Cheque</option>
          <option value="transferencia">Transferencia Bancaria</option>
        </select>
      </div>
      <div class="form-group" v-if="cobranzaFormaPago !== 'efectivo'">
        <label for="cobranzaCuentaId">Cuenta:</label>
        <select id="cobranzaCuentaId" v-model="cobranzaCuentaId" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="">-- Selecciona una cuenta --</option>
          <option v-for="cuenta in cuentasDisponibles" 
                  :key="cuenta.id || cuenta.ID" 
                  :value="cuenta.id || cuenta.ID">
            {{ cuenta.nombre }} ({{ cuenta.codigo || '' }})
          </option>
        </select>
        <button @click="obtenerCuentas()" :disabled="isLoading" class="test-btn" style="margin-top: 5px;">
          🔄 Cargar Cuentas
        </button>
      </div>
      <div class="form-group">
        <label for="cobranzaTipoimpresion">
          Tipo Impresión (para PDF):
          <span class="tooltip" title="Tipo de formato de impresión. Valor recomendado: 1">❓</span>
        </label>
        <input type="number" id="cobranzaTipoimpresion" v-model="cobranzaTipoimpresion" placeholder="Ej: 1">
        <div class="test-values">
          <button class="test-btn" @click="cobranzaTipoimpresion = '1'">1</button>
          <button class="test-btn" @click="cobranzaTipoimpresion = '2'">2</button>
          <button class="test-btn" @click="cobranzaTipoimpresion = '3'">3</button>
        </div>
      </div>
      <div class="form-group">
        <label for="cobranzaJson">JSON de Cobranza (opcional):</label>
        <textarea id="cobranzaJson" v-model="cobranzaJson" placeholder='Dejar vacío para generar automáticamente'></textarea>
      </div>
      <div class="flow-buttons">
        <button class="btn-secondary" @click="flujoCompletoCobranza()" :disabled="isLoading">🚀 Crear Cobranza y Obtener PDF</button>
        <button @click="soloCrearCobranza()" :disabled="isLoading">Solo Crear Cobranza</button>
      </div>
      <div v-if="cobranzaResult.visible" :class="['result', cobranzaResult.type]" v-html="formatoMensaje(cobranzaResult.message)"></div>
      <div v-if="cobranzaPdfViewerVisible" class="pdf-viewer" v-html="cobranzaPdfViewerHtml"></div>
    </div>

    <!-- Sección 5: Listar Facturas del Último Mes -->
    <div class="section">
      <h2>4. Listar Facturas del Último Mes</h2>
      <div class="info">
        💡 Trae las facturas del último mes y selecciona una para usar su ID
      </div>
      <button @click="listarFacturasUltimoMes()" :disabled="isLoading">📋 Traer Facturas del Último Mes</button>
      <div v-if="facturasListResult.visible" :class="['result', facturasListResult.type]" v-html="formatoMensaje(facturasListResult.message)"></div>
      <div v-if="facturasList.length > 0" style="margin-top: 15px;">
        <table class="facturas-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Número</th>
              <th>Fecha</th>
              <th>CUIT</th>
              <th>Razón Social</th>
              <th>Monto</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="factura in facturasList" :key="factura.id" 
                :class="{ selected: facturaSeleccionada === factura.id }"
                @click="seleccionarFactura(factura)"
                style="cursor: pointer;">
              <td><strong>{{ factura.id }}</strong></td>
              <td>{{ factura.numero }}</td>
              <td>{{ factura.fecha }}</td>
              <td>{{ factura.cuit }}</td>
              <td>{{ factura.razonSocial }}</td>
              <td>${{ parseFloat(factura.monto).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</td>
              <td>
                <button class="test-btn" @click.stop="seleccionarFactura(factura)">Seleccionar</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top: 10px; font-size: 12px; color: #666;">
          💡 Haz clic en una fila para seleccionarla. Se copiará el ID a los campos correspondientes.
        </div>
      </div>
    </div>

    <!-- Sección 6: Obtener PDF de Comprobante Existente -->
    <div class="section">
      <h2>5. Obtener PDF de Comprobante Existente</h2>
      <div class="info">
        💡 Usa esta sección para probar diferentes valores de tipoimpresion con un comprobante existente
      </div>
      <div class="form-group">
        <label for="transaccionId">Transaction ID:</label>
        <input type="number" id="transaccionId" v-model="transaccionId" placeholder="Ej: 67519506">
      </div>
      <div class="form-group">
        <label for="tipoimpresion">
          Tipo Impresión:
          <span class="tooltip" title="Tipo de formato de impresión. Valor recomendado: 1">❓</span>
        </label>
        <input type="number" id="tipoimpresion" v-model="tipoimpresion" placeholder="Ej: 1">
        <div class="test-values">
          <button class="test-btn" @click="probarTipo(1)">Probar 1</button>
          <button class="test-btn" @click="probarTipo(2)">Probar 2</button>
          <button class="test-btn" @click="probarTipo(3)">Probar 3</button>
          <button class="test-btn" @click="probarTipo(0)">Probar 0</button>
        </div>
      </div>
      <button @click="obtenerPDF()" :disabled="isLoading">Obtener PDF</button>
      <div v-if="pdfResult.visible" :class="['result', pdfResult.type]" v-html="formatoMensaje(pdfResult.message)"></div>
      <div v-if="pdfViewerVisible" class="pdf-viewer" v-html="pdfViewerHtml"></div>
    </div>
  </div>
</template>

<script>
// Importar las opciones del componente desde app.js
import { appOptions } from './app.js';

export default {
  ...appOptions,
  name: 'App'
};
</script>

