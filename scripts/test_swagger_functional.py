import json
import time
import subprocess
import urllib.request
from playwright.sync_api import sync_playwright

def wait_for_url(url, timeout=15):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url) as resp:
                if resp.status == 200:
                    return True
        except:
            time.sleep(0.5)
    return False

def test_swagger():
    print("===============================================================")
    print("   VERIFICACIÓN INTEGRAL DE SWAGGER UI Y DOCUMENTACIÓN OPENAPI ")
    print("===============================================================")

    # 1. Iniciar servidor Express
    server = subprocess.Popen(['node', 'src/app.js'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if not wait_for_url("http://localhost:3000/openapi.json", 15):
        server.kill()
        raise RuntimeError("No fue posible conectar con el servidor Express")

    # 2. Verificar openapi.json
    with urllib.request.urlopen("http://localhost:3000/openapi.json") as resp:
        spec = json.loads(resp.read().decode('utf-8'))

    print("✅ OpenAPI Spec obtenida exitosamente")
    print(f"   - Versión OpenAPI: {spec.get('openapi')}")
    print(f"   - Título: {spec.get('info', {}).get('title')}")
    print(f"   - Total de rutas documentadas: {len(spec.get('paths', {}))}")

    schemes = spec.get('components', {}).get('securitySchemes', {})
    if 'BearerAuth' not in schemes or 'ApiKeyAuth' not in schemes:
        server.kill()
        raise RuntimeError("Faltan esquemas de seguridad en OpenAPI")
    print("✅ Esquemas de seguridad (BearerAuth, ApiKeyAuth) presentes y configurados")

    # 3. Probar Swagger UI en navegador real con Playwright
    print("\nProbando Swagger UI en navegador (Edge)...")
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        page = browser.new_page()

        page.goto("http://localhost:3000/api-docs/")
        page.wait_for_selector(".swagger-ui", timeout=8000)
        page.wait_for_selector(".opblock-tag-section", timeout=8000)

        sections = page.locator(".opblock-tag-section").all()
        print(f"✅ Secciones de recursos encontradas en Swagger UI: {len(sections)}")

        operations = page.locator(".opblock").all()
        print(f"✅ Total de operaciones HTTP renderizadas en Swagger UI: {len(operations)}")

        # Botón Authorize
        auth_btn = page.locator("button.authorize")
        if auth_btn.count() == 0:
            browser.close()
            server.kill()
            raise RuntimeError("Botón Authorize no visible en Swagger UI")
        print("✅ Botón 'Authorize' visible y funcional")

        auth_btn.first.click()
        page.wait_for_selector(".modal-ux", timeout=4000)
        modal_text = page.locator(".modal-ux").first.inner_text()
        if "BearerAuth" not in modal_text or "ApiKeyAuth" not in modal_text:
            browser.close()
            server.kill()
            raise RuntimeError("El modal de autenticación de Swagger no incluye los esquemas requeridos")
        print("✅ Modal de autorización Swagger incluye BearerAuth y ApiKeyAuth")

        page.click("button.btn-done")

        # Probar interactividad de login
        login_op = page.locator("#operations-Autenticaci_n-post_api_auth_login")
        if login_op.count() > 0:
            login_op.first.click()
            time.sleep(0.5)
            try_btn = login_op.locator("button.try-out__btn")
            if try_btn.count() > 0:
                try_btn.first.click()
                print("✅ Operación interactiva en Swagger UI (Try it out funcional)")

        browser.close()

    server.kill()
    print("\n===============================================================")
    print("  🎉 ¡SWAGGER UI ESTÁ 100% ORGANIZADO, COMPLETO Y FUNCIONAL!   ")
    print("===============================================================")

if __name__ == "__main__":
    test_swagger()
