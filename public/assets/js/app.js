const AUTO_REDIRECT_GUARD = 'login-auto-redirect-ts';

// Usar a nova API configurada
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const login = document.getElementById('login').value.trim();
    const senha = document.getElementById('senha').value;
    const btnLogin = document.getElementById('btnLogin');
    
    btnLogin.textContent = 'Entrando...';
    btnLogin.disabled = true;
    
    try {
        // Fazer login usando a API configurada
        const data = await window.appAPI.login(login, senha);
        
        if (data.success) {
            window.AppUtils.showAlert('Login realizado! Redirecionando...', 'success');
            sessionStorage.setItem(AUTO_REDIRECT_GUARD, String(Date.now()));
            // SIMPLES: usar replace para não voltar
            setTimeout(() => {
                window.location.replace('app/');
            }, 1000);
        } else {
            window.AppUtils.showAlert(data.message || 'Falha no login', 'error');
            btnLogin.textContent = 'Entrar';
            btnLogin.disabled = false;
        }
    } catch (error) {
        window.AppUtils.showAlert(`Erro ao conectar: ${error.message}`, 'error');
        btnLogin.textContent = 'Entrar';
        btnLogin.disabled = false;
    }
});

async function hasServerSession() {
    try {
        const data = await window.appAPI.request('/api/auth', {
            method: 'POST',
            body: JSON.stringify({ action: 'check' })
        });

        if (data?.success && data.user) {
            localStorage.setItem('app_user', JSON.stringify(data.user));
            return true;
        }
    } catch (_error) {
        // Sem sessão ativa no servidor.
    }

    return false;
}

// Verificar se usuário já está logado
window.addEventListener('load', async () => {
    const lastAutoRedirect = Number(sessionStorage.getItem(AUTO_REDIRECT_GUARD) || 0);
    const stillCoolingDown = Date.now() - lastAutoRedirect < 3000;
    if (stillCoolingDown) {
        return;
    }

    if (await hasServerSession()) {
        sessionStorage.setItem(AUTO_REDIRECT_GUARD, String(Date.now()));
        console.log('Sessão do servidor válida encontrada, indo para app');
        window.location.replace('app/');
        return;
    }

    sessionStorage.removeItem(AUTO_REDIRECT_GUARD);

    // Evita loop com estado legado sem cookie válido.
    localStorage.removeItem('app_token');
    localStorage.removeItem('app_user');
});

// Função legada para compatibilidade
function showAlert(message, type) {
    const alert = document.getElementById('alert');
    if (alert) {
        alert.textContent = message;
        alert.className = `alert ${type}`;
        alert.style.display = 'block';
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    }
}

async function checkAuth() {
    const user = localStorage.getItem('user');
    
    if (!user && !window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado'))
            .catch(err => console.log('Erro ao registrar Service Worker:', err));
    });
}
