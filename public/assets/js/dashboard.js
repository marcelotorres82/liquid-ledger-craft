const API_BASE = './api';
const initialReferenceDate = getNextMonthReferenceDate();
let currentMonth = initialReferenceDate.getMonth() + 1;
let currentYear = initialReferenceDate.getFullYear();

const CATEGORY_ICON_MAP = {
    casa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 10.5L12 3l9 7.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 9.8V20h13V9.8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 20v-5h4v5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    carro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 14.5l1.5-4.5A2 2 0 0 1 7.4 8.5h9.2a2 2 0 0 1 1.9 1.5L20 14.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.5 15.5h17v3a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-3Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7.5" cy="14.5" r="1" fill="currentColor"/><circle cx="16.5" cy="14.5" r="1" fill="currentColor"/></svg>',
    reserva: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l7.5 2.9v5.3c0 4.1-2.5 7.8-6.4 9.3L12 21l-1.1-.5C7 19 4.5 15.3 4.5 11.2V5.9L12 3Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 12.2l1.8 1.8 3.3-3.6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ferias: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20v-8" stroke-width="2" stroke-linecap="round"/><path d="M5 12a7 7 0 0 1 14 0H5Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 20h16" stroke-width="2" stroke-linecap="round"/></svg>',
    lazer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="7" stroke-width="2"/><path d="M12 8v4l3 2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    default: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="8" stroke-width="2"/><path d="M12 8v4l3 2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

checkAuth();
loadDashboard();

function getNextMonthReferenceDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
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
    loadDashboard();
}

async function loadDashboard() {
    updateMonthDisplay();
    
    try {
        const response = await fetch(`${API_BASE}/dashboard?mes=${currentMonth}&ano=${currentYear}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalReceitas').textContent = formatCurrency(data.receitas.total);
            document.getElementById('receitasFixas').textContent = formatCurrency(data.receitas.fixas);
            document.getElementById('receitasVariaveis').textContent = formatCurrency(data.receitas.variaveis);
            
            document.getElementById('totalDespesas').textContent = formatCurrency(data.despesas.total);
            document.getElementById('despesasFixas').textContent = formatCurrency(data.despesas.fixas);
            document.getElementById('despesasAvulsas').textContent = formatCurrency(data.despesas.avulsas || 0);
            document.getElementById('despesasParceladas').textContent = formatCurrency(data.despesas.parceladas);
            
            const balancoCard = document.getElementById('balancoCard');
            const balancoElement = document.getElementById('balanco');
            balancoElement.textContent = formatCurrency(data.balanco);
            
            balancoCard.classList.remove('positive', 'negative');
            balancoCard.classList.add(data.balanco >= 0 ? 'positive' : 'negative');
            
            renderDistribuicaoSaldo(data.distribuicao_saldo, data.saldo_distribuivel, data.balanco);
            renderGastosDistribuicao(data.gastos_distribuicao, data.despesas.total);
            renderCaixinhas(data.caixinhas);
            renderParcelamentos(data.parcelamentos_ativos);
            loadInsights();
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function normalizeCategoryName(categoria) {
    const text = String(categoria || '').toLowerCase();
    if (text.includes('casa')) return 'casa';
    if (text.includes('carro')) return 'carro';
    if (text.includes('reserva') || text.includes('despesa')) return 'reserva';
    if (text.includes('férias') || text.includes('ferias')) return 'ferias';
    if (text.includes('lazer')) return 'lazer';
    return 'default';
}

function getCategoryIcon(categoria) {
    const key = normalizeCategoryName(categoria);
    return CATEGORY_ICON_MAP[key] || CATEGORY_ICON_MAP.default;
}

function renderDistribuicaoSaldo(distribuicao, saldoDistribuivel, balanco) {
    const section = document.getElementById('distribuicaoSection');
    const list = document.getElementById('distribuicaoList');
    const total = document.getElementById('saldoDistribuivel');

    if (!section || !list || !total) return;

    const itens = Array.isArray(distribuicao) ? distribuicao : [];
    const saldo = Number(saldoDistribuivel || 0);
    total.textContent = formatCurrency(saldo);

    if (itens.length === 0) {
        list.innerHTML = '<div class="empty-state">Distribuição indisponível no momento.</div>';
        return;
    }

    list.innerHTML = itens.map(item => {
        const categoryKey = normalizeCategoryName(item.categoria);
        return `
        <div class="distribuicao-item categoria-${categoryKey}">
            <div class="distribuicao-header">
                <div class="distribuicao-title">
                    <span class="icon-chip categoria-icon" aria-hidden="true">${getCategoryIcon(item.categoria)}</span>
                    <h4>${item.categoria}</h4>
                </div>
                <span class="distribuicao-valor">${formatCurrency(item.valor)}</span>
            </div>
            <p class="distribuicao-percentual">${item.percentual}% do saldo</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${item.percentual}%"></div>
            </div>
        </div>
    `;
    }).join('');

    if (balanco <= 0) {
        list.innerHTML += '<div class="empty-state">Sem saldo positivo neste mês. Valores zerados nas categorias.</div>';
    }
}

function formatPercent(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '0%';
    return `${numeric.toFixed(1).replace('.', ',')}%`;
}

function getMonthLabel(month, year) {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[(Number(month) || 1) - 1]}/${year}`;
}

function renderStackChart(container, items, total, classPrefix) {
    if (!container) return;

    const numericTotal = Number(total || 0);
    if (numericTotal <= 0 || items.length === 0) {
        container.innerHTML = '<div class="chart-empty">Sem valores para exibir.</div>';
        return;
    }

    container.innerHTML = items.map((item) => {
        const itemValue = Number(item.valor || 0);
        const width = Math.max(0, Math.min(100, (itemValue / numericTotal) * 100));
        return `
            <div class="chart-segment ${classPrefix}-${item.key}" style="width: ${width}%"
                 title="${escapeHtml(item.label)}: ${escapeHtml(formatCurrency(itemValue))}"></div>
        `;
    }).join('');
}

function renderGastosDistribuicao(gastos, totalDespesas) {
    const totalElement = document.getElementById('gastosTotal');
    const chartElement = document.getElementById('gastosChartStack');
    const legendElement = document.getElementById('gastosChartLegend');

    if (!totalElement || !chartElement || !legendElement) return;

    const itens = (Array.isArray(gastos) ? gastos : []).map((item) => ({
        key: String(item.chave || '').toLowerCase(),
        label: item.categoria || 'Gasto',
        valor: Number(item.valor || 0),
        percentual: Number(item.percentual || 0),
    }));

    const total = Number(totalDespesas || 0);
    totalElement.textContent = formatCurrency(total);

    renderStackChart(chartElement, itens, total, 'gasto');

    if (itens.length === 0) {
        legendElement.innerHTML = '<div class="empty-state">Sem gastos registrados neste mês.</div>';
        return;
    }

    legendElement.innerHTML = itens.map((item) => `
        <div class="chart-legend-item">
            <span class="chart-dot gasto-${item.key}"></span>
            <span class="chart-label">${escapeHtml(item.label)}</span>
            <span class="chart-value">${formatCurrency(item.valor)}</span>
            <span class="chart-percent">${formatPercent(item.percentual)}</span>
        </div>
    `).join('');
}

function renderCaixinhas(caixinhas) {
    const totalElement = document.getElementById('caixinhasTotal');
    const periodElement = document.getElementById('caixinhasPeriodo');
    const chartElement = document.getElementById('caixinhasChartStack');
    const legendElement = document.getElementById('caixinhasChartLegend');
    const listElement = document.getElementById('caixinhasList');

    if (!totalElement || !periodElement || !chartElement || !legendElement || !listElement) return;

    const categorias = Array.isArray(caixinhas?.categorias) ? caixinhas.categorias : [];
    const totalAcumulado = Number(caixinhas?.total_acumulado || 0);
    const inicio = caixinhas?.inicio_ciclo;
    const meses = Number(caixinhas?.meses_considerados || 0);

    totalElement.textContent = formatCurrency(totalAcumulado);
    if (inicio?.mes && inicio?.ano && meses > 0) {
        periodElement.textContent = `Acumulado desde ${getMonthLabel(inicio.mes, inicio.ano)} (${meses} meses)`;
    } else {
        periodElement.textContent = 'Acumulado do ciclo atual';
    }

    const chartItems = categorias.map((item) => ({
        key: normalizeCategoryName(item.categoria),
        label: item.categoria,
        valor: Number(item.valor_acumulado || 0),
        percentual: Number(item.percentual || 0),
    }));

    renderStackChart(chartElement, chartItems, totalAcumulado, 'caixinha');

    if (categorias.length === 0) {
        legendElement.innerHTML = '<div class="empty-state">Sem dados de caixinhas no momento.</div>';
        listElement.innerHTML = '';
        return;
    }

    legendElement.innerHTML = chartItems.map((item) => `
        <div class="chart-legend-item">
            <span class="chart-dot categoria-${item.key}"></span>
            <span class="chart-label">${escapeHtml(item.label)}</span>
            <span class="chart-value">${formatCurrency(item.valor)}</span>
            <span class="chart-percent">${item.percentual}%</span>
        </div>
    `).join('');

    listElement.innerHTML = categorias.map((item) => {
        const categoryKey = normalizeCategoryName(item.categoria);
        const valorAcumulado = Number(item.valor_acumulado || 0);
        const meta = Number(item.meta);
        const plusEntrada = Number(item.plus);
        const metaPlus = Number(item.meta_plus);
        const hasMeta = Number.isFinite(meta) && meta > 0;
        const hasPlus = Number.isFinite(metaPlus) && metaPlus > 0;
        const progressoMeta = Number.isFinite(Number(item.progresso_meta)) ? Number(item.progresso_meta) : 0;
        const progressoPlus = Number.isFinite(Number(item.progresso_plus)) ? Number(item.progresso_plus) : 0;
        const faltanteMeta = Number(item.faltante_meta || 0);
        const faltantePlus = Number(item.faltante_plus || 0);

        return `
            <div class="caixinha-item categoria-${categoryKey}">
                <div class="distribuicao-header">
                    <div class="distribuicao-title">
                        <span class="icon-chip categoria-icon" aria-hidden="true">${getCategoryIcon(item.categoria)}</span>
                        <h4>${escapeHtml(item.categoria)}</h4>
                    </div>
                    <span class="distribuicao-valor">${formatCurrency(valorAcumulado)}</span>
                </div>
                <p class="caixinha-targets">${hasMeta ? `Meta: ${formatCurrency(meta)}` : 'Meta: não definida'}${hasPlus ? ` • Plus: ${formatCurrency(metaPlus)}${Number.isFinite(plusEntrada) && plusEntrada > 0 && plusEntrada <= meta ? ` (${formatCurrency(plusEntrada)} extra)` : ''}` : ''}</p>
                ${
                    hasMeta
                        ? `
                <div class="caixinha-progress-line">
                    <span>Meta</span>
                    <span>${formatPercent(progressoMeta)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.max(0, Math.min(100, progressoMeta))}%"></div>
                </div>
                <p class="caixinha-status">${faltanteMeta > 0 ? `Faltam ${formatCurrency(faltanteMeta)} para a meta` : 'Meta principal concluída'}</p>
                        `
                        : '<p class="caixinha-status">Defina uma meta para acompanhar o progresso desta caixinha.</p>'
                }
                ${
                    hasPlus
                        ? `
                <div class="caixinha-progress-line secondary">
                    <span>Plus</span>
                    <span>${formatPercent(progressoPlus)}</span>
                </div>
                <div class="progress-bar progress-plus">
                    <div class="progress-fill" style="width: ${Math.max(0, Math.min(100, progressoPlus))}%"></div>
                </div>
                <p class="caixinha-status">${faltantePlus > 0 ? `Faltam ${formatCurrency(faltantePlus)} para o plus` : 'Meta plus concluída'}</p>
                        `
                        : ''
                }
            </div>
        `;
    }).join('');
}

function renderParcelamentos(parcelamentos) {
    const section = document.getElementById('parcelamentosSection');
    const list = document.getElementById('parcelamentosList');
    
    if (parcelamentos.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    list.innerHTML = parcelamentos.map(p => `
        <div class="parcelamento-item">
            <div class="parcelamento-header">
                <div class="parcelamento-title">
                    <span class="icon-chip parcelamento-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="6" width="18" height="12" rx="2.5" stroke-width="2"/>
                            <path d="M3 10.5h18" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </span>
                    <h4>${p.descricao}</h4>
                </div>
                <span class="parcelamento-valor">${formatCurrency(p.valor_parcela)}</span>
            </div>
            <p class="parcela-info">Parcela ${p.parcela_atual} de ${p.parcelas_total}</p>
            ${
                Number.isFinite(Number(p.valor_primeira_parcela)) &&
                Math.abs(Number(p.valor_primeira_parcela) - Number(p.valor_parcela_regular || p.valor_parcela)) > 0.009
                    ? `<p class="parcela-info">1ª: ${formatCurrency(p.valor_primeira_parcela)} • Demais: ${formatCurrency(p.valor_parcela_regular)}</p>`
                    : ''
            }
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${p.progresso}%"></div>
            </div>
        </div>
    `).join('');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildInsightMarkup(text) {
    const normalized = String(text || '').trim();
    if (!normalized) {
        return '<p style="color: var(--text-secondary);">Nenhum insight disponível no momento.</p>';
    }

    const lines = normalized
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
    const bulletLines = lines
        .filter(line => /^[•\-*]/.test(line))
        .map(line => line.replace(/^[•\-*]\s*/, '').trim())
        .filter(Boolean);

    if (bulletLines.length > 0) {
        const introLines = lines.filter(line => !/^[•\-*]/.test(line));
        const introMarkup = introLines.length > 0
            ? `<p>${escapeHtml(introLines.join(' ')).replace(/\n/g, '<br>')}</p>`
            : '';
        const listMarkup = `<ul>${bulletLines.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`;
        return `${introMarkup}${listMarkup}`;
    }

    return `<p>${escapeHtml(normalized).replace(/\n/g, '<br>')}</p>`;
}

function renderInsightContent(container, text, hint = '') {
    const hintMarkup = hint
        ? `<p class="insight-hint">${escapeHtml(hint)}</p>`
        : '';
    container.innerHTML = `${buildInsightMarkup(text)}${hintMarkup}`;
}

async function loadInsights() {
    const insightsContent = document.getElementById('insightsContent');
    insightsContent.innerHTML = '<p class="loading">Carregando insights...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/insights?mes=${currentMonth}&ano=${currentYear}`);
        const rawBody = await response.text();
        let data = null;
        try {
            data = rawBody ? JSON.parse(rawBody) : null;
        } catch (_) {
            data = null;
        }
        
        if (response.ok && data?.success) {
            const hint = data.warning || (data.source === 'fallback' ? (data.message || 'Insight local gerado sem IA.') : '');
            renderInsightContent(insightsContent, data.insight, hint);
        } else {
            const message = data?.message || 'Clique em "Atualizar" para gerar insights com IA';
            insightsContent.innerHTML = `<p style="color: var(--text-secondary);">${escapeHtml(message)}</p>`;
        }
    } catch (error) {
        insightsContent.innerHTML = '<p style="color: var(--danger);">Erro ao carregar insights</p>';
    }
}

async function generateInsights() {
    const btnInsights = document.getElementById('btnInsights');
    const insightsContent = document.getElementById('insightsContent');
    
    btnInsights.textContent = 'Gerando...';
    btnInsights.disabled = true;
    insightsContent.innerHTML = '<p class="loading">Gerando insights com IA...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/insights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mes: currentMonth, ano: currentYear })
        });
        
        const rawBody = await response.text();
        let data = null;
        try {
            data = rawBody ? JSON.parse(rawBody) : null;
        } catch (_) {
            data = null;
        }
        
        if (response.ok && data?.success) {
            const hint = data.warning || (data.source === 'fallback' ? (data.message || 'Insight local gerado sem IA.') : '');
            renderInsightContent(insightsContent, data.insight, hint);
        } else {
            const message = data?.message || 'Erro ao gerar insights';
            insightsContent.innerHTML = `<p style="color: var(--danger);">${escapeHtml(message)}</p>`;
        }
    } catch (error) {
        insightsContent.innerHTML = `<p style="color: var(--danger);">${escapeHtml(`Erro ao conectar ao servidor: ${error?.message || 'tente novamente'}`)}</p>`;
    } finally {
        btnInsights.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="23 4 23 10 17 10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Atualizar
        `;
        btnInsights.disabled = false;
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
