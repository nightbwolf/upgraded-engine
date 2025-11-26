/* ============================================================
   SISTEMA DA CLÍNICA • SCRIPT.JS - CORRIGIDO
   ============================================================ */
/* ============================================================
    1. CLIENTES — CRUD COM LOCALSTORAGE (ATUALIZADO)
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
            <td>${cliente.data || ''}</td>                    <!-- CORRIGIDO -->
            <td>${cliente.horario || ''}</td>                 <!-- CORRIGIDO -->
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
    2. CADASTRO DO CLIENTE — CORRIGIDO E COMPLETO
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
        const data = this.querySelector("#dia").value; // CAPTURAR A DATA
        const horario = localStorage.getItem("horarioEscolhido");

        if (!horario) {
            alert("Por favor, selecione um horário antes de enviar!");
            return;
        }

        if (!data) {
            alert("Por favor, selecione uma data!");
            return;
        }

        // Salvar no localStorage
        const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
        const novoCliente = { 
            nome, 
            email, 
            telefone, 
            observacoes,
            data,           // ADICIONADO
            horario,
            procedimento: localStorage.getItem("procedimentoEscolhido") || ''
        };
        
        clientes.push(novoCliente);
        localStorage.setItem("clientes", JSON.stringify(clientes));

        // Tentar sincronizar com BD
        sincronizarComBD(novoCliente); // PASSAR O CLIENTE COMO PARÂMETRO

        alert("Cadastro realizado com sucesso!");
        this.reset();
        localStorage.removeItem("horarioEscolhido");
        localStorage.removeItem("procedimentoEscolhido");
        
        // Remover seleção dos horários
        document.querySelectorAll(".horario-btn").forEach(btn => {
            btn.classList.remove("selecionado");
        });
    });
}

/* ============================================================
    3. LOGIN - CORRIGIDO
   ============================================================ */

function configurarLogin() {
    const btnLogin = document.getElementById("btnLogin");
    if (!btnLogin) return;

    btnLogin.addEventListener("click", function () {
        const user = document.getElementById("user").value;
        const pass = document.getElementById("password").value;

        if (user === "admin" && pass === "1234") {
            window.location.href = "area_parceiro.html";
        } else {
            alert("Usuário ou senha incorretos! Use: admin / 1234");
        }
    });
}

/* ============================================================
    4. PROCEDIMENTOS - CORRIGIDO
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

/* ============================================================
    5. CALENDÁRIO - CORRIGIDO
   ============================================================ */

function gerarCalendario() {
    const calendario = document.getElementById("calendario");
    if (!calendario) return;

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();

    // Dias ocupados (exemplo)
    const diasOcupados = [3, 7, 15, 22];

    calendario.innerHTML = "";

    // Dias vazios no início
    for (let i = 0; i < primeiroDia; i++) {
        calendario.innerHTML += `<div class="calendario-dia vazio"></div>`;
    }

    // Dias do mês
    for (let dia = 1; dia <= ultimoDia; dia++) {
        const ocupado = diasOcupados.includes(dia);
        const classe = ocupado ? "ocupado" : "livre";

        calendario.innerHTML += `
            <div class="calendario-dia ${classe}">
                ${dia}
            </div>
        `;
    }
}

/* ============================================================
    6. HORÁRIOS DISPONÍVEIS - CORRIGIDO
   ============================================================ */

const horarios = ["08:00", "09:00", "10:00", "14:00", "15:00", "16:00"];

function gerarHorarios() {
    const container = document.getElementById("horarios");
    if (!container) return;

    container.innerHTML = "";

    horarios.forEach(h => {
        const btn = document.createElement("button");
        btn.type = "button"; // Importante: evitar submit do form
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
    7. SINCRONIZAÇÃO COM BANCO - COMPLETAMENTE CORRIGIDA
   ============================================================ */

function sincronizarComBD() {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    const ultimoCliente = clientes[clientes.length - 1];
    
    if (!ultimoCliente) {
        console.log("Nenhum cliente para sincronizar");
        return;
    }

    console.log("Enviando para BD:", ultimoCliente);

    // Preparar dados para envio
    const dados = {
        acao: 'salvar_cliente',
        nome: ultimoCliente.nome || '',
        email: ultimoCliente.email || '',
        telefone: ultimoCliente.telefone || '',
        observacoes: ultimoCliente.observacoes || '',
        procedimento: ultimoCliente.procedimento || '',
        horario: ultimoCliente.horario || ''
    };

    // Enviar para PHP
    fetch('../php/salvar_dados.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // Mudamos para JSON
        },
        body: JSON.stringify(dados) // Envia como JSON
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro na rede: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('Resposta do servidor:', data);
        if (data.status === 'sucesso') {
            console.log('✅ Dados salvos no banco com sucesso!');
            
            // Opcional: Limpar localStorage após sucesso
            // localStorage.removeItem("clientes");
            
        } else {
            console.error('❌ Erro do servidor:', data.mensagem);
            alert('Erro ao salvar no banco: ' + data.mensagem);
        }
    })
    .catch(error => {
        console.error('❌ Erro na sincronização:', error);
        alert('Erro de conexão. Os dados foram salvos localmente.');
    });
}

/* ============================================================
    8. CARREGAR CLIENTES DO BANCO - CORRIGIDO
   ============================================================ */

function carregarClientesDoBD() {
    console.log("Carregando clientes do BD...");
    
    const dados = {
        acao: 'listar_clientes'
    };

    fetch('../php/salvar_dados.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Resposta do BD:", data);
        
        if (data.status === 'sucesso' && data.clientes) {
            atualizarTabelaClientes(data.clientes);
        } else {
            console.error("Erro ao carregar clientes:", data.mensagem);
            // Fallback para localStorage
            carregarClientes();
        }
    })
    .catch(error => {
        console.error('Erro ao carregar clientes do BD:', error);
        // Fallback para localStorage
        carregarClientes();
    });
}

function atualizarTabelaClientes(clientes) {
    const tabela = document.querySelector("#tabelaClientes tbody");
    if (!tabela) return;

    tabela.innerHTML = "";

    if (clientes.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: #666;">
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
            <td>${cliente.observacoes || ''}</td>
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

    const dados = {
        acao: 'deletar_cliente',
        id: id
    };

    fetch('../php/salvar_dados.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
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
    
    // Configurar funcionalidades baseadas na página atual
    const path = window.location.pathname;
    
    if (path.includes("area_parceiro.html")) {
        carregarClientes();
        gerarCalendario();
    }
    
    if (path.includes("cadastro.html")) {
        configurarCadastro();
        gerarHorarios();
        
        // Configurar data mínima para hoje
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

// Função global para carregar clientes (chamada pelo HTML)
window.carregarClientesDoBD = carregarClientesDoBD;