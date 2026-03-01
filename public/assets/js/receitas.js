const API_BASE = './api';
const initialReferenceDate = getNextMonthReferenceDate();
let currentMonth = initialReferenceDate.getMonth() + 1;
let currentYear = initialReferenceDate.getFullYear();

checkAuth();
loadReceitas();
setDefaultDate();

function getNextMonthReferenceDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

function setDefaultDate() {
    const defaultDate = new Date(currentYear, currentMonth - 1, 1);
    const isoDate = defaultDate.toISOString().split('T')[0];
    document.getElementById('data').value = isoDate;
}

function updateMonthDisplay() {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth - 1]} ${currentYear}`;
}

function changeMonth(direction) {
    currentMonth += direction;
    
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    } else if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }
    
    updateMonthDisplay();
    setDefaultDate();
    loadReceitas();
}

document.getElementById('receitaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const receita = {
        descricao: document.getElementById('descricao').value,
        valor: parseFloat(document.getElementById('valor').value),
        tipo: document.getElementById('tipo').value,
        data_registro: document.getElementById('data').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/receitas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(receita)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Receita adicionada com sucesso!');
            e.target.reset();
            setDefaultDate();
            loadReceitas();
        } else {
            alert('Erro ao adicionar receita');
        }
    } catch (error) {
        alert('Erro ao conectar ao servidor');
    }
});

async function loadReceitas() {
    updateMonthDisplay();
    
    try {
        const response = await fetch(`${API_BASE}/receitas?mes=${currentMonth}&ano=${currentYear}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalReceitas').textContent = formatCurrency(data.total_geral);
            
            renderReceitas('receitasFixasList', data.receitas_fixas, 'fixa');
            renderReceitas('receitasVariaveisList', data.receitas_variaveis, 'variavel');
        }
    } catch (error) {
        console.error('Erro ao carregar receitas:', error);
    }
}

function renderReceitas(elementId, receitas, tipo) {
    const list = document.getElementById(elementId);
    
    if (receitas.length === 0) {
        list.innerHTML = '<div class="empty-state">Nenhuma receita cadastrada</div>';
        return;
    }
    
    list.innerHTML = receitas.map(r => `
        <div class="item receita">
            <div class="item-info">
                <h4>${r.descricao}</h4>
                <p>${formatDate(r.data_registro)} • ${tipo === 'fixa' ? 'Receita Fixa' : 'Receita Variável'}</p>
            </div>
            <span class="item-value">${formatCurrency(r.valor)}</span>
            <button class="btn-delete" onclick="deleteReceita(${r.id})">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3 6 5 6 21 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
    `).join('');
}

async function deleteReceita(id) {
    if (!confirm('Deseja realmente remover esta receita?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/receitas?id=${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadReceitas();
        } else {
            alert('Erro ao remover receita');
        }
    } catch (error) {
        alert('Erro ao conectar ao servidor');
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

async function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
    }
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}
