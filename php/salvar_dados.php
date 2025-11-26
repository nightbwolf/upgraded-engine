<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Responde pré-flight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Config Banco de dados - VERIFIQUE SUAS CONFIGURAÇÕES!
$servername = "localhost";
$port = "3307"; // Se estiver usando porta diferente
$username = "root"; // Seu usuário MySQL
$password = ""; // Sua senha MySQL
$dbname = "clinica";

try {
    // Conexão corrigida
    $conn = new mysqli($servername, $username, $password, $dbname, $port);
    
    if ($conn->connect_error) {
        throw new Exception('Erro na conexão: ' . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");

    // Verifica se é POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método não permitido');
    }

    // Lê os dados JSON do corpo da requisição
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Se não conseguir ler como JSON, tenta como form-data
    if (!$data) {
        $data = $_POST;
    }

    $acao = $data['acao'] ?? '';

    if ($acao === 'salvar_cliente') {
        // Validações
        if (empty($data['nome']) || empty($data['telefone'])) {
            throw new Exception('Nome e telefone são obrigatórios');
        }

        $nome = $conn->real_escape_string($data['nome'] ?? '');
        $email = $conn->real_escape_string($data['email'] ?? '');
        $telefone = $conn->real_escape_string($data['telefone'] ?? '');
        $observacoes = $conn->real_escape_string($data['observacoes'] ?? '');
        $procedimento = $conn->real_escape_string($data['procedimento'] ?? '');
        $horario = $conn->real_escape_string($data['horario'] ?? '');

        $sql = "INSERT INTO clientes (nome, email, telefone, observacoes, procedimento, horario, data_cadastro) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())";
        
        // Usando prepared statements para segurança
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception('Erro ao preparar query: ' . $conn->error);
        }
        
        $stmt->bind_param("ssssss", $nome, $email, $telefone, $observacoes, $procedimento, $horario);
        
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
    elseif ($acao === 'listar_clientes') {
        $sql = "SELECT id, nome, email, telefone, observacoes, procedimento, horario, data_cadastro 
                FROM clientes ORDER BY data_cadastro DESC";
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
        $id = intval($data['id'] ?? 0);
        
        if ($id <= 0) {
            throw new Exception('ID inválido');
        }
        
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
        $id = intval($data['id'] ?? 0);
        $nome = $conn->real_escape_string($data['nome'] ?? '');
        $email = $conn->real_escape_string($data['email'] ?? '');
        $telefone = $conn->real_escape_string($data['telefone'] ?? '');
        $observacoes = $conn->real_escape_string($data['observacoes'] ?? '');

        $sql = "UPDATE clientes SET 
                    nome = ?, 
                    email = ?,
                    telefone = ?,
                    observacoes = ?
                WHERE id = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssi", $nome, $email, $telefone, $observacoes, $id);
        
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