"""Testes automáticos da API de estoque (banco em memória, sem MongoDB instalado).

Rodar na raiz do projeto:
    pip install -r backend/requirements.txt
    pytest -q
"""
import asyncio
import os
import sys
from pathlib import Path

import pytest

os.environ["MONGO_URL"] = "memory"
os.environ["DB_NAME"] = "estoque_teste"
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from fastapi.testclient import TestClient  # noqa: E402
import server  # noqa: E402


@pytest.fixture()
def api():
    # Banco limpo a cada teste
    async def limpar():
        for nome in ("produtos", "movimentacoes", "fornecedores", "clientes", "pedidos_compra", "pedidos_venda", "armazens", "estoque_armazem", "auditoria"):
            await server.db[nome].delete_many({})
    asyncio.run(limpar())
    with TestClient(server.app) as cliente:
        yield cliente


def criar(api, nome, minima, categoria="Cafeteria"):
    r = api.post("/api/produtos", json={
        "nome": nome, "categoria": categoria, "unidade_medida": "pacote",
        "quantidade_atual": 0, "quantidade_minima": minima, "preco_compra": 10, "preco_venda": 15,
    })
    assert r.status_code == 200, r.text
    return r.json()["id"]


def mover(api, produto_id, tipo, quantidade, motivo="compra"):
    return api.post("/api/movimentacoes", json={
        "produto_id": produto_id, "tipo": tipo, "quantidade": quantidade, "motivo": motivo,
    })


def test_entrada_e_saida_atualizam_o_saldo(api):
    pid = criar(api, "Café 1kg", minima=6)
    assert mover(api, pid, "entrada", 20).json()["quantidade_nova"] == 20
    assert mover(api, pid, "saida", 16, "venda").json()["quantidade_nova"] == 4
    assert api.get(f"/api/produtos/{pid}").json()["quantidade_atual"] == 4


def test_saida_maior_que_o_saldo_e_recusada(api):
    pid = criar(api, "Leite 1L", minima=12)
    mover(api, pid, "entrada", 3)
    r = mover(api, pid, "saida", 5, "venda")
    assert r.status_code == 400
    assert "insuficiente" in r.json()["detail"].lower()


@pytest.mark.parametrize("quantidade", [0, -1])
def test_movimentacao_exige_quantidade_positiva(api, quantidade):
    pid = criar(api, "Farinha 1kg", minima=2)
    resposta = mover(api, pid, "entrada", quantidade)
    assert resposta.status_code == 422


def test_dashboard_alerta_estoque_baixo_e_zerado(api):
    baixo = criar(api, "Café 1kg", minima=6)
    ok = criar(api, "Açúcar 1kg", minima=8, categoria="Mercearia")
    criar(api, "Copo 300ml", minima=10)  # nunca recebeu entrada: zerado
    mover(api, baixo, "entrada", 20)
    mover(api, baixo, "saida", 16, "venda")   # sobra 4, mínimo 6
    mover(api, ok, "entrada", 15)             # 15, mínimo 8

    d = api.get("/api/dashboard").json()
    assert d["total_produtos"] == 3
    assert d["produtos_sem_estoque"] == 1
    assert d["produtos_estoque_baixo"] == 1
    assert [p["nome"] for p in d["estoque_baixo"]] == ["Café 1kg"]
    assert [p["nome"] for p in d["produtos_zerados"]] == ["Copo 300ml"]


def test_desativar_tira_do_dashboard(api):
    pid = criar(api, "Pão de queijo", minima=5)
    assert api.delete(f"/api/produtos/{pid}").status_code == 200
    assert api.get("/api/dashboard").json()["total_produtos"] == 0


def test_transferencia_mantem_estoque_global_e_registra_saldos_por_armazem(api):
    pid = criar(api, "Café 1kg", minima=6)
    origem = api.post("/api/erp/armazens", json={"codigo": "CD01", "nome": "Principal"}).json()
    destino = api.post("/api/erp/armazens", json={"codigo": "CD02", "nome": "Loja"}).json()
    mover(api, pid, "entrada", 20)

    transferencia = api.post("/api/erp/transferencias", json={
        "produto_id": pid,
        "origem_id": origem["id"],
        "destino_id": destino["id"],
        "quantidade": 7,
    })

    assert transferencia.status_code == 200, transferencia.text
    assert transferencia.json()["estoque_global"] == 20
    assert api.get(f"/api/produtos/{pid}").json()["quantidade_atual"] == 20
    saldo_origem = api.get(f"/api/erp/armazens/{origem['id']}/estoque").json()
    saldo_destino = api.get(f"/api/erp/armazens/{destino['id']}/estoque").json()
    assert saldo_origem[0]["quantidade"] == 13
    assert saldo_destino[0]["quantidade"] == 7

    saida = api.post("/api/movimentacoes", json={
        "produto_id": pid,
        "tipo": "saida",
        "motivo": "venda",
        "quantidade": 3,
        "armazem_id": destino["id"],
    })
    assert saida.status_code == 200, saida.text
    assert api.get(f"/api/produtos/{pid}").json()["quantidade_atual"] == 17
    assert api.get(f"/api/erp/armazens/{destino['id']}/estoque").json()[0]["quantidade"] == 4

    historico = api.get("/api/movimentacoes", params={"produto_id": pid})
    assert historico.status_code == 200, historico.text
    transferencias = [m for m in historico.json() if m["motivo"] == "transferencia"]
    assert len(transferencias) == 2
    assert {m["tipo"] for m in transferencias} == {"entrada", "saida"}


def test_transferencia_nao_permite_saldo_negativo_no_armazem_origem(api):
    pid = criar(api, "Leite 1L", minima=3)
    origem = api.post("/api/erp/armazens", json={"codigo": "CD01", "nome": "Principal"}).json()
    destino = api.post("/api/erp/armazens", json={"codigo": "CD02", "nome": "Loja"}).json()
    mover(api, pid, "entrada", 4)

    resposta = api.post("/api/erp/transferencias", json={
        "produto_id": pid,
        "origem_id": origem["id"],
        "destino_id": destino["id"],
        "quantidade": 5,
    })

    assert resposta.status_code == 400
    assert api.get(f"/api/produtos/{pid}").json()["quantidade_atual"] == 4


def test_recebimento_registra_fornecedor_no_historico(api):
    pid = criar(api, "Café especial", minima=2)
    fornecedor = api.post("/api/erp/fornecedores", json={
        "razao_social": "Torrefação Central Ltda.",
        "nome_fantasia": "Torrefação Central",
    }).json()

    resposta = api.post("/api/movimentacoes", json={
        "produto_id": pid,
        "tipo": "entrada",
        "motivo": "compra",
        "quantidade": 12,
        "fornecedor_id": fornecedor["id"],
    })

    assert resposta.status_code == 200, resposta.text
    assert resposta.json()["fornecedor_id"] == fornecedor["id"]
    historico = api.get("/api/movimentacoes", params={"produto_id": pid}).json()
    assert historico[0]["fornecedor_id"] == fornecedor["id"]


def test_fornecedor_nao_pode_ser_vinculado_a_saida(api):
    pid = criar(api, "Açúcar", minima=1)
    fornecedor = api.post("/api/erp/fornecedores", json={"razao_social": "Distribuidora Teste"}).json()
    resposta = api.post("/api/movimentacoes", json={
        "produto_id": pid,
        "tipo": "saida",
        "motivo": "venda",
        "quantidade": 1,
        "fornecedor_id": fornecedor["id"],
    })
    assert resposta.status_code == 400


def test_buscas_toleram_campos_opcionais_vazios(api):
    criar(api, "Produto sem código", minima=0)
    fornecedor = api.post("/api/erp/fornecedores", json={"razao_social": "Distribuidora Central"})
    assert fornecedor.status_code == 200

    assert api.get("/api/produtos", params={"busca": "inexistente"}).json() == []
    resultado = api.get("/api/erp/fornecedores", params={"busca": "Distribuidora"})
    assert resultado.status_code == 200, resultado.text
    assert resultado.json()[0]["razao_social"] == "Distribuidora Central"


def test_pedido_compra_recebimento_parcial_atualiza_saldo_e_historico(api):
    pid = criar(api, "Café especial", minima=5)
    fornecedor = api.post("/api/erp/fornecedores", json={"razao_social": "Torrefação Central"}).json()
    armazem = api.get("/api/erp/armazens").json()[0]
    resposta = api.post("/api/erp/compras", json={
        "fornecedor_id": fornecedor["id"], "armazem_id": armazem["id"],
        "itens": [{"produto_id": pid, "quantidade": 10, "preco_unitario": 12.5}],
    })
    assert resposta.status_code == 200, resposta.text
    pedido = resposta.json()
    assert pedido["status"] == "aberto"
    assert pedido["total"] == 125

    parcial = api.post(f"/api/erp/compras/{pedido['id']}/receber", json={"itens": [{"item_id": pedido["itens"][0]["id"], "quantidade": 4}]})
    assert parcial.status_code == 200, parcial.text
    assert parcial.json()["status"] == "parcialmente_recebido"
    assert api.get(f"/api/produtos/{pid}").json()["quantidade_atual"] == 4

    recebido = api.post(f"/api/erp/compras/{pedido['id']}/receber")
    assert recebido.status_code == 200, recebido.text
    assert recebido.json()["status"] == "recebido"
    assert recebido.json()["itens"][0]["quantidade_recebida"] == 10
    assert api.get(f"/api/produtos/{pid}").json()["quantidade_atual"] == 10
    historico = api.get("/api/movimentacoes", params={"produto_id": pid}).json()
    assert len([mov for mov in historico if mov.get("pedido_id") == pedido["id"]]) == 2


def test_pedido_venda_expede_e_recusa_saldo_insuficiente(api):
    pid = criar(api, "Farinha especial", minima=4)
    cliente = api.post("/api/erp/clientes", json={"nome": "Mercado da Vila"}).json()
    armazem = api.get("/api/erp/armazens").json()[0]
    mover(api, pid, "entrada", 8)
    resposta = api.post("/api/erp/vendas", json={
        "cliente_id": cliente["id"], "armazem_id": armazem["id"],
        "itens": [{"produto_id": pid, "quantidade": 5, "preco_unitario": 18}],
    })
    assert resposta.status_code == 200, resposta.text
    pedido = resposta.json()
    assert pedido["status"] == "aberto"
    assert pedido["total"] == 90
    expedicao = api.post(f"/api/erp/vendas/{pedido['id']}/expedir")
    assert expedicao.status_code == 200, expedicao.text
    assert expedicao.json()["status"] == "expedido"
    assert api.get(f"/api/produtos/{pid}").json()["quantidade_atual"] == 3

    outro = api.post("/api/erp/vendas", json={
        "cliente_id": cliente["id"], "armazem_id": armazem["id"],
        "itens": [{"produto_id": pid, "quantidade": 4, "preco_unitario": 18}],
    }).json()
    recusado = api.post(f"/api/erp/vendas/{outro['id']}/expedir")
    assert recusado.status_code == 400
    assert api.get(f"/api/produtos/{pid}").json()["quantidade_atual"] == 3


def test_documento_de_cliente_nao_pode_ser_repetido(api):
    primeiro = api.post("/api/erp/clientes", json={"nome": "Cliente A", "documento": "12345678900"})
    segundo = api.post("/api/erp/clientes", json={"nome": "Cliente B", "documento": "12345678900"})
    assert primeiro.status_code == 200
    assert segundo.status_code == 400
