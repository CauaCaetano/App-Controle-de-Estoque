import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { ativarDemo, resetarDemo } from "./demoApi";
import { Activity, ArrowLeftRight, ArrowUpFromLine, Bell, Boxes, Building2, ChevronRight, CircleHelp, ClipboardList, LayoutDashboard, Package, ShoppingCart, Truck, UserRound, Warehouse } from "lucide-react";

const DEMO = process.env.REACT_APP_DEMO === "1";
if (DEMO) ativarDemo(axios);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const reais = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const rotulosMotivo = { compra: 'Compra', venda: 'Venda', perda: 'Perda', devolucao: 'Devolução', ajuste: 'Ajuste de estoque', inicial: 'Saldo inicial', transferencia: 'Transferência' };
const rotuloMotivo = (motivo) => rotulosMotivo[motivo] || motivo;

// Componente principal
function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const menu = [
    { id: 'dashboard', label: 'Visão geral', icon: LayoutDashboard, group: 'Operação' },
    { id: 'produtos', label: 'Produtos', icon: Package, group: 'Operação' },
    { id: 'compras', label: 'Compras', icon: ClipboardList, group: 'Operação' },
    { id: 'vendas', label: 'Vendas', icon: ShoppingCart, group: 'Operação' },
    { id: 'movimentacoes', label: 'Movimentações', icon: ArrowLeftRight, group: 'Operação' },
    { id: 'armazens', label: 'Armazéns', icon: Warehouse, group: 'Cadastros' },
    { id: 'fornecedores', label: 'Fornecedores', icon: Truck, group: 'Cadastros' },
    { id: 'clientes', label: 'Clientes', icon: UserRound, group: 'Cadastros' },
    { id: 'erp', label: 'Indicadores', icon: Activity, group: 'Gestão' },
  ];
  const page = menu.find((item) => item.id === currentPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {DEMO && (
        <div className="bg-gray-900 text-gray-100 text-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2">
            <span>Demonstração ao vivo: cadastre, venda e veja o painel reagir. Os dados ficam só no seu navegador.</span>
            <span className="flex flex-wrap gap-4">
              <button
                type="button"
                className="underline underline-offset-2 hover:text-white"
                onClick={() => { resetarDemo(); window.location.reload(); }}
              >
                Recomeçar com os dados de exemplo
              </button>
              <a className="underline underline-offset-2 hover:text-white" href="../../projetos.html#stockmaster" target="_top">
                Voltar ao site da BLUE ROSE
              </a>
            </span>
          </div>
        </div>
      )}
      {/* ERP shell */}
      <div className="erp-shell flex min-h-screen bg-[#f5f7fa] text-slate-900">
        <aside className="erp-sidebar hidden lg:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200"><Boxes size={21} strokeWidth={2.2} /></div>
              <div><div className="text-[17px] font-extrabold leading-5 tracking-tight text-slate-900">Nexo<span className="text-indigo-600">.</span></div><div className="mt-1 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Gestão de estoque</div></div>
            </div>
          </div>
          <div className="mx-4 mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-white text-indigo-600 shadow-sm"><Building2 size={16} /></div>
            <div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-slate-700">Minha empresa</div><div className="mt-0.5 text-[10px] text-slate-400">Unidade principal</div></div>
            <ChevronRight size={14} className="text-slate-400" />
          </div>
          <nav className="flex-1 px-3 pb-4">
            {['Operação', 'Cadastros', 'Gestão'].map((group) => <div key={group} className="mb-5">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">{group}</div>
              <div className="space-y-1">{menu.filter((item) => item.group === group).map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setCurrentPage(item.id)} aria-current={currentPage === item.id ? 'page' : undefined}
                className={`erp-nav-item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition ${currentPage === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                <Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>{currentPage === item.id && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />}
              </button>; })}</div>
            </div>)}
          </nav>
          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center gap-3 rounded-xl p-2"><div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">GE</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-slate-700">Gestor de estoque</div><div className="text-[10px] text-slate-400">Painel operacional</div></div><CircleHelp size={16} className="text-slate-400" /></div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="erp-topbar sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-7 lg:px-9">
              <div className="flex items-center gap-3"><div className="lg:hidden grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 text-white"><Boxes size={19} /></div><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">{page?.group || 'Operação'}</div><h1 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">{page?.label}</h1></div></div>
              <div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 md:flex"><Activity size={14} className="text-emerald-600"/><span>Ambiente operacional</span></div><button type="button" aria-label="Abrir indicadores" title="Abrir indicadores" onClick={() => setCurrentPage('erp')} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"><Bell size={16} /></button><div className="hidden h-8 w-px bg-slate-200 sm:block"/><span className="hidden text-xs font-semibold text-slate-600 sm:inline">Operação</span></div>
            </div>
          </header>
          <div className="erp-mobile-nav sticky top-[61px] z-10 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
            {menu.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setCurrentPage(item.id)} className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${currentPage === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}><Icon size={14}/>{item.label}</button>; })}
          </div>
      {/* Main Content */}
      <main className="erp-main w-full px-4 py-6 sm:px-6 lg:px-9 lg:py-8">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'produtos' && <Produtos />}
        {currentPage === 'compras' && <PedidosPage tipo="compra" />}
        {currentPage === 'vendas' && <PedidosPage tipo="venda" />}
        {currentPage === 'fornecedores' && <Fornecedores />}
        {currentPage === 'clientes' && <Clientes />}
        {currentPage === 'movimentacoes' && <Movimentacoes />}
        {currentPage === 'armazens' && <Armazens />}
        {currentPage === 'erp' && <ERPCentral />}
      </main>
        </div>
      </div>
    </div>
  );
}

// ERP Central — indicadores operacionais da nova camada ERP.
function ERPCentral() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { axios.get(`${API}/erp/resumo`).then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="p-10 text-center text-slate-500">Carregando central ERP...</div>;
  if (!data) return <div className="p-10 text-center text-red-600">Não foi possível carregar a central ERP.</div>;
  const i = data.indicadores;
  const cards = [['Produtos', i.produtos], ['Itens em estoque', i.itens_em_estoque], ['Valor a custo', reais(i.valor_estoque_custo)], ['Valor potencial de venda', reais(i.valor_estoque_venda)], ['Estoque baixo', i.estoque_baixo], ['Estoque zerado', i.estoque_zerado], ['Fornecedores', i.fornecedores], ['Armazéns', i.armazens]];
  return <div className="space-y-6"><div><p className="text-sm text-slate-500">Cockpit operacional</p><h2 className="text-2xl font-bold text-slate-900">Central ERP</h2></div><div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{cards.map(([label,value]) => <div key={label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"><div className="text-xs uppercase tracking-wider font-semibold text-slate-400">{label}</div><div className="mt-2 text-2xl font-bold text-slate-900">{value}</div></div>)}</div><div className="grid lg:grid-cols-2 gap-6"><div className="bg-white border border-slate-200 rounded-xl p-6"><h3 className="font-bold text-slate-900">Alertas de estoque</h3><div className="mt-4 space-y-2">{[...(data.alertas.zerados || []).map(p => ({...p,tipo:'Zerado'})), ...(data.alertas.baixo || []).map(p => ({...p,tipo:'Baixo'}))].slice(0,8).map(p => <div key={p.id + p.tipo} className="flex justify-between border-b border-slate-100 py-3 text-sm"><span className="font-medium">{p.nome}</span><span className={p.tipo === 'Zerado' ? 'text-red-600 font-semibold' : 'text-amber-600 font-semibold'}>{p.tipo}</span></div>)}{data.alertas.zerados.length === 0 && data.alertas.baixo.length === 0 && <p className="text-sm text-slate-500 py-4">Nenhum alerta ativo.</p>}</div></div><div className="bg-slate-950 text-white rounded-xl p-6"><div className="text-xs uppercase tracking-wider text-slate-400">Potencial financeiro</div><div className="text-3xl font-bold mt-2">{reais(i.margem_potencial)}</div><p className="text-sm text-slate-400 mt-2">Diferença entre valor estimado de venda e custo do estoque atual.</p><div className="mt-6 grid grid-cols-2 gap-4"><div><div className="text-xs text-slate-500">Custo</div><div className="font-semibold">{reais(i.valor_estoque_custo)}</div></div><div><div className="text-xs text-slate-500">Venda</div><div className="font-semibold">{reais(i.valor_estoque_venda)}</div></div></div></div></div></div>;
}

function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [form, setForm] = useState({ razao_social: '', nome_fantasia: '', documento: '', email: '', telefone: '' });

  const carregarFornecedores = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/erp/fornecedores`, { params: { busca: busca || undefined } });
      setFornecedores(response.data);
      setErro('');
    } catch (error) {
      setErro(error.response?.data?.detail || 'Não foi possível carregar fornecedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(carregarFornecedores, busca ? 250 : 0);
    return () => clearTimeout(timer);
  }, [busca]);

  const salvarFornecedor = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErro('');
    setAviso('');
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value || null]));
      const response = await axios.post(`${API}/erp/fornecedores`, payload);
      setForm({ razao_social: '', nome_fantasia: '', documento: '', email: '', telefone: '' });
      setAviso(`Fornecedor ${response.data.nome_fantasia || response.data.razao_social} cadastrado.`);
      await carregarFornecedores();
    } catch (error) {
      setErro(error.response?.data?.detail || 'Não foi possível salvar o fornecedor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Parceiros de abastecimento e origem dos recebimentos</p>
        <h2 className="text-2xl font-bold text-slate-900">Fornecedores</h2>
      </div>
      {erro && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}
      {aviso && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{aviso}</div>}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Cadastrar fornecedor</h3>
        <form className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={salvarFornecedor}>
          <label className="text-sm font-medium text-slate-700">Razão social *<input required maxLength={160} value={form.razao_social} onChange={(event) => setForm({ ...form, razao_social: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Nome fantasia<input maxLength={160} value={form.nome_fantasia} onChange={(event) => setForm({ ...form, nome_fantasia: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">CNPJ / documento<input maxLength={32} value={form.documento} onChange={(event) => setForm({ ...form, documento: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">E-mail<input type="email" maxLength={160} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Telefone<input maxLength={32} value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
          <div className="flex items-end"><button disabled={saving} className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar fornecedor'}</button></div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div><h3 className="font-bold text-slate-900">Base de fornecedores</h3><p className="mt-1 text-sm text-slate-500">Fornecedores ativos disponíveis nos recebimentos.</p></div>
          <input aria-label="Buscar fornecedores" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar por razão social, nome ou documento" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm md:max-w-sm" />
        </div>
        {loading ? <p className="p-8 text-center text-sm text-slate-500">Carregando fornecedores...</p> : fornecedores.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Nenhum fornecedor encontrado.</p> : (
          <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Fornecedor</th><th className="px-5 py-3">Documento</th><th className="px-5 py-3">Contato</th></tr></thead><tbody className="divide-y divide-slate-100">{fornecedores.map((fornecedor) => <tr key={fornecedor.id}><td className="px-5 py-4"><div className="font-semibold text-slate-900">{fornecedor.nome_fantasia || fornecedor.razao_social}</div>{fornecedor.nome_fantasia && <div className="text-xs text-slate-500">{fornecedor.razao_social}</div>}</td><td className="px-5 py-4 text-slate-600">{fornecedor.documento || '—'}</td><td className="px-5 py-4 text-slate-600">{fornecedor.email || fornecedor.telefone || '—'}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  );
}

function ItemPedidoEditor({ produtos, itens, setItens, tipo }) {
  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [preco, setPreco] = useState('');
  const produto = produtos.find((item) => item.id === produtoId);

  const selecionarProduto = (id) => {
    setProdutoId(id);
    const selecionado = produtos.find((item) => item.id === id);
    setPreco(String(selecionado ? (tipo === 'compra' ? selecionado.preco_compra : selecionado.preco_venda) : ''));
  };
  const adicionar = () => {
    const qtd = Number(quantidade);
    const valor = Number(preco);
    if (!produto || qtd <= 0 || valor < 0 || !Number.isFinite(valor)) return;
    setItens((atuais) => [...atuais, { local_id: `${produto.id}-${Date.now()}`, produto_id: produto.id, produto_nome: produto.nome, unidade_medida: produto.unidade_medida, quantidade: qtd, preco_unitario: valor }]);
    setProdutoId(''); setQuantidade('1'); setPreco('');
  };

  return <div className="space-y-3">
    <div className="grid items-end gap-3 md:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]">
      <label className="text-xs font-semibold text-slate-600">Produto<select value={produtoId} onChange={(event) => selecionarProduto(event.target.value)} className="mt-1 w-full border bg-white px-3 py-2.5"><option value="">Selecione um produto</option>{produtos.map((item) => <option key={item.id} value={item.id}>{item.nome} · saldo {item.quantidade_atual} {item.unidade_medida}</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-600">Quantidade<input type="number" min="0.01" step="any" value={quantidade} onChange={(event) => setQuantidade(event.target.value)} className="mt-1 w-full border px-3 py-2.5" /></label>
      <label className="text-xs font-semibold text-slate-600">Preço unitário<input type="number" min="0" step="0.01" value={preco} onChange={(event) => setPreco(event.target.value)} className="mt-1 w-full border px-3 py-2.5" /></label>
      <button type="button" onClick={adicionar} disabled={!produtoId || Number(quantidade) <= 0 || preco === ''} className="h-10 rounded-lg border border-indigo-200 bg-indigo-50 px-4 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50">Adicionar</button>
    </div>
    {itens.length > 0 && <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">{itens.map((item) => <div key={item.local_id} className="flex items-center justify-between gap-3 px-3 py-2.5"><div className="min-w-0"><div className="truncate text-xs font-semibold text-slate-700">{item.produto_nome}</div><div className="mt-0.5 text-[11px] text-slate-400">{item.quantidade} {item.unidade_medida} × {reais(item.preco_unitario)}</div></div><div className="flex shrink-0 items-center gap-3"><span className="text-xs font-bold tabular-nums text-slate-700">{reais(item.quantidade * item.preco_unitario)}</span><button type="button" aria-label={`Remover ${item.produto_nome}`} onClick={() => setItens((atuais) => atuais.filter((linha) => linha.local_id !== item.local_id))} className="rounded px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">Remover</button></div></div>)}</div>}
    {itens.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 px-4 py-5 text-center text-xs text-slate-400">Adicione pelo menos um produto ao pedido.</p>}
  </div>;
}

const statusPedidoLabel = { aberto: 'Aberto', parcialmente_recebido: 'Recebido em parte', recebido: 'Recebido', expedido: 'Expedido' };

function PedidosPage({ tipo }) {
  const compra = tipo === 'compra';
  const [pedidos, setPedidos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [parceiros, setParceiros] = useState([]);
  const [armazens, setArmazens] = useState([]);
  const [parceiroId, setParceiroId] = useState('');
  const [armazemId, setArmazemId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const base = compra ? 'compras' : 'vendas';

  const carregar = async () => {
    setLoading(true);
    try {
      const [pedidosResponse, produtosResponse, parceirosResponse, armazensResponse] = await Promise.all([
        axios.get(`${API}/erp/${base}`),
        axios.get(`${API}/produtos`),
        axios.get(`${API}/erp/${compra ? 'fornecedores' : 'clientes'}`),
        axios.get(`${API}/erp/armazens`),
      ]);
      setPedidos(pedidosResponse.data);
      setProdutos(produtosResponse.data);
      setParceiros(parceirosResponse.data);
      setArmazens(armazensResponse.data);
      setArmazemId((current) => current || armazensResponse.data[0]?.id || '');
      setErro('');
    } catch (error) {
      setErro(error.response?.data?.detail || 'Não foi possível carregar os dados deste módulo.');
    } finally { setLoading(false); }
  };

  useEffect(() => { carregar(); }, [base]);

  const salvarPedido = async (event) => {
    event.preventDefault();
    if (!parceiroId || !armazemId || itens.length === 0) return;
    setSaving(true); setErro(''); setAviso('');
    try {
      await axios.post(`${API}/erp/${base}`, {
        [compra ? 'fornecedor_id' : 'cliente_id']: parceiroId,
        armazem_id: armazemId,
        observacoes: observacoes || null,
        itens: itens.map(({ produto_id, quantidade, preco_unitario }) => ({ produto_id, quantidade, preco_unitario })),
      });
      setItens([]); setObservacoes(''); setParceiroId('');
      setAviso(compra ? 'Pedido de compra criado. Receba os itens quando chegarem.' : 'Pedido de venda criado. Confira o saldo antes de expedir.');
      await carregar();
    } catch (error) { setErro(error.response?.data?.detail || 'Não foi possível criar o pedido.'); }
    finally { setSaving(false); }
  };

  const processarPedido = async (pedido) => {
    setActionId(pedido.id); setErro(''); setAviso('');
    try {
      const acao = compra ? 'receber' : 'expedir';
      const resposta = await axios.post(`${API}/erp/${base}/${pedido.id}/${acao}`);
      setAviso(compra ? `Recebimento registrado para ${pedido.codigo}.` : `Pedido ${pedido.codigo} expedido e estoque atualizado.`);
      await carregar();
      return resposta.data;
    } catch (error) { setErro(error.response?.data?.detail || 'Não foi possível concluir esta etapa.'); }
    finally { setActionId(''); }
  };

  const totalRascunho = itens.reduce((soma, item) => soma + item.quantidade * item.preco_unitario, 0);
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">Ciclo operacional</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{compra ? 'Compras' : 'Vendas'}</h2><p className="mt-1 text-sm text-slate-500">{compra ? 'Do fornecedor ao recebimento no armazém.' : 'Do pedido do cliente à expedição pelo armazém.'}</p></div><div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">{pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}</div></header>
    {erro && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{erro}</div>}{aviso && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{aviso}</div>}
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6"><div className="mb-5"><h3 className="text-sm font-bold text-slate-800">Novo pedido de {compra ? 'compra' : 'venda'}</h3><p className="mt-1 text-xs text-slate-400">Os itens e valores ficam registrados no documento.</p></div>
      <form onSubmit={salvarPedido} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-xs font-semibold text-slate-600">{compra ? 'Fornecedor' : 'Cliente'}<select required value={parceiroId} onChange={(event) => setParceiroId(event.target.value)} className="mt-1 w-full border bg-white px-3 py-2.5"><option value="">Selecione</option>{parceiros.map((parceiro) => <option key={parceiro.id} value={parceiro.id}>{compra ? (parceiro.nome_fantasia || parceiro.razao_social) : parceiro.nome}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600">Armazém<select required value={armazemId} onChange={(event) => setArmazemId(event.target.value)} className="mt-1 w-full border bg-white px-3 py-2.5"><option value="">Selecione</option>{armazens.map((armazem) => <option key={armazem.id} value={armazem.id}>{armazem.nome} · {armazem.codigo}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600">Observações<input value={observacoes} onChange={(event) => setObservacoes(event.target.value)} maxLength={500} className="mt-1 w-full border px-3 py-2.5" placeholder="Opcional" /></label>
        </div>
        <div><div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Itens do pedido</div><ItemPedidoEditor produtos={produtos} itens={itens} setItens={setItens} tipo={tipo}/></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total do pedido</div><div className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">{reais(totalRascunho)}</div></div><button disabled={saving || !parceiroId || !armazemId || !itens.length} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Salvando...' : `Criar pedido de ${compra ? 'compra' : 'venda'}`}</button></div>
        {!parceiros.length && <p className="text-xs text-amber-700">Cadastre {compra ? 'um fornecedor' : 'um cliente'} antes de criar pedidos.</p>}
      </form>
    </section>
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40"><div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-bold text-slate-800">Pedidos registrados</h3><p className="mt-1 text-xs text-slate-400">Cada {compra ? 'recebimento' : 'expedição'} atualiza o histórico e o saldo do armazém.</p></div>
      {loading ? <div className="px-5 py-10 text-center text-sm text-slate-400" role="status">Carregando pedidos...</div> : !pedidos.length ? <div className="px-5 py-10 text-center"><p className="text-sm font-semibold text-slate-700">Ainda não há pedidos</p><p className="mt-1 text-xs text-slate-400">Crie um pedido acima para iniciar este fluxo.</p></div> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Pedido</th><th className="px-5 py-3">{compra ? 'Fornecedor' : 'Cliente'}</th><th className="px-5 py-3">Armazém / Itens</th><th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">{pedidos.map((pedido) => <tr key={pedido.id}><td className="whitespace-nowrap px-5 py-4"><div className="font-semibold text-slate-800">{pedido.codigo}</div><div className="mt-1 text-[10px] text-slate-400">{new Date(pedido.created_at).toLocaleDateString('pt-BR')}</div></td><td className="px-5 py-4 font-medium text-slate-700">{compra ? pedido.fornecedor_nome : pedido.cliente_nome}</td><td className="px-5 py-4"><div className="text-xs text-slate-600">{pedido.armazem_nome}</div><div className="mt-1 text-[10px] text-slate-400">{pedido.itens.length} {pedido.itens.length === 1 ? 'item' : 'itens'}</div></td><td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums text-slate-700">{reais(pedido.total)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${pedido.status === 'expedido' || pedido.status === 'recebido' ? 'bg-emerald-50 text-emerald-700' : pedido.status === 'parcialmente_recebido' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>{statusPedidoLabel[pedido.status] || pedido.status}</span></td><td className="px-5 py-4">{(compra ? pedido.status !== 'recebido' : pedido.status === 'aberto') && <button disabled={actionId === pedido.id} onClick={() => processarPedido(pedido)} className="whitespace-nowrap rounded-lg border border-indigo-200 px-3 py-2 text-[11px] font-bold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50">{actionId === pedido.id ? 'Processando...' : compra ? (pedido.status === 'aberto' ? 'Receber itens' : 'Receber restante') : 'Expedir pedido'}</button>}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [form, setForm] = useState({ nome: '', documento: '', email: '', telefone: '' });
  const carregar = async () => { setLoading(true); try { const resposta = await axios.get(`${API}/erp/clientes`); setClientes(resposta.data); setErro(''); } catch (error) { setErro(error.response?.data?.detail || 'Não foi possível carregar os clientes.'); } finally { setLoading(false); } };
  useEffect(() => { carregar(); }, []);
  const salvar = async (event) => { event.preventDefault(); setSaving(true); setErro(''); setAviso(''); try { await axios.post(`${API}/erp/clientes`, Object.fromEntries(Object.entries(form).map(([chave, valor]) => [chave, valor || null]))); setForm({ nome: '', documento: '', email: '', telefone: '' }); setAviso('Cliente cadastrado. Já pode receber pedidos de venda.'); await carregar(); } catch (error) { setErro(error.response?.data?.detail || 'Não foi possível salvar o cliente.'); } finally { setSaving(false); } };
  return <div className="space-y-6"><header><p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">Cadastros comerciais</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Clientes</h2><p className="mt-1 text-sm text-slate-500">Pessoas e empresas que compram da distribuidora.</p></header>{erro && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{erro}</div>}{aviso && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{aviso}</div>}
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40"><h3 className="text-sm font-bold text-slate-800">Cadastrar cliente</h3><form onSubmit={salvar} className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5"><label className="text-xs font-semibold text-slate-600">Nome / razão social *<input required maxLength={160} value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} className="mt-1 w-full border px-3 py-2.5" /></label><label className="text-xs font-semibold text-slate-600">CPF / CNPJ<input maxLength={32} value={form.documento} onChange={(event) => setForm({ ...form, documento: event.target.value })} className="mt-1 w-full border px-3 py-2.5" /></label><label className="text-xs font-semibold text-slate-600">E-mail<input type="email" maxLength={160} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full border px-3 py-2.5" /></label><label className="text-xs font-semibold text-slate-600">Telefone<input maxLength={32} value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} className="mt-1 w-full border px-3 py-2.5" /></label><div className="flex items-end"><button disabled={saving} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar cliente'}</button></div></form></section>
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40"><div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-bold text-slate-800">Base de clientes</h3></div>{loading ? <p className="px-5 py-10 text-center text-sm text-slate-400">Carregando clientes...</p> : !clientes.length ? <p className="px-5 py-10 text-center text-sm text-slate-400">Cadastre o primeiro cliente para registrar vendas.</p> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Cliente</th><th className="px-5 py-3">Documento</th><th className="px-5 py-3">Contato</th></tr></thead><tbody className="divide-y divide-slate-100">{clientes.map((cliente) => <tr key={cliente.id}><td className="px-5 py-4 font-semibold text-slate-700">{cliente.nome}</td><td className="px-5 py-4 text-slate-500">{cliente.documento || '—'}</td><td className="px-5 py-4 text-slate-500">{cliente.email || cliente.telefone || '—'}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}

function Armazens() {
  const [armazens, setArmazens] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [armazemSelecionado, setArmazemSelecionado] = useState('');
  const [saldos, setSaldos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockLoading, setStockLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [novoArmazem, setNovoArmazem] = useState({ codigo: '', nome: '' });
  const [transferencia, setTransferencia] = useState({
    produto_id: '', origem_id: '', destino_id: '', quantidade: '', observacoes: '',
  });

  const carregarDados = async (armazemIdPreferido) => {
    setLoading(true);
    setErro('');
    try {
      const [armazensResponse, produtosResponse] = await Promise.all([
        axios.get(`${API}/erp/armazens`),
        axios.get(`${API}/produtos`),
      ]);
      const locais = armazensResponse.data;
      setArmazens(locais);
      setProdutos(produtosResponse.data);
      const primeiroId = locais[0]?.id || '';
      const origemId = transferencia.origem_id || primeiroId;
      setArmazemSelecionado((atual) => armazemIdPreferido || atual || primeiroId);
      setTransferencia((atual) => ({ ...atual, origem_id: origemId }));
    } catch (error) {
      setErro(error.response?.data?.detail || 'Não foi possível carregar armazéns e produtos.');
    } finally {
      setLoading(false);
    }
  };

  const carregarSaldos = async (armazemId) => {
    if (!armazemId) {
      setSaldos([]);
      return;
    }
    setStockLoading(true);
    try {
      const response = await axios.get(`${API}/erp/armazens/${armazemId}/estoque`);
      setSaldos(response.data);
    } catch (error) {
      setErro(error.response?.data?.detail || 'Não foi possível carregar o saldo deste armazém.');
      setSaldos([]);
    } finally {
      setStockLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);
  useEffect(() => { carregarSaldos(armazemSelecionado); }, [armazemSelecionado]);

  const criarArmazem = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErro('');
    setAviso('');
    try {
      const response = await axios.post(`${API}/erp/armazens`, novoArmazem);
      setNovoArmazem({ codigo: '', nome: '' });
      setAviso(`Armazém ${response.data.nome} criado.`);
      await carregarDados(response.data.id);
    } catch (error) {
      setErro(error.response?.data?.detail || 'Não foi possível criar o armazém.');
    } finally {
      setSaving(false);
    }
  };

  const transferir = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErro('');
    setAviso('');
    try {
      const response = await axios.post(`${API}/erp/transferencias`, {
        ...transferencia,
        quantidade: Number(transferencia.quantidade),
      });
      const produto = produtos.find((item) => item.id === transferencia.produto_id);
      const origem = armazens.find((item) => item.id === transferencia.origem_id);
      const destino = armazens.find((item) => item.id === transferencia.destino_id);
      setAviso(`${produto?.nome || 'Produto'} transferido para ${destino?.nome || 'o destino'}. Saldo na origem: ${response.data.estoque_restante_origem}.`);
      setTransferencia((atual) => ({ ...atual, quantidade: '', observacoes: '' }));
      setArmazemSelecionado(transferencia.origem_id);
      await carregarSaldos(transferencia.origem_id);
    } catch (error) {
      setErro(error.response?.data?.detail || 'Não foi possível registrar a transferência.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Carregando armazéns...</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Locais de armazenagem e movimentação interna</p>
        <h2 className="text-2xl font-bold text-slate-900">Armazéns</h2>
      </div>

      {erro && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}
      {aviso && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{aviso}</div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Novo armazém</h3>
          <p className="mt-1 text-sm text-slate-500">Cadastre um depósito ou ponto de armazenagem.</p>
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={criarArmazem}>
            <label className="text-sm font-medium text-slate-700">
              Código
              <input required maxLength={24} value={novoArmazem.codigo} onChange={(event) => setNovoArmazem({ ...novoArmazem, codigo: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Ex.: CD02" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Nome
              <input required maxLength={120} value={novoArmazem.nome} onChange={(event) => setNovoArmazem({ ...novoArmazem, nome: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Ex.: Loja Centro" />
            </label>
            <button disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:col-span-2">Cadastrar armazém</button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Saldo por armazém</h3>
              <p className="mt-1 text-sm text-slate-500">Consulte a quantidade disponível em cada local.</p>
            </div>
            <label className="text-sm font-medium text-slate-700">
              Local
              <select value={armazemSelecionado} onChange={(event) => setArmazemSelecionado(event.target.value)} className="mt-1 block min-w-48 rounded-md border border-slate-300 bg-white px-3 py-2">
                {armazens.map((armazem) => <option key={armazem.id} value={armazem.id}>{armazem.codigo} · {armazem.nome}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-4 overflow-x-auto">
            {stockLoading ? <p className="py-8 text-center text-sm text-slate-500">Atualizando saldo...</p> : saldos.length === 0 ? <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Este armazém ainda não tem saldo de produtos.</p> : (
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Produto</th><th className="px-3 py-3">Saldo local</th><th className="px-3 py-3">Saldo geral</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{saldos.map((saldo) => <tr key={saldo.produto_id}><td className="px-3 py-3 font-medium text-slate-900">{saldo.nome}</td><td className="px-3 py-3">{saldo.quantidade} {saldo.unidade_medida}</td><td className="px-3 py-3 text-slate-500">{saldo.estoque_global}</td></tr>)}</tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Transferir estoque</h3>
        <p className="mt-1 text-sm text-slate-500">A transferência reduz o saldo na origem e aumenta o destino sem alterar o estoque global.</p>
        {armazens.length < 2 ? <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">Cadastre pelo menos dois armazéns para transferir produtos.</p> : produtos.length === 0 ? <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">Cadastre um produto antes de transferir estoque.</p> : (
          <form className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={transferir}>
            <label className="text-sm font-medium text-slate-700 xl:col-span-1">Produto
              <select required value={transferencia.produto_id} onChange={(event) => setTransferencia({ ...transferencia, produto_id: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"><option value="">Selecione</option>{produtos.map((produto) => <option key={produto.id} value={produto.id}>{produto.nome}</option>)}</select>
            </label>
            <label className="text-sm font-medium text-slate-700">Origem
              <select required value={transferencia.origem_id} onChange={(event) => setTransferencia({ ...transferencia, origem_id: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"><option value="">Selecione</option>{armazens.map((armazem) => <option key={armazem.id} value={armazem.id}>{armazem.nome}</option>)}</select>
            </label>
            <label className="text-sm font-medium text-slate-700">Destino
              <select required value={transferencia.destino_id} onChange={(event) => setTransferencia({ ...transferencia, destino_id: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"><option value="">Selecione</option>{armazens.map((armazem) => <option key={armazem.id} value={armazem.id} disabled={armazem.id === transferencia.origem_id}>{armazem.nome}</option>)}</select>
            </label>
            <label className="text-sm font-medium text-slate-700">Quantidade
              <input required min="0.01" step="any" type="number" value={transferencia.quantidade} onChange={(event) => setTransferencia({ ...transferencia, quantidade: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <div className="flex items-end"><button disabled={saving || !transferencia.produto_id || !transferencia.origem_id || !transferencia.destino_id || !transferencia.quantidade || transferencia.origem_id === transferencia.destino_id} className="w-full rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">Registrar transferência</button></div>
            <label className="text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-5">Observações
              <input value={transferencia.observacoes} onChange={(event) => setTransferencia({ ...transferencia, observacoes: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Opcional" />
            </label>
          </form>
        )}
      </section>
    </div>
  );
}

// Dashboard Component
function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [resposta, produtos] = await Promise.all([
        axios.get(`${API}/dashboard`),
        axios.get(`${API}/produtos`, { params: { apenas_ativos: false } }),
      ]);
      const nomes = Object.fromEntries(produtos.data.map((p) => [p.id, p.nome]));
      setDashboard({ ...resposta.data, nomes });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div><span className="sr-only">Carregando dados do painel</span>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="rounded-xl border border-rose-200 bg-white px-6 py-10 text-center" role="alert">
        <p className="text-sm font-semibold text-slate-800">Não foi possível carregar o painel</p><p className="mt-1 text-xs text-slate-500">Verifique a conexão e tente novamente.</p>
        <button onClick={fetchDashboard} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2">Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">Painel operacional</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">Visão geral do estoque</h2><p className="mt-1 text-sm text-slate-500">Acompanhe seus produtos, alertas e atividades recentes.</p></div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      </div>
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="erp-kpi-card bg-white rounded-xl border border-slate-200/80 shadow-sm shadow-slate-200/40 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-xs font-medium text-slate-500">Produtos cadastrados</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{dashboard.total_produtos}</p>
            </div>
          </div>
        </div>

        <div className="erp-kpi-card bg-white rounded-xl border border-slate-200/80 shadow-sm shadow-slate-200/40 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-xs font-medium text-slate-500">Estoque zerado</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{dashboard.produtos_sem_estoque}</p>
            </div>
          </div>
        </div>

        <div className="erp-kpi-card bg-white rounded-xl border border-slate-200/80 shadow-sm shadow-slate-200/40 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-xs font-medium text-slate-500">Abaixo do mínimo</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{dashboard.produtos_estoque_baixo}</p>
            </div>
          </div>
        </div>

        <div className="erp-kpi-card bg-white rounded-xl border border-slate-200/80 shadow-sm shadow-slate-200/40 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-xs font-medium text-slate-500">Categorias</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{dashboard.categorias?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="text-sm font-bold text-slate-800">Atenção ao estoque</h3><p className="mt-1 text-xs text-slate-400">Produtos que precisam de reposição</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${(dashboard.produtos_zerados?.length || 0) + (dashboard.estoque_baixo?.length || 0) ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{(dashboard.produtos_zerados?.length || 0) + (dashboard.estoque_baixo?.length || 0)} alertas</span></div>
          <div className="divide-y divide-slate-100">
            {[...(dashboard.produtos_zerados || []).map((produto) => ({ ...produto, status: 'Zerado' })), ...(dashboard.estoque_baixo || []).map((produto) => ({ ...produto, status: 'Baixo' }))].slice(0, 6).map((produto) => <div key={`${produto.id}-${produto.status}`} className="flex items-center justify-between gap-3 px-5 py-3.5"><div className="min-w-0"><div className="truncate text-xs font-semibold text-slate-700">{produto.nome}</div><div className="mt-1 text-[10px] text-slate-400">Saldo {produto.quantidade_atual} <span className="mx-1">·</span> Mínimo {produto.quantidade_minima}</div></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${produto.status === 'Zerado' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{produto.status}</span></div>)}
            {(dashboard.produtos_zerados?.length || 0) + (dashboard.estoque_baixo?.length || 0) === 0 && <div className="px-5 py-8 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Boxes size={17}/></div><p className="mt-2 text-xs font-semibold text-slate-700">Tudo em ordem</p><p className="mt-1 text-[11px] text-slate-400">Nenhum produto abaixo do nível mínimo.</p></div>}
          </div>
        </section>
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40">
          <div className="mb-5"><h3 className="text-sm font-bold text-slate-800">Produtos por categoria</h3><p className="mt-1 text-xs text-slate-400">Distribuição do catálogo por linha de produto</p></div>
          {dashboard.categorias?.length ? <div className="space-y-4">{(() => { const maxProdutos = Math.max(1, ...dashboard.categorias.map((categoria) => categoria.total || 0)); return dashboard.categorias.slice(0, 6).map((categoria) => { const percentual = Math.round(((categoria.total || 0) / maxProdutos) * 100); return <div key={categoria._id}><div className="mb-1.5 flex items-center justify-between gap-3"><div className="truncate text-xs font-semibold text-slate-700">{categoria._id}</div><div className="shrink-0 text-[10px] tabular-nums text-slate-500">{categoria.total} {categoria.total === 1 ? 'produto' : 'produtos'}</div></div><div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`Produtos na categoria ${categoria._id}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={percentual}><div className="h-full rounded-full bg-indigo-500 transition-[width] duration-500" style={{ width: `${percentual}%` }}/></div></div>; }); })()}</div> : <div className="rounded-lg bg-slate-50 px-4 py-8 text-center"><p className="text-xs font-semibold text-slate-700">Sem categorias cadastradas</p><p className="mt-1 text-[11px] text-slate-400">Cadastre produtos para visualizar a distribuição.</p></div>}
        </section>
      </div>

      {/* Últimas movimentações */}
      {dashboard.ultimas_movimentacoes?.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4"><h3 className="text-sm font-bold text-slate-800">Movimentações recentes</h3><p className="mt-1 text-xs text-slate-400">Entradas, saídas e transferências mais recentes</p></div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboard.ultimas_movimentacoes.slice(0, 5).map((mov) => (
                  <tr key={mov.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(mov.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {dashboard.nomes[mov.produto_id] || 'Produto removido'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        mov.tipo === 'entrada' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rotuloMotivo(mov.motivo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mov.quantidade}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-indigo-50 text-indigo-600"><ArrowLeftRight size={18}/></div>
          <h3 className="mt-3 text-sm font-semibold text-slate-800">Sem movimentações recentes</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">As entradas, saídas e transferências registradas aparecerão nesta lista.</p>
        </div>
      )}
    </div>
  );
}

// Produtos Component
function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    fetchProdutos();
    fetchCategorias();
  }, []);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/produtos`, {
        params: {
          busca: searchTerm || undefined,
          categoria: selectedCategory || undefined
        }
      });
      setProdutos(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await axios.get(`${API}/categorias`);
      setCategorias(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProdutos();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory]);

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await axios.delete(`${API}/produtos/${id}`);
        fetchProdutos();
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar produtos
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome ou código de barras..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de produtos */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preços
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produtos.map((produto) => (
                  <tr key={produto.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
                        {produto.codigo_barras && (
                          <div className="text-sm text-gray-500">{produto.codigo_barras}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                        {produto.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div><div className="text-sm font-semibold tabular-nums text-slate-800">{produto.quantidade_atual} <span className="text-xs font-normal text-slate-400">{produto.unidade_medida}</span></div><div className="mt-1 text-[11px] text-slate-400">Mín. {produto.quantidade_minima}</div></div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${produto.quantidade_atual <= 0 ? 'bg-rose-50 text-rose-700' : produto.quantidade_atual <= produto.quantidade_minima ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{produto.quantidade_atual <= 0 ? 'Zerado' : produto.quantidade_atual <= produto.quantidade_minima ? 'Baixo' : 'Normal'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>V: {reais(produto.preco_venda)}</div>
                        <div className="text-xs text-gray-500">
                          C: {reais(produto.preco_compra)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setEditingProduct(produto);
                          setShowForm(true);
                        }}
                        className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(produto.id)}
                        className="rounded-md px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-800"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de formulário */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingProduct(null);
            fetchProdutos();
            fetchCategorias();
          }}
        />
      )}
    </div>
  );
}

// Product Form Component
function ProductForm({ product, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nome: product?.nome || '',
    categoria: product?.categoria || '',
    unidade_medida: product?.unidade_medida || 'unidade',
    quantidade_atual: product?.quantidade_atual || 0,
    quantidade_minima: product?.quantidade_minima || 0,
    preco_compra: product?.preco_compra || 0,
    preco_venda: product?.preco_venda || 0,
    codigo_barras: product?.codigo_barras || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (product) {
        await axios.put(`${API}/produtos/${product.id}`, formData);
      } else {
        await axios.post(`${API}/produtos`, formData);
      }
      onSave();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria *
            </label>
            <input
              type="text"
              required
              value={formData.categoria}
              onChange={(e) => setFormData({...formData, categoria: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidade de Medida
            </label>
            <select
              value={formData.unidade_medida}
              onChange={(e) => setFormData({...formData, unidade_medida: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="unidade">Unidade</option>
              <option value="kg">Kg</option>
              <option value="litro">Litro</option>
              <option value="metro">Metro</option>
              <option value="caixa">Caixa</option>
              <option value="pacote">Pacote</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade Atual
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantidade_atual}
                onChange={(e) => setFormData({...formData, quantidade_atual: parseFloat(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade Mínima
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantidade_minima}
                onChange={(e) => setFormData({...formData, quantidade_minima: parseFloat(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço de Compra
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_compra}
                onChange={(e) => setFormData({...formData, preco_compra: parseFloat(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço de Venda
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_venda}
                onChange={(e) => setFormData({...formData, preco_venda: parseFloat(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de Barras
            </label>
            <input
              type="text"
              value={formData.codigo_barras}
              onChange={(e) => setFormData({...formData, codigo_barras: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Movimentações Component
function Movimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchMovimentacoes();
    fetchProdutos();
    fetchFornecedores();
  }, []);

  const fetchMovimentacoes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/movimentacoes`);
      setMovimentacoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProdutos = async () => {
    try {
      const response = await axios.get(`${API}/produtos`, { params: { apenas_ativos: false } });
      setProdutos(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const fetchFornecedores = async () => {
    try {
      const response = await axios.get(`${API}/erp/fornecedores`);
      setFornecedores(response.data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const getProdutoNome = (produtoId) => {
    const produto = produtos.find(p => p.id === produtoId);
    return produto ? produto.nome : 'Produto não encontrado';
  };

  const getFornecedorNome = (fornecedorId) => fornecedores.find((item) => item.id === fornecedorId)?.nome_fantasia || fornecedores.find((item) => item.id === fornecedorId)?.razao_social || '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Movimentações de Estoque</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nova Movimentação</span>
        </button>
      </div>

      {/* Lista de movimentações */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fornecedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movimentacoes.map((mov) => (
                  <tr key={mov.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(mov.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getProdutoNome(mov.produto_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        mov.tipo === 'entrada' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rotuloMotivo(mov.motivo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getFornecedorNome(mov.fornecedor_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mov.quantidade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mov.quantidade_anterior} → {mov.quantidade_nova}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de formulário */}
      {showForm && (
        <MovimentacaoForm
          produtos={produtos.filter((produto) => produto.ativo !== false)}
          fornecedores={fornecedores}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false);
            fetchMovimentacoes();
          }}
        />
      )}
    </div>
  );
}

// Movimentacao Form Component
function MovimentacaoForm({ produtos, fornecedores, onClose, onSave }) {
  const [formData, setFormData] = useState({
    produto_id: '',
    tipo: 'entrada',
    motivo: 'compra',
    quantidade: 0,
    preco_unitario: 0,
    observacoes: '',
    fornecedor_id: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/movimentacoes`, formData);
      onSave();
    } catch (error) {
      console.error('Erro ao salvar movimentação:', error);
      alert('Erro ao salvar movimentação: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const motivosEntrada = ['compra', 'devolucao', 'ajuste'];
  const motivosSaida = ['venda', 'perda', 'devolucao', 'ajuste'];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Nova Movimentação</h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produto *
            </label>
            <select
              required
              value={formData.produto_id}
              onChange={(e) => setFormData({...formData, produto_id: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um produto</option>
              {produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome} - {produto.quantidade_atual} {produto.unidade_medida}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({...formData, tipo: e.target.value, motivo: e.target.value === 'entrada' ? 'compra' : 'venda', fornecedor_id: ''})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo *
            </label>
            <select
              value={formData.motivo}
              onChange={(e) => setFormData({...formData, motivo: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
            >
              {(formData.tipo === 'entrada' ? motivosEntrada : motivosSaida).map((motivo) => (
                <option key={motivo} value={motivo}>{rotuloMotivo(motivo)}</option>
              ))}
            </select>
          </div>

          {formData.tipo === 'entrada' && formData.motivo === 'compra' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
              <select
                value={formData.fornecedor_id}
                onChange={(e) => setFormData({...formData, fornecedor_id: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sem fornecedor vinculado</option>
                {fornecedores.map((fornecedor) => <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome_fantasia || fornecedor.razao_social}</option>)}
              </select>
              {fornecedores.length === 0 && <p className="mt-1 text-xs text-gray-500">Cadastre um fornecedor no módulo Fornecedores para vinculá-lo ao recebimento.</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.quantidade}
                onChange={(e) => setFormData({...formData, quantidade: parseFloat(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço Unitário
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_unitario}
                onChange={(e) => setFormData({...formData, preco_unitario: parseFloat(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              rows="3"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
