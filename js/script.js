/* ============================================================
   SISTEMA DA CLÍNICA • SCRIPT.JS
   Controle de clientes, login, agenda mensal, horários e
   seleção de procedimentos.
   ============================================================ */


/* ============================================================
    1. CLIENTES — CRUD COM LOCALSTORAGE
   ============================================================ */

// Carrega clientes na tabela da área do parceiro
function carregarClientes() {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    const tabela = document.querySelector("#tabelaClientes tbody");
    if (!tabela) return;

    tabela.innerHTML = "";

    clientes.forEach((cliente, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${cliente.nome}</td>
            <td>${cliente.email}</td>
            <td>${cliente.telefone}</td>
            <td>${cliente.observacoes}</td>
            <td class="td-acoes">
                <button class="btn-editar" onclick="editarCliente(${index})">Editar</button>
                <button class="btn-deletar" onclick="deletarCliente(${index})">Deletar</button>
            </td>
        `;
        tabela.appendChild(row);
    });
}

function editarCliente(index) {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    const c = clientes[index];

    const nome = prompt("Editar Nome:", c.nome);
    if (!nome) return;

    const email = prompt("Editar Email:", c.email);
    if (!email) return;

    const telefone = prompt("Editar Telefone:", c.telefone);
    if (!telefone) return;

    const obs = prompt("Editar Observações:", c.observacoes);

    clientes[index] = { nome, email, telefone, observacoes: obs };
    localStorage.setItem("clientes", JSON.stringify(clientes));
    carregarClientes();
}

function deletarCliente(index) {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    if (confirm("Excluir cliente?")) {
        clientes.splice(index, 1);
        localStorage.setItem("clientes", JSON.stringify(clientes));
        carregarClientes();
    }
}


/* ============================================================
    2. CADASTRO DO CLIENTE + REDIRECIONAMENTO DE ETAPAS
   ============================================================ */

const formCadastro = document.querySelector(".form-cadastro");
if (formCadastro) {
    formCadastro.addEventListener("submit", function (e) {
        e.preventDefault();

        const nome = this.querySelector("input[name=nome]").value;
        const email = this.querySelector("input[name=email]").value;
        const telefone = this.querySelector("input[name=telefone]").value;
        const observacoes = this.querySelector("textarea[name=obs]").value;

        const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
        clientes.push({ nome, email, telefone, observacoes });
        localStorage.setItem("clientes", JSON.stringify(clientes));

        alert("Cadastro realizado! Agora escolha o horário.");
        window.location.href = "../html/procedimento.html";
    });
}


/* ============================================================
    3. LOGIN DO PARCEIRO
   ============================================================ */

document.getElementById("btnLogin")?.addEventListener("click", function () {
    const user = document.getElementById("user").value;
    const pass = document.getElementById("password").value;

    if (user === "admin" && pass === "1234") {
        window.location.href = "area_parceiro.html";
    } else {
        alert("Usuário ou senha incorretos!");
    }
});


/* ============================================================
    4. ESCOLHA DE PROCEDIMENTO
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
        if (!selecionado) return alert("Selecione um procedimento!");

        localStorage.setItem("procedimentoEscolhido", selecionado);
        alert("Procedimento selecionado! Aguarde confirmação.");
    });
}


/* ============================================================
    5. AGENDA MENSAL (PARCEIRO)
   ============================================================ */

function gerarCalendario() {
    const calendario = document.getElementById("calendario");
    if (!calendario) return;

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.toLocaleString("pt-BR", { month: "long" });

    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).getDay();
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();

    // Em um banco real isso seria buscado do servidor
    const diasOcupados = [3, 7, 15, 22];

    calendario.innerHTML = "";

    for (let i = 0; i < primeiroDia; i++) {
        calendario.innerHTML += `<div class="dia vazio"></div>`;
    }

    for (let dia = 1; dia <= ultimoDia; dia++) {
        const ocupado = diasOcupados.includes(dia);
        const classe = ocupado ? "ocupado" : "livre";

        calendario.innerHTML += `
            <div class="dia ${classe}">
                ${dia}
            </div>
        `;
    }
}


/* ============================================================
    6. HORÁRIOS DISPONÍVEIS (CLIENTE)
   ============================================================ */

const horarios = ["08:00","09:00","10:00","14:00","15:00","16:00"];

function gerarHorarios() {
    const container = document.getElementById("horarios");
    if (!container) return;

    container.innerHTML = "";

    horarios.forEach(h => {
        const btn = document.createElement("button");
        btn.innerText = h;
        btn.classList.add("horario-btn");

        btn.addEventListener("click", () => {
            document.querySelectorAll(".horario-btn")
                .forEach(b => b.classList.remove("selecionado"));
            btn.classList.add("selecionado");

            localStorage.setItem("horarioEscolhido", h);
        });

        container.appendChild(btn);
    });
}


/* ============================================================
    7. FINALIZAÇÃO DO CADASTRO DO CLIENTE
   ============================================================ */

function configurarFinalizacao() {
    const form = document.getElementById("formSelecionarHorario");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const horario = localStorage.getItem("horarioEscolhido");
        if (!horario) return alert("Escolha um horário!");

        window.location.href = "../html/procedimento.html";
    });
}


/* ============================================================
    8. INICIALIZAÇÃO AUTOMÁTICA
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    carregarClientes();
    gerarCalendario();
    gerarHorarios();
    configurarProcedimentos();
    configurarFinalizacao();
});
