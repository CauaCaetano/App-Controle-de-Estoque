from datetime import datetime
from enum import Enum
from typing import List, Optional
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from server import (
    MotivoMovimentacao,
    MovimentacaoCreate,
    TipoMovimentacao,
    criar_movimentacao,
    db,
    obter_armazem_padrao,
)

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

class Cliente(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    documento: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    ativo: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClienteCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=160)
    documento: Optional[str] = Field(default=None, max_length=32)
    email: Optional[str] = Field(default=None, max_length=160)
    telefone: Optional[str] = Field(default=None, max_length=32)

class ItemPedidoCreate(BaseModel):
    produto_id: str
    quantidade: float = Field(gt=0)
    preco_unitario: float = Field(ge=0)

class ItemRecebimento(BaseModel):
    item_id: str
    quantidade: float = Field(gt=0)

class RecebimentoPedido(BaseModel):
    itens: List[ItemRecebimento] = Field(min_length=1)

class PedidoCompraCreate(BaseModel):
    fornecedor_id: str
    armazem_id: Optional[str] = None
    observacoes: Optional[str] = Field(default=None, max_length=500)
    itens: List[ItemPedidoCreate] = Field(min_length=1)

class PedidoVendaCreate(BaseModel):
    cliente_id: str
    armazem_id: Optional[str] = None
    observacoes: Optional[str] = Field(default=None, max_length=500)
    itens: List[ItemPedidoCreate] = Field(min_length=1)

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
        # Motor acrescenta um _id BSON aos documentos. Não o exponha na API:
        # ObjectId não é serializável e quebra o painel assim que há alertas.
        "alertas": {
            "zerados": [{k: v for k, v in p.items() if k != "_id"} for p in zerados[:10]],
            "baixo": [{k: v for k, v in p.items() if k != "_id"} for p in baixo[:10]],
        }
    }

@erp_router.get("/armazens", response_model=List[Armazem])
async def listar_armazens():
    if not await db.armazens.find_one({"codigo": "CD01", "ativo": True}):
        await obter_armazem_padrao()
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
        campos_busca = ("razao_social", "nome_fantasia", "documento")
        docs = [d for d in docs if any(termo in (d.get(campo) or "").lower() for campo in campos_busca)]
    return [Fornecedor(**d) for d in docs]

@erp_router.get("/armazens/{armazem_id}/estoque")
async def listar_estoque_armazem(armazem_id: str):
    armazem = await db.armazens.find_one({"id": armazem_id, "ativo": True})
    if not armazem:
        raise HTTPException(status_code=404, detail="Armazém não encontrado")

    saldos = await db.estoque_armazem.find({"armazem_id": armazem_id}).to_list(5000)
    resultado = []
    for saldo in saldos:
        produto = await db.produtos.find_one({"id": saldo["produto_id"], "ativo": True})
        if produto:
            resultado.append({
                "produto_id": produto["id"],
                "nome": produto["nome"],
                "unidade_medida": produto["unidade_medida"],
                "quantidade": saldo["quantidade"],
                "estoque_global": produto.get("quantidade_atual", 0),
            })
    return sorted(resultado, key=lambda item: item["nome"].lower())

@erp_router.post("/fornecedores", response_model=Fornecedor)
async def criar_fornecedor(payload: FornecedorCreate):
    if payload.documento and await db.fornecedores.find_one({"documento": payload.documento, "ativo": True}):
        raise HTTPException(status_code=400, detail="Documento do fornecedor já cadastrado")
    obj = Fornecedor(**payload.dict())
    await db.fornecedores.insert_one(obj.dict())
    return obj

@erp_router.get("/clientes", response_model=List[Cliente])
async def listar_clientes(busca: Optional[str] = None):
    docs = await db.clientes.find({"ativo": True}).sort("nome", 1).to_list(2000)
    if busca:
        termo = busca.lower()
        docs = [d for d in docs if any(termo in (d.get(campo) or "").lower() for campo in ("nome", "documento", "email"))]
    return [Cliente(**d) for d in docs]

@erp_router.post("/clientes", response_model=Cliente)
async def criar_cliente(payload: ClienteCreate):
    if payload.documento and await db.clientes.find_one({"documento": payload.documento, "ativo": True}):
        raise HTTPException(status_code=400, detail="Documento do cliente já cadastrado")
    cliente = Cliente(**payload.dict())
    await db.clientes.insert_one(cliente.dict())
    return cliente

async def _localizar_armazem(armazem_id: Optional[str]):
    armazem = await (
        db.armazens.find_one({"id": armazem_id, "ativo": True})
        if armazem_id
        else obter_armazem_padrao()
    )
    if not armazem:
        raise HTTPException(status_code=404, detail="Armazém não encontrado")
    return armazem

async def _itens_pedido(itens: List[ItemPedidoCreate]):
    resultado = []
    for item in itens:
        produto = await db.produtos.find_one({"id": item.produto_id, "ativo": True})
        if not produto:
            raise HTTPException(status_code=404, detail=f"Produto não encontrado: {item.produto_id}")
        resultado.append({
            "id": str(uuid.uuid4()),
            "produto_id": produto["id"],
            "produto_nome": produto["nome"],
            "unidade_medida": produto["unidade_medida"],
            "quantidade": item.quantidade,
            "preco_unitario": item.preco_unitario,
            "total": round(item.quantidade * item.preco_unitario, 2),
        })
    return resultado

def _codigo_pedido(prefixo: str):
    return f"{prefixo}-{datetime.utcnow():%y%m%d}-{uuid.uuid4().hex[:5].upper()}"

def _documento_publico(documento: dict):
    return {chave: valor for chave, valor in documento.items() if chave != "_id"}

@erp_router.get("/compras")
async def listar_pedidos_compra(status: Optional[str] = None):
    filtro = {"status": status} if status else {}
    documentos = await db.pedidos_compra.find(filtro).sort("created_at", -1).to_list(1000)
    return [_documento_publico(documento) for documento in documentos]

@erp_router.post("/compras")
async def criar_pedido_compra(payload: PedidoCompraCreate):
    fornecedor = await db.fornecedores.find_one({"id": payload.fornecedor_id, "ativo": True})
    if not fornecedor:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    armazem = await _localizar_armazem(payload.armazem_id)
    itens = await _itens_pedido(payload.itens)
    agora = datetime.utcnow()
    pedido = {
        "id": str(uuid.uuid4()), "codigo": _codigo_pedido("PC"), "tipo": "compra",
        "fornecedor_id": fornecedor["id"],
        "fornecedor_nome": fornecedor.get("nome_fantasia") or fornecedor["razao_social"],
        "armazem_id": armazem["id"], "armazem_nome": armazem["nome"],
        "itens": itens, "total": round(sum(item["total"] for item in itens), 2),
        "status": "aberto", "observacoes": payload.observacoes,
        "created_at": agora, "updated_at": agora,
    }
    await db.pedidos_compra.insert_one(pedido)
    await db.auditoria.insert_one({"id": str(uuid.uuid4()), "acao": "pedido_criado", "entidade": "compra", "entidade_id": pedido["id"], "usuario": "Sistema", "descricao": f"Pedido {pedido['codigo']} criado", "created_at": agora})
    return _documento_publico(pedido)

@erp_router.post("/compras/{pedido_id}/receber")
async def receber_pedido_compra(pedido_id: str, payload: Optional[RecebimentoPedido] = None):
    pedido = await db.pedidos_compra.find_one({"id": pedido_id})
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido de compra não encontrado")
    if pedido["status"] == "recebido":
        raise HTTPException(status_code=400, detail="Este pedido já foi recebido por completo")

    recebimentos = (
        [{"item_id": item["id"], "quantidade": round(item["quantidade"] - item.get("quantidade_recebida", 0), 6)} for item in pedido["itens"] if item["quantidade"] > item.get("quantidade_recebida", 0)]
        if payload is None
        else [item.dict() for item in payload.itens]
    )
    linhas_por_id = {item["id"]: item for item in pedido["itens"]}
    vistos = set()
    for recebimento in recebimentos:
        item = linhas_por_id.get(recebimento["item_id"])
        if not item or recebimento["item_id"] in vistos:
            raise HTTPException(status_code=400, detail="Linha de recebimento inválida ou repetida")
        vistos.add(recebimento["item_id"])
        restante = item["quantidade"] - item.get("quantidade_recebida", 0)
        if recebimento["quantidade"] > restante + 1e-9:
            raise HTTPException(status_code=400, detail=f"Quantidade recebida excede o restante de {item['produto_nome']}")
        if not await db.produtos.find_one({"id": item["produto_id"], "ativo": True}):
            raise HTTPException(status_code=400, detail=f"O produto {item['produto_nome']} está inativo e não pode ser recebido")

    if not recebimentos:
        raise HTTPException(status_code=400, detail="Não há itens pendentes para receber")
    armazem = await _localizar_armazem(pedido["armazem_id"])
    for recebimento in recebimentos:
        item = linhas_por_id[recebimento["item_id"]]
        await criar_movimentacao(MovimentacaoCreate(
            produto_id=item["produto_id"], tipo=TipoMovimentacao.ENTRADA,
            motivo=MotivoMovimentacao.COMPRA, quantidade=recebimento["quantidade"],
            preco_unitario=item["preco_unitario"], observacoes=f"Recebimento {pedido['codigo']}",
            armazem_id=armazem["id"], fornecedor_id=pedido["fornecedor_id"], pedido_id=pedido["id"],
        ))
        item["quantidade_recebida"] = round(item.get("quantidade_recebida", 0) + recebimento["quantidade"], 6)

    completo = all(item.get("quantidade_recebida", 0) >= item["quantidade"] - 1e-9 for item in pedido["itens"])
    pedido["status"] = "recebido" if completo else "parcialmente_recebido"
    pedido["updated_at"] = datetime.utcnow()
    await db.pedidos_compra.update_one({"id": pedido_id}, {"$set": {"itens": pedido["itens"], "status": pedido["status"], "updated_at": pedido["updated_at"]}})
    await db.auditoria.insert_one({"id": str(uuid.uuid4()), "acao": "pedido_recebido", "entidade": "compra", "entidade_id": pedido["id"], "usuario": "Sistema", "descricao": f"Recebimento registrado para {pedido['codigo']}", "created_at": pedido["updated_at"]})
    return _documento_publico(await db.pedidos_compra.find_one({"id": pedido_id}))

@erp_router.get("/vendas")
async def listar_pedidos_venda(status: Optional[str] = None):
    filtro = {"status": status} if status else {}
    documentos = await db.pedidos_venda.find(filtro).sort("created_at", -1).to_list(1000)
    return [_documento_publico(documento) for documento in documentos]

@erp_router.post("/vendas")
async def criar_pedido_venda(payload: PedidoVendaCreate):
    cliente = await db.clientes.find_one({"id": payload.cliente_id, "ativo": True})
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    armazem = await _localizar_armazem(payload.armazem_id)
    itens = await _itens_pedido(payload.itens)
    agora = datetime.utcnow()
    pedido = {
        "id": str(uuid.uuid4()), "codigo": _codigo_pedido("PV"), "tipo": "venda",
        "cliente_id": cliente["id"], "cliente_nome": cliente["nome"],
        "armazem_id": armazem["id"], "armazem_nome": armazem["nome"],
        "itens": itens, "total": round(sum(item["total"] for item in itens), 2),
        "status": "aberto", "observacoes": payload.observacoes,
        "created_at": agora, "updated_at": agora,
    }
    await db.pedidos_venda.insert_one(pedido)
    await db.auditoria.insert_one({"id": str(uuid.uuid4()), "acao": "pedido_criado", "entidade": "venda", "entidade_id": pedido["id"], "usuario": "Sistema", "descricao": f"Pedido {pedido['codigo']} criado", "created_at": agora})
    return _documento_publico(pedido)

@erp_router.post("/vendas/{pedido_id}/expedir")
async def expedir_pedido_venda(pedido_id: str):
    pedido = await db.pedidos_venda.find_one({"id": pedido_id})
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido de venda não encontrado")
    if pedido["status"] != "aberto":
        raise HTTPException(status_code=400, detail="Somente pedidos abertos podem ser expedidos")
    armazem = await _localizar_armazem(pedido["armazem_id"])
    quantidades_por_produto = {}
    for item in pedido["itens"]:
        quantidades_por_produto[item["produto_id"]] = quantidades_por_produto.get(item["produto_id"], 0) + item["quantidade"]
    for produto_id, quantidade in quantidades_por_produto.items():
        produto = await db.produtos.find_one({"id": produto_id, "ativo": True})
        if not produto:
            raise HTTPException(status_code=400, detail=f"Um dos produtos do pedido está inativo")
        saldos = await db.estoque_armazem.count_documents({"produto_id": produto_id})
        id_saldo = f"{produto_id}:{armazem['id']}"
        if saldos == 0:
            await db.estoque_armazem.insert_one({"id": id_saldo, "produto_id": produto_id, "armazem_id": armazem["id"], "quantidade": produto.get("quantidade_atual", 0), "updated_at": datetime.utcnow()})
        saldo = await db.estoque_armazem.find_one({"id": id_saldo})
        disponivel_local = saldo.get("quantidade", 0) if saldo else 0
        if disponivel_local < quantidade or produto.get("quantidade_atual", 0) < quantidade:
            raise HTTPException(status_code=400, detail=f"Estoque insuficiente para expedir. Disponível no armazém: {disponivel_local}")

    for item in pedido["itens"]:
        await criar_movimentacao(MovimentacaoCreate(
            produto_id=item["produto_id"], tipo=TipoMovimentacao.SAIDA,
            motivo=MotivoMovimentacao.VENDA, quantidade=item["quantidade"],
            preco_unitario=item["preco_unitario"], observacoes=f"Expedição {pedido['codigo']}",
            armazem_id=armazem["id"], pedido_id=pedido["id"], cliente_id=pedido["cliente_id"],
        ))
    agora = datetime.utcnow()
    await db.pedidos_venda.update_one({"id": pedido_id, "status": "aberto"}, {"$set": {"status": "expedido", "updated_at": agora, "expedido_at": agora}})
    await db.auditoria.insert_one({"id": str(uuid.uuid4()), "acao": "pedido_expedição", "entidade": "venda", "entidade_id": pedido["id"], "usuario": "Sistema", "descricao": f"Pedido {pedido['codigo']} expedido", "created_at": agora})
    return _documento_publico(await db.pedidos_venda.find_one({"id": pedido_id}))

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
    # Produtos existentes ainda podem ter apenas o saldo legado global. Na
    # primeira transferência, aloque esse saldo ao armazém de origem informado.
    saldos_existentes = await db.estoque_armazem.count_documents({"produto_id": produto["id"]})
    if saldos_existentes == 0:
        await db.estoque_armazem.insert_one({
            "id": f"{produto['id']}:{origem['id']}",
            "produto_id": produto["id"],
            "armazem_id": origem["id"],
            "quantidade": produto.get("quantidade_atual", 0),
            "updated_at": datetime.utcnow(),
        })

    id_saldo_origem = f"{produto['id']}:{origem['id']}"
    saldo_origem = await db.estoque_armazem.find_one({"id": id_saldo_origem})
    disponivel = saldo_origem.get("quantidade", 0) if saldo_origem else 0
    if disponivel < payload.quantidade:
        raise HTTPException(status_code=400, detail=f"Estoque insuficiente no armazém de origem. Disponível: {disponivel}")

    agora = datetime.utcnow()
    debito = await db.estoque_armazem.update_one(
        {"id": id_saldo_origem, "quantidade": {"$gte": payload.quantidade}},
        {"$inc": {"quantidade": -payload.quantidade}, "$set": {"updated_at": agora}},
    )
    if not debito.matched_count:
        raise HTTPException(status_code=400, detail="Estoque insuficiente no armazém de origem")

    id_saldo_destino = f"{produto['id']}:{destino['id']}"
    await db.estoque_armazem.update_one(
        {"id": id_saldo_destino},
        {
            "$setOnInsert": {
                "id": id_saldo_destino,
                "produto_id": produto["id"],
                "armazem_id": destino["id"],
            },
            "$inc": {"quantidade": payload.quantidade},
            "$set": {"updated_at": agora},
        },
        upsert=True,
    )

    transferencia_id = str(uuid.uuid4())
    saldo_destino = await db.estoque_armazem.find_one({"id": id_saldo_destino})
    movimentos = [
        {
            "tipo": "saida",
            "armazem_id": origem["id"],
            "quantidade_anterior": disponivel,
            "quantidade_nova": disponivel - payload.quantidade,
        },
        {
            "tipo": "entrada",
            "armazem_id": destino["id"],
            "quantidade_anterior": saldo_destino["quantidade"] - payload.quantidade,
            "quantidade_nova": saldo_destino["quantidade"],
        },
    ]
    for movimento in movimentos:
        await db.movimentacoes.insert_one({
            "id": str(uuid.uuid4()), "produto_id": produto["id"], "tipo": movimento["tipo"],
            "motivo": "transferencia", "quantidade": payload.quantidade,
            "quantidade_anterior": movimento["quantidade_anterior"],
            "quantidade_nova": movimento["quantidade_nova"],
            "preco_unitario": produto.get("preco_compra", 0), "observacoes": payload.observacoes,
            "usuario": payload.usuario, "armazem_id": movimento["armazem_id"],
            "armazem_origem_id": payload.origem_id, "armazem_destino_id": payload.destino_id,
            "transferencia_id": transferencia_id, "created_at": agora,
        })
    await db.auditoria.insert_one({
        "id": str(uuid.uuid4()), "acao": "transferencia", "entidade": "estoque",
        "entidade_id": produto["id"], "usuario": payload.usuario,
        "descricao": f"Transferência de {payload.quantidade} de {origem['nome']} para {destino['nome']}",
        "created_at": agora
    })
    return {
        "message": "Transferência registrada",
        "transferencia_id": transferencia_id,
        "estoque_restante_origem": disponivel - payload.quantidade,
        "estoque_destino": movimentos[1]["quantidade_nova"],
        "estoque_global": produto.get("quantidade_atual", 0),
    }

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
