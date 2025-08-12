#!/usr/bin/env python3
"""
Teste completo do sistema de controle de estoque backend
Foca nos endpoints críticos conforme solicitado
"""

import requests
import json
import sys
from datetime import datetime

# URL base do backend
BASE_URL = "https://stock-master-20.preview.emergentagent.com/api"

class StockSystemTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.created_products = []
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details
        })
    
    def test_health_check(self):
        """Teste básico de conectividade"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Health Check", True, f"API respondendo: {data.get('message', 'OK')}")
                return True
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Erro de conexão: {str(e)}")
            return False
    
    def test_criar_produtos(self):
        """Teste de criação de produtos conforme especificado"""
        produtos_teste = [
            {
                "nome": "Arroz 5kg",
                "categoria": "Alimentos", 
                "unidade_medida": "pacote",
                "quantidade_atual": 10,
                "quantidade_minima": 5,
                "preco_compra": 15.50,
                "preco_venda": 18.90,
                "codigo_barras": "7891234567890"
            },
            {
                "nome": "Detergente",
                "categoria": "Limpeza",
                "unidade_medida": "unidade", 
                "quantidade_atual": 5,
                "quantidade_minima": 2,
                "preco_compra": 3.50,
                "preco_venda": 4.90,
                "codigo_barras": "7891234567891"
            }
        ]
        
        for produto in produtos_teste:
            try:
                response = self.session.post(
                    f"{self.base_url}/produtos",
                    json=produto,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.created_products.append(data)
                    self.log_test(
                        f"Criar Produto - {produto['nome']}", 
                        True, 
                        f"Produto criado com ID: {data['id']}"
                    )
                else:
                    self.log_test(
                        f"Criar Produto - {produto['nome']}", 
                        False, 
                        f"Status: {response.status_code}",
                        response.text
                    )
            except Exception as e:
                self.log_test(
                    f"Criar Produto - {produto['nome']}", 
                    False, 
                    f"Erro: {str(e)}"
                )
    
    def test_listar_produtos(self):
        """Teste de listagem de produtos"""
        try:
            response = self.session.get(f"{self.base_url}/produtos")
            if response.status_code == 200:
                produtos = response.json()
                self.log_test(
                    "Listar Produtos", 
                    True, 
                    f"Encontrados {len(produtos)} produtos"
                )
                
                # Verificar se os produtos criados estão na lista
                nomes_encontrados = [p['nome'] for p in produtos]
                if "Arroz 5kg" in nomes_encontrados and "Detergente" in nomes_encontrados:
                    self.log_test(
                        "Verificar Produtos Criados", 
                        True, 
                        "Produtos de teste encontrados na listagem"
                    )
                else:
                    self.log_test(
                        "Verificar Produtos Criados", 
                        False, 
                        f"Produtos não encontrados. Encontrados: {nomes_encontrados}"
                    )
                return produtos
            else:
                self.log_test(
                    "Listar Produtos", 
                    False, 
                    f"Status: {response.status_code}",
                    response.text
                )
                return []
        except Exception as e:
            self.log_test("Listar Produtos", False, f"Erro: {str(e)}")
            return []
    
    def test_busca_produtos(self):
        """Teste de busca por nome e código de barras"""
        # Busca por nome
        try:
            response = self.session.get(f"{self.base_url}/produtos?busca=Arroz")
            if response.status_code == 200:
                produtos = response.json()
                arroz_encontrado = any(p['nome'] == "Arroz 5kg" for p in produtos)
                self.log_test(
                    "Busca por Nome", 
                    arroz_encontrado, 
                    f"Busca 'Arroz' retornou {len(produtos)} produtos"
                )
            else:
                self.log_test("Busca por Nome", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Busca por Nome", False, f"Erro: {str(e)}")
        
        # Busca por código de barras
        try:
            response = self.session.get(f"{self.base_url}/produtos?busca=7891234567890")
            if response.status_code == 200:
                produtos = response.json()
                codigo_encontrado = any(p.get('codigo_barras') == "7891234567890" for p in produtos)
                self.log_test(
                    "Busca por Código de Barras", 
                    codigo_encontrado, 
                    f"Busca por código retornou {len(produtos)} produtos"
                )
            else:
                self.log_test("Busca por Código de Barras", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Busca por Código de Barras", False, f"Erro: {str(e)}")
    
    def test_filtro_categoria(self):
        """Teste de filtro por categoria"""
        try:
            response = self.session.get(f"{self.base_url}/produtos?categoria=Alimentos")
            if response.status_code == 200:
                produtos = response.json()
                todos_alimentos = all(p['categoria'] == "Alimentos" for p in produtos)
                self.log_test(
                    "Filtro por Categoria", 
                    todos_alimentos, 
                    f"Filtro 'Alimentos' retornou {len(produtos)} produtos"
                )
            else:
                self.log_test("Filtro por Categoria", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Filtro por Categoria", False, f"Erro: {str(e)}")
    
    def test_atualizar_produto(self):
        """Teste de atualização de produto"""
        if not self.created_products:
            self.log_test("Atualizar Produto", False, "Nenhum produto criado para testar")
            return
        
        produto = self.created_products[0]
        update_data = {
            "preco_venda": 19.90,
            "quantidade_minima": 8
        }
        
        try:
            response = self.session.put(
                f"{self.base_url}/produtos/{produto['id']}",
                json=update_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                preco_atualizado = data['preco_venda'] == 19.90
                minima_atualizada = data['quantidade_minima'] == 8
                
                self.log_test(
                    "Atualizar Produto", 
                    preco_atualizado and minima_atualizada, 
                    f"Produto atualizado - Preço: {data['preco_venda']}, Mínima: {data['quantidade_minima']}"
                )
            else:
                self.log_test("Atualizar Produto", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Atualizar Produto", False, f"Erro: {str(e)}")
    
    def test_movimentacoes_entrada(self):
        """Teste de movimentação de entrada"""
        if not self.created_products:
            self.log_test("Movimentação Entrada", False, "Nenhum produto criado para testar")
            return
        
        produto = self.created_products[0]
        movimentacao = {
            "produto_id": produto['id'],
            "tipo": "entrada",
            "motivo": "compra",
            "quantidade": 20,
            "preco_unitario": 15.50,
            "observacoes": "Compra para reposição de estoque"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/movimentacoes",
                json=movimentacao,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                quantidade_correta = data['quantidade_nova'] == data['quantidade_anterior'] + 20
                self.log_test(
                    "Movimentação Entrada", 
                    quantidade_correta, 
                    f"Entrada registrada - Anterior: {data['quantidade_anterior']}, Nova: {data['quantidade_nova']}"
                )
                return data
            else:
                self.log_test("Movimentação Entrada", False, f"Status: {response.status_code}", response.text)
                return None
        except Exception as e:
            self.log_test("Movimentação Entrada", False, f"Erro: {str(e)}")
            return None
    
    def test_movimentacoes_saida(self):
        """Teste de movimentação de saída"""
        if not self.created_products:
            self.log_test("Movimentação Saída", False, "Nenhum produto criado para testar")
            return
        
        produto = self.created_products[1]  # Detergente
        movimentacao = {
            "produto_id": produto['id'],
            "tipo": "saida",
            "motivo": "venda",
            "quantidade": 2,
            "preco_unitario": 4.90,
            "observacoes": "Venda para cliente"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/movimentacoes",
                json=movimentacao,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                quantidade_correta = data['quantidade_nova'] == data['quantidade_anterior'] - 2
                self.log_test(
                    "Movimentação Saída", 
                    quantidade_correta, 
                    f"Saída registrada - Anterior: {data['quantidade_anterior']}, Nova: {data['quantidade_nova']}"
                )
                return data
            else:
                self.log_test("Movimentação Saída", False, f"Status: {response.status_code}", response.text)
                return None
        except Exception as e:
            self.log_test("Movimentação Saída", False, f"Erro: {str(e)}")
            return None
    
    def test_validacao_estoque_negativo(self):
        """Teste de validação de estoque insuficiente"""
        if not self.created_products:
            self.log_test("Validação Estoque Negativo", False, "Nenhum produto criado para testar")
            return
        
        produto = self.created_products[1]  # Detergente (deve ter 3 unidades após saída anterior)
        movimentacao = {
            "produto_id": produto['id'],
            "tipo": "saida",
            "motivo": "venda",
            "quantidade": 100,  # Quantidade maior que disponível
            "preco_unitario": 4.90
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/movimentacoes",
                json=movimentacao,
                headers={"Content-Type": "application/json"}
            )
            
            # Deve retornar erro 400
            if response.status_code == 400:
                error_data = response.json()
                self.log_test(
                    "Validação Estoque Negativo", 
                    True, 
                    f"Validação funcionando - Erro: {error_data.get('detail', 'Estoque insuficiente')}"
                )
            else:
                self.log_test(
                    "Validação Estoque Negativo", 
                    False, 
                    f"Deveria retornar erro 400, mas retornou: {response.status_code}"
                )
        except Exception as e:
            self.log_test("Validação Estoque Negativo", False, f"Erro: {str(e)}")
    
    def test_listar_movimentacoes(self):
        """Teste de listagem de movimentações"""
        try:
            response = self.session.get(f"{self.base_url}/movimentacoes")
            if response.status_code == 200:
                movimentacoes = response.json()
                self.log_test(
                    "Listar Movimentações", 
                    True, 
                    f"Encontradas {len(movimentacoes)} movimentações"
                )
                
                # Verificar se há movimentações dos produtos criados
                if self.created_products:
                    produto_ids = [p['id'] for p in self.created_products]
                    movs_produtos = [m for m in movimentacoes if m['produto_id'] in produto_ids]
                    self.log_test(
                        "Movimentações dos Produtos Teste", 
                        len(movs_produtos) > 0, 
                        f"Encontradas {len(movs_produtos)} movimentações dos produtos de teste"
                    )
                
                return movimentacoes
            else:
                self.log_test("Listar Movimentações", False, f"Status: {response.status_code}")
                return []
        except Exception as e:
            self.log_test("Listar Movimentações", False, f"Erro: {str(e)}")
            return []
    
    def test_dashboard(self):
        """Teste do endpoint de dashboard"""
        try:
            response = self.session.get(f"{self.base_url}/dashboard")
            if response.status_code == 200:
                data = response.json()
                
                # Verificar campos obrigatórios
                campos_obrigatorios = [
                    'total_produtos', 'produtos_sem_estoque', 'produtos_estoque_baixo',
                    'produtos_zerados', 'estoque_baixo', 'ultimas_movimentacoes', 'categorias'
                ]
                
                campos_presentes = all(campo in data for campo in campos_obrigatorios)
                
                self.log_test(
                    "Dashboard - Estrutura", 
                    campos_presentes, 
                    f"Dashboard retornado com {len(data)} campos"
                )
                
                # Verificar dados específicos
                if campos_presentes:
                    self.log_test(
                        "Dashboard - Dados", 
                        True, 
                        f"Total produtos: {data['total_produtos']}, "
                        f"Sem estoque: {data['produtos_sem_estoque']}, "
                        f"Estoque baixo: {data['produtos_estoque_baixo']}, "
                        f"Categorias: {len(data['categorias'])}"
                    )
                
                return data
            else:
                self.log_test("Dashboard", False, f"Status: {response.status_code}", response.text)
                return None
        except Exception as e:
            self.log_test("Dashboard", False, f"Erro: {str(e)}")
            return None
    
    def test_categorias(self):
        """Teste do endpoint de categorias"""
        try:
            response = self.session.get(f"{self.base_url}/categorias")
            if response.status_code == 200:
                categorias = response.json()
                
                # Verificar se as categorias dos produtos teste estão presentes
                categorias_esperadas = ["Alimentos", "Limpeza"]
                categorias_encontradas = all(cat in categorias for cat in categorias_esperadas)
                
                self.log_test(
                    "Listar Categorias", 
                    categorias_encontradas, 
                    f"Encontradas {len(categorias)} categorias: {categorias}"
                )
                
                return categorias
            else:
                self.log_test("Listar Categorias", False, f"Status: {response.status_code}")
                return []
        except Exception as e:
            self.log_test("Listar Categorias", False, f"Erro: {str(e)}")
            return []
    
    def test_obter_produto_especifico(self):
        """Teste de obtenção de produto específico por ID"""
        if not self.created_products:
            self.log_test("Obter Produto Específico", False, "Nenhum produto criado para testar")
            return
        
        produto = self.created_products[0]
        try:
            response = self.session.get(f"{self.base_url}/produtos/{produto['id']}")
            if response.status_code == 200:
                data = response.json()
                produto_correto = data['id'] == produto['id'] and data['nome'] == produto['nome']
                self.log_test(
                    "Obter Produto Específico", 
                    produto_correto, 
                    f"Produto obtido: {data['nome']} (ID: {data['id']})"
                )
            else:
                self.log_test("Obter Produto Específico", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Obter Produto Específico", False, f"Erro: {str(e)}")
    
    def test_desativar_produto(self):
        """Teste de desativação de produto"""
        if len(self.created_products) < 2:
            self.log_test("Desativar Produto", False, "Produtos insuficientes para testar")
            return
        
        produto = self.created_products[1]  # Detergente
        try:
            response = self.session.delete(f"{self.base_url}/produtos/{produto['id']}")
            if response.status_code == 200:
                # Verificar se produto foi desativado
                response_check = self.session.get(f"{self.base_url}/produtos/{produto['id']}")
                if response_check.status_code == 200:
                    data = response_check.json()
                    produto_desativado = not data.get('ativo', True)
                    self.log_test(
                        "Desativar Produto", 
                        produto_desativado, 
                        f"Produto desativado: {data['nome']} (ativo: {data.get('ativo', True)})"
                    )
                else:
                    self.log_test("Desativar Produto", False, "Erro ao verificar desativação")
            else:
                self.log_test("Desativar Produto", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Desativar Produto", False, f"Erro: {str(e)}")
    
    def run_all_tests(self):
        """Executa todos os testes na ordem correta"""
        print("=" * 80)
        print("INICIANDO TESTES DO SISTEMA DE CONTROLE DE ESTOQUE")
        print(f"URL Base: {self.base_url}")
        print("=" * 80)
        
        # Testes básicos
        if not self.test_health_check():
            print("❌ FALHA CRÍTICA: API não está respondendo")
            return False
        
        # Testes de CRUD de Produtos
        print("\n📦 TESTANDO CRUD DE PRODUTOS")
        self.test_criar_produtos()
        self.test_listar_produtos()
        self.test_busca_produtos()
        self.test_filtro_categoria()
        self.test_obter_produto_especifico()
        self.test_atualizar_produto()
        
        # Testes de Movimentações
        print("\n📊 TESTANDO SISTEMA DE MOVIMENTAÇÕES")
        self.test_movimentacoes_entrada()
        self.test_movimentacoes_saida()
        self.test_validacao_estoque_negativo()
        self.test_listar_movimentacoes()
        
        # Testes de Dashboard e Relatórios
        print("\n📈 TESTANDO DASHBOARD E RELATÓRIOS")
        self.test_dashboard()
        self.test_categorias()
        
        # Teste de desativação (por último)
        print("\n🗑️ TESTANDO DESATIVAÇÃO")
        self.test_desativar_produto()
        
        # Resumo final
        self.print_summary()
        
        return True
    
    def print_summary(self):
        """Imprime resumo dos testes"""
        print("\n" + "=" * 80)
        print("RESUMO DOS TESTES")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total de testes: {total_tests}")
        print(f"✅ Passou: {passed_tests}")
        print(f"❌ Falhou: {failed_tests}")
        print(f"Taxa de sucesso: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ TESTES QUE FALHARAM:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    tester = StockSystemTester()
    success = tester.run_all_tests()
    
    if not success:
        sys.exit(1)