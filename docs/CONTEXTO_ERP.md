# Contexto do produto: ERP para pequena distribuidora

## Para quem é

O Nexo Gestão organiza a rotina de uma distribuidora pequena que compra produtos de fornecedores, guarda mercadoria em um ou mais depósitos e atende pedidos de clientes. A pessoa que opera o sistema precisa saber o que foi comprado, onde está guardado, o que está comprometido para cada pedido e o que já saiu.

## A história que a interface deve contar

O ponto de partida é o ciclo de mercadoria:

**fornecedor → pedido de compra → recebimento no depósito → estoque disponível → pedido do cliente → expedição**

Transferências explicam a movimentação entre depósitos; cadastro de produto define unidade e níveis de reposição; o painel mostra exceções que pedem ação, como estoque baixo, zerado ou atividade recente. Isso põe cada tela em uma rotina de trabalho, em vez de apresentar módulos isolados.

## Regras centrais

- Criar pedido não altera estoque. Receber compra adiciona o que chegou.
- Venda só reduz estoque quando expedida, com validação do depósito escolhido.
- Transferência reduz o saldo de origem e aumenta o destino, preservando o total global.
- Movimentações mantêm o vínculo com produto e, quando aplicável, pedido, contraparte e depósito.
- Desativar cadastros preserva os registros históricos.

## Escopo atual e sequência sugerida

O protótipo cobre cadastros básicos, compras e recebimento integral, vendas e expedição, saldos por depósito, transferências, alertas e visão ABC. O próximo passo de operação seria quantidades parciais por recebimento e expedição, reserva de estoque, cancelamentos e trilha de auditoria mais completa. Em seguida, financeiro de contas a pagar e receber pode nascer das compras e vendas. Fiscal, autenticação, permissões e implantação multiempresa precisam de requisitos próprios antes de serem tratados como recursos prontos para uso real.

## Critério de coerência

Uma pessoa deve conseguir responder, navegando pelos módulos: “de quem veio este produto?”, “em qual depósito está?”, “a qual pedido pertence esta entrada ou saída?” e “o que falta para concluir o fluxo?”. Se os dados não conectarem essas respostas, a tela ou o modelo precisa de revisão.
