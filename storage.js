function exportarBackup() { 
    const b = JSON.stringify({ 
        func: JSON.parse(localStorage.getItem('listaFuncionarios')||'[]'), 
        notas: JSON.parse(localStorage.getItem('notasCalendario')||'{}') 
    }); 
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(new Blob([b], {type:'application/json'})); 
    a.download = `rh_backup.json`; 
    a.click(); 
    mostrarToast("Exportado!"); 
}

function importarBackup(e) { 
    const l = new FileReader(); 
    l.onload = (ev) => { 
        try{ 
            const d = JSON.parse(ev.target.result); 
            if(d.func) localStorage.setItem('listaFuncionarios', JSON.stringify(d.func)); 
            if(d.notas) localStorage.setItem('notasCalendario', JSON.stringify(d.notas)); 
            atualizarTabela(); 
            if(typeof atualizarTabelaFerias === 'function') atualizarTabelaFerias(); 
            renderizarCalendario(); 
            mostrarToast("Restaurado!"); 
        }catch(err){mostrarToast("Erro","error");} 
    }; 
    l.readAsText(e.target.files[0]); 
}

let dCal = new Date(); let dSelNota = null; 
const mN = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function renderizarCalendario() { 
    const mD = document.getElementById('mes-ano-display'); 
    const dG = document.getElementById('dias-grid'); 
    if(!mD||!dG) return; 
    const a = dCal.getFullYear(); 
    const m = dCal.getMonth(); 
    mD.innerText = `${mN[m]} ${a}`; 
    dG.innerHTML = ''; 
    const p = new Date(a, m, 1).getDay(); 
    const u = new Date(a, m + 1, 0).getDate(); 
    const h = new Date(); 
    const notas = JSON.parse(localStorage.getItem('notasCalendario')) || {}; 
    for (let i = 0; i < p; i++) dG.innerHTML += `<div class="dia-cal dia-vazio"></div>`; 
    for (let d = 1; d <= u; d++) { 
        const dtStr = `${a}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; 
        let c = ''; 
        if (d===h.getDate() && m===h.getMonth() && a===h.getFullYear()) c += ' dia-hoje'; 
        if (notas[dtStr] && notas[dtStr].trim() !== '') c += ' tem-nota'; 
        dG.innerHTML += `<div class="dia-cal ${c}" onclick="abrirNotasDia('${dtStr}', ${d})">${d}</div>`; 
    } 
}

function mudarMes(dir) { dCal.setMonth(dCal.getMonth() + dir); fecharNotasDia(); renderizarCalendario(); }

function abrirNotasDia(dt, d) { 
    dSelNota = dt; 
    document.getElementById('painel-notas-dia').style.display='block'; 
    document.getElementById('titulo-notas-dia').innerText=`Anotações: ${d} ${mN[dCal.getMonth()]}`; 
    document.getElementById('texto-nota-dia').value=(JSON.parse(localStorage.getItem('notasCalendario'))||{})[dt]||''; 
}

function fecharNotasDia() { document.getElementById('painel-notas-dia').style.display='none'; dSelNota=null; }

function salvarNotaDia() { 
    if(!dSelNota)return; 
    let n = JSON.parse(localStorage.getItem('notasCalendario'))||{}; 
    n[dSelNota]=document.getElementById('texto-nota-dia').value; 
    localStorage.setItem('notasCalendario', JSON.stringify(n)); 
    mostrarToast("Salvo!"); 
    renderizarCalendario(); 
}

// NOVA FUNÇÃO: IMPORTAR EXCEL (CSV)
function importarDadosCSV(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = function(event) {
        const conteudo = event.target.result;
        const linhas = conteudo.split(/\r?\n/);
        let fs = JSON.parse(localStorage.getItem('listaFuncionarios')) || [];
        for (let i = 1; i < linhas.length; i++) {
            if (linhas[i].trim() === "") continue;
            const col = linhas[i].split(',').map(item => item.replace(/"/g, "").trim());
            if (!fs.find(f => f.cpf === col[2])) {
                fs.push({
                    id: Date.now() + i,
                    status: col[0] || 'Ativo', nome: col[1], cpf: col[2], nascimento: col[3], cargo: col[4], dataAdmissao: col[5], salario: col[6],
                    dadosBancarios: { banco: col[7] || '', conta: col[8] || '' },
                    controle: { decimoStatus: 'Não Solicitado', historicoFerias: [] },
                    dependentes: [], documentos: {}
                });
            }
        }
        localStorage.setItem('listaFuncionarios', JSON.stringify(fs));
        atualizarTabela();
        if(typeof atualizarTabelaFerias === 'function') atualizarTabelaFerias();
        mostrarToast("Importação concluída!");
        e.target.value = "";
    };
    leitor.readAsText(arquivo, 'UTF-8');
}
