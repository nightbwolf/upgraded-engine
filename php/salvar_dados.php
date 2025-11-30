<?php
header('Content-Type: application/json');
// Em produção, mudar * para domínio (ex: https://clinica.com)
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Responde pré-flight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Config Banco de dados
$servername = "localhost";
$port = "3307"; 
$username = "root"; 
$password = ""; 
$dbname = "clinica";

try {
    // Conexão
    $conn = new mysqli($servername, $username, $password, $dbname, $port);
    
    if ($conn->connect_error) {
        throw new Exception('Erro na conexão: ' . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método não permitido');
    }

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        $data = $_POST;
    }

    $acao = $data['acao'] ?? '';

    /* ============================================================
       AÇÃO: SALVAR CLIENTE (COM CHECAGEM DE HORÁRIO)
       ============================================================ */
    if ($acao === 'salvar_cliente') {
        // Extrai os dados do payload JSON.
        $nome = $data['nome'] ?? '';
        $email = $data['email'] ?? '';
        $telefone = $data['telefone'] ?? '';
        $observacoes = $data['observacoes'] ?? '';
        $procedimento = $data['procedimento'] ?? '';
        $horario = $data['horario'] ?? '';
        $data_agendamento = $data['data'] ?? date('Y-m-d'); // Pega a data da agenda

        // Validações
        if (empty($nome) || empty($telefone) || empty($data_agendamento) || empty($horario)) {
            throw new Exception('Nome, telefone, data e horário são obrigatórios');
        }

        // ⚠️ VERIFICAÇÃO DE AGENDAMENTO ⚠️
        $check_sql = "SELECT COUNT(*) FROM clientes WHERE data_agendamento = ? AND horario = ?";
        $check_stmt = $conn->prepare($check_sql);
        $check_stmt->bind_param("ss", $data_agendamento, $horario);
        $check_stmt->execute();
        $check_stmt->bind_result($count);
        $check_stmt->fetch();
        $check_stmt->close();

        if ($count > 0) {
            // Lança exceção se o horário estiver ocupado
            http_response_code(409); // Conflito
            throw new Exception('❌ Este horário já está reservado. Por favor, escolha outro.');
        }
        // ------------------------------------

        // Insere no banco (se o horário estiver livre)
        $sql = "INSERT INTO clientes (nome, email, telefone, observacoes, procedimento, horario, data_agendamento, data_cadastro) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
        
        $stmt = $conn->prepare($sql);
        
        // sssssss = 7 strings
        $stmt->bind_param("sssssss", $nome, $email, $telefone, $observacoes, $procedimento, $horario, $data_agendamento);
        
        if ($stmt->execute()) {
            echo json_encode([
                'status' => 'sucesso', 
                'mensagem' => 'Cliente salvo com sucesso no banco de dados!',
                'id' => $stmt->insert_id
            ]);
        } else {
            throw new Exception('Erro ao executar query: ' . $stmt->error);
        }
        $stmt->close();

    }
    /* ============================================================
       AÇÕES RESTANTES (LISTAR, DELETAR, EDITAR)
       ============================================================ */
    elseif ($acao === 'listar_clientes') {
        // Seleciona a coluna data_agendamento para exibir na tabela
        $sql = "SELECT id, nome, email, telefone, observacoes, procedimento, horario, data_agendamento, data_cadastro 
                FROM clientes ORDER BY data_agendamento DESC, horario ASC";
        $result = $conn->query($sql);
        
        if (!$result) {
            throw new Exception('Erro ao buscar clientes: ' . $conn->error);
        }
        
        $clientes = [];
        while ($row = $result->fetch_assoc()) {
            $clientes[] = $row;
        }

        echo json_encode([
            'status' => 'sucesso', 
            'clientes' => $clientes,
            'total' => count($clientes)
        ]);
    }
    elseif ($acao === 'deletar_cliente') {
        // deletar
        $id = intval($data['id'] ?? 0);
        if ($id <= 0) { throw new Exception('ID inválido'); }
        $sql = "DELETE FROM clientes WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(['status' => 'sucesso', 'mensagem' => 'Cliente deletado!']);
        } else {
            throw new Exception('Erro ao deletar: ' . $stmt->error);
        }
        $stmt->close();
    }
    elseif ($acao === 'editar_cliente') {
        // Lógica de edição completa (permite alterar data e horário)
        $id = intval($data['id'] ?? 0);
        $nome = $data['nome'] ?? '';
        $email = $data['email'] ?? '';
        $telefone = $data['telefone'] ?? '';
        $observacoes = $data['observacoes'] ?? '';
        $procedimento = $data['procedimento'] ?? '';
        $horario = $data['horario'] ?? '';
        $data_agendamento = $data['data'] ?? ''; 

        $sql = "UPDATE clientes SET nome = ?, email = ?, telefone = ?, observacoes = ?, procedimento = ?, horario = ?, data_agendamento = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        
        $stmt->bind_param("sssssssi", $nome, $email, $telefone, $observacoes, $procedimento, $horario, $data_agendamento, $id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'sucesso', 'mensagem' => 'Cliente atualizado!']);
        } else {
            throw new Exception('Erro ao atualizar: ' . $stmt->error);
        }
        $stmt->close();
    }
    else {
        throw new Exception('Ação não reconhecida: ' . $acao);
    }

} catch (Exception $e) {
    // Garante que o erro do banco ou de lógica é retornado
    echo json_encode([
        'status' => 'erro', 
        'mensagem' => 'Erro: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>