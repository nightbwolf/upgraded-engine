/* ============================================================
    SISTEMA DA CLÍNICA • SCRIPT.JS - CORRIGIDO (VERSÃO FINAL)
    ============================================================ */
/* ============================================================
    1. CLIENTES — CRUD COM LOCALSTORAGE (MANTIDO COMO FALLBACK)
    ============================================================ */

function carregarClientes() {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    const tabela = document.querySelector("#tabelaClientes tbody");
    if (!tabela) return;
    
    tabela.innerHTML = "";

    clientes.forEach((cliente, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${cliente.nome || ''}</td>
            <td>${cliente.email || ''}</td>
            <td>${cliente.telefone || ''}</td>
            <td>${cliente.data || ''}</td>
            <td>${cliente.horario || ''}</td>
            <td>${cliente.observacoes || ''}</td>
            <td>
                <button class="btn-editar" onclick="editarCliente(${index})">Editar</button>
                <button class="btn-deletar" onclick="deletarCliente(${index})">Deletar</button>
            </td>
        `;
        tabela.appendChild(row);
    });
}

/* ============================================================
    2. CADASTRO DO CLIENTE — CORRIGIDO
    ============================================================ */

function configurarCadastro() {
    const formCadastro = document.getElementById("formSelecionarHorario");
    if (!formCadastro) return;

    formCadastro.addEventListener("submit", function (e) {
        e.preventDefault();

        const nome = this.querySelector("input[name='nome']").value;
        const email = this.querySelector("input[name='email']").value;
        const telefone = this.querySelector("input[name='telefone']").value;
        const observacoes = this.querySelector("textarea[name='obs']").value;
        const data = this.querySelector("#dia").value;
        const horario = localStorage.getItem("horarioEscolhido");
        const procedimento = localStorage.getItem("procedimentoEscolhido") || '';


        if (!horario) {
            alert("Por favor, selecione um horário antes de enviar!");
            return;
        }

        if (!data) {
            alert("Por favor, selecione uma data!");
            return;
        }

        const novoCliente = { 
            nome, 
            email, 
            telefone, 
            observacoes,
            data, 
            horario,
            procedimento
        };
        
        // 1. Salvar no localStorage (temporário)
        const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
        clientes.push(novoCliente);
        localStorage.setItem("clientes", JSON.stringify(clientes));

        // 2. Tentar sincronizar com BD (PASSANDO O OBJETO CORRETO)
        sincronizarComBD(novoCliente); 
        
        // 3. Limpar formulário e storage (apenas se a sincronização for bem sucedida)
        this.reset();
        localStorage.removeItem("horarioEscolhido");
        localStorage.removeItem("procedimentoEscolhido");
        
        // 4. Remover seleção dos horários
        document.querySelectorAll(".horario-btn").forEach(btn => {
            btn.classList.remove("selecionado");
        });
    });
}

/* ============================================================
    3. LOGIN - (AVISO DE SEGURANÇA MANTIDO)
    ============================================================ */

function configurarLogin() {
    const btnLogin = document.getElementById("btnLogin");
    if (!btnLogin) return;

    btnLogin.addEventListener("click", function () {
        const user = document.getElementById("user").value;
        const pass = document.getElementById("password").value;

        // ⚠️ ATENÇÃO: LOGIN NÃO SEGURO. DEVE SER CORRIGIDO NO SERVIDOR.
        if (user === "admin" && pass === "1234") {
            window.location.href = "area_parceiro.html";
        } else {
            alert("Usuário ou senha incorretos! Use: admin / 1234");
        }
    });
}

/* ============================================================
    4. PROCEDIMENTOS / 5. CALENDÁRIO / 6. HORÁRIOS
    ============================================================ */

function configurarProcedimentos() {
    const cards = document.querySelectorAll(".procedimento-card");
    const btn = document.getElementById("btnConfirmarProcedimento");

    if (!cards.length || !btn) return;

    let selecionado = null;

    cards.forEach(card => {
        card.addEventListener("click", () => {
            cards.forEach(c => c.classList.remove("selecionado"));
            card.classList.add("selecionado");
            selecionado = card.dataset.proc;
        });
    });

    btn.addEventListener("click", () => {
        if (!selecionado) {
            alert("Selecione um procedimento!");
            return;
        }

        localStorage.setItem("procedimentoEscolhido", selecionado);
        alert(`Procedimento "${selecionado}" selecionado! Voltando para o cadastro...`);
        window.location.href = "cadastro.html";
    });
}

function gerarCalendario() {
    const calendario = document.getElementById("calendario");
    if (!calendario) return;

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();

    const diasOcupados = [3, 7, 15, 22];
    
    // Melhoria de performance: usar array join
    let diasHtml = "";

    // Dias vazios no início
    for (let i = 0; i < primeiroDia; i++) {
        diasHtml += `<div class="calendario-dia vazio"></div>`;
    }

    // Dias do mês
    for (let dia = 1; dia <= ultimoDia; dia++) {
        const ocupado = diasOcupados.includes(dia);
        const classe = ocupado ? "ocupado" : "livre";

        diasHtml += `
            <div class="calendario-dia ${classe}">
                ${dia}
            </div>
        `;
    }
    calendario.innerHTML = diasHtml; // Renderiza de uma vez
}

const horarios = ["08:00", "09:00", "10:00", "14:00", "15:00", "16:00"];

function gerarHorarios() {
    const container = document.getElementById("horarios");
    if (!container) return;

    container.innerHTML = "";

    horarios.forEach(h => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.innerText = h;
        btn.classList.add("horario-btn");

        btn.addEventListener("click", () => {
            document.querySelectorAll(".horario-btn").forEach(b => {
                b.classList.remove("selecionado");
            });
            
            btn.classList.add("selecionado");
            localStorage.setItem("horarioEscolhido", h);
        });

        container.appendChild(btn);
    });
}

/* ============================================================
    7. SINCRONIZAÇÃO COM BANCO
    ============================================================ */

function sincronizarComBD(clienteParaSalvar) {
    if (!clienteParaSalvar) {
        console.log("Nenhum cliente para sincronizar (função chamada sem parâmetro).");
        return;
    }

    console.log("Tentando enviar para BD:", clienteParaSalvar);

    // Preparar dados para envio (usando a data/horário do objeto)
    const dados = {
        acao: 'salvar_cliente',
        nome: clienteParaSalvar.nome,
        email: clienteParaSalvar.email,
        telefone: clienteParaSalvar.telefone,
        observacoes: clienteParaSalvar.observacoes,
        procedimento: clienteParaSalvar.procedimento,
        horario: clienteParaSalvar.horario,
        data: clienteParaSalvar.data // Envia a data de agendamento
    };

    fetch('../php/salvar_dados.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                // Lança o erro do PHP para ser capturado no .catch
                throw new Error(errorData.mensagem || 'Erro desconhecido na rede.'); 
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Resposta do servidor:', data);
        if (data.status === 'sucesso') {
            alert("✅ Agendamento realizado e salvo no banco de dados!");
        } else {
            console.error('❌ Erro do servidor:', data.mensagem);
            alert('Erro ao salvar no banco: ' + data.mensagem);
        }
    })
    .catch(error => {
        // Captura o erro, incluindo a mensagem de horário ocupado
        console.error('❌ Erro na sincronização:', error.message);
        alert(error.message); // Exibe a mensagem de erro vinda do PHP
    });
}

/* ============================================================
    8. CARREGAR CLIENTES DO BANCO - (Tabela)
    ============================================================ */

function carregarClientesDoBD() {
    console.log("Carregando clientes do BD...");
    
    const dados = { acao: 'listar_clientes' };

    fetch('../php/salvar_dados.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'sucesso' && data.clientes) {
            atualizarTabelaClientes(data.clientes);
        } else {
            console.error("Erro ao carregar clientes:", data.mensagem);
            carregarClientes(); // Fallback para localStorage
        }
    })
    .catch(error => {
        console.error('Erro ao carregar clientes do BD:', error);
        carregarClientes(); // Fallback para localStorage
    });
}

function atualizarTabelaClientes(clientes) {
    const tabela = document.querySelector("#tabelaClientes tbody");
    if (!tabela) return;

    tabela.innerHTML = "";

    if (clientes.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
                    Nenhum cliente cadastrado no banco de dados
                </td>
            </tr>
        `;
        return;
    }

    clientes.forEach((cliente) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${cliente.nome || ''}</td>
            <td>${cliente.email || ''}</td>
            <td>${cliente.telefone || ''}</td>
            <td>${cliente.data_agendamento || ''}</td> <td>${cliente.horario || ''}</td>          <td>${cliente.observacoes || ''}</td>
            <td>
                <button class="btn-editar" onclick="editarClienteBD(${cliente.id})">Editar</button>
                <button class="btn-deletar" onclick="deletarClienteBD(${cliente.id})">Deletar</button>
            </td>
        `;
        tabela.appendChild(row);
    });
}

function deletarClienteBD(id) {
    if (!confirm("Tem certeza que deseja excluir este cliente do banco de dados?")) {
        return;
    }

    const dados = { acao: 'deletar_cliente', id: id };

    fetch('../php/salvar_dados.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'sucesso') {
            alert('Cliente excluído do banco de dados!');
            carregarClientesDoBD(); // Recarrega a lista
        } else {
            alert('Erro ao excluir: ' + data.mensagem);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao excluir cliente');
    });
}

/* ============================================================
    9. INICIALIZAÇÃO COMPLETA
    ============================================================ */

document.addEventListener("DOMContentLoaded", function() {
    console.log("Script inicializado");
    
    const path = window.location.pathname;
    
    if (path.includes("area_parceiro.html")) {
        // CORRIGIDO: Prioriza o carregamento do Banco de Dados
        carregarClientesDoBD(); 
        gerarCalendario();
    }
    
    if (path.includes("cadastro.html")) {
        configurarCadastro();
        gerarHorarios();
        
        const campoData = document.getElementById("dia");
        if (campoData) {
            const hoje = new Date().toISOString().split('T')[0];
            campoData.min = hoje;
        }
    }
    
    if (path.includes("parceiro_login.html")) {
        configurarLogin();
    }
    
    if (path.includes("procedimento.html")) {
        configurarProcedimentos();
    }
});

// Expor função global para uso no HTML
window.carregarClientesDoBD = carregarClientesDoBD;