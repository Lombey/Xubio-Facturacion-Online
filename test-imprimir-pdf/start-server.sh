#!/bin/bash
echo "Iniciando servidor local en http://localhost:8000"
echo ""
echo "Abre tu navegador en: http://localhost:8000/index.html"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo ""
python3 -m http.server 8000

