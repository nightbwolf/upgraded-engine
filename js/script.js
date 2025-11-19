// ================= CLIENTES =================

// Função para carregar clientes na tabela
function carregarClientes() {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    const tabela = document.querySelector("#tabelaClientes tbody");
    if (!tabela) return; // Evita erro se tabela não existir
    tabela.innerHTML = "";

    clientes.forEach((cliente, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${cliente.nome}</td>
            <td>${cliente.email}</td>
            <td>${cliente.telefone}</td>
            <td>${cliente.observacoes}</td>
            <td>
                <button onclick="editarCliente(${index})">Editar</button>
                <button onclick="deletarCliente(${index})">Deletar</button>
            </td>
        `;
        tabela.appendChild(row);
    });
}

// Editar cliente
function editarCliente(index) {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    const cliente = clientes[index];

    const novoNome = prompt("Editar Nome:", cliente.nome);
    if (!novoNome) return;
    const novoEmail = prompt("Editar E-mail:", cliente.email);
    if (!novoEmail) return;
    const novoTelefone = prompt("Editar Telefone:", cliente.telefone);
    if (!novoTelefone) return;
    const novasObs = prompt("Editar Observações:", cliente.observacoes);

    clientes[index] = { nome: novoNome, email: novoEmail, telefone: novoTelefone, observacoes: novasObs };
    localStorage.setItem("clientes", JSON.stringify(clientes));
    carregarClientes();
}

// Deletar cliente
function deletarCliente(index) {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    if (confirm("Deseja realmente deletar este cliente?")) {
        clientes.splice(index, 1);
        localStorage.setItem("clientes", JSON.stringify(clientes));
        carregarClientes();
    }
}

// Inicializa tabela se estiver na página de clientes
document.addEventListener("DOMContentLoaded", carregarClientes);

// ================= CADASTRO =================
// Adiciona cliente no localStorage ao enviar o formulário de cadastro
const formCadastro = document.querySelector(".form-cadastro");
if(formCadastro){
    formCadastro.addEventListener("submit", function(e){
        e.preventDefault();

        const nome = this.querySelector("input[type=text]").value;
        const email = this.querySelector("input[type=email]").value;
        const telefone = this.querySelector("input[type=tel]").value;
        const observacoes = this.querySelector("textarea").value;

        const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
        clientes.push({ nome, email, telefone, observacoes });
        localStorage.setItem("clientes", JSON.stringify(clientes));

        alert("Cadastro realizado com sucesso!");
        this.reset();
    });
}

// Validação simples de login do parceiro

document.getElementById("btnLogin")?.addEventListener("click", function () {
    const user = document.getElementById("user").value;
    const pass = document.getElementById("password").value;

    // Usuário e senha padrão
    if (user === "admin" && pass === "1234") {
        window.location.href = "area_parceiro.html";
    } else {
        alert("Usuário ou senha incorretos!");
    }
});
