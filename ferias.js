function verificarAlertas(funcionarios) {
    const lista = document.getElementById('lista-alertas'); if(!lista) return; lista.innerHTML = '';
    let temAlerta = false; const hoje = new Date();
    funcionarios.forEach(f => {
        if(f.status === 'Demitido' || !f.dataAdmissao) return;
        const v = new Date(f.dataAdmissao + "T00:00:00"); v.setFullYear(v.getFullYear() + 2); 
        const difMeses = (v.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if(difMeses < 0) { lista.innerHTML += `<li>🚨 <strong>${f.nome}</strong>: Férias vencidas!</li>`; temAlerta = true; }
        else if(difMeses <= 2) { lista.innerHTML += `<li>⚠️ <strong>${f.nome}</strong>: Férias vencendo em breve.</li>`; temAlerta = true; }
    });
    if(!temAlerta) lista.innerHTML = '<li style="color: var(--texto-cinza);">Nenhum alerta no momento.</li>';
}

function atualizarTabelaFerias() {
    const tb = document.querySelector('#tabelaFerias tbody'); if(!tb) return; tb.innerHTML = '';
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; const hoje = new Date();
    fs.forEach(f => {
        if(f.status === 'Demitido' || !f.dataAdmissao) return;
        const adm = new Date(f.dataAdmissao + "T00:00:00");
        const vencimento = new Date(adm); vencimento.setFullYear(vencimento.getFullYear() + 1);
        const limiteConcessao = new Date(vencimento); limiteConcessao.setFullYear(limiteConcessao.getFullYear() + 1);
        const difDias = (limiteConcessao.getTime() - hoje.getTime()) / (1000 * 3600 * 24);
        let historico = f.controle?.historicoFerias || [];
        let diasTirados = historico.reduce((acc, curr) => acc + Number(curr.dias), 0);
        let diasHaver = 30 - diasTirados;
        let statusBadge = difDias < 0 ? '🔴 Vencidas' : (difDias <= 90 ? '🟡 Atenção' : '🟢 No Prazo');
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${statusBadge}</td><td><strong>${f.nome}</strong></td><td>${f.dataAdmissao}</td><td>${diasHaver}</td><td><button class="btn-acao btn-perfil" onclick="abrirModalFerias(${f.id})">Agendar</button></td>`; 
        tb.appendChild(tr);
    });
}

function abrirModalFerias(id) {
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; 
    const f = fs.find(x => x.id === id); 
    if(!f) return;

    // GARANTE QUE O MODAL ABRA COMO FLEX PARA O NOVO CSS FUNCIONAR
    const modal = document.getElementById('modal-ferias');
    modal.style.display = 'flex'; 
    
    document.getElementById('modal-ferias-id').value = id; 
    document.getElementById('modal-ferias-nome').innerText = f.nome;
    document.getElementById('modal-saida').value = ''; 
    document.getElementById('modal-retorno').value = ''; 
    document.getElementById('modal-dias').value = '';
    
    let hist = f.controle?.historicoFerias || []; 
    let diasTirados = hist.reduce((acc, curr) => acc + Number(curr.dias), 0); 
    let diasHaver = 30 - diasTirados;
    document.getElementById('modal-dias-haver').innerText = diasHaver;
    
    let ul = document.getElementById('modal-historico'); ul.innerHTML = '';
    hist.forEach((h, index) => { 
        ul.innerHTML += `<li>📅 ${h.saida} até ${h.retorno} (-${h.dias} dias)</li>`; 
    });
}

function fecharModalFerias() { document.getElementById('modal-ferias').style.display = 'none'; }

function calcularDiasModal() {
    const s = document.getElementById('modal-saida').value; 
    const r = document.getElementById('modal-retorno').value;
    if(s && r) { 
        const dif = (new Date(r + "T00:00:00") - new Date(s + "T00:00:00")) / (1000 * 3600 * 24); 
        document.getElementById('modal-dias').value = dif > 0 ? dif : 0; 
    }
}

function salvarAgendamentoFerias() {
    const id = Number(document.getElementById('modal-ferias-id').value);
    const saida = document.getElementById('modal-saida').value; 
    const retorno = document.getElementById('modal-retorno').value; 
    const dias = Number(document.getElementById('modal-dias').value);
    if(!saida || !retorno || dias <= 0) return mostrarToast('Dados inválidos!', 'error');
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; 
    const i = fs.findIndex(x => x.id === id);
    if(i !== -1) {
        if(!fs[i].controle) fs[i].controle = {};
        if(!fs[i].controle.historicoFerias) fs[i].controle.historicoFerias = [];
        fs[i].controle.historicoFerias.push({saida, retorno, dias});
        localStorage.setItem('listaFuncionarios', JSON.stringify(fs));
        mostrarToast('Férias lançadas!');
        fecharModalFerias(); 
        atualizarTabelaFerias();
    }
}
