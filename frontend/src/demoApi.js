// =============================================================
// Modo demonstração (REACT_APP_DEMO=1)
// -------------------------------------------------------------
// A mesma interface, com a API rodando dentro do navegador e as
// MESMAS regras do backend em FastAPI (backend/server.py):
//  - nome de produto ativo não se repete
//  - cadastro com quantidade inicial gera movimentação "inicial"
//  - saída maior que o saldo é recusada
//  - estoque baixo = 0 < atual <= mínimo; zerado = atual 0
//  - excluir = desativar (o histórico continua)
// Os dados ficam só no navegador de quem testa (localStorage).
// =============================================================

const CHAVE = 'nexo-erp-demo-v2';
const agora = () => new Date().toISOString();
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

function exemplo() {
  const t0 = Date.now() - 6 * 864e5;
  const produtos = [];
  const movimentacoes = [];
  const quando = (dias) => new Date(t0 + dias * 864e5).toISOString();
  const armazens = [
    { id: uuid(), codigo: 'CD01', nome: 'Depósito Principal', ativo: true, created_at: quando(0) },
    { id: uuid(), codigo: 'CD02', nome: 'Depósito Secundário', ativo: true, created_at: quando(0) },
  ];
  const criar = (nome, categoria, unidade, minima, compra, venda, movs) => {
    const p = {
      id: uuid(), nome, categoria, unidade_medida: unidade, quantidade_atual: 0, quantidade_minima: minima,
      preco_compra: compra, preco_venda: venda, codigo_barras: null, ativo: true, created_at: quando(0), updated_at: quando(0),
    };
    movs.forEach(([tipo, qtd, motivo, dia]) => {
      const anterior = p.quantidade_atual;
      p.quantidade_atual = tipo === 'entrada' ? anterior + qtd : anterior - qtd;
      movimentacoes.push({
        id: uuid(), produto_id: p.id, tipo, motivo, quantidade: qtd, quantidade_anterior: anterior,
        quantidade_nova: p.quantidade_atual, preco_unitario: 0, observacoes: null, usuario: 'Sistema', created_at: quando(dia),
      });
    });
    produtos.push(p);
  };
  criar('Arroz integral 5kg', 'Mercearia', 'unidade', 10, 22.5, 31.9, [['entrada', 60, 'compra', 0], ['saida', 10, 'venda', 5]]);
  criar('Café torrado 500g', 'Mercearia', 'pacote', 12, 17.8, 25.9, [['entrada', 30, 'compra', 0], ['saida', 6, 'venda', 4]]);
  criar('Detergente neutro 500ml', 'Limpeza', 'unidade', 10, 2.1, 3.49, [['entrada', 24, 'compra', 1], ['saida', 15, 'venda', 5]]);
  criar('Papel toalha 2 rolos', 'Limpeza', 'pacote', 8, 5.4, 8.9, [['entrada', 20, 'compra', 1], ['saida', 4, 'venda', 3]]);
  criar('Feijão carioca 1kg', 'Mercearia', 'pacote', 10, 6.2, 8.9, [['entrada', 40, 'compra', 2], ['saida', 10, 'venda', 5]]);
  criar('Óleo de soja 900ml', 'Mercearia', 'unidade', 10, 5.3, 7.49, [['entrada', 40, 'compra', 2], ['saida', 4, 'venda', 5]]);
  const produto = (nome) => produtos.find((p) => p.nome === nome);
  const fornecedores = [
    { id: uuid(), razao_social: 'Distribuidora Vale do Grão Ltda.', nome_fantasia: 'Vale do Grão', documento: 'DEMO-FORN-001', email: 'vendas@valedograo.demo', telefone: '(11) 3333-1001', contato: 'Marina Souza', ativo: true, created_at: quando(0), updated_at: quando(0) },
    { id: uuid(), razao_social: 'Higiene & Cia Atacado Ltda.', nome_fantasia: 'Higiene & Cia', documento: 'DEMO-FORN-002', email: 'comercial@higiene.demo', telefone: '(11) 3333-1002', contato: 'Rafael Lima', ativo: true, created_at: quando(0), updated_at: quando(0) },
  ];
  const clientes = [
    { id: uuid(), nome: 'Mercadinho São Bento', documento: 'DEMO-CLI-001', email: 'compras@saobento.demo', telefone: '(11) 4444-2001', ativo: true, created_at: quando(0) },
    { id: uuid(), nome: 'Café da Praça', documento: 'DEMO-CLI-002', email: 'contato@cafedapraca.demo', telefone: '(11) 4444-2002', ativo: true, created_at: quando(0) },
    { id: uuid(), nome: 'Empório Central', documento: 'DEMO-CLI-003', email: 'estoque@emporiocentral.demo', telefone: '(11) 4444-2003', ativo: true, created_at: quando(0) },
  ];
  const linhas = (nomes) => nomes.map(([nome, quantidade, preco]) => {
    const p = produto(nome);
    return { id: uuid(), produto_id: p.id, produto_nome: p.nome, unidade_medida: p.unidade_medida, quantidade, preco_unitario: preco, total: Number((quantidade * preco).toFixed(2)), quantidade_recebida: quantidade };
  });
  const pedidoCompra = (codigo, fornecedor, itens, dia) => ({ id: uuid(), codigo, tipo: 'compra', fornecedor_id: fornecedor.id, fornecedor_nome: fornecedor.nome_fantasia, armazem_id: armazens[0].id, armazem_nome: armazens[0].nome, itens, total: Number(itens.reduce((s, i) => s + i.total, 0).toFixed(2)), status: 'recebido', observacoes: 'Carga inicial de demonstração', created_at: quando(dia), updated_at: quando(dia) });
  const pedidoVenda = (codigo, cliente, warehouse, nomes, status, dia) => {
    const itens = nomes.map(([nome, quantidade, preco]) => { const p = produto(nome); return { id: uuid(), produto_id: p.id, produto_nome: p.nome, unidade_medida: p.unidade_medida, quantidade, preco_unitario: preco, total: Number((quantidade * preco).toFixed(2)) }; });
    return { id: uuid(), codigo, tipo: 'venda', cliente_id: cliente.id, cliente_nome: cliente.nome, armazem_id: warehouse.id, armazem_nome: warehouse.nome, itens, total: Number(itens.reduce((s, i) => s + i.total, 0).toFixed(2)), status, observacoes: 'Pedido de demonstração', created_at: quando(dia), updated_at: quando(dia), ...(status === 'expedido' ? { expedido_at: quando(dia) } : {}) };
  };
  const pedidos_compra = [
    pedidoCompra('PC-260930-001', fornecedores[0], linhas([['Arroz integral 5kg', 60, 22.5], ['Café torrado 500g', 30, 17.8], ['Feijão carioca 1kg', 40, 6.2], ['Óleo de soja 900ml', 40, 5.3]]), 0),
    pedidoCompra('PC-260930-002', fornecedores[1], linhas([['Detergente neutro 500ml', 24, 2.1], ['Papel toalha 2 rolos', 20, 5.4]]), 1),
  ];
  // O arroz está dividido entre os dois depósitos: 42 no principal e 8 no secundário.
  const arroz = produto('Arroz integral 5kg');
  movimentacoes.push(
    { id: uuid(), produto_id: arroz.id, tipo: 'saida', motivo: 'transferencia', quantidade: 8, quantidade_anterior: arroz.quantidade_atual, quantidade_nova: arroz.quantidade_atual, armazem_id: armazens[0].id, armazem_origem_id: armazens[0].id, armazem_destino_id: armazens[1].id, created_at: quando(5) },
    { id: uuid(), produto_id: arroz.id, tipo: 'entrada', motivo: 'transferencia', quantidade: 8, quantidade_anterior: arroz.quantidade_atual, quantidade_nova: arroz.quantidade_atual, armazem_id: armazens[1].id, armazem_origem_id: armazens[0].id, armazem_destino_id: armazens[1].id, created_at: quando(5) },
  );
  const pedidos_venda = [
    pedidoVenda('PV-261001-001', clientes[0], armazens[0], [['Café torrado 500g', 6, 25.9], ['Detergente neutro 500ml', 15, 3.49], ['Papel toalha 2 rolos', 4, 8.9], ['Feijão carioca 1kg', 10, 8.9], ['Óleo de soja 900ml', 4, 7.49]], 'expedido', 5),
    pedidoVenda('PV-261002-002', clientes[1], armazens[0], [['Arroz integral 5kg', 6, 31.9], ['Papel toalha 2 rolos', 3, 8.9]], 'aberto', 6),
  ];
  return {
    produtos, movimentacoes, armazens,
    estoque_armazem: produtos.flatMap((p) => p.id === arroz.id
      ? [{ id: `${p.id}:${armazens[0].id}`, produto_id: p.id, armazem_id: armazens[0].id, quantidade: 42 }, { id: `${p.id}:${armazens[1].id}`, produto_id: p.id, armazem_id: armazens[1].id, quantidade: 8 }]
      : [{ id: `${p.id}:${armazens[0].id}`, produto_id: p.id, armazem_id: armazens[0].id, quantidade: p.quantidade_atual }]),
    fornecedores, clientes, pedidos_compra, pedidos_venda,
    auditoria: [
      { id: uuid(), acao: 'pedido_recebido', entidade: 'compra', descricao: 'Recebimento de compras iniciais', created_at: quando(1) },
      { id: uuid(), acao: 'pedido_expedição', entidade: 'venda', descricao: 'Expedição de pedido de demonstração', created_at: quando(5) },
    ],
  };
}

let banco = null;
function carregar() {
  if (banco) return banco;
  try { banco = JSON.parse(localStorage.getItem(CHAVE)); } catch (e) { banco = null; }
  if (!banco || !Array.isArray(banco.produtos)) banco = exemplo();
  banco.armazens ||= [{ id: uuid(), codigo: 'CD01', nome: 'Depósito Principal', ativo: true, created_at: agora() }];
  banco.fornecedores ||= [];
  banco.clientes ||= [];
  banco.pedidos_compra ||= [];
  banco.pedidos_venda ||= [];
  banco.auditoria ||= [];
  banco.estoque_armazem ||= banco.produtos.filter((p) => p.ativo).map((produto) => ({ id: `${produto.id}:${banco.armazens[0].id}`, produto_id: produto.id, armazem_id: banco.armazens[0].id, quantidade: produto.quantidade_atual }));
  return banco;
}
function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(banco)); } catch (e) { /* modo privado: segue só em memória */ }
}
export function resetarDemo() {
  banco = exemplo();
  salvar();
}

class ErroApi extends Error {
  constructor(status, detail) { super(detail); this.status = status; this.detail = detail; }
}
const porData = (a, b) => (a.created_at < b.created_at ? 1 : -1);

function obterArmazemPadrao(b) {
  if (!b.armazens.length) b.armazens.push({ id: uuid(), codigo: 'CD01', nome: 'Depósito Principal', ativo: true, created_at: agora() });
  return b.armazens.find((a) => a.ativo) || b.armazens[0];
}
function saldoArmazem(b, produtoId, armazemId) {
  let saldo = b.estoque_armazem.find((x) => x.produto_id === produtoId && x.armazem_id === armazemId);
  if (!saldo) {
    const temAlgum = b.estoque_armazem.some((x) => x.produto_id === produtoId);
    const produto = b.produtos.find((x) => x.id === produtoId);
    saldo = { id: `${produtoId}:${armazemId}`, produto_id: produtoId, armazem_id: armazemId, quantidade: temAlgum ? 0 : (produto?.quantidade_atual || 0) };
    b.estoque_armazem.push(saldo);
  }
  return saldo;
}
function registrarMovimento(b, produto, tipo, motivo, quantidade, armazemId, extras = {}) {
  const saldo = saldoArmazem(b, produto.id, armazemId);
  const anteriorGlobal = produto.quantidade_atual;
  const anteriorLocal = saldo.quantidade;
  const sinal = tipo === 'entrada' ? 1 : -1;
  if (sinal < 0 && (anteriorGlobal < quantidade || anteriorLocal < quantidade)) throw new ErroApi(400, `Estoque insuficiente. Disponível no armazém: ${anteriorLocal}`);
  saldo.quantidade += sinal * quantidade;
  produto.quantidade_atual += sinal * quantidade;
  produto.updated_at = agora();
  const mov = { id: uuid(), produto_id: produto.id, tipo, motivo, quantidade, quantidade_anterior: anteriorGlobal, quantidade_nova: produto.quantidade_atual, quantidade_anterior_armazem: anteriorLocal, quantidade_nova_armazem: saldo.quantidade, armazem_id: armazemId, preco_unitario: 0, observacoes: null, usuario: 'Sistema', created_at: agora(), ...extras };
  b.movimentacoes.push(mov);
  return mov;
}
function nomeFornecedor(f) { return f.nome_fantasia || f.razao_social; }

function rotear(metodo, caminho, params, corpo) {
  const b = carregar();
  const ativos = b.produtos.filter((p) => p.ativo);
  let m;

  if (metodo === 'get' && caminho === '/produtos') {
    let lista = ativos;
    if (params.categoria) lista = lista.filter((p) => p.categoria === params.categoria);
    if (params.busca) {
      const q = String(params.busca).toLowerCase();
      lista = lista.filter((p) => p.nome.toLowerCase().includes(q) || (p.codigo_barras || '').toLowerCase().includes(q));
    }
    return lista;
  }
  if (metodo === 'post' && caminho === '/produtos') {
    if (ativos.some((p) => p.nome === corpo.nome)) throw new ErroApi(400, 'Produto com este nome já existe');
    const p = {
      id: uuid(), nome: corpo.nome, categoria: corpo.categoria, unidade_medida: corpo.unidade_medida,
      quantidade_atual: Number(corpo.quantidade_atual) || 0, quantidade_minima: Number(corpo.quantidade_minima) || 0,
      preco_compra: Number(corpo.preco_compra) || 0, preco_venda: Number(corpo.preco_venda) || 0,
      codigo_barras: corpo.codigo_barras || null, ativo: true, created_at: agora(), updated_at: agora(),
    };
    b.produtos.push(p);
    const armazem = obterArmazemPadrao(b);
    b.estoque_armazem.push({ id: `${p.id}:${armazem.id}`, produto_id: p.id, armazem_id: armazem.id, quantidade: p.quantidade_atual });
    if (p.quantidade_atual > 0) {
      b.movimentacoes.push({
        id: uuid(), produto_id: p.id, tipo: 'entrada', motivo: 'inicial', quantidade: p.quantidade_atual,
        quantidade_anterior: 0, quantidade_nova: p.quantidade_atual, preco_unitario: p.preco_compra,
        observacoes: null, usuario: 'Sistema', created_at: agora(),
      });
    }
    salvar();
    return p;
  }
  if ((m = caminho.match(/^\/produtos\/([^/]+)$/))) {
    const p = b.produtos.find((x) => x.id === m[1]);
    if (!p) throw new ErroApi(404, 'Produto não encontrado');
    if (metodo === 'get') return p;
    if (metodo === 'put') {
      ['nome', 'categoria', 'unidade_medida', 'codigo_barras', 'ativo'].forEach((k) => { if (corpo[k] != null) p[k] = corpo[k]; });
      ['quantidade_minima', 'preco_compra', 'preco_venda'].forEach((k) => { if (corpo[k] != null && corpo[k] !== '') p[k] = Number(corpo[k]); });
      p.updated_at = agora();
      salvar();
      return p;
    }
    if (metodo === 'delete') { p.ativo = false; salvar(); return { message: 'Produto desativado com sucesso' }; }
  }
  if (metodo === 'post' && caminho === '/movimentacoes') {
    const p = ativos.find((x) => x.id === corpo.produto_id);
    if (!p) throw new ErroApi(404, 'Produto não encontrado');
    const qtd = Number(corpo.quantidade);
    const armazem = corpo.armazem_id ? b.armazens.find((a) => a.id === corpo.armazem_id && a.ativo) : obterArmazemPadrao(b);
    if (!armazem) throw new ErroApi(404, 'Armazém não encontrado');
    const mov = registrarMovimento(b, p, corpo.tipo, corpo.motivo, qtd, armazem.id, { preco_unitario: Number(corpo.preco_unitario) || 0, observacoes: corpo.observacoes || null, usuario: corpo.usuario || 'Sistema', fornecedor_id: corpo.fornecedor_id || null, pedido_id: corpo.pedido_id || null, cliente_id: corpo.cliente_id || null });
    salvar();
    return mov;
  }
  if (metodo === 'get' && caminho === '/movimentacoes') {
    let lista = [...b.movimentacoes].sort(porData);
    if (params.produto_id) lista = lista.filter((x) => x.produto_id === params.produto_id);
    return lista.slice(0, Number(params.limit) || 100);
  }
  if (metodo === 'get' && caminho === '/dashboard') {
    const grupos = {};
    ativos.forEach((p) => {
      grupos[p.categoria] = grupos[p.categoria] || { _id: p.categoria, total: 0, quantidade_total: 0 };
      grupos[p.categoria].total += 1;
      grupos[p.categoria].quantidade_total += p.quantidade_atual;
    });
    const zerados = ativos.filter((p) => p.quantidade_atual === 0);
    const baixo = ativos.filter((p) => p.quantidade_atual > 0 && p.quantidade_atual <= p.quantidade_minima);
    return {
      total_produtos: ativos.length,
      produtos_sem_estoque: zerados.length,
      produtos_estoque_baixo: baixo.length,
      produtos_zerados: zerados,
      estoque_baixo: baixo,
      ultimas_movimentacoes: [...b.movimentacoes].sort(porData).slice(0, 10),
      categorias: Object.values(grupos).sort((x, y) => y.total - x.total),
    };
  }
  if (metodo === 'get' && caminho === '/categorias') return [...new Set(ativos.map((p) => p.categoria))].sort();

  if (metodo === 'get' && caminho === '/erp/resumo') {
    const valorCusto = ativos.reduce((s, p) => s + p.quantidade_atual * p.preco_compra, 0);
    const valorVenda = ativos.reduce((s, p) => s + p.quantidade_atual * p.preco_venda, 0);
    const baixo = ativos.filter((p) => p.quantidade_atual > 0 && p.quantidade_atual <= p.quantidade_minima);
    const zerados = ativos.filter((p) => p.quantidade_atual <= 0);
    return { indicadores: { produtos: ativos.length, itens_em_estoque: ativos.reduce((s, p) => s + p.quantidade_atual, 0), valor_estoque_custo: +valorCusto.toFixed(2), valor_estoque_venda: +valorVenda.toFixed(2), margem_potencial: +(valorVenda - valorCusto).toFixed(2), estoque_baixo: baixo.length, estoque_zerado: zerados.length, fornecedores: b.fornecedores.filter((x) => x.ativo).length, armazens: b.armazens.filter((x) => x.ativo).length }, alertas: { zerados: zerados.slice(0, 10), baixo: baixo.slice(0, 10) } };
  }
  if (metodo === 'get' && caminho === '/erp/armazens') return b.armazens.filter((x) => x.ativo).sort((a, z) => a.nome.localeCompare(z.nome));
  if (metodo === 'post' && caminho === '/erp/armazens') {
    if (b.armazens.some((x) => x.codigo === corpo.codigo)) throw new ErroApi(400, 'Código de armazém já cadastrado');
    const armazem = { id: uuid(), codigo: corpo.codigo, nome: corpo.nome, descricao: corpo.descricao || null, ativo: true, created_at: agora() };
    b.armazens.push(armazem); salvar(); return armazem;
  }
  if ((m = caminho.match(/^\/erp\/armazens\/([^/]+)\/estoque$/)) && metodo === 'get') {
    if (!b.armazens.some((x) => x.id === m[1] && x.ativo)) throw new ErroApi(404, 'Armazém não encontrado');
    return b.estoque_armazem.filter((s) => s.armazem_id === m[1]).map((s) => ({ produto_id: s.produto_id, nome: b.produtos.find((p) => p.id === s.produto_id)?.nome, unidade_medida: b.produtos.find((p) => p.id === s.produto_id)?.unidade_medida, quantidade: s.quantidade, estoque_global: b.produtos.find((p) => p.id === s.produto_id)?.quantidade_atual })).filter((x) => x.nome).sort((x, y) => x.nome.localeCompare(y.nome));
  }
  if (metodo === 'get' && caminho === '/erp/fornecedores') {
    let lista = b.fornecedores.filter((x) => x.ativo);
    if (params.busca) lista = lista.filter((x) => `${x.razao_social} ${x.nome_fantasia || ''} ${x.documento || ''}`.toLowerCase().includes(String(params.busca).toLowerCase()));
    return lista.sort((x, y) => x.razao_social.localeCompare(y.razao_social));
  }
  if (metodo === 'post' && caminho === '/erp/fornecedores') {
    if (corpo.documento && b.fornecedores.some((x) => x.ativo && x.documento === corpo.documento)) throw new ErroApi(400, 'Documento do fornecedor já cadastrado');
    const fornecedor = { id: uuid(), ...corpo, ativo: true, created_at: agora(), updated_at: agora() };
    b.fornecedores.push(fornecedor); salvar(); return fornecedor;
  }
  if (metodo === 'get' && caminho === '/erp/clientes') {
    let lista = b.clientes.filter((x) => x.ativo);
    if (params.busca) lista = lista.filter((x) => `${x.nome} ${x.documento || ''} ${x.email || ''}`.toLowerCase().includes(String(params.busca).toLowerCase()));
    return lista.sort((x, y) => x.nome.localeCompare(y.nome));
  }
  if (metodo === 'post' && caminho === '/erp/clientes') {
    if (corpo.documento && b.clientes.some((x) => x.ativo && x.documento === corpo.documento)) throw new ErroApi(400, 'Documento do cliente já cadastrado');
    const cliente = { id: uuid(), ...corpo, ativo: true, created_at: agora() };
    b.clientes.push(cliente); salvar(); return cliente;
  }
  if (metodo === 'post' && caminho === '/erp/transferencias') {
    if (corpo.origem_id === corpo.destino_id) throw new ErroApi(400, 'Origem e destino devem ser diferentes');
    const origem = b.armazens.find((x) => x.id === corpo.origem_id && x.ativo); const destino = b.armazens.find((x) => x.id === corpo.destino_id && x.ativo);
    const produto = ativos.find((x) => x.id === corpo.produto_id);
    if (!origem || !destino || !produto) throw new ErroApi(404, 'Armazém ou produto não encontrado');
    const de = saldoArmazem(b, produto.id, origem.id); const para = saldoArmazem(b, produto.id, destino.id); const qtd = Number(corpo.quantidade);
    if (de.quantidade < qtd) throw new ErroApi(400, `Estoque insuficiente no armazém de origem. Disponível: ${de.quantidade}`);
    const idTransferencia = uuid();
    for (const [armazem, tipo, anterior] of [[origem, 'saida', de.quantidade], [destino, 'entrada', para.quantidade]]) {
      const saldo = armazem.id === origem.id ? de : para;
      saldo.quantidade += tipo === 'entrada' ? qtd : -qtd;
      b.movimentacoes.push({ id: uuid(), produto_id: produto.id, tipo, motivo: 'transferencia', quantidade: qtd, quantidade_anterior: anterior, quantidade_nova: saldo.quantidade, armazem_id: armazem.id, armazem_origem_id: origem.id, armazem_destino_id: destino.id, transferencia_id: idTransferencia, observacoes: corpo.observacoes || null, usuario: corpo.usuario || 'Sistema', created_at: agora() });
    }
    salvar(); return { message: 'Transferência registrada', transferencia_id: idTransferencia, estoque_restante_origem: de.quantidade, estoque_destino: para.quantidade, estoque_global: produto.quantidade_atual };
  }
  if ((m = caminho.match(/^\/erp\/(compras|vendas)(?:\/([^/]+)(?:\/(receber|expedir))?)?$/))) {
    const compra = m[1] === 'compras'; const chave = compra ? 'pedidos_compra' : 'pedidos_venda'; const pessoaKey = compra ? 'fornecedor_id' : 'cliente_id'; const pessoaNome = compra ? 'fornecedor_nome' : 'cliente_nome';
    if (!m[2] && metodo === 'get') return b[chave].filter((x) => !params.status || x.status === params.status).sort(porData);
    if (!m[2] && metodo === 'post') {
      const pessoa = (compra ? b.fornecedores : b.clientes).find((x) => x.id === corpo[pessoaKey] && x.ativo);
      if (!pessoa) throw new ErroApi(404, compra ? 'Fornecedor não encontrado' : 'Cliente não encontrado');
      const armazem = corpo.armazem_id ? b.armazens.find((x) => x.id === corpo.armazem_id && x.ativo) : obterArmazemPadrao(b);
      if (!armazem) throw new ErroApi(404, 'Armazém não encontrado');
      const itens = (corpo.itens || []).map((i) => { const p = ativos.find((x) => x.id === i.produto_id); if (!p) throw new ErroApi(404, `Produto não encontrado: ${i.produto_id}`); return { id: uuid(), produto_id: p.id, produto_nome: p.nome, unidade_medida: p.unidade_medida, quantidade: Number(i.quantidade), preco_unitario: Number(i.preco_unitario), total: +(Number(i.quantidade) * Number(i.preco_unitario)).toFixed(2), ...(compra ? { quantidade_recebida: 0 } : {}) }; });
      if (!itens.length) throw new ErroApi(400, 'Adicione ao menos um item');
      const codigo = `${compra ? 'PC' : 'PV'}-${Date.now().toString().slice(-8)}`;
      const pedido = { id: uuid(), codigo, tipo: compra ? 'compra' : 'venda', [pessoaKey]: pessoa.id, [pessoaNome]: compra ? nomeFornecedor(pessoa) : pessoa.nome, armazem_id: armazem.id, armazem_nome: armazem.nome, itens, total: +itens.reduce((s, x) => s + x.total, 0).toFixed(2), status: 'aberto', observacoes: corpo.observacoes || null, created_at: agora(), updated_at: agora() };
      b[chave].push(pedido); b.auditoria.push({ id: uuid(), acao: 'pedido_criado', entidade: compra ? 'compra' : 'venda', entidade_id: pedido.id, descricao: `Pedido ${codigo} criado`, created_at: agora() }); salvar(); return pedido;
    }
    if (m[2] && metodo === 'post') {
      const pedido = b[chave].find((x) => x.id === m[2]); if (!pedido) throw new ErroApi(404, 'Pedido não encontrado');
      if (compra && m[3] === 'receber') {
        if (pedido.status === 'recebido') throw new ErroApi(400, 'Este pedido já foi recebido por completo');
        for (const item of pedido.itens) { const pendente = item.quantidade - (item.quantidade_recebida || 0); if (pendente > 0) { const p = ativos.find((x) => x.id === item.produto_id); registrarMovimento(b, p, 'entrada', 'compra', pendente, pedido.armazem_id, { preco_unitario: item.preco_unitario, observacoes: `Recebimento ${pedido.codigo}`, fornecedor_id: pedido.fornecedor_id, pedido_id: pedido.id }); item.quantidade_recebida = item.quantidade; } }
        pedido.status = 'recebido';
      } else if (!compra && m[3] === 'expedir') {
        if (pedido.status !== 'aberto') throw new ErroApi(400, 'Somente pedidos abertos podem ser expedidos');
        for (const item of pedido.itens) { const p = ativos.find((x) => x.id === item.produto_id); const saldo = saldoArmazem(b, p.id, pedido.armazem_id); if (saldo.quantidade < item.quantidade || p.quantidade_atual < item.quantidade) throw new ErroApi(400, `Estoque insuficiente para expedir. Disponível no armazém: ${saldo.quantidade}`); }
        for (const item of pedido.itens) registrarMovimento(b, ativos.find((x) => x.id === item.produto_id), 'saida', 'venda', item.quantidade, pedido.armazem_id, { preco_unitario: item.preco_unitario, observacoes: `Expedição ${pedido.codigo}`, pedido_id: pedido.id, cliente_id: pedido.cliente_id });
        pedido.status = 'expedido';
      }
      pedido.updated_at = agora(); salvar(); return pedido;
    }
  }
  if (metodo === 'get' && caminho === '/erp/analise/abc') {
    const itens = [...ativos].map((p) => ({ produto_id: p.id, nome: p.nome, valor: +(p.quantidade_atual * p.preco_compra).toFixed(2) })).sort((x, y) => y.valor - x.valor);
    const total = itens.reduce((s, x) => s + x.valor, 0); let acumulado = 0;
    itens.forEach((x) => { acumulado += x.valor; x.percentual_acumulado = total ? +(acumulado / total * 100).toFixed(2) : 0; x.classe = x.percentual_acumulado <= 80 ? 'A' : x.percentual_acumulado <= 95 ? 'B' : 'C'; });
    return { total: +total.toFixed(2), itens };
  }
  if (metodo === 'get' && caminho === '/erp/auditoria') return [...b.auditoria].sort(porData).slice(0, Math.min(Number(params.limit) || 100, 500));
  throw new ErroApi(404, 'Rota não encontrada');
}

/** Liga o modo demonstração: o axios passa a responder daqui, sem servidor */
export function ativarDemo(axios) {
  axios.defaults.adapter = async (config) => {
    const url = new URL(config.url, 'http://demo.local');
    const caminho = url.pathname.replace(/^.*\/api/, '') || '/';
    const params = { ...Object.fromEntries(url.searchParams), ...(config.params || {}) };
    const corpo = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
    await new Promise((r) => setTimeout(r, 120)); // latência pequena, como numa API real
    try {
      const data = rotear((config.method || 'get').toLowerCase(), caminho, params, corpo);
      return { data: JSON.parse(JSON.stringify(data)), status: 200, statusText: 'OK', headers: {}, config };
    } catch (e) {
      if (!(e instanceof ErroApi)) throw e;
      const erro = new Error(e.detail);
      erro.config = config;
      erro.response = { data: { detail: e.detail }, status: e.status, statusText: 'Erro', headers: {}, config };
      throw erro;
    }
  };
}
