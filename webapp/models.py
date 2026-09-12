from decimal import Decimal
from typing import Literal
from urllib.parse import urlsplit

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class CampaignInput(StrictModel):
    url: HttpUrl
    objetivo: Literal["leads", "ventas", "awareness", "trafico"]
    detalle: str = Field(default="", max_length=2000)
    presupuesto: Decimal = Field(gt=0, le=100000000, max_digits=12, decimal_places=2)
    moneda: Literal["PEN", "USD", "EUR"] = "PEN"
    duracion_semanas: int = Field(ge=1, le=104)
    publico: str = Field(default="", max_length=2000)
    notas: str = Field(default="", max_length=3000)

    @field_validator("url")
    @classmethod
    def public_shape(cls, value):
        parsed = urlsplit(str(value))
        if parsed.username or parsed.password or parsed.port not in (None, 80, 443):
            raise ValueError("Usa una URL pública HTTP(S), sin credenciales ni puertos especiales.")
        return value


class Claim(StrictModel):
    texto: str = Field(min_length=1, max_length=6000)
    origen: Literal["web", "usuario", "hipotesis"]
    confianza: Literal["alta", "media", "baja"]
    fuentes: list[str] = Field(default_factory=list, max_length=100)


class Objective(StrictModel):
    tipo: Literal["leads", "ventas", "awareness", "trafico"]
    metrica_principal: str = Field(min_length=1, max_length=500)
    enfoque: str = Field(min_length=1, max_length=3000)
    meta_numerica: None = None


class Budget(StrictModel):
    importe: Decimal = Field(gt=0, le=100000000, max_digits=12, decimal_places=2)
    moneda: Literal["PEN", "USD", "EUR"]
    duracion_semanas: int = Field(ge=1, le=104)
    reparto_sugerido: str = Field(min_length=1, max_length=2000)


class Brief(StrictModel):
    negocio: Claim
    publico_objetivo: Claim
    propuesta_valor: Claim
    objetivo: Objective
    presupuesto: Budget
    tono: Claim
    restricciones: str = Field(max_length=3000)
    huecos: list[str] = Field(min_length=1, max_length=30)


class GenerateInput(StrictModel):
    expected_version: int = Field(default=0, ge=0)
    instrucciones: str = Field(default="", max_length=3000)
    descripcion_manual: str = Field(default="", max_length=12000)
    ejemplo: bool = False


class EditInput(StrictModel):
    expected_version: int = Field(ge=1)
    contenido: Brief


class ApproveInput(StrictModel):
    expected_version: int = Field(ge=1)


class LoginInput(StrictModel):
    password: str = Field(max_length=500)
