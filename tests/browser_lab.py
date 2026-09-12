"""Next.js demo browser check; run with Next and FastAPI locally active."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ARTIFACTS=Path(__file__).resolve().parents[1]/".artifacts"
with sync_playwright() as p:
    browser=p.chromium.launch()
    context=browser.new_context(viewport={"width":1440,"height":1000})
    page=context.new_page()
    errors=[]
    page.on("pageerror",lambda e: errors.append(str(e)))
    page.goto("http://127.0.0.1:3000/laboratorio")
    expect(page.get_by_text("Modo demo · sin LLM",exact=True)).to_be_visible()
    page.screenshot(path=str(ARTIFACTS/"next-lab-desktop.png"),full_page=True)
    page.get_by_role("button",name="Explorar con un ejemplo").click()
    expect(page.get_by_role("button",name="Aprobar y continuar")).to_be_visible(timeout=20000)
    page.reload()
    expect(page.get_by_role("button",name="Aprobar y continuar")).to_be_visible(timeout=20000)
    page.get_by_role("button",name="Aprobar y continuar").click()
    page.get_by_role("button",name="Investigar el negocio").click()
    expect(page.get_by_role("button",name="Generar propuestas y debate")).to_be_enabled(timeout=20000)
    page.get_by_role("button",name="Generar propuestas y debate").click()
    expect(page.get_by_role("button",name="Seleccionar estrategia").first).to_be_visible(timeout=20000)
    page.get_by_role("button",name="Seleccionar estrategia").first.click()
    expect(page.get_by_role("button",name="Continuar a contenido")).to_be_visible()
    page.get_by_role("button",name="Continuar a contenido").click()
    page.get_by_role("button",name="Generar lote",exact=False).click()
    expect(page.get_by_text("Contenido simulado",exact=True).first).to_be_visible(timeout=20000)
    page.get_by_role("button",name="04 Aprobación y ejecución").click()
    page.get_by_role("button",name="Aprobar pieza",exact=True).first.click()
    expect(page.get_by_role("button",name="Ejecutar mock ahora").first).to_be_enabled()
    page.get_by_role("button",name="Ejecutar mock ahora").first.click()
    expect(page.get_by_text("Ejecuciones registradas",exact=True)).to_be_visible()
    page.get_by_role("button",name="05 Analítica y optimización").click()
    page.get_by_role("button",name="Simular métricas",exact=True).click()
    expect(page.get_by_role("button",name="Generar informe",exact=True)).to_be_enabled()
    page.get_by_role("button",name="Generar informe",exact=True).click()
    expect(page.get_by_text("Informe y siguiente experimento",exact=True)).to_be_visible(timeout=20000)
    page.screenshot(path=str(ARTIFACTS/"next-lab-report.png"),full_page=True)
    page.set_viewport_size({"width":390,"height":844})
    page.screenshot(path=str(ARTIFACTS/"next-lab-mobile.png"),full_page=True)
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "Mobile horizontal overflow"
    assert not errors,errors
    context.close()
    browser.close()
print("Next.js browser workflow passed")
