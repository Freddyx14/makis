"""Run against a dedicated local test server; uses an isolated browser session."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ARTIFACTS = Path(__file__).resolve().parents[1] / ".artifacts"
ARTIFACTS.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={"width": 1440, "height": 1080}, device_scale_factor=1)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(os.getenv("TEST_BASE_URL", "http://127.0.0.1:8011"))
    expect(page.locator("#provider-label")).to_contain_text("Modo demo")
    page.screenshot(path=str(ARTIFACTS / "desktop-initial.png"), full_page=True)
    page.get_by_role("button", name="Explorar con un ejemplo").click()
    expect(page.locator("#status-badge")).to_have_text("Por revisar", timeout=20000)
    expect(page.locator("#count-campaigns")).to_have_text("1")
    expect(page.locator("[data-path='negocio.texto']")).to_contain_text("Kintu")
    page.locator("[data-path='negocio.texto']").fill("Kintu Café: propuesta editada para el concurso.")
    page.get_by_role("button", name="Guardar nueva versión").click()
    expect(page.locator(".version-label")).to_have_text("VERSIÓN 2")
    page.reload()
    expect(page.locator("[data-path='negocio.texto']")).to_have_value("Kintu Café: propuesta editada para el concurso.")
    page.get_by_role("button", name="Historial", exact=False).click()
    page.get_by_role("button", name="Comparar cambios").first.click()
    expect(page.locator("#info-dialog")).to_be_visible()
    expect(page.locator("#dialog-body")).to_contain_text("Kintu Café: propuesta editada")
    page.get_by_role("button", name="Cerrar", exact=True).click()
    page.get_by_role("button", name="Brief maestro", exact=True).click()
    page.get_by_role("button", name="Aprobar brief").click()
    expect(page.locator("#status-badge")).to_have_text("Aprobado")
    page.screenshot(path=str(ARTIFACTS / "desktop-approved.png"), full_page=True)
    page.get_by_role("button", name="Trazabilidad", exact=True).click()
    expect(page.locator(".trace-card")).to_contain_text("demo-reglas-v1")
    page.get_by_role("button", name="Fuentes", exact=False).click()
    expect(page.locator("#tab-content")).to_contain_text("Negocio ficticio")
    # Another browser session cannot see the campaign.
    second = browser.new_context()
    other = second.new_page()
    other.goto(os.getenv("TEST_BASE_URL", "http://127.0.0.1:8011"))
    expect(other.locator("#count-campaigns")).to_have_text("0")
    second.close()
    # Verify a stored XSS-looking edit remains text, then inspect mobile layout.
    page.get_by_role("button", name="Brief maestro", exact=True).click()
    page.locator("[data-path='restricciones']").fill('<img src=x onerror="window.XSS=1">')
    page.get_by_role("button", name="Guardar nueva versión").click()
    expect(page.locator(".version-label")).to_have_text("VERSIÓN 3")
    assert page.evaluate("window.XSS === undefined")
    page.set_viewport_size({"width": 390, "height": 844})
    page.get_by_role("button", name="Nueva campaña", exact=False).first.click()
    page.screenshot(path=str(ARTIFACTS / "mobile-initial.png"), full_page=True)
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "Mobile horizontal overflow"
    page.get_by_role("button", name="Mis campañas", exact=True).click()
    expect(page.locator("#info-dialog .campaign-item")).to_have_count(1)
    assert not errors, errors
    browser.close()
    print("Browser checks passed: example, edit, persistence, history, approval, trace, session isolation, XSS escaping, mobile.")
