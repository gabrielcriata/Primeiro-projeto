function verificarStatus() { const s = document.getElementById('statusFunc').value; const b = document.getElementById('boxDemissao'); if(b) { b.style.display = s === 'Demitido' ? 'block' : 'none'; if(s !== 'Demitido') document.getElementById('dataDemissao').value = ''; } }

let contadorDep = 0;
function adicionarDependente(n='', d='') { contadorDep++; const c = document.getElementById('lista-dependentes-container'); if(!c) return; const div = document.createElement('div'); div.className = 'dependente-item'; div.id = `dep-${contadorDep}`; div.innerHTML = `<div style="flex:2;"><label>Nome</label><input type="text" class="dep-nome" value="${n}"></div><div style="flex:1;"><label>Nasc.</label><input type="date" class="dep-nasc" value="${d}"></div><button type="button" class="btn-acao btn-excluir" onclick="document.getElementById('dep-${contadorDep}').remove()" style="height:48px; margin-bottom:2px;">Remover</button>`; c.appendChild(div); }
function limparDependentes() { const c = document.getElementById('lista-dependentes-container'); if(c) c.innerHTML = ''; contadorDep = 0; }

function atualizarDashboard(funcs) {
    const c = document.getElementById('contador-funcionarios'); if(c) c.innerText = funcs.filter(f=>f.status!=='Demitido').length;
    const l = document.getElementById('lista-aniversariantes');
    if(l) {
        l.innerHTML=''; let tm = false; const mA = String(new Date().getMonth()+1).padStart(2,'0');
        funcs.forEach(f => { if(f.status!=='Demitido' && f.nascimento && f.nascimento.split('-')[1]===mA) { tm=true; l.innerHTML+=`<li>🎈 <strong>Dia ${f.nascimento.split('-')[2]}</strong> - ${f.nome}</li>`; } });
        if(!tm) l.innerHTML='<li style="color:#718096">Nenhum neste mês.</li>';
    }
    if (typeof verificarAlertas === 'function') verificarAlertas(funcs);
}

function filtrarTabela() { const b = document.getElementById('inputBusca').value.toLowerCase(); document.querySelectorAll('#tabelaFuncionarios tbody tr').forEach(tr => tr.style.display = tr.innerText.toLowerCase().includes(b) ? '' : 'none'); }

function atualizarTabela() {
    const tb = document.querySelector('#tabelaFuncionarios tbody'); if(!tb) return; tb.innerHTML = '';
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; atualizarDashboard(fs);
    fs.forEach(f => {
        const tr = document.createElement('tr'); const sc = (f.status||'Ativo').replace(/\s+/g,'');
        tr.innerHTML = `<td><span class="badge badge-${sc}">${f.status}</span></td><td><strong>${f.nome}</strong><br><small style="color:#718096">${f.cargo||''}</small></td><td><div class="acoes-container"><button class="btn-acao btn-perfil" onclick="verPerfil(${f.id})">Ver Ficha</button><button class="btn-acao btn-editar" onclick="prepararEdicao(${f.id})">Editar</button></div></td>`; tb.appendChild(tr);
    });
}

let idEditando = null;
function prepararEdicao(id) {
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; const f = fs.find(x => x.id === id);
    if (f) {
        const sV = (i, v) => { const el = document.getElementById(i); if(el) el.value = v||''; }
        sV('nome', f.nome); sV('cpf', f.cpf); sV('dataNascimento', f.nascimento); sV('dataAdmissao', f.dataAdmissao); sV('statusFunc', f.status); sV('dataDemissao', f.dataDemissao); sV('departamento', f.departamento); sV('cargo', f.cargo); sV('salario', f.salario); sV('nomeMae', f.filiacao?.mae); sV('nomePai', f.filiacao?.pai); sV('rg', f.documentosBasicos?.rg); sV('pis', f.documentosBasicos?.pis); sV('reservista', f.documentosBasicos?.reservista); sV('ctpsNumero', f.documentosBasicos?.ctps?.numero); sV('ctpsSerie', f.documentosBasicos?.ctps?.serie); sV('eleitorNumero', f.documentosBasicos?.eleitor?.numero); sV('eleitorZona', f.documentosBasicos?.eleitor?.zona); sV('eleitorSecao', f.documentosBasicos?.eleitor?.secao); sV('banco', f.dadosBancarios?.banco); sV('agencia', f.dadosBancarios?.agencia); sV('conta', f.dadosBancarios?.conta); sV('chavePix', f.dadosBancarios?.chavePix);
        if (typeof f.endereco === 'object') { sV('cep', f.endereco.cep); sV('logradouro', f.endereco.logradouro); sV('numeroEnd', f.endereco.numero); sV('bairro', f.endereco.bairro); sV('cidade', f.endereco.cidade); sV('uf', f.endereco.uf); } else sV('logradouro', f.endereco);
        sV('decimoStatus', f.controle?.decimoStatus || 'Não Solicitado'); sV('decimoValorAdiantado', f.controle?.decimoValorAdiantado); sV('notasInternas', f.notasInternas);
        limparDependentes(); if(f.dependentes) f.dependentes.forEach(d => adicionarDependente(d.nome, d.nascimento));
        verificarStatus(); idEditando = id; document.getElementById('btnSubmit').textContent = "✨ Salvar Alterações";
        mudarAbaForm('tab-dados'); document.querySelectorAll('.menu-item')[1].click();
    }
}

function verPerfil(id) {
    let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; const f = fs.find(x => x.id === id);
    if (f) {
        const endFmt = typeof f.endereco === 'object' && f.endereco.logradouro ? `${f.endereco.logradouro}, ${f.endereco.numero} - ${f.endereco.bairro}. ${f.endereco.cidade}/${f.endereco.uf}. CEP: ${f.endereco.cep}` : (f.endereco||'-');
        let depHtml = f.dependentes?.length ? f.dependentes.map(d=>`<li><strong>${d.nome}</strong> - Nasc: ${formatarDataBR(d.nascimento)}</li>`).join('') : '<li style="color:#718096;">Nenhum</li>';
        const adc = f.controle?.decimoStatus === 'Adiantado (Novembro)' ? `(R$ ${f.controle.decimoValorAdiantado || '0,00'})` : '';
        let hist = f.controle?.historicoFerias || []; let diasTirados = hist.reduce((acc, curr) => acc + Number(curr.dias), 0);
        
        let htmlDocs = '';
        if (f.documentos?.rg) htmlDocs += `<div class="doc-item"><span>📄 RG/CPF: <strong>${f.documentos.rg.nome}</strong></span><a href="${f.documentos.rg.base64}" download="${f.documentos.rg.nome}" class="btn-acao btn-perfil">Baixar</a></div>`;
        if (f.documentos?.ctps) htmlDocs += `<div class="doc-item"><span>📘 CTPS: <strong>${f.documentos.ctps.nome}</strong></span><a href="${f.documentos.ctps.base64}" download="${f.documentos.ctps.nome}" class="btn-acao btn-perfil">Baixar</a></div>`;
        if (htmlDocs === '') htmlDocs = '<p style="color: #718096; margin-top: 10px;">Nenhum anexo.</p>';

        document.getElementById('conteudo-perfil').innerHTML = `
            <div class="print-header-oficial"><h1 style="text-align:center; font-size:20px; font-weight:bold; border-bottom:2px solid black; padding-bottom:10px; margin-bottom:20px;">FICHA DE REGISTRO DE EMPREGADO</h1></div>
            <div class="web-cabecalho-perfil" style="display:flex; align-items:center; gap:15px; margin-bottom:5px;"><h2 style="font-size:26px; margin:0;">${f.nome}</h2><span class="badge badge-${(f.status||'Ativo').replace(/\s+/g,'')} hide-on-print">${f.status||'Ativo'}</span></div>
            <p class="web-cabecalho-perfil" style="color:#718096; font-size:16px;">${f.cargo} • ${f.departamento}</p>
            ${f.status==='Demitido'?`<p style="color:#B23434; font-weight:bold; margin-top:5px;">Demitido em: ${formatarDataBR(f.dataDemissao)}</p>`:''}
            
            <h3 class="print-section-title" style="margin-bottom:15px; margin-top:25px; font-size:18px; color:var(--primaria);">Dados Gerais e Endereço</h3>
            <div class="perfil-grid print-grid"><div class="perfil-info print-box"><strong>CPF</strong><p>${f.cpf}</p></div><div class="perfil-info print-box"><strong>Nasc.</strong><p>${formatarDataBR(f.nascimento)}</p></div><div class="perfil-info print-box" style="grid-column: span 2;"><strong>Endereço</strong><p>${endFmt}</p></div><div class="perfil-info print-box"><strong>Mãe</strong><p>${f.filiacao?.mae||'-'}</p></div><div class="perfil-info print-box"><strong>Pai</strong><p>${f.filiacao?.pai||'-'}</p></div></div>
            <h3 class="print-section-title" style="margin-bottom:15px; margin-top:25px; font-size:18px; color:var(--primaria);">Documentação</h3>
            <div class="perfil-grid print-grid"><div class="perfil-info print-box"><strong>RG / PIS</strong><p>${f.documentosBasicos?.rg||'-'} / ${f.documentosBasicos?.pis||'-'}</p></div><div class="perfil-info print-box"><strong>CTPS / Série</strong><p>${f.documentosBasicos?.ctps?.numero||'-'} / ${f.documentosBasicos?.ctps?.serie||'-'}</p></div><div class="perfil-info print-box" style="grid-column: span 2;"><strong>Título de Eleitor (Nº - Z/S)</strong><p>${f.documentosBasicos?.eleitor?.numero||'-'} (Z: ${f.documentosBasicos?.eleitor?.zona||'-'} / S: ${f.documentosBasicos?.eleitor?.secao||'-'})</p></div></div>
            <h3 class="print-section-title" style="margin-bottom:15px; margin-top:25px; font-size:18px; color:var(--primaria);">Contrato e Banco</h3>
            <div class="perfil-grid print-grid"><div class="perfil-info print-box"><strong>Admissão</strong><p>${formatarDataBR(f.dataAdmissao)}</p></div><div class="perfil-info print-box"><strong>Salário</strong><p>${f.salario||'-'}</p></div><div class="perfil-info print-box"><strong>Banco / Agência</strong><p>${f.dadosBancarios?.banco||'-'} / ${f.dadosBancarios?.agencia||'-'}</p></div><div class="perfil-info print-box"><strong>Conta / PIX</strong><p>${f.dadosBancarios?.conta||'-'} / ${f.dadosBancarios?.chavePix||'-'}</p></div></div>
            <h3 class="print-section-title" style="margin-bottom:15px; margin-top:25px; font-size:18px; color:var(--primaria);">Dependentes</h3>
            <div class="perfil-info print-box" style="margin-bottom: 20px;"><ul class="lista-simples" style="margin-top:0;">${depHtml}</ul></div>
            
            <h3 class="print-section-title hide-on-print" style="margin-bottom:15px; margin-top:25px; font-size:18px; color:var(--secundaria);">Controle Interno (RH)</h3>
            <div class="perfil-grid hide-on-print" style="background: #E6FAFB; padding: 20px; border-radius: 12px; border: 1px solid #00C4CC;">
                <div class="perfil-info" style="background: transparent;"><strong>Férias (Neste Período)</strong><p>Saldo: ${30 - diasTirados} dias</p></div><div class="perfil-info" style="background: transparent;"><strong>Situação 13º</strong><p>${f.controle?.decimoStatus||'-'} <br>${adc}</p></div><div class="perfil-info" style="background: transparent; grid-column: span 2;"><strong>Anotações Internas</strong><p style="white-space: pre-wrap; font-size: 14px; font-weight: normal;">${f.notasInternas || 'Nenhuma anotação.'}</p></div>
            </div>

            <div class="area-documentos-perfil hide-on-print"><strong>Arquivos Anexados (Não aparecem na impressão)</strong>${htmlDocs}</div>
            <div class="print-signatures-oficial"><div class="linha-assinatura"><hr><p>Assinatura Empregado</p></div><div class="linha-assinatura"><hr><p>Assinatura Empregador</p></div></div>
        `; mudarAba(null, 'tela-perfil');
    }
}

function exportarListaCSV() {
    let f = JSON.parse(localStorage.getItem('listaFuncionarios')) || []; if (f.length === 0) return mostrarToast("Nenhum funcionário cadastrado.", "error");
    let csv = "Status,Nome,CPF,Nascimento,Cargo,Admissao,Salario,Banco,Conta\n"; f.forEach(x => csv += `"${x.status}","${x.nome}","${x.cpf}","${x.nascimento}","${x.cargo}","${x.dataAdmissao}","${x.salario}","${x.dadosBancarios?.banco}","${x.dadosBancarios?.conta}"\n`);
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); link.download = "lista_funcionarios.csv"; link.click();
}

const form = document.getElementById('formFuncionario');
if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault(); const gV = id => document.getElementById(id)?.value.trim()||'';
        const dArr = []; document.querySelectorAll('.dependente-item').forEach(i => { const n = i.querySelector('.dep-nome').value; if(n) dArr.push({nome:n, nascimento:i.querySelector('.dep-nasc').value}); });
        const aRG = await processarArquivo(document.getElementById('docRG')); const aCTPS = await processarArquivo(document.getElementById('docCTPS'));

        let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
        const nF = {
            id: idEditando !== null ? idEditando : Date.now(),
            nome: gV('nome'), cpf: gV('cpf'), nascimento: gV('dataNascimento'), dataAdmissao: gV('dataAdmissao'), status: gV('statusFunc'), dataDemissao: gV('statusFunc')==='Demitido'?gV('dataDemissao'):'',
            departamento: gV('departamento'), cargo: gV('cargo'), salario: gV('salario'), filiacao: { mae: gV('nomeMae'), pai: gV('nomePai') },
            endereco: { cep: gV('cep'), logradouro: gV('logradouro'), numero: gV('numeroEnd'), bairro: gV('bairro'), cidade: gV('cidade'), uf: gV('uf') },
            documentosBasicos: { rg: gV('rg'), pis: gV('pis'), reservista: gV('reservista'), ctps: { numero: gV('ctpsNumero'), serie: gV('ctpsSerie') }, eleitor: { numero: gV('eleitorNumero'), zona: gV('eleitorZona'), secao: gV('eleitorSecao') } },
            dadosBancarios: { banco: gV('banco'), agencia: gV('agencia'), conta: gV('conta'), chavePix: gV('chavePix') },
            controle: { decimoStatus: gV('decimoStatus'), decimoValorAdiantado: gV('decimoValorAdiantado'), historicoFerias: [] },
            notasInternas: gV('notasInternas'), dependentes: dArr, documentos: {}
        };

        if (idEditando === null) { 
            if (aRG) nF.documentos.rg = aRG; if (aCTPS) nF.documentos.ctps = aCTPS; fs.push(nF); mostrarToast("Ficha salva!"); 
        } else { 
            const i = fs.findIndex(f => f.id === idEditando); 
            if(i !== -1) { nF.controle.historicoFerias = fs[i].controle?.historicoFerias || []; nF.documentos.rg = aRG ? aRG : fs[i].documentos?.rg; nF.documentos.ctps = aCTPS ? aCTPS : fs[i].documentos?.ctps; fs[i] = nF; }
            idEditando = null; document.getElementById('btnSubmit').textContent = "✨ Salvar Ficha Completa"; mostrarToast("Ficha atualizada!"); 
        }

        localStorage.setItem('listaFuncionarios', JSON.stringify(fs));
        form.reset(); limparDependentes(); verificarStatus(); atualizarTabela(); if(typeof atualizarTabelaFerias === 'function') atualizarTabelaFerias(); mudarAbaForm('tab-dados'); document.querySelectorAll('.menu-item')[2].click();
    });
}

// INICIALIZAÇÃO DA APLICAÇÃO
window.onload = function() { 
    atualizarTabela(); 
    if(typeof atualizarTabelaFerias === 'function') atualizarTabelaFerias(); 
    if(typeof renderizarCalendario === 'function') renderizarCalendario(); 
};
