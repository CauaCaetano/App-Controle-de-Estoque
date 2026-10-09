// =============================================================
// Idioma da interface (português ou inglês)
// -------------------------------------------------------------
// - ?lang=en ou ?lang=pt na URL escolhe o idioma e fica salvo;
// - sem parâmetro, usa a última escolha (a mesma chave "br-lang"
//   do site BLUE ROSE, que hospeda a demonstração);
// - o padrão é português.
// Em inglês, a camada abaixo traduz o texto renderizado usando o
// dicionário (frases fixas) e as regras (frases com valores).
// =============================================================

const CHAVE_IDIOMA = 'br-lang';

function detectarIdioma() {
  try {
    const pedido = new URLSearchParams(window.location.search).get('lang');
    if (pedido === 'en' || pedido === 'pt') {
      localStorage.setItem(CHAVE_IDIOMA, pedido);
      return pedido;
    }
    return localStorage.getItem(CHAVE_IDIOMA) === 'en' ? 'en' : 'pt';
  } catch (e) {
    return 'pt';
  }
}

export const IDIOMA = detectarIdioma();
export const EN = IDIOMA === 'en';
export const LOCALE = EN ? 'en-US' : 'pt-BR';

/** Valor em reais (pt) ou dólares (en) */
export const dinheiro = (v) => (v || 0).toLocaleString(LOCALE, { style: 'currency', currency: EN ? 'USD' : 'BRL' });
export const data = (iso, opcoes) => new Date(iso).toLocaleDateString(LOCALE, opcoes);

/** Troca o idioma e recarrega mantendo a página atual */
export function trocarIdioma(novo) {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', novo);
  window.location.href = url.toString();
}

// quantidades aparecem quase sempre no plural ("50 units")
const UNIDADES = { unidade: 'units', unidades: 'units', pacote: 'packs', kg: 'kg', litro: 'liters', metro: 'meters', caixa: 'boxes' };
const unidade = (u) => UNIDADES[u] || u;

// Frases fixas: português → inglês
const DICIONARIO = {
  // estrutura
  'Demonstração ao vivo: cadastre, venda e veja o painel reagir. Os dados ficam só no seu navegador.': 'Live demo: add products, make sales and watch the dashboard react. Your data stays in your browser.',
  'Recomeçar com os dados de exemplo': 'Start over with sample data',
  'Ver código-fonte no GitHub': 'View source on GitHub',
  'Gestão de estoque': 'Inventory management',
  'Minha empresa': 'My company',
  'Unidade principal': 'Main location',
  'Gestor de estoque': 'Inventory manager',
  'Painel operacional': 'Operations dashboard',
  'Ambiente operacional': 'Live environment',
  'Operação': 'Operations',
  'Cadastros': 'Records',
  'Gestão': 'Management',
  'Visão geral': 'Overview',
  'Produtos': 'Products',
  'Compras': 'Purchasing',
  'Vendas': 'Sales',
  'Movimentações': 'Stock movements',
  'Armazéns': 'Warehouses',
  'Fornecedores': 'Suppliers',
  'Clientes': 'Customers',
  'Indicadores': 'KPIs',
  'Abrir indicadores': 'Open KPIs',
  // central ERP
  'Carregando central ERP...': 'Loading ERP hub...',
  'Não foi possível carregar a central ERP.': 'Could not load the ERP hub.',
  'Itens em estoque': 'Units in stock',
  'Valor a custo': 'Value at cost',
  'Valor potencial de venda': 'Potential sales value',
  'Estoque baixo': 'Low stock',
  'Estoque zerado': 'Out of stock',
  'Cockpit operacional': 'Operations cockpit',
  'Central ERP': 'ERP hub',
  'Alertas de estoque': 'Stock alerts',
  'Nenhum alerta ativo.': 'No active alerts.',
  'Potencial financeiro': 'Financial potential',
  'Diferença entre valor estimado de venda e custo do estoque atual.': 'Difference between the estimated sales value and the cost of current stock.',
  'Custo': 'Cost',
  'Venda': 'Sale',
  'Zerado': 'Out',
  'Baixo': 'Low',
  'Normal': 'OK',
  // fornecedores
  'Parceiros de abastecimento e origem dos recebimentos': 'Supply partners and where receipts come from',
  'Cadastrar fornecedor': 'Add supplier',
  'Razão social *': 'Legal name *',
  'Nome fantasia': 'Trade name',
  'CNPJ / documento': 'Tax ID / EIN',
  'E-mail': 'Email',
  'Telefone': 'Phone',
  'Salvando...': 'Saving...',
  'Salvar fornecedor': 'Save supplier',
  'Base de fornecedores': 'Supplier list',
  'Fornecedores ativos disponíveis nos recebimentos.': 'Active suppliers available for receiving.',
  'Buscar fornecedores': 'Search suppliers',
  'Buscar por razão social, nome ou documento': 'Search by legal name, trade name or tax ID',
  'Carregando fornecedores...': 'Loading suppliers...',
  'Nenhum fornecedor encontrado.': 'No suppliers found.',
  'Fornecedor': 'Supplier',
  'Documento': 'Tax ID',
  'Contato': 'Contact',
  'Não foi possível carregar fornecedores.': 'Could not load suppliers.',
  'Não foi possível salvar o fornecedor.': 'Could not save the supplier.',
  // pedidos
  'Produto': 'Product',
  'Selecione um produto': 'Select a product',
  'Quantidade': 'Quantity',
  'Preço unitário': 'Unit price',
  'Adicionar': 'Add',
  'Remover': 'Remove',
  'Adicione pelo menos um produto ao pedido.': 'Add at least one product to the order.',
  'Aberto': 'Open',
  'Recebido em parte': 'Partially received',
  'Recebido': 'Received',
  'Expedido': 'Shipped',
  'Ciclo operacional': 'Order cycle',
  'Do fornecedor ao recebimento no armazém.': 'From the supplier to receiving at the warehouse.',
  'Do pedido do cliente à expedição pelo armazém.': 'From the customer order to shipping from the warehouse.',
  'pedido': 'order',
  'pedidos': 'orders',
  'Novo pedido de compra': 'New purchase order',
  'Novo pedido de venda': 'New sales order',
  'Os itens e valores ficam registrados no documento.': 'Items and prices are recorded on the document.',
  'Cliente': 'Customer',
  'Selecione': 'Select',
  'Armazém': 'Warehouse',
  'Observações': 'Notes',
  'Opcional': 'Optional',
  'Itens do pedido': 'Order items',
  'Total do pedido': 'Order total',
  'Criar pedido de compra': 'Create purchase order',
  'Criar pedido de venda': 'Create sales order',
  'Cadastre um fornecedor antes de criar pedidos.': 'Add a supplier before creating orders.',
  'Cadastre um cliente antes de criar pedidos.': 'Add a customer before creating orders.',
  'Pedidos registrados': 'Recorded orders',
  'Cada recebimento atualiza o histórico e o saldo do armazém.': 'Each receipt updates the history and the warehouse balance.',
  'Cada expedição atualiza o histórico e o saldo do armazém.': 'Each shipment updates the history and the warehouse balance.',
  'Carregando pedidos...': 'Loading orders...',
  'Ainda não há pedidos': 'No orders yet',
  'Crie um pedido acima para iniciar este fluxo.': 'Create an order above to start this flow.',
  'Pedido': 'Order',
  'Armazém / Itens': 'Warehouse / Items',
  'Total': 'Total',
  'Status': 'Status',
  'Ação': 'Action',
  'item': 'item',
  'itens': 'items',
  'Processando...': 'Processing...',
  'Receber itens': 'Receive items',
  'Receber restante': 'Receive the rest',
  'Expedir pedido': 'Ship order',
  'Pedido de compra criado. Receba os itens quando chegarem.': 'Purchase order created. Receive the items when they arrive.',
  'Pedido de venda criado. Confira o saldo antes de expedir.': 'Sales order created. Check the balance before shipping.',
  'Não foi possível carregar os dados deste módulo.': 'Could not load data for this module.',
  'Não foi possível criar o pedido.': 'Could not create the order.',
  'Não foi possível concluir esta etapa.': 'Could not complete this step.',
  // clientes
  'Cadastros comerciais': 'Commercial records',
  'Pessoas e empresas que compram da distribuidora.': 'People and businesses that buy from the distributor.',
  'Cadastrar cliente': 'Add customer',
  'Nome / razão social *': 'Name / legal name *',
  'CPF / CNPJ': 'Tax ID',
  'Salvar cliente': 'Save customer',
  'Base de clientes': 'Customer list',
  'Carregando clientes...': 'Loading customers...',
  'Cadastre o primeiro cliente para registrar vendas.': 'Add your first customer to record sales.',
  'Cliente cadastrado. Já pode receber pedidos de venda.': 'Customer added. Ready for sales orders.',
  'Não foi possível carregar os clientes.': 'Could not load customers.',
  'Não foi possível salvar o cliente.': 'Could not save the customer.',
  // armazéns
  'Carregando armazéns...': 'Loading warehouses...',
  'Locais de armazenagem e movimentação interna': 'Storage locations and internal moves',
  'Novo armazém': 'New warehouse',
  'Cadastre um depósito ou ponto de armazenagem.': 'Add a warehouse or storage location.',
  'Código': 'Code',
  'Nome': 'Name',
  'Ex.: CD02': 'E.g. WH02',
  'Ex.: Loja Centro': 'E.g. Downtown Store',
  'Cadastrar armazém': 'Add warehouse',
  'Saldo por armazém': 'Stock by warehouse',
  'Consulte a quantidade disponível em cada local.': 'Check the quantity available at each location.',
  'Local': 'Location',
  'Atualizando saldo...': 'Updating balance...',
  'Este armazém ainda não tem saldo de produtos.': 'This warehouse has no stock yet.',
  'Saldo local': 'Local stock',
  'Saldo geral': 'Total stock',
  'Transferir estoque': 'Transfer stock',
  'A transferência reduz o saldo na origem e aumenta o destino sem alterar o estoque global.': 'A transfer lowers the source balance and raises the destination without changing total stock.',
  'Cadastre pelo menos dois armazéns para transferir produtos.': 'Add at least two warehouses to transfer products.',
  'Cadastre um produto antes de transferir estoque.': 'Add a product before transferring stock.',
  'Origem': 'From',
  'Destino': 'To',
  'Registrar transferência': 'Record transfer',
  'Não foi possível carregar armazéns e produtos.': 'Could not load warehouses and products.',
  'Não foi possível carregar o saldo deste armazém.': 'Could not load this warehouse balance.',
  'Não foi possível criar o armazém.': 'Could not create the warehouse.',
  'Não foi possível registrar a transferência.': 'Could not record the transfer.',
  // painel
  'Carregando dados do painel': 'Loading dashboard data',
  'Não foi possível carregar o painel': 'Could not load the dashboard',
  'Verifique a conexão e tente novamente.': 'Check your connection and try again.',
  'Tentar novamente': 'Try again',
  'Visão geral do estoque': 'Inventory overview',
  'Acompanhe seus produtos, alertas e atividades recentes.': 'Track your products, alerts and recent activity.',
  'Produtos cadastrados': 'Products',
  'Abaixo do mínimo': 'Below minimum',
  'Categorias': 'Categories',
  'Atenção ao estoque': 'Stock watch',
  'Produtos que precisam de reposição': 'Products that need restocking',
  'Saldo': 'Stock',
  'Mínimo': 'Min',
  'Tudo em ordem': 'All good',
  'Nenhum produto abaixo do nível mínimo.': 'No product is below its minimum level.',
  'Produtos por categoria': 'Products by category',
  'Distribuição do catálogo por linha de produto': 'Catalog breakdown by product line',
  'produto': 'product',
  'produtos': 'products',
  'Sem categorias cadastradas': 'No categories yet',
  'Cadastre produtos para visualizar a distribuição.': 'Add products to see the breakdown.',
  'Movimentações recentes': 'Recent stock movements',
  'Entradas, saídas e transferências mais recentes': 'Latest stock in, stock out and transfers',
  'Data': 'Date',
  'Tipo': 'Type',
  'Motivo': 'Reason',
  'Entrada': 'In',
  'Saída': 'Out',
  'Produto removido': 'Removed product',
  'Sem movimentações recentes': 'No recent movements',
  'As entradas, saídas e transferências registradas aparecerão nesta lista.': 'Recorded stock in, stock out and transfers will show up here.',
  // produtos
  'Novo Produto': 'New product',
  'Editar Produto': 'Edit product',
  'Buscar produtos': 'Search products',
  'Nome ou código de barras...': 'Name or barcode...',
  'Categoria': 'Category',
  'Todas as categorias': 'All categories',
  'Estoque': 'Stock',
  'Preços': 'Prices',
  'Ações': 'Actions',
  'Mín.': 'Min.',
  '· saldo': '· stock',
  'V:': 'Sale:',
  'C:': 'Cost:',
  'Editar': 'Edit',
  'Excluir': 'Delete',
  'Nome *': 'Name *',
  'Categoria *': 'Category *',
  'Unidade de Medida': 'Unit of measure',
  'Unidade': 'Unit',
  'Kg': 'Kg',
  'Litro': 'Liter',
  'Metro': 'Meter',
  'Caixa': 'Box',
  'Pacote': 'Pack',
  'Quantidade Atual': 'Current quantity',
  'Quantidade Mínima': 'Minimum quantity',
  'Preço de Compra': 'Purchase price',
  'Preço de Venda': 'Sale price',
  'Código de Barras': 'Barcode',
  'Cancelar': 'Cancel',
  'Salvar': 'Save',
  'Tem certeza que deseja excluir este produto?': 'Are you sure you want to delete this product?',
  'Erro ao excluir produto': 'Could not delete the product',
  // movimentações
  'Movimentações de Estoque': 'Stock movements',
  'Nova Movimentação': 'New movement',
  'Produto *': 'Product *',
  'Tipo *': 'Type *',
  'Motivo *': 'Reason *',
  'Sem fornecedor vinculado': 'No linked supplier',
  'Cadastre um fornecedor no módulo Fornecedores para vinculá-lo ao recebimento.': 'Add a supplier in the Suppliers module to link it to this receipt.',
  'Quantidade *': 'Quantity *',
  'Preço Unitário': 'Unit price',
  'Produto não encontrado': 'Product not found',
  // motivos
  'Compra': 'Purchase',
  'Perda': 'Loss',
  'Devolução': 'Return',
  'Ajuste de estoque': 'Stock adjustment',
  'Saldo inicial': 'Opening balance',
  'Transferência': 'Transfer',
  // mensagens da API de demonstração
  'Produto com este nome já existe': 'A product with this name already exists',
  'Produto desativado com sucesso': 'Product deactivated',
  'Armazém não encontrado': 'Warehouse not found',
  'Código de armazém já cadastrado': 'Warehouse code already exists',
  'Documento do fornecedor já cadastrado': 'Supplier tax ID already exists',
  'Documento do cliente já cadastrado': 'Customer tax ID already exists',
  'Origem e destino devem ser diferentes': 'Source and destination must be different',
  'Armazém ou produto não encontrado': 'Warehouse or product not found',
  'Fornecedor não encontrado': 'Supplier not found',
  'Cliente não encontrado': 'Customer not found',
  'Adicione ao menos um item': 'Add at least one item',
  'Pedido não encontrado': 'Order not found',
  'Este pedido já foi recebido por completo': 'This order has already been fully received',
  'Somente pedidos abertos podem ser expedidos': 'Only open orders can be shipped',
  'Rota não encontrada': 'Route not found',
};
Object.keys(UNIDADES).forEach((u) => { if (!DICIONARIO[u]) DICIONARIO[u] = UNIDADES[u]; });

// Frases com valores no meio
const REGRAS = [
  [/^(\d+) alertas?$/, (m) => `${m[1]} ${m[1] === '1' ? 'alert' : 'alerts'}`],
  [/^Fornecedor (.+) cadastrado\.$/, (m) => `Supplier ${m[1]} added.`],
  [/^Armazém (.+) criado\.$/, (m) => `Warehouse ${m[1]} created.`],
  [/^Recebimento registrado para (.+)\.$/, (m) => `Receipt recorded for ${m[1]}.`],
  [/^Pedido (.+) expedido e estoque atualizado\.$/, (m) => `Order ${m[1]} shipped and stock updated.`],
  [/^(.+) transferido para (.+)\. Saldo na origem: (.+)\.$/, (m) => `${m[1]} transferred to ${m[2] === 'o destino' ? 'the destination' : m[2]}. Source balance: ${m[3]}.`],
  [/^Remover (.+)$/, (m) => `Remove ${m[1]}`],
  [/^Produtos na categoria (.+)$/, (m) => `Products in category ${m[1]}`],
  [/^(.+) · saldo ([\d.,]+) (\S+)$/, (m) => `${m[1]} · stock ${m[2]} ${unidade(m[3])}`],
  [/^(.+) - ([\d.,]+) (\S+)$/, (m) => (UNIDADES[m[3]] ? `${m[1]} - ${m[2]} ${unidade(m[3])}` : null)],
  [/^Estoque insuficiente\. Disponível no armazém: (.+)$/, (m) => `Not enough stock. Available in this warehouse: ${m[1]}`],
  [/^Estoque insuficiente no armazém de origem\. Disponível: (.+)$/, (m) => `Not enough stock at the source warehouse. Available: ${m[1]}`],
  [/^Estoque insuficiente para expedir\. Disponível no armazém: (.+)$/, (m) => `Not enough stock to ship. Available in this warehouse: ${m[1]}`],
  [/^Produto não encontrado: (.+)$/, (m) => `Product not found: ${m[1]}`],
  [/^Erro ao salvar produto: (.*)$/s, (m) => `Could not save the product: ${traduzir(m[1])}`],
  [/^Erro ao salvar movimentação: (.*)$/s, (m) => `Could not save the movement: ${traduzir(m[1])}`],
];

/** Traduz uma frase (devolve a original se não houver tradução) */
export function traduzir(texto) {
  if (!EN || texto == null) return texto;
  const s = String(texto);
  const limpo = s.trim();
  if (!limpo) return s;
  let novo = DICIONARIO[limpo];
  if (novo == null) {
    for (const [re, fn] of REGRAS) {
      const m = limpo.match(re);
      if (m) { novo = fn(m); if (novo != null) break; }
    }
  }
  if (novo == null) return s;
  const ini = s.slice(0, s.indexOf(limpo));
  const fim = s.slice(s.indexOf(limpo) + limpo.length);
  return ini + novo + fim;
}
export const t = traduzir;

const ATRIBUTOS = ['placeholder', 'aria-label', 'title'];
function traduzirNo(no) {
  if (no.nodeType === 3) {
    const pai = no.parentNode;
    if (!pai || pai.nodeName === 'SCRIPT' || pai.nodeName === 'STYLE' || pai.nodeName === 'TEXTAREA') return;
    const novo = traduzir(no.nodeValue);
    if (novo !== no.nodeValue) no.nodeValue = novo;
    return;
  }
  if (no.nodeType !== 1) return;
  ATRIBUTOS.forEach((a) => {
    const v = no.getAttribute(a);
    if (v) { const novo = traduzir(v); if (novo !== v) no.setAttribute(a, novo); }
  });
  no.childNodes.forEach(traduzirNo);
}

/** Liga a tradução da tela (só em inglês) */
export function iniciarIdioma() {
  document.documentElement.lang = EN ? 'en' : 'pt-BR';
  if (!EN) return;
  document.title = 'Nexo | Inventory Management';
  const alerta = window.alert.bind(window);
  const confirmar = window.confirm.bind(window);
  window.alert = (msg) => alerta(traduzir(msg));
  window.confirm = (msg) => confirmar(traduzir(msg));
  const observar = () => {
    traduzirNo(document.body);
    new MutationObserver((mudancas) => {
      mudancas.forEach((m) => {
        if (m.type === 'characterData') traduzirNo(m.target);
        else if (m.type === 'attributes') traduzirNo(m.target);
        else m.addedNodes.forEach(traduzirNo);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
  };
  if (document.body) observar(); else document.addEventListener('DOMContentLoaded', observar);
}
