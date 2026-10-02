# StockMaster: controle de estoque

Sistema web para pequenos comércios controlarem estoque sem planilha: cadastro de produtos, entradas e saídas com motivo, bloqueio de saída maior que o saldo e um painel que avisa o que está acabando.

![Painel do StockMaster](docs/dashboard.png)

## O que ele faz

- **Painel**: total de produtos, itens zerados, itens abaixo do mínimo e as últimas movimentações (com o nome do produto).
- **Produtos**: cadastro com categoria, unidade (unidade, kg, litro, metro, caixa, pacote), preços de compra e venda, código de barras e quantidade mínima. Busca por nome ou código e filtro por categoria.
- **Movimentações**: entrada (compra, devolução, ajuste) e saída (venda, perda). O saldo é atualizado na hora e uma saída maior que o estoque é recusada.
- **Exclusão segura**: o produto é desativado, não apagado, então o histórico continua consistente.

![Lista de produtos](docs/produtos.png)

## Tecnologias

| Camada | Uso |
|---|---|
| Backend | Python, FastAPI, Pydantic, Motor (MongoDB assíncrono) |
| Frontend | React, Tailwind CSS, componentes shadcn/ui, Axios |
| Banco | MongoDB, ou banco em memória para demonstração (`MONGO_URL=memory`) |
| Testes | pytest + TestClient (unitários) e `backend_test.py` (19 verificações de ponta a ponta) |

## Como rodar

**Backend** (porta 8001):

```bash
python -m venv .venv
.venv/Scripts/activate        # Windows  |  source .venv/bin/activate no Linux/Mac
pip install -r backend/requirements.txt
cd backend
# Com MongoDB instalado: MONGO_URL=mongodb://localhost:27017
# Sem MongoDB (dados somem ao reiniciar):
MONGO_URL=memory uvicorn server:app --port 8001
```

**Frontend** (porta 3000):

```bash
cd frontend
yarn install
REACT_APP_BACKEND_URL=http://127.0.0.1:8001 yarn start
```

## Testes

```bash
pytest -q                      # testes automáticos da API (sem precisar de MongoDB)
python backend_test.py         # roteiro de ponta a ponta contra o backend rodando
```

## Histórico de correções

- O alerta de **estoque baixo nunca disparava**: o filtro comparava a quantidade com o texto `"$quantidade_minima"` em vez do campo. Corrigido com `$expr` e coberto por teste.
- Removidos o rastreador de analytics de terceiros e o selo da ferramenta que gerou o projeto.
- Painel passou a mostrar o nome do produto em cada movimentação; preços em formato brasileiro (R$ 59,90).
- Banco em memória para rodar e testar sem instalar o MongoDB; dependências reduzidas ao que o código usa.

Projeto da [BLUE ROSE](https://cauacaetano.github.io/blue-rose-automacao-express/).
