from datetime import datetime
from enum import Enum
from typing import List, Optional
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from server import db

erp_router = APIRouter(prefix="/api/erp", tags=["ERP"])

class Armazem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    codigo: str
    nome: str
    descricao: Optional[str] = None
    ativo: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ArmazemCreate(BaseModel):
    codigo: str
    nome: str
    descricao: Optional[str] = None

class Fornecedor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    razao_social: str
    nome_fantasia: Optional[str] = None
    documento: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    contato: Optional[str] = None
    observacoes: Optional[str] = None
    ativo: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FornecedorCreate(BaseModel):
    razao_social: str
    nome_fantasia: Optional[str] = None
    documento: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    contato: Optional[str] = None
    observacoes: Optional[str] = None

class TransferenciaCreate(BaseModel):
    produto_id: str
    origem_id: str
    destino_id: str
    quantidade: float = Field(gt=0)
    observacoes: Optional[str] = None
    usuario: str = "Sistema"

@erp_router.get("/resumo")
async def resumo_erp():
    produtos = await db.produtos.find({"ativo": True}).to_list(5000)
    valor_custo = sum(p.get("quantidade_atual", 0) * p.get("preco_compra", 0) for p in produtos)
    valor_venda = sum(p.get("quantidade_atual", 0) * p.get("preco_venda", 0) for p in produtos)
    baixo = [p for p in produtos if 0 < p.get("quantidade_atual", 0) <= p.get("quantidade_minima", 0)]
    zerados = [p for p in produtos if p.get("quantidade_atual", 0) <= 0]
    return {
        "indicadores": {
            "produtos": len(produtos),
            "itens_em_estoque": sum(p.get("quantidade_atual", 0) for p in produtos),
            "valor_estoque_custo": round(valor_custo, 2),
            "valor_estoque_venda": round(valor_venda, 2),
            "margem_potencial": round(valor_venda - valor_custo, 2),
            "estoque_baixo": len(baixo),
            "estoque_zerado": len(zerados),
            "fornecedores": await db.fornecedores.count_documents({"ativo": True}),
            "armazens": await db.armazens.count_documents({"ativo": True}),
        },
        "alertas": {"zerados": zerados[:10], "baixo": baixo[:10]}
    }

@erp_router.get("/armazens", response_model=List[Armazem])
async def listar_armazens():
    if await db.armazens.count_documents({}) == 0:
        await db.armazens.insert_one(Armazem(codigo="CD01", nome="Depósito Principal").dict())
    docs = await db.armazens.find({"ativo": True}).sort("nome", 1).to_list(500)
    return [Armazem(**d) for d in docs]

@erp_router.post("/armazens", response_model=Armazem)
async def criar_armazem(payload: ArmazemCreate):
    if await db.armazens.find_one({"codigo": payload.codigo}):
        raise HTTPException(status_code=400, detail="Código de armazém já cadastrado")
    obj = Armazem(**payload.dict())
    await db.armazens.insert_one(obj.dict())
    return obj

@erp_router.get("/fornecedores", response_model=List[Fornecedor])
async def listar_fornecedores(busca: Optional[str] = None):
    docs = await db.fornecedores.find({"ativo": True}).sort("razao_social", 1).to_list(2000)
    if busca:
        termo = busca.lower()
        docs = [d for d in docs if termo in d.get("razao_social", "").lower() or termo in d.get("nome_fantasia", "").lower() or termo in d.get("documento", "").lower()]
    return [Fornecedor(**d) for d in docs]

@erp_router.post("/fornecedores", response_model=Fornecedor)
async def criar_fornecedor(payload: FornecedorCreate):
    if payload.documento and await db.fornecedores.find_one({"documento": payload.documento, "ativo": True}):
        raise HTTPException(status_code=400, detail="Documento do fornecedor já cadastrado")
    obj = Fornecedor(**payload.dict())
    await db.fornecedores.insert_one(obj.dict())
    return obj

@erp_router.post("/transferencias")
async def transferir_estoque(payload: TransferenciaCreate):
    if payload.origem_id == payload.destino_id:
        raise HTTPException(status_code=400, detail="Origem e destino devem ser diferentes")
    origem = await db.armazens.find_one({"id": payload.origem_id, "ativo": True})
    destino = await db.armazens.find_one({"id": payload.destino_id, "ativo": True})
    produto = await db.produtos.find_one({"id": payload.produto_id, "ativo": True})
    if not origem or not destino:
        raise HTTPException(status_code=404, detail="Armazém de origem ou destino não encontrado")
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    atual = produto.get("quantidade_atual", 0)
    if atual < payload.quantidade:
        raise HTTPException(status_code=400, detail=f"Estoque insuficiente. Disponível: {atual}")
    agora = datetime.utcnow()
    transferencia_id = str(uuid.uuid4())
    await db.produtos.update_one({"id": produto["id"]}, {"$set": {"quantidade_atual": atual - payload.quantidade, "updated_at": agora}})
    await db.movimentacoes.insert_one({
        "id": str(uuid.uuid4()), "produto_id": produto["id"], "tipo": "saida", "motivo": "transferencia",
        "quantidade": payload.quantidade, "quantidade_anterior": atual, "quantidade_nova": atual - payload.quantidade,
        "preco_unitario": produto.get("preco_compra", 0), "observacoes": payload.observacoes,
        "usuario": payload.usuario, "armazem_origem_id": payload.origem_id,
        "armazem_destino_id": payload.destino_id, "transferencia_id": transferencia_id, "created_at": agora
    })
    await db.auditoria.insert_one({
        "id": str(uuid.uuid4()), "acao": "transferencia", "entidade": "estoque",
        "entidade_id": produto["id"], "usuario": payload.usuario,
        "descricao": f"Transferência de {payload.quantidade} de {origem['nome']} para {destino['nome']}",
        "created_at": agora
    })
    return {"message": "Transferência registrada", "transferencia_id": transferencia_id, "estoque_restante": atual - payload.quantidade}

@erp_router.get("/analise/abc")
async def curva_abc():
    produtos = await db.produtos.find({"ativo": True}).to_list(5000)
    linhas = sorted([{"produto_id": p["id"], "nome": p["nome"], "valor": round(p.get("quantidade_atual", 0) * p.get("preco_compra", 0), 2)} for p in produtos], key=lambda x: x["valor"], reverse=True)
    total = sum(x["valor"] for x in linhas)
    acumulado = 0
    for item in linhas:
        acumulado += item["valor"]
        percentual = acumulado / total * 100 if total else 0
        item["percentual_acumulado"] = round(percentual, 2)
        item["classe"] = "A" if percentual <= 80 else ("B" if percentual <= 95 else "C")
    return {"total": round(total, 2), "itens": linhas}

@erp_router.get("/auditoria")
async def listar_auditoria(limit: int = 100):
    n = min(max(limit, 1), 500)
    return await db.auditoria.find().sort("created_at", -1).limit(n).to_list(n)
