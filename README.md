# Sheets con Xubio - Integración de Facturación

Este proyecto tiene como objetivo hacer funcionar el Google Sheet **"Xubio integracion"** en Google Drive, integrando datos de consumo con el sistema de facturación Xubio para generar facturas automáticamente y gestionar clientes.

## 📋 Descripción

**Sheets con Xubio** es una herramienta que automatiza el proceso de facturación mediante la integración entre:

- **Google Sheets "Xubio integracion"**: El Google Sheet en Google Drive que contiene los datos de consumo y gestiona la integración
- **Google Apps Script**: Plataforma de desarrollo para automatizar las operaciones
- **API de Xubio**: Sistema de facturación y gestión contable

El sistema está implementado utilizando **Google Apps Script**, lo que permite ejecutar el código directamente desde el Google Sheet "Xubio integracion" y automatizar todo el proceso de lectura de datos, generación de facturas y obtención de comprobantes en formato PDF.

## ✨ Funcionalidades

### 🔄 Integración con Google Sheets
- Lectura de datos de consumo desde hojas de cálculo de Google Sheets
- Procesamiento automático de la información para generar facturas

### 📄 Generación de Facturas
- Creación automática de facturas/cobros basados en los datos de consumo
- Generación de comprobantes de venta a través de la API de Xubio
- Obtención de facturas en formato PDF

### 👥 Gestión de Clientes
- **Listado de clientes**: Obtener la lista completa de clientes disponibles en Xubio para realizar facturas
- **Creación de clientes**: Generar nuevos clientes directamente a través de la API cuando sea necesario

## 🏗️ Arquitectura

El proyecto está desarrollado con **Google Apps Script** y se conecta con:

1. **Google Sheets**: Acceso directo a las hojas de cálculo mediante Apps Script
2. **API de Xubio**: Para operaciones de facturación y gestión de clientes
   - Endpoints principales utilizados:
     - `/clienteBean` - Gestión de clientes (GET, POST, PUT, DELETE)
     - `/comprobanteVentaBean` - Creación de facturas (POST)
     - `/imprimirPDF` - Obtención de PDFs de comprobantes (GET)

### Tecnologías

- **Google Apps Script**: Lenguaje JavaScript para automatización en el ecosistema de Google Workspace
- **REST API**: Comunicación con la API de Xubio mediante peticiones HTTP
- **MCP (Model Context Protocol)**: Uso del servidor MCP de Google Apps Script para gestión y desarrollo del proyecto

### Google Sheet del Proyecto

- **Nombre del Sheet**: "Xubio integracion"
- **Ubicación**: Google Drive
- **Objetivo**: Hacer funcionar este Sheet para automatizar la integración con Xubio

### Script de Google Apps Script

Este proyecto utiliza un script de Google Apps Script asociado al Sheet "Xubio integracion" que se gestiona mediante el **MCP (Model Context Protocol) de Google Apps Script**.

- **Script ID**: `1ip692XU1PolOYflhtEsLmtZAQ1e-8vlrV4C1_uc5o_sb1R5Xv1UpgC4z`
- **Título**: "Conexion a xubio"
- **Acceso**: El script puede ser gestionado y editado a través del servidor MCP configurado en Cursor/IDE

El servidor MCP permite:
- Leer y modificar el contenido del script
- Gestionar versiones y deployments
- Ejecutar funciones del script
- Obtener métricas y logs de ejecución

## 🔄 Flujo Conceptual del Sistema

### 1. Configuración Inicial
- **Autenticación**: El sistema guarda las credenciales y obtiene tokens de acceso para comunicarse con Xubio
- **Inicialización de hojas**: Se crean las hojas necesarias para almacenar datos y configuración

### 2. Sincronización de Datos Maestros
- **Clientes**: Se obtienen y almacenan todos los clientes activos disponibles en Xubio
- **Catálogos**: Se sincronizan bancos y cuentas contables necesarios para las operaciones

### 3. Identificación de Facturas Pendientes
- **Consulta de comprobantes asociados**: Se buscan las facturas pendientes de cobro del cliente configurado
- **Enriquecimiento de datos**: Se completan automáticamente los importes, monedas y cotizaciones de las facturas encontradas

### 4. Preparación de Cobranzas
- **Selección de facturas**: El usuario selecciona qué facturas desea cobrar
- **Completado automático**: El sistema completa automáticamente importe, moneda y cotización desde la factura seleccionada
- **Generación de template**: Se crea un JSON base con todos los datos necesarios del comprobante y cliente

### 5. Configuración Manual
- **Medios de pago**: El usuario debe completar manualmente la información de medios de pago en el template JSON generado

### 6. Procesamiento de Cobranzas
- **Validación**: Se verifica que el JSON tenga la estructura mínima requerida
- **Envío**: Se crea la cobranza en Xubio con los datos preparados
- **Actualización de estado**: Se marca cada cobranza como procesada exitosamente o con error según el resultado

### Flujo de Trabajo Resumido
1. **Autenticación** → Obtener acceso al sistema
2. **Sincronización** → Traer datos maestros y facturas pendientes
3. **Preparación** → Seleccionar facturas y generar templates
4. **Configuración** → Completar medios de pago manualmente
5. **Procesamiento** → Enviar cobranzas y actualizar estados

El sistema automatiza la obtención de datos y la generación de templates, pero requiere intervención manual para configurar los medios de pago antes de procesar.

## 📚 Documentación

La información oficial sobre los endpoints disponibles de la API de Xubio se encuentra en el archivo [`API_Xubio.md`](./API_Xubio.md), que contiene la documentación completa de los recursos disponibles.

⚠️ **Nota importante**: Aunque `API_Xubio.md` es la documentación oficial del proyecto, puede contener errores o información desactualizada. Se recomienda verificar la información con la documentación oficial de Xubio o mediante pruebas directas con la API.

## 🚀 Uso

### Prerrequisitos

- Cuenta de Google con acceso a Google Drive
- Acceso al Google Sheet **"Xubio integracion"** en Google Drive
- Editor de Google Apps Script (disponible en Google Sheets: Extensiones → Apps Script)
- Credenciales de acceso a la API de Xubio
- Permisos necesarios para leer las hojas de cálculo y realizar llamadas HTTP externas
- **Servidor MCP de Google Apps Script** configurado (opcional, para desarrollo y gestión del script)

### Flujo de trabajo

1. **Lectura de datos**: El sistema lee los datos de consumo desde Google Sheets
2. **Procesamiento**: Los datos se procesan y validan
3. **Gestión de clientes**: 
   - Se consulta la lista de clientes existentes
   - Si es necesario, se crean nuevos clientes
4. **Generación de facturas**: Se generan las facturas en Xubio basadas en los datos de consumo
5. **Obtención de PDFs**: Se descargan los comprobantes generados en formato PDF

## 📝 Notas

- Este proyecto está en desarrollo activo
- La integración con Xubio utiliza la documentación disponible en [`API_Xubio.md`](./API_Xubio.md) (puede contener errores)
- La documentación oficial de Xubio está disponible en `https://xubio.com/API/documentation/index.html`
- Los datos de consumo deben estar estructurados correctamente en Google Sheets para su procesamiento

## 🔗 Referencias

- [Documentación API Xubio del proyecto](./API_Xubio.md) - ⚠️ Puede contener errores
- [Documentación oficial Xubio](https://xubio.com/API/documentation/index.html)

