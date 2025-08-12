from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class UnidadeMedida(str, Enum):
    UNIDADE = "unidade"
    KG = "kg"
    LITRO = "litro"
    METRO = "metro"
    CAIXA = "caixa"
    PACOTE = "pacote"

class TipoMovimentacao(str, Enum):
    ENTRADA = "entrada"
    SAIDA = "saida"

class MotivoMovimentacao(str, Enum):
    COMPRA = "compra"
    VENDA = "venda"
    PERDA = "perda"
    DEVOLUCAO = "devolucao"
    AJUSTE = "ajuste"
    INICIAL = "inicial"

# Models
class Produto(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    categoria: str
    unidade_medida: UnidadeMedida
    quantidade_atual: float = 0
    quantidade_minima: float = 0
    preco_compra: float = 0
    preco_venda: float = 0
    codigo_barras: Optional[str] = None
    ativo: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProdutoCreate(BaseModel):
    nome: str
    categoria: str
    unidade_medida: UnidadeMedida
    quantidade_atual: float = 0
    quantidade_minima: float = 0
    preco_compra: float = 0
    preco_venda: float = 0
    codigo_barras: Optional[str] = None

class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    categoria: Optional[str] = None
    unidade_medida: Optional[UnidadeMedida] = None
    quantidade_minima: Optional[float] = None
    preco_compra: Optional[float] = None
    preco_venda: Optional[float] = None
    codigo_barras: Optional[str] = None
    ativo: Optional[bool] = None

class MovimentacaoEstoque(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    produto_id: str
    tipo: TipoMovimentacao
    motivo: MotivoMovimentacao
    quantidade: float
    quantidade_anterior: float
    quantidade_nova: float
    preco_unitario: float = 0
    observacoes: Optional[str] = None
    usuario: Optional[str] = "Sistema"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MovimentacaoCreate(BaseModel):
    produto_id: str
    tipo: TipoMovimentacao
    motivo: MotivoMovimentacao
    quantidade: float
    preco_unitario: float = 0
    observacoes: Optional[str] = None
    usuario: Optional[str] = "Sistema"

# CRUD Produtos
@api_router.post("/produtos", response_model=Produto)
async def criar_produto(produto: ProdutoCreate):
    produto_dict = produto.dict()
    produto_obj = Produto(**produto_dict)
    
    # Verificar se já existe produto com mesmo nome
    existing = await db.produtos.find_one({"nome": produto_obj.nome, "ativo": True})
    if existing:
        raise HTTPException(status_code=400, detail="Produto com este nome já existe")
    
    await db.produtos.insert_one(produto_obj.dict())
    
    # Criar movimentação inicial se quantidade > 0
    if produto_obj.quantidade_atual > 0:
        movimentacao = MovimentacaoEstoque(
            produto_id=produto_obj.id,
            tipo=TipoMovimentacao.ENTRADA,
            motivo=MotivoMovimentacao.INICIAL,
            quantidade=produto_obj.quantidade_atual,
            quantidade_anterior=0,
            quantidade_nova=produto_obj.quantidade_atual,
            preco_unitario=produto_obj.preco_compra
        )
        await db.movimentacoes.insert_one(movimentacao.dict())
    
    return produto_obj

@api_router.get("/produtos", response_model=List[Produto])
async def listar_produtos(
    categoria: Optional[str] = None,
    busca: Optional[str] = None,
    apenas_ativos: bool = True
):
    filter_dict = {}
    if apenas_ativos:
        filter_dict["ativo"] = True
    if categoria:
        filter_dict["categoria"] = categoria
    
    produtos = await db.produtos.find(filter_dict).to_list(1000)
    
    # Filtro de busca por nome ou código de barras
    if busca:
        busca_lower = busca.lower()
        produtos = [
            p for p in produtos 
            if busca_lower in p.get("nome", "").lower() or 
               busca_lower in p.get("codigo_barras", "").lower()
        ]
    
    return [Produto(**produto) for produto in produtos]

@api_router.get("/produtos/{produto_id}", response_model=Produto)
async def obter_produto(produto_id: str):
    produto = await db.produtos.find_one({"id": produto_id})
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return Produto(**produto)

@api_router.put("/produtos/{produto_id}", response_model=Produto)
async def atualizar_produto(produto_id: str, produto_update: ProdutoUpdate):
    produto = await db.produtos.find_one({"id": produto_id})
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    update_dict = {k: v for k, v in produto_update.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.produtos.update_one({"id": produto_id}, {"$set": update_dict})
    
    produto_atualizado = await db.produtos.find_one({"id": produto_id})
    return Produto(**produto_atualizado)

@api_router.delete("/produtos/{produto_id}")
async def deletar_produto(produto_id: str):
    produto = await db.produtos.find_one({"id": produto_id})
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    await db.produtos.update_one({"id": produto_id}, {"$set": {"ativo": False}})
    return {"message": "Produto desativado com sucesso"}

# Movimentações de Estoque
@api_router.post("/movimentacoes", response_model=MovimentacaoEstoque)
async def criar_movimentacao(movimentacao: MovimentacaoCreate):
    produto = await db.produtos.find_one({"id": movimentacao.produto_id, "ativo": True})
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    quantidade_anterior = produto["quantidade_atual"]
    
    if movimentacao.tipo == TipoMovimentacao.ENTRADA:
        quantidade_nova = quantidade_anterior + movimentacao.quantidade
    else:  # SAIDA
        quantidade_nova = quantidade_anterior - movimentacao.quantidade
        if quantidade_nova < 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Estoque insuficiente. Disponível: {quantidade_anterior}"
            )
    
    # Criar movimentação
    movimentacao_obj = MovimentacaoEstoque(
        **movimentacao.dict(),
        quantidade_anterior=quantidade_anterior,
        quantidade_nova=quantidade_nova
    )
    
    await db.movimentacoes.insert_one(movimentacao_obj.dict())
    
    # Atualizar quantidade do produto
    await db.produtos.update_one(
        {"id": movimentacao.produto_id},
        {"$set": {"quantidade_atual": quantidade_nova, "updated_at": datetime.utcnow()}}
    )
    
    return movimentacao_obj

@api_router.get("/movimentacoes", response_model=List[MovimentacaoEstoque])
async def listar_movimentacoes(produto_id: Optional[str] = None, limit: int = 100):
    filter_dict = {}
    if produto_id:
        filter_dict["produto_id"] = produto_id
    
    movimentacoes = await db.movimentacoes.find(filter_dict).sort("created_at", -1).limit(limit).to_list(limit)
    return [MovimentacaoEstoque(**mov) for mov in movimentacoes]

# Relatórios e Dashboards
@api_router.get("/dashboard")
async def obter_dashboard():
    # Contadores básicos
    total_produtos = await db.produtos.count_documents({"ativo": True})
    produtos_sem_estoque = await db.produtos.count_documents({"quantidade_atual": 0, "ativo": True})
    
    # Produtos com estoque baixo
    produtos_estoque_baixo = await db.produtos.find({
        "quantidade_atual": {"$gt": 0, "$lte": "$quantidade_minima"}, 
        "ativo": True
    }).to_list(1000)
    
    # Produtos sem estoque
    produtos_zerados = await db.produtos.find({
        "quantidade_atual": 0, 
        "ativo": True
    }).to_list(1000)
    
    # Últimas movimentações
    ultimas_movimentacoes = await db.movimentacoes.find().sort("created_at", -1).limit(10).to_list(10)
    
    # Categorias
    pipeline = [
        {"$match": {"ativo": True}},
        {"$group": {"_id": "$categoria", "total": {"$sum": 1}, "quantidade_total": {"$sum": "$quantidade_atual"}}},
        {"$sort": {"total": -1}}
    ]
    categorias = await db.produtos.aggregate(pipeline).to_list(1000)
    
    return {
        "total_produtos": total_produtos,
        "produtos_sem_estoque": produtos_sem_estoque,
        "produtos_estoque_baixo": len(produtos_estoque_baixo),
        "produtos_zerados": [Produto(**p) for p in produtos_zerados],
        "estoque_baixo": [Produto(**p) for p in produtos_estoque_baixo],
        "ultimas_movimentacoes": [MovimentacaoEstoque(**m) for m in ultimas_movimentacoes],
        "categorias": categorias
    }

@api_router.get("/categorias")
async def listar_categorias():
    pipeline = [
        {"$match": {"ativo": True}},
        {"$group": {"_id": "$categoria"}},
        {"$sort": {"_id": 1}}
    ]
    categorias = await db.produtos.aggregate(pipeline).to_list(1000)
    return [cat["_id"] for cat in categorias]

# Health check
@api_router.get("/")
async def root():
    return {"message": "Sistema de Controle de Estoque - API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()