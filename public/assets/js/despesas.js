const API_BASE = './api';
const initialReferenceDate = getNextMonthReferenceDate();
let currentMonth = initialReferenceDate.getMonth() + 1;
let currentYear = initialReferenceDate.getFullYear();

checkAuth();
loadDespesas();
setDefaultDate();
toggleParcelas();

function getNextMonthReferenceDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

function setDefaultDate() {
    const defaultDate = new Date(currentYear, currentMonth - 1, 1);
    const isoDate = defaultDate.toISOString().split('T')[0];
    document.getElementById('data').value = isoDate;
}

function toggleParcelas() {
    const tipo = document.getElementById('tipo').value;
    const parcelasGroup = document.getElementById('parcelasGroup');
    const valorPrimeiraGroup = document.getElementById('valorPrimeiraGroup');
    const parcelasInput = document.getElementById('parcelas');
    const valorPrimeiraInput = document.getElementById('valorPrimeira');
    const valorLabel = document.getElementById('valorLabel');
    const isParcelada = tipo === 'parcelada';
    
    if (isParcelada) {
        parcelasGroup.style.display = 'block';
        valorPrimeiraGroup.style.display = 'block';
        parcelasInput.required = true;
        valorLabel.textContent = 'Valor das demais parcelas (R$)';
    } else {
        parcelasGroup.style.display = 'none';
        valorPrimeiraGroup.style.display = 'none';
        parcelasInput.required = false;
        parcelasInput.value = '';
        valorPrimeiraInput.value = '';
        valorLabel.textContent = 'Valor (R$)';
    }
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
    loadDespesas();
}

document.getElementById('despesaForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const tipo = document.getElementById('tipo').value;
    const parcelas = document.getElementById('parcelas').value;
    const valorPrimeira = document.getElementById('valorPrimeira').value;
    
    const despesa = {
        descricao: document.getElementById('descricao').value,
        valor_parcela: parseFloat(document.getElementById('valor').value),
        tipo,
        data_inicio: document.getElementById('data').value,
        parcelas_total: tipo === 'parcelada' 
            ? parseInt(parcelas, 10) 
            : 1
    };

    if (tipo === 'parcelada' && valorPrimeira) {
        despesa.valor_primeira_parcela = parseFloat(valorPrimeira);
    }
    
    try {
        const response = await fetch(`${API_BASE}/despesas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(despesa)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Despesa adicionada com sucesso!');
            e.target.reset();
            setDefaultDate();
            toggleParcelas();
            loadDespesas();
        } else {
            alert(data.message || 'Erro ao adicionar despesa');
        }
    } catch (error) {
        alert('Erro ao conectar ao servidor');
    }
});

async function loadDespesas() {
    updateMonthDisplay();
    
    try {
        const response = await fetch(`${API_BASE}/despesas?mes=${currentMonth}&ano=${currentYear}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalDespesas').textContent = formatCurrency(data.total_geral);
            
            renderDespesas('despesasFixasList', data.despesas_fixas, 'Despesa Fixa');
            renderDespesas('despesasAvulsasList', data.despesas_avulsas, 'Despesa Avulsa');
            renderDespesasParceladas('despesasParceladasList', data.despesas_parceladas);
        }
    } catch (error) {
        console.error('Erro ao carregar despesas:', error);
    }
}

function renderDespesas(elementId, despesas, tipoLabel) {
    const list = document.getElementById(elementId);
    const items = Array.isArray(despesas) ? despesas : [];
    
    if (items.length === 0) {
        list.innerHTML = '<div class="empty-state">Nenhuma despesa cadastrada</div>';
        return;
    }
    
    list.innerHTML = items.map(d => `
        <div class="item despesa">
            <div class="item-info">
                <h4>${d.descricao}</h4>
                <p>${formatDate(d.data_inicio)} • ${tipoLabel}</p>
            </div>
            <span class="item-value">${formatCurrency(d.valor_parcela)}</span>
            <button class="btn-delete" onclick="deleteDespesa(${d.id})">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3 6 5 6 21 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
    `).join('');
}

function renderDespesasParceladas(elementId, despesas) {
    const list = document.getElementById(elementId);
    const items = Array.isArray(despesas) ? despesas : [];
    
    if (items.length === 0) {
        list.innerHTML = '<div class="empty-state">Nenhuma despesa parcelada ativa</div>';
        return;
    }
    
    list.innerHTML = items.map(d => {
        const valorMes = d.valor_parcela_mes ?? d.valor_parcela;
        const valorRegular = d.valor_parcela_regular ?? d.valor_parcela;
        const primeiraDiferente =
            Number.isFinite(Number(d.valor_primeira_parcela)) &&
            Math.abs(Number(d.valor_primeira_parcela) - Number(valorRegular)) > 0.009;
        const detalhePrimeira = primeiraDiferente
            ? `<p>1ª parcela: ${formatCurrency(d.valor_primeira_parcela)} • Demais: ${formatCurrency(valorRegular)}</p>`
            : '';

        return `
        <div class="item despesa">
            <div class="item-info">
                <h4>${d.descricao}</h4>
                <p>Parcela ${d.parcela_atual} de ${d.parcelas_total} (${d.progresso}%)</p>
                ${detalhePrimeira}
                <div class="progress-bar" style="margin-top: 8px;">
                    <div class="progress-fill" style="width: ${d.progresso}%"></div>
                </div>
            </div>
            <span class="item-value">${formatCurrency(valorMes)}</span>
            <button class="btn-delete" onclick="deleteDespesa(${d.id})">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3 6 5 6 21 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
    `;
    }).join('');
}

async function deleteDespesa(id) {
    if (!confirm('Deseja realmente remover esta despesa?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/despesas?id=${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadDespesas();
        } else {
            alert('Erro ao remover despesa');
        }
    } catch (error) {
        alert('Erro ao conectar ao servidor');
    }
}

function formatCurrency(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(0);
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numericValue);
}

function formatDate(dateString) {
    const parsedValue = String(dateString || '').trim();
    if (!parsedValue) return 'Data não informada';

    const date = parsedValue.includes('T')
        ? new Date(parsedValue)
        : new Date(`${parsedValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) return 'Data inválida';
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
