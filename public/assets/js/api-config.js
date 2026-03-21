// Configuração da API
const API_CONFIG = {
  BASE_URL: window.location.origin,
  ENDPOINTS: {
    AUTH: '/api/auth',
    DASHBOARD: '/api/dashboard',
    RECEITAS: '/api/receitas',
    DESPESAS: '/api/despesas',
    HEALTH: '/api/health'
  }
};

// Classe para gerenciar a API
class AppAPI {
  constructor() {
    const savedToken = localStorage.getItem('app_token');
    this.token =
      savedToken && savedToken !== 'undefined' && savedToken !== 'null'
        ? savedToken
        : null;
    this.user = JSON.parse(localStorage.getItem('app_user') || 'null');
  }

  // Método genérico para requisições
  async request(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const config = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Adicionar token de autenticação se existir
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      console.log(`🔗 API Request: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      const data = await response.json();

      console.log(`📦 API Response: ${response.status}`, data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ API Error: ${error.message}`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      return await this.request(API_CONFIG.ENDPOINTS.HEALTH);
    } catch (_error) {
      // Compatibilidade com execução fora do Vercel.
      return this.request('/health');
    }
  }

  // Login
  async login(login, senha) {
    const data = await this.request(API_CONFIG.ENDPOINTS.AUTH, {
      method: 'POST',
      body: JSON.stringify({
        action: 'login',
        login,
        senha
      })
    });

    if (data.success) {
      this.user = data.user;

      if (typeof data.token === 'string' && data.token.length > 0) {
        this.token = data.token;
        localStorage.setItem('app_token', this.token);
      } else {
        this.token = null;
        localStorage.removeItem('app_token');
      }

      localStorage.setItem('app_user', JSON.stringify(this.user));
    }

    return data;
  }

  // Logout
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('app_token');
    localStorage.removeItem('app_user');
  }

  // Verificar se está autenticado
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Dashboard
  async getDashboard() {
    return this.request(API_CONFIG.ENDPOINTS.DASHBOARD);
  }

  // Receitas
  async getReceitas() {
    return this.request(API_CONFIG.ENDPOINTS.RECEITAS);
  }

  async createReceita(receita) {
    return this.request(API_CONFIG.ENDPOINTS.RECEITAS, {
      method: 'POST',
      body: JSON.stringify(receita)
    });
  }

  // Despesas
  async getDespesas() {
    return this.request(API_CONFIG.ENDPOINTS.DESPESAS);
  }

  async createDespesa(despesa) {
    return this.request(API_CONFIG.ENDPOINTS.DESPESAS, {
      method: 'POST',
      body: JSON.stringify(despesa)
    });
  }
}

// Instância global da API
window.appAPI = new AppAPI();

// Utilitários
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;

  const colors = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };

  alertDiv.style.background = colors[type] || colors.info;
  document.body.appendChild(alertDiv);

  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.parentNode.removeChild(alertDiv);
    }
  }, 5000);
}

// Verificar conexão com API
async function checkAPIConnection() {
  try {
    const health = await window.appAPI.healthCheck();
    console.log('✅ API conectada:', health);
    return true;
  } catch (error) {
    console.error('❌ API não disponível:', error);
    showAlert('Servidor não disponível. Verifique se o backend está rodando.', 'error');
    return false;
  }
}

// Exportar para uso global
window.AppUtils = {
  formatCurrency,
  formatDate,
  showAlert,
  checkAPIConnection
};
