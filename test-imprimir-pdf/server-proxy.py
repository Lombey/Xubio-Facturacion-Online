#!/usr/bin/env python3
"""
Servidor proxy simple para evitar problemas de CORS con la API de Xubio.
Este servidor actúa como intermediario entre el navegador y la API de Xubio.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import urllib.request
import urllib.parse
import urllib.error

# Intentar usar requests si está disponible (más robusto)
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    print("[PROXY] requests no disponible, usando urllib")

class CORSProxyHandler(BaseHTTPRequestHandler):
    XUBIO_BASE_URL = 'https://xubio.com/API/1.1'
    
    def do_OPTIONS(self):
        """Maneja preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
        self.end_headers()
    
    def do_GET(self):
        """Proxy para peticiones GET"""
        if self.path.startswith('/proxy'):
            # Extraer la ruta real de Xubio
            path = self.path[6:]  # Remover '/proxy'
            self.proxy_request('GET', path, None)
        else:
            # Servir archivos estáticos
            self.serve_static()
    
    def do_POST(self):
        """Proxy para peticiones POST"""
        if self.path.startswith('/proxy'):
            # Leer el body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            # Extraer la ruta real de Xubio
            path = self.path[6:]  # Remover '/proxy'
            self.proxy_request('POST', path, body)
        else:
            self.send_error(404)
    
    def proxy_request(self, method, path, body):
        """Hace la petición real a Xubio y devuelve la respuesta"""
        try:
            url = f"{self.XUBIO_BASE_URL}{path}"
            print(f"[PROXY] {method} {url}")
            
            # Preparar headers
            headers = {}
            headers['Accept'] = 'application/json'
            
            # Copiar headers del cliente (excepto los problemáticos)
            for header, value in self.headers.items():
                header_lower = header.lower()
                if header_lower not in ['host', 'connection', 'accept-encoding', 'content-length']:
                    headers[header] = value
            
            # Si hay body, establecer Content-Type
            if body:
                headers['Content-Type'] = 'application/x-www-form-urlencoded'
            
            print(f"[PROXY] Request creado, body length: {len(body) if body else 0}")
            print(f"[PROXY] Headers: {list(headers.keys())}")
            
            # Usar requests si está disponible (más robusto)
            if HAS_REQUESTS:
                try:
                    response = requests.request(
                        method=method,
                        url=url,
                        data=body,
                        headers=headers,
                        timeout=30,
                        allow_redirects=False
                    )
                    
                    status_code = response.status_code
                    response_data = response.content  # bytes
                    content_type = response.headers.get('Content-Type', 'application/json')
                    
                    print(f"[PROXY] Response (requests): {status_code} ({len(response_data)} bytes)")
                    if len(response_data) > 0:
                        preview = response_data[:200].decode('utf-8', errors='ignore')
                        print(f"[PROXY] Response preview: {preview}")
                    
                    # Enviar respuesta al cliente
                    self.send_response(status_code)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                    self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
                    self.send_header('Content-Type', content_type)
                    self.end_headers()
                    self.wfile.write(response_data)
                    return
                except Exception as e:
                    print(f"[PROXY] Error con requests, fallback a urllib: {e}")
            
            # Fallback a urllib
            req = urllib.request.Request(url, data=body, method=method)
            for header, value in headers.items():
                req.add_header(header, value)
            
            try:
                response = urllib.request.urlopen(req, timeout=30)
                
                # Obtener información de la respuesta
                status_code = response.getcode()
                content_type = response.headers.get('Content-Type', 'application/json')
                
                # Leer la respuesta
                response_data = response.read()
                response.close()
                
                print(f"[PROXY] Response (urllib): {status_code} ({len(response_data)} bytes)")
                if len(response_data) > 0:
                    try:
                        preview = response_data[:200].decode('utf-8', errors='ignore')
                        print(f"[PROXY] Response preview: {preview}")
                    except:
                        print(f"[PROXY] Response preview (raw): {response_data[:200]}")
                else:
                    print(f"[PROXY] WARNING: Respuesta vacía!")
                    print(f"[PROXY] Content-Type: {content_type}, Status: {status_code}")
                    
                # Enviar respuesta al cliente
                self.send_response(status_code)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
                self.send_header('Content-Type', content_type)
                self.end_headers()
                self.wfile.write(response_data)
                    
            except urllib.error.HTTPError as e:
                # Manejar errores HTTP
                error_body = e.read()
                error_status = e.code
                print(f"[PROXY] HTTP Error {error_status}: {len(error_body)} bytes")
                if len(error_body) > 0:
                    print(f"[PROXY] Error body: {error_body[:200]}")
                
                self.send_response(error_status)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(error_body)
                
        except urllib.error.URLError as e:
            # Manejar errores de URL (conexión, timeout, etc.)
            error_msg = f'Error de conexión: {str(e)}'
            print(f"[PROXY] URL Error: {error_msg}")
            error_response = json.dumps({'error': error_msg, 'type': 'connection_error'}).encode()
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(error_response)
            
        except Exception as e:
            # Manejar otros errores
            error_msg = f'Error interno: {str(e)}'
            print(f"[PROXY] Exception: {error_msg}")
            import traceback
            traceback.print_exc()
            error_response = json.dumps({'error': error_msg, 'type': 'server_error'}).encode()
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(error_response)
    
    def serve_static(self):
        """Sirve archivos estáticos"""
        import os
        path = self.path
        if path == '/':
            path = '/index.html'
        
        # Ruta del archivo
        file_path = os.path.join(os.path.dirname(__file__), path.lstrip('/'))
        
        if os.path.exists(file_path) and os.path.isfile(file_path):
            self.send_response(200)
            # Detectar tipo de contenido
            if file_path.endswith('.html'):
                self.send_header('Content-Type', 'text/html')
            elif file_path.endswith('.js'):
                self.send_header('Content-Type', 'application/javascript')
            elif file_path.endswith('.css'):
                self.send_header('Content-Type', 'text/css')
            else:
                self.send_header('Content-Type', 'application/octet-stream')
            self.end_headers()
            with open(file_path, 'rb') as f:
                self.wfile.write(f.read())
        else:
            self.send_error(404)
    
    def log_message(self, format, *args):
        """Override para logging más limpio"""
        print(f"[{self.address_string()}] {format % args}")

def run_server(port=8000):
    """Inicia el servidor proxy"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, CORSProxyHandler)
    print(f"🚀 Servidor proxy iniciado en http://localhost:{port}")
    print(f"📄 Abre: http://localhost:{port}/index.html")
    print(f"🔄 Proxy API: http://localhost:{port}/proxy")
    print("\nPresiona Ctrl+C para detener el servidor\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n⏹️  Servidor detenido")
        httpd.server_close()

if __name__ == '__main__':
    run_server(8000)

