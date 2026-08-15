export interface User {
  id: number;
  nome: string;
  email: string;
}

export type ReceitaTipo = 'fixa' | 'variavel';

export interface Receita {
  id: number;
  descricao: string;
  valor: number;
  tipo: ReceitaTipo;
  data_registro: string;
  categoria?: string;
  estabelecimento?: string;
  conta?: string;
  origem?: string;
  confianca_ia?: number | null;
  notas?: string;
}

export interface ReceitasResponse {
  success: boolean;
  receitas_fixas: Receita[];
  receitas_variaveis: Receita[];
  total_fixas: number;
  total_variaveis: number;
  total_geral: number;
}

export type DespesaTipo = 'fixa' | 'avulsa' | 'parcelada';

export interface Despesa {
  id: number;
  descricao: string;
  valor_parcela: number;
  valor_primeira_parcela: number | null;
  tipo: DespesaTipo;
  data_inicio: string;
  paga: boolean;
  data_pagamento: string | null;
  parcelas_total: number;
  valor_parcela_mes?: number;
  valor_parcela_regular?: number;
  parcela_atual?: number;
  progresso?: number;
  categoria?: string;
  estabelecimento?: string;
  conta?: string;
  origem?: string;
  confianca_ia?: number | null;
  notas?: string;
}

export interface DespesasResponse {
  success: boolean;
  despesas_fixas: Despesa[];
  despesas_avulsas: Despesa[];
  despesas_parceladas: Despesa[];
  total_fixas: number;
  total_avulsas: number;
  total_parceladas: number;
  total_geral: number;
}

export interface DashboardTotals {
  fixas: number;
  variaveis?: number;
  avulsas?: number;
  parceladas?: number;
  total: number;
}

export interface DistribuicaoSaldoItem {
  categoria: string;
  percentual: number;
  valor: number;
}

export interface GastoDistribuicaoItem {
  categoria: string;
  chave: string;
  valor: number;
  percentual: number;
}

export interface CaixinhaCategoria {
  categoria: string;
  percentual: number;
  valor_acumulado: number;
  meta: number | null;
  plus: number | null;
  meta_plus: number | null;
  faltante_meta: number | null;
  faltante_plus: number | null;
  progresso_meta: number | null;
  progresso_plus: number | null;
}

export interface CaixinhaHistorico {
  mes: number;
  ano: number;
  receitas: number;
  despesas: number;
  saldo_distribuivel: number;
  guardado: number;
  guardado_calculado: number;
  guardado_manual: boolean;
  ajustes: number;
  saldo_zerado: boolean;
}

export interface CaixinhasData {
  inicio_ciclo: {
    mes: number;
    ano: number;
  };
  meses_considerados: number;
  guardado_mes: number;
  guardado_mes_calculado: number;
  guardado_mes_manual: boolean;
  ajustes_mes: number;
  saldo_zerado_mes: boolean;
  total_acumulado: number;
  categorias: CaixinhaCategoria[];
  historico: CaixinhaHistorico[];
}

export interface ParcelamentoAtivo {
  id: number;
  descricao: string;
  valor_parcela: number;
  valor_parcela_regular: number;
  valor_primeira_parcela: number | null;
  parcela_atual: number;
  parcelas_total: number;
  progresso: number;
}

export interface DashboardResponse {
  success: boolean;
  mes: number;
  ano: number;
  receitas: {
    fixas: number;
    variaveis: number;
    total: number;
  };
  despesas: {
    fixas: number;
    avulsas: number;
    parceladas: number;
    total: number;
    pagas: number;
    contas_a_pagar: number;
  };
  balanco: number;
  saldo_distribuivel: number;
  distribuicao_saldo: DistribuicaoSaldoItem[];
  gastos_distribuicao: GastoDistribuicaoItem[];
  caixinhas: CaixinhasData;
  parcelamentos_ativos: ParcelamentoAtivo[];
}

export interface InsightResponse {
  success: boolean;
  insight?: string;
  message?: string;
  warning?: string;
  source?: string;
  model?: string | null;
  updated_at?: string;
  summary?: string;
  insights?: ActionableInsight[];
}

export interface ActionableInsight {
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  description: string;
  evidence: string;
  impact: number;
  recommendation: string;
  actionType: 'none' | 'create_budget' | 'review_expenses' | 'open_savings';
  actionLabel: string;
  actionCategory: string;
  actionAmount: number;
}

export interface SmartTransaction {
  kind: 'income' | 'expense';
  amount: number;
  description: string;
  categoryKey: string;
  categoryLabel: string;
  recordType: 'fixa' | 'variavel' | 'avulsa' | 'parcelada';
  date: string;
  merchant: string;
  account: string;
  installments: number;
  paid: boolean;
  confidence: number;
  notes: string;
  source: string;
}

export interface CopilotResponse {
  success: boolean;
  answer: string;
  headline: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  evidence: string[];
  suggestions: string[];
  source: string;
  model: string;
  degraded?: boolean;
  notice?: string | null;
  action: {
    type: 'none' | 'create_budget' | 'navigate';
    label: string;
    category: string;
    amount: number;
    path: string;
    requiresConfirmation: boolean;
  };
}
