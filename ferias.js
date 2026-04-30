function verificarAlertas(funcionarios) {
    const lista = document.getElementById('lista-alertas'); if(!lista) return; lista.innerHTML = '';
    let temAlerta = false; const hoje = new Date();

    funcionarios.forEach(f => {
        if(f.status === 'Demitido' || !f.dataAdmissao) return;
        const v = new Date(f.dataAdmissao + "T00:00:00"); v.setFullYear(v.getFullYear() + 2); 
        const difMeses = (v.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24 * 30);

        if(difMeses < 0) { lista.innerHTML += `<li>🚨 <strong>${f.nome}</strong>: Férias vencidas! Sujeito a multa.</li>`; temAlerta = true; }
        else if(difMeses <= 2) { lista.innerHTML += `<li>⚠️ <strong>${f.nome}</strong>: Férias vencendo em breve. Agende logo!</li>`; temAlerta = true; }
    });
    if(!temAlerta) lista.innerHTML = '<li style="color: var(--texto-cinza);">Nenhum alerta de férias no momento.</li>';
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
        
        let statusBadge = '';
        if (difDias < 0) statusBadge = '<span class="badge" style="background:#FFF0F0; color:#B23434; border:1px solid #B23434;">🔴 Vencidas</span>';
        else if (difDias <= 90) statusBadge = '<span class="badge" style="background:#FFF6E5; color:#B27B16; border:1px solid #B27B16;">🟡 Atenção</span>';
        else statusBadge = '<span class="badge" style="background:#E6FAFB; color:#008A8F;">🟢 No Prazo</span>';
        
        let emGozo = false;
        historico.forEach(h => { const dS = new Date(h.saida + "T00:00:00"); const dR = new Date(h.retorno + "T00:00:00"); if(hoje >= dS && hoje <= dR) emGozo = true; });
        if(emGozo) statusBadge = '<span class="badge" style="background:#EBF4FF; color:#1E3A8A; border:1px solid #1E3A8A;">🔵 Em Gozo</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${statusBadge}</td><td><strong>${f.nome}</strong></td><td style="font-size: 13px;">${formatarDataBR(f.dataAdmissao)} a ${formatarDataBR(vencimento.toISOString().split('T')[0])}</td><td><strong style="color:${diasHaver===0?'#B23434':'#008A8F'}; font-size:16px;">${diasHaver}</strong> <span style="font-size:12px;color:var(--texto-cinza);">dias</span></td><td><button class="btn-acao btn-perfil" onclick="abrirModalFerias(${f.id})">Agendar / Histórico</button></td>`; tb.appendChild(tr);
    });
}

function filtrarTabelaFerias() { const b = document.getElementById('inputBuscaFerias').value.toLowerCase(); document.querySelectorAll('#tabelaFerias tbody tr').forEach(tr => tr.style.display = tr.innerText.toLowerCase().includes(b) ? '' : 'none'); }

function abrirModalFerias(id) {
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; const f = fs.find(x => x.id === id); if(!f) return;
    document.getElementById('modal-ferias-id').value = id; document.getElementById('modal-ferias-nome').innerText = f.nome;
    document.getElementById('modal-saida').value = ''; document.getElementById('modal-retorno').value = ''; document.getElementById('modal-dias').value = '';
    
    let hist = f.controle?.historicoFerias || []; let diasTirados = hist.reduce((acc, curr) => acc + Number(curr.dias), 0); let diasHaver = 30 - diasTirados;
    document.getElementById('modal-dias-haver').innerText = diasHaver; document.getElementById('modal-dias-haver').style.color = diasHaver === 0 ? '#B23434' : '#00C4CC';
    
    let ul = document.getElementById('modal-historico'); ul.innerHTML = '';
    hist.forEach((h, index) => { ul.innerHTML += `<li style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #E2E8F0;"><span>📅 ${formatarDataBR(h.saida)} até ${formatarDataBR(h.retorno)}</span><span><strong style="color:var(--perigo);">- ${h.dias} dias</strong> <button onclick="excluirHistoricoFerias(${id}, ${index})" style="background:none;border:none;color:red;cursor:pointer;margin-left:10px;" title="Excluir">✖</button></span></li>`; });
    if(hist.length === 0) ul.innerHTML = '<li style="color:#718096">Nenhum dia tirado neste período.</li>';
    document.getElementById('modal-ferias').style.display = 'flex';
}

function fecharModalFerias() { document.getElementById('modal-ferias').style.display = 'none'; }

function calcularDiasModal() {
    const s = document.getElementById('modal-saida').value; const r = document.getElementById('modal-retorno').value;
    if(s && r) { const dif = (new Date(r + "T00:00:00") - new Date(s + "T00:00:00")) / (1000 * 3600 * 24); document.getElementById('modal-dias').value = dif > 0 ? dif : 0; }
}

function salvarAgendamentoFerias() {
    const id = Number(document.getElementById('modal-ferias-id').value); const saida = document.getElementById('modal-saida').value; const retorno = document.getElementById('modal-retorno').value; const dias = Number(document.getElementById('modal-dias').value);
    if(!saida || !retorno || dias <= 0) { mostrarToast('Preencha datas de Saída e Retorno válidas!', 'error'); return; }
    
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; const i = fs.findIndex(x => x.id === id);
    if(i !== -1) {
        if(!fs[i].controle) fs[i].controle = {}; if(!fs[i].controle.historicoFerias) fs[i].controle.historicoFerias = [];
        let diasTirados = fs[i].controle.historicoFerias.reduce((acc, curr) => acc + Number(curr.dias), 0);
        if (30 - diasTirados - dias < 0) { mostrarToast('Saldo de dias insuficiente!', 'error'); return; }
        
        fs[i].controle.historicoFerias.push({saida, retorno, dias}); localStorage.setItem('listaFuncionarios', JSON.stringify(fs));
        mostrarToast('Dias descontados com sucesso!'); abrirModalFerias(id); atualizarTabelaFerias(); atualizarDashboard(fs);
    }
}

function excluirHistoricoFerias(idFunc, indexHist) {
    if(confirm("Cancelar este agendamento e devolver os dias pro saldo?")) {
        let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; const i = fs.findIndex(x => x.id === idFunc);
        if(i !== -1 && fs[i].controle?.historicoFerias) { fs[i].controle.historicoFerias.splice(indexHist, 1); localStorage.setItem('listaFuncionarios', JSON.stringify(fs)); mostrarToast('Agendamento cancelado. Dias estornados!'); abrirModalFerias(idFunc); atualizarTabelaFerias(); atualizarDashboard(fs); }
    }
}
