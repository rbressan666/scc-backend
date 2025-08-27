const { query } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.nome_completo = userData.nome_completo;
    this.email = userData.email;
    this.senha_hash = userData.senha_hash;
    this.perfil = userData.perfil;
    this.ativo = userData.ativo;
    this.data_criacao = userData.data_criacao;
    this.data_atualizacao = userData.data_atualizacao;
  }

  // Criar novo usuário
  static async create(userData) {
    const { nome_completo, email, senha, perfil = 'operador' } = userData;
    
    // Hash da senha
    const saltRounds = 10;
    const senha_hash = await bcrypt.hash(senha, saltRounds);
    
    const queryText = `
      INSERT INTO usuarios (nome_completo, email, senha_hash, perfil)
      VALUES ($1, LOWER($2), $3, $4)
      RETURNING id, nome_completo, email, perfil, ativo, data_criacao, data_atualizacao
    `;
    
    const values = [nome_completo, email, senha_hash, perfil];
    const result = await query(queryText, values);
    
    return new User(result.rows[0]);
  }

  // Buscar usuário por email
  static async findByEmail(email) {
    const queryText = 'SELECT * FROM usuarios WHERE email = LOWER($1) AND ativo = true';
    const result = await query(queryText, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Buscar usuário por ID
  static async findById(id) {
    const queryText = 'SELECT * FROM usuarios WHERE id = $1';
    const result = await query(queryText, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Listar todos os usuários
  static async findAll() {
    const queryText = `
      SELECT id, nome_completo, email, perfil, ativo, data_criacao, data_atualizacao
      FROM usuarios
      ORDER BY data_criacao DESC
    `;
    const result = await query(queryText);
    
    return result.rows.map(row => new User(row));
  }

  // Atualizar usuário
  static async update(id, userData) {
    const { nome_completo, email, perfil, ativo } = userData;
    
    const queryText = `
      UPDATE usuarios 
      SET nome_completo = $1, email = LOWER($2), perfil = $3, ativo = $4
      WHERE id = $5
      RETURNING id, nome_completo, email, perfil, ativo, data_criacao, data_atualizacao
    `;
    
    const values = [nome_completo, email, perfil, ativo, id];
    const result = await query(queryText, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Atualizar senha
  static async updatePassword(id, novaSenha) {
    const saltRounds = 10;
    const senha_hash = await bcrypt.hash(novaSenha, saltRounds);
    
    const queryText = `
      UPDATE usuarios 
      SET senha_hash = $1
      WHERE id = $2
      RETURNING id, nome_completo, email, perfil, ativo, data_criacao, data_atualizacao
    `;
    
    const result = await query(queryText, [senha_hash, id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Desativar usuário (exclusão lógica)
  static async deactivate(id) {
    const queryText = `
      UPDATE usuarios 
      SET ativo = false
      WHERE id = $1
      RETURNING id, nome_completo, email, perfil, ativo, data_criacao, data_atualizacao
    `;
    
    const result = await query(queryText, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Verificar senha
  async verifyPassword(senha) {
    return await bcrypt.compare(senha, this.senha_hash);
  }

  // Converter para JSON (sem senha)
  toJSON() {
    const { senha_hash, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  // Inicializar usuário administrador padrão
  static async initializeAdminUser() {
    try {
      // Verificar se já existe o usuário admin
      const existingAdmin = await User.findByEmail('roberto.fujiy@gmail.com');
      
      if (!existingAdmin) {
        console.log('🔧 Criando usuário administrador inicial...');
        
        const adminData = {
          nome_completo: 'Roberto Bressan',
          email: 'roberto.fujiy@gmail.com',
          senha: 'Cadoz@001',
          perfil: 'admin'
        };
        
        await User.create(adminData);
        console.log('✅ Usuário administrador criado com sucesso!');
      } else {
        console.log('ℹ️ Usuário administrador já existe');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar usuário administrador:', error);
    }
  }
}

module.exports = User;

