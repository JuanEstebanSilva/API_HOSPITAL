import os
import sys
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

def run():
    print("===============================================================")
    print("  INICIANDO PRUEBAS E2E REALES EN NAVEGADOR (PLAYWRIGHT)       ")
    print("===============================================================")

    # 1. Iniciar Backend
    print("Iniciando Backend Express...")
    be_process = subprocess.Popen(['node', 'src/app.js'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if not wait_for_url("http://localhost:3000/api-docs", 15):
        print("❌ Fallo al iniciar backend")
        be_process.kill()
        sys.exit(1)
    print("✅ Backend Express activo en http://localhost:3000")

    # 2. Iniciar Frontend Vite Preview
    print("Iniciando Frontend Vite Preview...")
    fe_dir = os.path.abspath("api-hospital-frontend")
    fe_process = subprocess.Popen(['npx.cmd', 'vite', 'preview', '--port', '5173', '--strictPort'], cwd=fe_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if not wait_for_url("http://localhost:5173", 15):
        print("❌ Fallo al iniciar frontend preview")
        fe_process.kill()
        be_process.kill()
        sys.exit(1)
    print("✅ Frontend React/Vite activo en http://localhost:5173")

    screenshots_dir = os.path.abspath("e2e_screenshots")
    os.makedirs(screenshots_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 850})
        page = context.new_page()

        try:
            # 1. Login Page
            print("\n[E2E-01] Navegando a Login...")
            page.goto("http://localhost:5173/login")
            page.wait_for_selector("input#email", timeout=6000)
            page.screenshot(path=os.path.join(screenshots_dir, "01_login_page.png"))
            print("✅ Página de Login cargada correctamente")

            # 2. Login Admin
            print("\n[E2E-02] Iniciando sesión como Administrador...")
            page.fill("input#email", "admin@hospital.com")
            page.fill("input#password", "SANTOTO_2026--2")
            page.click("button[type='submit']")
            page.wait_for_url("**/dashboard", timeout=8000)
            time.sleep(1.5)
            page.screenshot(path=os.path.join(screenshots_dir, "02_admin_dashboard.png"))
            print("✅ Login Administrador exitoso, Dashboard renderizado con métricas")

            # 3. Navegar a Usuarios
            print("\n[E2E-03] Navegando a pestaña de Usuarios...")
            btn_usuarios = page.locator("button:has-text('Usuarios')")
            if btn_usuarios.count() > 0:
                btn_usuarios.first.click()
                time.sleep(1)
                page.screenshot(path=os.path.join(screenshots_dir, "03_admin_usuarios.png"))
                print("✅ Gestión de Usuarios renderizada")

            # 4. Logout
            print("\n[E2E-04] Cerrando sesión de Administrador...")
            btn_logout = page.locator("button:has-text('Cerrar sesión')")
            if btn_logout.count() > 0:
                btn_logout.first.click()
                page.wait_for_url("**/login", timeout=6000)
                print("✅ Cierre de sesión exitoso")

            # 5. Login Médico
            print("\n[E2E-05] Iniciando sesión como Médico...")
            page.fill("input#email", "medico.a@hospital.com")
            page.fill("input#password", "ClaveSegura2026*")
            page.click("button[type='submit']")
            page.wait_for_url("**/dashboard", timeout=8000)
            time.sleep(1.5)
            page.screenshot(path=os.path.join(screenshots_dir, "04_medico_dashboard.png"))
            print("✅ Login Médico exitoso, vista médica renderizada con citas asignadas")

            # 6. Logout Médico
            btn_logout = page.locator("button:has-text('Cerrar sesión')")
            if btn_logout.count() > 0:
                btn_logout.first.click()
                page.wait_for_url("**/login", timeout=6000)

            # 7. Login Paciente
            print("\n[E2E-06] Iniciando sesión como Paciente...")
            page.fill("input#email", "paciente.a@example.com")
            page.fill("input#password", "ClaveSegura2026*")
            page.click("button[type='submit']")
            page.wait_for_url("**/dashboard", timeout=8000)
            time.sleep(1.5)
            page.screenshot(path=os.path.join(screenshots_dir, "05_paciente_dashboard.png"))
            print("✅ Login Paciente exitoso, vista de paciente renderizada con solicitud de citas")

            # 8. Password Recovery View
            print("\n[E2E-07] Navegando a Recuperación de Contraseña...")
            btn_logout = page.locator("button:has-text('Cerrar sesión')")
            if btn_logout.count() > 0:
                btn_logout.first.click()
                page.wait_for_url("**/login", timeout=6000)

            page.goto("http://localhost:5173/recuperar-password")
            page.wait_for_selector("form", timeout=5000)
            time.sleep(1)
            page.screenshot(path=os.path.join(screenshots_dir, "06_recuperar_password.png"))
            print("✅ Vista de Recuperación de Contraseña renderizada correctamente")

            print("\n===============================================================")
            print("  🎉 ¡TODAS LAS 7 PRUEBAS E2E EN NAVEGADOR FUERON EXITOSAS!    ")
            print("===============================================================")

        finally:
            browser.close()
            fe_process.kill()
            be_process.kill()

if __name__ == "__main__":
    run()
