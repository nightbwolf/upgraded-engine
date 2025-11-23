<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Config Banco de dados
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "clinica";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(['status' => 'erro', 'mensagem' => 'Erro na conexão: ' . $conn->connect_error]));
}

$conn->set_charset("utf8mb4");

// Receber dados via POST
$acao = $_POST['acao'] ?? '';

if ($acao === 'salvar_cliente') {
    $nome = $conn->real_escape_string($_POST['nome'] ?? '');
    $email = $conn->real_escape_string($_POST['email'] ?? '');
    $telefone = $conn->real_escape_string($_POST['telefone'] ?? '');
    $observacoes = $conn->real_escape_string($_POST['observacoes'] ?? '');
    $procedimento = $conn->real_escape_string($_POST['procedimento'] ?? '');
    $horario = $conn->real_escape_string($_POST['horario'] ?? '');

    $sql = "INSERT INTO clientes (nome, email, telefone, observacoes, procedimento, horario, data_cadastro) 
            VALUES ('$nome', '$email', '$telefone', '$observacoes', '$procedimento', '$horario', NOW())";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(['status' => 'sucesso', 'mensagem' => 'Cliente salvo com sucesso!']);
    } else {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao salvar: ' . $conn->error]);
    }
}

elseif ($acao === 'listar_clientes') {
    $sql = "SELECT id, nome, email, telefone, observacoes, procedimento, horario FROM clientes ORDER BY data_cadastro DESC";
    $result = $conn->query($sql);
    $clientes = [];

    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $clientes[] = $row;
        }
    }
    echo json_encode(['status' => 'sucesso', 'clientes' => $clientes]);
}

elseif ($acao === 'deletar_cliente') {
    $id = intval($_POST['id'] ?? 0);
    $sql = "DELETE FROM clientes WHERE id = $id";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(['status' => 'sucesso', 'mensagem' => 'Cliente deletado!']);
    } else {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao deletar: ' . $conn->error]);
    }
}

elseif ($acao === 'editar_cliente') {
    $id = intval($_POST['id'] ?? 0);
    $nome = $conn->real_escape_string($_POST['nome'] ?? '');
    $email = $conn->real_escape_string($_POST['email'] ?? '');
    $telefone = $conn->real_escape_string($_POST['telefone'] ?? '');
    $observacoes = $conn->real_escape_string($_POST['observacoes'] ?? '');

    $sql = "UPDATE clientes SET nome='$nome', email='$email', telefone='$telefone', observacoes='$observacoes' WHERE id=$id";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(['status' => 'sucesso', 'mensagem' => 'Cliente atualizado!']);
    } else {
        echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao atualizar: ' . $conn->error]);
    }
}

$conn->close();
?>