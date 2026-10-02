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

const CHAVE = 'stockmaster-demo-v1';
const agora = () => new Date().toISOString();
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

function exemplo() {
  const t0 = Date.now() - 6 * 864e5;
  const produtos = [];
  const movimentacoes = [];
  const quando = (dias) => new Date(t0 + dias * 864e5).toISOString();
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
  criar('Café em grãos 1kg', 'Cafeteria', 'pacote', 6, 38.5, 59.9, [['entrada', 20, 'compra', 0], ['saida', 16, 'venda', 5]]);
  criar('Leite integral 1L', 'Cafeteria', 'litro', 12, 4.79, 7.5, [['entrada', 48, 'compra', 0], ['saida', 21, 'venda', 4]]);
  criar('Copo descartável 300ml', 'Descartáveis', 'pacote', 10, 8.9, 14, [['entrada', 30, 'compra', 1], ['saida', 23, 'venda', 5]]);
  criar('Pão de queijo congelado', 'Salgados', 'kg', 5, 22, 42, [['entrada', 12, 'compra', 1], ['saida', 9, 'venda', 3], ['saida', 1, 'perda', 4]]);
  criar('Açúcar refinado 1kg', 'Mercearia', 'pacote', 8, 4.2, 6.9, [['entrada', 15, 'compra', 2], ['saida', 3, 'venda', 5]]);
  criar('Chocolate em pó 400g', 'Cafeteria', 'pacote', 4, 11.3, 18.9, [['entrada', 6, 'compra', 2], ['saida', 6, 'venda', 6]]);
  return { produtos, movimentacoes };
}

let banco = null;
function carregar() {
  if (banco) return banco;
  try { banco = JSON.parse(localStorage.getItem(CHAVE)); } catch (e) { banco = null; }
  if (!banco || !Array.isArray(banco.produtos)) banco = exemplo();
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
    const anterior = p.quantidade_atual;
    const nova = corpo.tipo === 'entrada' ? anterior + qtd : anterior - qtd;
    if (nova < 0) throw new ErroApi(400, `Estoque insuficiente. Disponível: ${anterior}`);
    const mov = {
      id: uuid(), produto_id: p.id, tipo: corpo.tipo, motivo: corpo.motivo, quantidade: qtd, quantidade_anterior: anterior,
      quantidade_nova: nova, preco_unitario: Number(corpo.preco_unitario) || 0, observacoes: corpo.observacoes || null,
      usuario: corpo.usuario || 'Sistema', created_at: agora(),
    };
    p.quantidade_atual = nova;
    p.updated_at = agora();
    b.movimentacoes.push(mov);
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
