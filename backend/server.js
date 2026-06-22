require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Credenciais via variáveis de ambiente (nunca hardcodadas)
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'gelamour',
  waitForConnections: true,
  connectionLimit: 10,
});

const STATUS_VALIDOS = ['pendente', 'aguardando', 'confirmado', 'entregue', 'cancelado'];

// Salvar pedido
app.post('/api/pedidos', async (req, res) => {
  const { nome, endereco, pagamento, itens, total, observacao } = req.body;
  if (!nome || !endereco || !pagamento || !Array.isArray(itens) || total == null) {
    return res.status(400).json({ erro: 'Dados obrigatórios faltando ou inválidos' });
  }
  if (typeof total !== 'number' || total < 0) {
    return res.status(400).json({ erro: 'Total inválido' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO pedidos (nome, endereco, pagamento, itens, total, observacao, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nome, endereco, pagamento, JSON.stringify(itens), total, observacao || null, 'aguardando']
    );
    res.json({ sucesso: true, id: result.insertId });
  } catch (err) {
    console.error('Erro ao salvar pedido:', err.message);
    res.status(500).json({ erro: 'Erro interno ao salvar pedido' });
  }
});

// Listar pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM pedidos ORDER BY criado_em DESC');
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err.message);
    res.status(500).json({ erro: 'Erro interno ao buscar pedidos' });
  }
});

// Atualizar status do pedido
app.patch('/api/pedidos/:id', async (req, res) => {
  const { status } = req.body;
  const id = parseInt(req.params.id, 10);
  if (!STATUS_VALIDOS.includes(status) || isNaN(id)) {
    return res.status(400).json({ erro: 'Parâmetros inválidos' });
  }
  try {
    await pool.execute('UPDATE pedidos SET status = ? WHERE id = ?', [status, id]);
    res.json({ sucesso: true });
  } catch (err) {
    console.error('Erro ao atualizar pedido:', err.message);
    res.status(500).json({ erro: 'Erro interno ao atualizar pedido' });
  }
});

const PORT = parseInt(process.env.PORT, 10) || 3001;
app.listen(PORT, () => console.log(`Servidor Gelamour rodando na porta ${PORT}`));
