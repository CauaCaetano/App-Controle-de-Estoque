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
        for nome in ("produtos", "movimentacoes"):
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
