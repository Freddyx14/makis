"""Local, offline fixture presentation smoke check."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

with sync_playwright() as p:
    browser=p.chromium.launch()
    page=browser.new_page(viewport={"width":1440,"height":1000})
    page.goto("http://127.0.0.1:3000/nueva")
    expect(page.locator('input[type="url"]')).to_have_value("https://crispy-chicken-promo.example/")
    button=page.get_by_role("button",name="Abrir Laboratorio de campañas")
    expect(button).to_be_enabled()
    button.click()
    expect(page).to_have_url(__import__("re").compile(r"/laboratorio\?campaign="))
    expect(page.get_by_text("BK: Crispy Chicken Promo",exact=True)).to_be_visible()
    page.get_by_role("button",name="05 Analítica y optimización").click()
    expect(page.get_by_text("Informe y siguiente experimento",exact=True)).to_be_visible()
    page.screenshot(path=str(Path(".artifacts/kfc-report.png")),full_page=True)
    page.get_by_role("button",name="03 Contenido y creatividades").click()
    expect(page.get_by_text("El encuentro empieza en el chat",exact=True)).to_be_visible()
    expect(page.get_by_text("Mockups de creatividades · sin imágenes generadas",exact=True)).to_be_visible()
    page.set_viewport_size({"width":390,"height":844})
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    page.screenshot(path=str(Path(".artifacts/kfc-content-mobile.png")),full_page=True)
    browser.close()
print("KFC fixture browser check passed")
