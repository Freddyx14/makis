/** Isolated campaign API contracts. Does not modify the teammate's Workspace types. */
export interface Claim {texto:string; origen:"web"|"usuario"|"hipotesis"; confianza:"alta"|"media"|"baja"; fuentes:string[]}
export interface Brief {negocio:Claim; publico_objetivo:Claim; propuesta_valor:Claim; tono:Claim; restricciones:string; huecos:string[];
  objetivo:{tipo:string; metrica_principal:string; enfoque:string; meta_numerica:null};
  presupuesto:{importe:string; moneda:string; duracion_semanas:number; reparto_sugerido:string}}
export interface CampaignInput {url:string; objetivo:string; detalle:string; presupuesto:string; moneda:string; duracion_semanas:number; publico:string; notas:string; mercado?:string}
export interface Campaign {id:string; status:string; input:CampaignInput; created_at:string}
export interface BriefVersion {version:number; contenido:Brief; source:string; created_at:string; aprobado_at:string|null}
export interface Run {id:string; stage:number; model:string; tokens:number|null; duration:number; status:string; input:Record<string, unknown>; output:unknown}
export interface CampaignDetail {campaign:Campaign; versions:BriefVersion[]; jobs:{id:string; status:string; message:string; progress:number}[]; runs:Run[]}
export interface StrategyContent {nombre:string; tesis:string; publico_objetivo:string; posicionamiento:string; mensaje_clave:string;
  canales:{canal:string; porcentaje:number; justificacion:string}[]; kpis:{metrica:string; meta:number; medicion:string}[]; riesgos:string[]; supuestos:string[]}
export interface Strategy {id:string; perfil:string; version:number; contenido:StrategyContent}
export interface Copy {titulo:string; cuerpo:string; cta:string; hashtags:string[]; justificacion:string}
export interface Piece {id:string; tipo:string; canal:string; estado:string; version:number; contenido:Copy; programada_para:string|null; historial:unknown[]; mode:string}
export interface Metric {canal:string; fecha:string; impresiones:number; clics:number; leads:number; clientes:number; inversion:number; ingresos:number; origen:string; estimado:boolean; cpl:number|null; cac:number|null; roas:number|null; ctr:number|null}
export interface Workflow {version:number; mode:string; research:null|{hallazgos:{eje:string; texto:string; fuente:string; confianza:string}[]; huecos:string[]};
  strategies:Strategy[]; selected:string|null; fusion_count:number; search_count:number; iteration:number;
  arbitration:null|{recomendacion:string; confianza:string; justificacion:string; critica_conservadora:string; critica_arriesgada:string; supuestos_sin_respaldo:string[]; sugerencia_fusion:string};
  debate:unknown[]; pieces:Piece[]; executions:{id:string; piece_id:string; canal:string; mode:string; estado:string; fecha:string; payload:unknown}[];
  metrics:Metric[]; report:null|{resumen:string; observaciones:string[]; hipotesis:string[]; siguiente_experimento:string; advertencias:string[]; origen_datos:string[]};
  learnings:{observacion:string; confianza:string; accion:string; basado_en_simulados:boolean}[];
  landing:null|{token:string; mode:string; published:boolean; contenido:{titular:string; subtitulo:string; cta:string; beneficios:string[]; preguntas:string[]}}}
