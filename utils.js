function mostrarToast(msg, tipo = 'success') {
    const c = document.getElementById('toast-container'); if (!c) return;
    const t = document.createElement('div'); t.className = `toast ${tipo}`; t.innerHTML = `<span>${tipo==='success'?'✅':'⚠️'}</span> ${msg}`;
    c.appendChild(t); setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 3000);
}

function formatarMoeda(e) { let v = e.target.value.replace(/\D/g, ""); v = (Number(v) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); e.target.value = v; }
function formatarDataBR(dataISO) { if (!dataISO) return ''; const p = dataISO.split('-'); return p.length===3 ? `${p[2]}/${p[1]}/${p[0]}` : dataISO; }

document.getElementById('salario')?.addEventListener('input', formatarMoeda);
document.getElementById('decimoValorAdiantado')?.addEventListener('input', formatarMoeda);
document.getElementById('cpf')?.addEventListener('input', (e) => { let v = e.target.value.replace(/\D/g, ""); v = v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"); e.target.value = v; });
document.getElementById('cep')?.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2"); });

async function buscarCEP(cep) {
    const limpo = cep.replace(/\D/g, ''); if (limpo.length === 8) {
        try { const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`); const data = await res.json();
            if (!data.erro) { document.getElementById('logradouro').value = data.logradouro; document.getElementById('bairro').value = data.bairro; document.getElementById('cidade').value = data.localidade; document.getElementById('uf').value = data.uf; document.getElementById('numeroEnd').focus(); 
            } else mostrarToast('CEP não encontrado.', 'error');
        } catch (e) { mostrarToast('Erro no CEP.', 'error'); }
    }
}

function mudarAba(e, id) {
    document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('ativo'));
    document.querySelectorAll('.main-content > .aba').forEach(t => t.classList.remove('ativa'));
    if (e?.target?.classList.contains('menu-item')) e.target.classList.add('ativo');
    document.getElementById(id)?.classList.add('ativa');
}

function mudarAbaForm(id) {
    document.querySelectorAll('.btn-form-tab').forEach(b => b.classList.remove('ativo')); document.querySelectorAll('.form-tab-content').forEach(c => c.style.display = 'none');
    if (window.event && window.event.target) window.event.target.classList.add('ativo');
    const tab = document.getElementById(id); if(tab) tab.style.display = id === 'tab-notas' ? 'block' : 'grid';
}

function processarArquivo(input) { return new Promise((resolve) => { if (!input||!input.files||input.files.length===0) resolve(null); else { const l = new FileReader(); l.onload = (e) => resolve({ nome: input.files[0].name, base64: e.target.result }); l.readAsDataURL(input.files[0]); } }); }
