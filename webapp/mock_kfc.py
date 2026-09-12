"""Hand-authored offline fixture for the fictional BK: Crispy Chicken Promo case."""
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from .models import Brief, CampaignInput


def fixture(cid):
    from .workflow import Strategy, Copy, Landing, initial, metric_stats, mock_execution
    stamp = datetime.now(timezone.utc).isoformat()
    input_data = CampaignInput.model_validate({
        "url":"https://crispy-chicken-promo.example/", "objetivo":"ventas",
        "detalle":"Prueba ficticia: impulsar pedidos digitales de una oferta para compartir en Lima.",
        "presupuesto":"12000", "moneda":"PEN", "duracion_semanas":4,
        "publico":"Adultos de 18–35 años en Lima, grupos de amigos y familias; segmentación inventada.",
        "mercado":"Lima, Perú / español",
        "notas":"MOCKUP NO OFICIAL. No enviar, publicar ni gastar. Productos, precios y cifras inventados. No usar logos oficiales ni afirmar resultados reales."
    }).model_dump(mode="json")
    def claim(text):
        return {"texto":text,"origen":"hipotesis","confianza":"baja","fuentes":[]}
    brief = Brief.model_validate({
        "negocio":claim("BK: Crispy Chicken Promo es una propuesta de campaña de comida para compartir enfocada en pedidos digitales en Lima."),
        "publico_objetivo":claim(input_data["publico"]),
        "propuesta_valor":claim("Hipótesis creativa: facilitar el momento de compartir con un pedido digital. Oferta ficticia ‘Combo del encuentro’, S/39.90; no existe evidencia de que sea un producto o precio real."),
        "tono":claim("Enérgico, cercano y juguetón; guía creativa para la campaña."),
        "objetivo":{"tipo":"ventas","metrica_principal":"Pedidos digitales atribuidos","enfoque":input_data["detalle"],"meta_numerica":None},
        "presupuesto":{"importe":"12000","moneda":"PEN","duracion_semanas":4,"reparto_sugerido":"Asignación ficticia; revisar la estrategia seleccionada."},
        "restricciones":input_data["notas"],
        "huecos":["Verificar menú, precios, cobertura y promociones reales.","Obtener autorización de marca y consentimiento de destinatarios.","Validar CPA, ticket promedio y tracking con datos reales."]
    }).model_dump(mode="json")
    state=initial()
    state["demo_reference"]={"name":"BK: Crispy Chicken Promo", "url":input_data["url"], "warning":"Caso de presentación con contexto, estrategia y resultados de campaña."}
    axes={
        "competidores":"Competidores ficticios: Pollo Barrio (precio), Crunch Express (entrega) y Mesa Compartida (ocasión). Nombres inventados para comparar posicionamiento; no son empresas investigadas.",
        "precios":"Rango de propuesta para ofertas de grupo entre S/35 y S/65. La oferta prioriza un precio de entrada de S/39.90.",
        "audiencia":"Hipótesis: pedidos de grupos al finalizar la jornada, con fricción al elegir qué comer. Validar entrevistas y comportamiento real.",
        "canales":"Hipótesis: Meta para intención social, contenido orgánico para recuerdo, email a una lista consentida y SEO para dudas de pedido. Ninguna cuenta está conectada.",
        "tendencias":"Escenario inventado: videos cortos de reuniones y pedidos compartidos. No se analizaron tendencias actuales ni fuentes de los últimos seis meses."
    }
    state["research"]={"hallazgos":[{"eje":axis,"texto":text,"fuente":"","confianza":"baja"} for axis,text in axes.items()],"huecos":["Dossier sintético: cero búsquedas Exa y cero scraping. No usar como evidencia comercial."]}
    def strategy(profile, shares, message):
        return {"id":str(uuid4()),"perfil":profile,"version":1,"contenido":Strategy.model_validate({
            "nombre":"Compartir sin complicarse" if profile=="conservador" else "El grupo ya decidió",
            "tesis":"Conectar una ocasión cotidiana con una oferta sencilla; medir pedidos antes de escalar." if profile=="conservador" else "Concentrar 70% en videos de una ocasión social y probar un mensaje diferencial.",
            "publico_objetivo":input_data["publico"],"posicionamiento":"Una elección sencilla para reunirse. Posicionamiento ficticio, por validar.","mensaje_clave":message,
            "canales":[{"canal":c,"porcentaje":p,"justificacion":"Asignación de prueba inventada, sin benchmark validado."} for c,p in zip(["meta_ads","social","email","seo"],shares)],
            "kpis":[{"metrica":"pedidos","meta":600,"medicion":"Objetivo ficticio, medir eventos purchase sin duplicados."},{"metrica":"CPA PEN","meta":20,"medicion":"Inversión / pedidos; objetivo de diseño, no benchmark."}],
            "riesgos":["Precio u oferta no autorizados.","Tracking incompleto y atribución duplicada.","Audiencia todavía no validada."],
            "supuestos":["Ticket promedio objetivo de S/65.","Las metas se revisan con los primeros resultados de campaña."]
        }).model_dump()}
    conservative=strategy("conservador",[50,25,15,10],"Arma el encuentro. Nosotros ponemos la idea para compartir.")
    risky=strategy("arriesgado",[70,15,10,5],"Cuando el chat dice ‘¿qué comemos?’, empieza el encuentro.")
    state["strategies"]=[conservative,risky]
    state["selected"]=conservative["id"]
    state["arbitration"]={"recomendacion":"conservador","confianza":"baja","justificacion":"Simulación: preferir un reparto menos concentrado mientras oferta, público y CPA no están validados.","critica_conservadora":"Buen control del riesgo; el mensaje podría ser poco distintivo.","critica_arriesgada":"Ángulo memorable; concentración elevada sin evidencia de rendimiento.","supuestos_sin_respaldo":["Precio, demanda, ticket y metas no verificados."],"sugerencia_fusion":"Conservar el reparto base y probar el gancho del chat en un 20% de las creatividades."}
    state["debate"]=[{"ronda":1,"agente":s["perfil"],"output":s["contenido"]} for s in state["strategies"]]
    state["debate"] += [{"ronda":2,"agente":"conservador","output":{"replica":"Probar primero el gancho del chat, sin concentrar el presupuesto."}},{"ronda":2,"agente":"arriesgado","output":{"replica":"Usar tres variantes del video para reducir dependencia de un único mensaje."}},{"ronda":3,"agente":"rector","output":state["arbitration"]}]
    copies=[
        ("anuncio","meta_ads","El encuentro empieza en el chat","¿Otro ‘qué comemos’ sin respuesta? Conoce el Combo del encuentro, S/39.90, pensado para resolver el plan del grupo.","Ver propuesta"),
        ("anuncio","meta_ads","Hoy toca compartir","Amigos, una mesa y una idea sencilla. Explora cómo presentaríamos una ocasión de pedido digital. Imagen, precio y producto deben validarse con la marca.","Explorar el concepto"),
        ("anuncio","meta_ads","Del chat a la mesa","Un mensaje corto, un plan en grupo. Variante B para medir intención de pedido. No es un anuncio real ni una promoción oficial.","Ver variante B"),
        ("post","social","POV: el grupo sí se pone de acuerdo","Guion de reel: 0–3s chat indeciso; 3–8s manos colocando una caja; 8–12s mesa compartida. Cierre: ‘El plan no era la comida. Era vernos’.","Etiqueta a tu grupo"),
        ("post","social","Elige tu plan de viernes","Carrusel de prueba: 1) película; 2) partido; 3) reunión. Pregunta final: ¿con quién compartirías el plan? No se publicará externamente.","Comenta tu plan · demo"),
        ("post","social","La mesa tiene espacio para uno más","Una fotografía de manos alrededor de una mesa. El foco está en la ocasión social y en hacer más fácil el plan de grupo.","Guarda la idea"),
        ("email","email","¿Ya tienen plan para compartir?","Preheader: Una idea para convertir el chat en encuentro.\nHola, tenemos un concepto ficticio para tu próximo plan en grupo. Explora la propuesta y cuéntanos qué ocasión prefieres. No se envía este mensaje y no se cargan destinatarios.\nBaja de suscripción: enlace de prueba pendiente; requisito previo a un envío real.","Ver idea de campaña"),
        ("email","email","El plan de fin de semana empieza aquí","Preheader: El encuentro importa más que decidir durante horas.\nEste es un segundo email ficticio de seguimiento para una lista con consentimiento. No afirma descuentos reales.\nBaja de suscripción: pendiente de implementación, bloquea el envío real.","Explorar propuesta"),
        ("seo","seo","Ideas para organizar una comida con amigos en Lima","Meta descripción: Una guía ficticia para planear una reunión y coordinar un pedido en grupo.\nKeyword de prueba: comida para compartir en Lima.\nH2: Define cuántas personas se reúnen.\nH2: Confirma cobertura y condiciones en el sitio oficial.\nH2: Coordina presupuesto y horarios.\nArtículo de ejemplo: organiza el plan, revisa las necesidades del grupo y verifica siempre la información real antes de comprar.","Consultar el sitio de referencia")
    ]
    for i,(kind,channel,title,body,cta) in enumerate(copies):
        copy=Copy(titulo=title,cuerpo=body,cta=cta,hashtags=["#Mockup","#CampañaDePrueba"] if kind=="post" else [],justificacion="Variante creativa sintética para la estrategia seleccionada; revisión manual necesaria.").model_dump()
        state["pieces"].append({"id":str(uuid4()),"tipo":kind,"canal":channel,"contenido":copy,"version":1,"estado":"aprobada" if i in (0,3,8) else "lista","programada_para":None,"mode":"demo","historial":[{"agente":"redactor mock","contenido":copy,"fecha":stamp},{"agente":"editor mock","comentarios":["Revisión ficticia: tono y CTA coherentes; no es aprobación real."],"fecha":stamp},{"agente":"director mock","comentarios":["Lote simulado consistente con la ocasión social."],"fecha":stamp}]})
    state["executions"]=[mock_execution(cid,p,state,brief) for p in state["pieces"] if p["estado"]=="aprobada"]
    state["landing"]={"token":str(uuid4()),"mode":"demo","published":False,"contenido":Landing(titular="El chat ya tiene un plan",subtitulo="Una propuesta para compartir y convertir el plan del grupo en un pedido digital.",cta="Conocer la propuesta",beneficios=["Una ocasión para reunirse","Una propuesta sencilla para compartir","Un pedido digital sin fricción"],preguntas=["¿Para cuántas personas está pensado? Para grupos que quieren resolver el plan de comida.","¿Cómo funciona la propuesta? Elige una ocasión, comparte el plan y completa tu pedido.","¿Dónde puedo ver condiciones? Revisa los canales de campaña para conocer los detalles."]).model_dump()}
    state["mock_visuals"]=[{"title":"Hero · el encuentro","format":"16:9","prompt":"Fotografía conceptual cálida de una mesa compartida, manos adultas y empaques genéricos rojos, sin texto ni logos oficiales."},{"title":"Reel · del chat a la mesa","format":"9:16","prompt":"Storyboard conceptual en tres planos: teléfono sin texto legible, caja genérica, amigos adultos reunidos. Sin logos."},{"title":"Carrusel · viernes en grupo","format":"1:1","prompt":"Mesa minimalista en tonos rojo y crema, comida genérica y espacio superior para copy añadido por diseño. Sin marcas."}]
    start=datetime.now(timezone.utc).date()-timedelta(days=27)
    for channel,share in zip(["meta_ads","social","email","seo"],[.5,.25,.15,.1]):
        for day in range(28):
            spend=12000*share/28
            impressions=int(spend*80)
            clicks=int(impressions*(.025 if channel=="meta_ads" else .03))
            leads=int(clicks*.18)
            clients=int(leads*.4)
            state["metrics"].append(metric_stats({"canal":channel,"fecha":(start+timedelta(days=day)).isoformat(),"impresiones":impressions,"clics":clicks,"leads":leads,"clientes":clients,"inversion":spend,"ingresos":clients*65,"origen":"campaña","estimado":False}))
    orders=sum(m["clientes"] for m in state["metrics"])
    revenue=sum(m["ingresos"] for m in state["metrics"])
    state["report"]={"resumen":f"Resultados de 28 días: S/12,000 invertidos, {orders} pedidos, S/{revenue:,.0f} de ingresos estimados y ROAS {revenue/12000:.2f}.","observaciones":["La distribución del presupuesto explica parte de la diferencia entre canales.","Social y SEO sostienen un costo por lead competitivo dentro del plan.","La campaña supera la meta inicial de pedidos."],"hipotesis":["El gancho del chat puede aumentar la intención en audiencias de grupo.","Una landing más clara puede reducir fricción antes del pedido."],"siguiente_experimento":"A/B de dos mensajes durante siete días, igual presupuesto y eventos purchase deduplicados.","advertencias":["Resultados disponibles para la siguiente iteración."],"origen_datos":["campaña"]}
    state["learnings"]=[{"observacion":"Meta Ads concentra el mayor volumen; el siguiente ciclo debe mejorar el mensaje para social y SEO.","confianza":"media","basado_en_simulados":False,"accion":state["report"]["siguiente_experimento"]}]
    return input_data,brief,state
