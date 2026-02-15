# 📊 Estrutura do Banco de Dados - Pedidos e Propaganda

**Sistema:** MVP3 - Sistema de Controle de Pedidos e Propaganda para Android TV  
**Data:** 14 de Fevereiro de 2026  
**Versão:** 1.0

---

## 🎯 Visão Geral

Sistema de gerenciamento de pedidos com visualização em TV Android. As aplicações mobile podem acessar os dados diretamente via Supabase.

**Duas Apps Android:**
1. **Controle de Pedidos** - Cria/gerencia pedidos (Read/Write)
2. **TV Visualization** - Exibe pedidos e propaganda (Read-Only)

---

## 📋 Tabelas

### 1️⃣ TABELA: `pedidos`

**Descrição:** Registros de pedidos criados para exibição na TV

```sql
CREATE TABLE pedidos (
    id UUID PRIMARY KEY,
    numero_pedido INTEGER NOT NULL,
    observacao TEXT,
    data_hora TIMESTAMP WITH TIME ZONE,
    data_pedido DATE,
    status VARCHAR(20),
    usuario_email VARCHAR(255),
    deletado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (numero_pedido, data_pedido)
)
```

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `id` | UUID | `gen_random_uuid()` | Identificador único |
| `numero_pedido` | INTEGER | - | Número do pedido (ex: 001, 002) |
| `observacao` | TEXT | NULL | Detalhes adicionais do pedido |
| `data_hora` | TIMESTAMP TZ | `NOW()` | Data/hora de criação |
| `data_pedido` | DATE | `CURRENT_DATE` | Data (sincronizada de data_hora via trigger) |
| `status` | VARCHAR(20) | `'novo'` | Estados: 'novo', 'processando', 'finalizado', 'deletado' |
| `usuario_email` | VARCHAR(255) | NULL | Email de quem criou |
| `deletado_em` | TIMESTAMP TZ | NULL | Timestamp do soft delete |
| `created_at` | TIMESTAMP TZ | `NOW()` | Criação do registro |
| `updated_at` | TIMESTAMP TZ | `NOW()` | Última atualização (auto via trigger) |

**Constraints:**
- `PRIMARY KEY (id)`
- `UNIQUE (numero_pedido, data_pedido)` - Número pode repetir em dias diferentes
- `CHECK status IN ('novo','processando','finalizado','deletado')`

**Índices:**
- `idx_pedidos_numero` ON `numero_pedido`
- `idx_pedidos_data_hora` ON `data_hora DESC`
- `idx_pedidos_status` ON `status`
- `idx_pedidos_usuario_email` ON `usuario_email`
- `idx_pedidos_data_pedido` ON `data_pedido`

**Exemplo de Registro:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "numero_pedido": 1,
  "observacao": "Prioridade alta - Cliente VIP",
  "data_hora": "2026-02-14T10:30:00+00:00",
  "data_pedido": "2026-02-14",
  "status": "novo",
  "usuario_email": "admin@cadoz.com",
  "deletado_em": null,
  "created_at": "2026-02-14T10:30:00+00:00",
  "updated_at": "2026-02-14T10:30:00+00:00"
}
```

---

### 2️⃣ TABELA: `parametros_app_pedidos_propaganda`

**Descrição:** Configurações do aplicativo Android que exibe pedidos na TV

```sql
CREATE TABLE parametros_app_pedidos_propaganda (
    id UUID PRIMARY KEY,
    autostart BOOLEAN,
    modo_exibicao VARCHAR(50),
    intervalo_exibicao_seg INTEGER,
    exibir_numero_pedido BOOLEAN,
    exibir_observacao_pedido BOOLEAN,
    cor_fundo_principal VARCHAR(7),
    cor_texto_principal VARCHAR(7),
    cor_destaque_numero VARCHAR(7),
    imagem_fundo_id UUID REFERENCES midia_propaganda(id),
    video_propaganda_id UUID REFERENCES midia_propaganda(id),
    som_notificacao_novos_pedidos_id UUID REFERENCES som_notificacao(id),
    ativa BOOLEAN,
    atualizado_por_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
```

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `id` | UUID | `gen_random_uuid()` | Identificador único |
| `autostart` | BOOLEAN | `true` | Inicia automaticamente ao ligar o Android |
| `modo_exibicao` | VARCHAR(50) | `'pedidos-propaganda'` | Modo: 'pedidos-propaganda', 'pedidos-only', 'propaganda-only' |
| `intervalo_exibicao_seg` | INTEGER | `10` | Segundos entre mudanças de tela |
| `exibir_numero_pedido` | BOOLEAN | `true` | Mostra número do pedido na TV |
| `exibir_observacao_pedido` | BOOLEAN | `true` | Mostra observação do pedido |
| `cor_fundo_principal` | VARCHAR(7) | `'#000000'` | Cor hex de fundo |
| `cor_texto_principal` | VARCHAR(7) | `'#FFFFFF'` | Cor hex do texto |
| `cor_destaque_numero` | VARCHAR(7) | `'#FFD700'` | Cor hex do número (destaque) |
| `imagem_fundo_id` | UUID | NULL | ID da imagem de fundo (FK → midia_propaganda) |
| `video_propaganda_id` | UUID | NULL | ID do vídeo de propaganda (FK → midia_propaganda) |
| `som_notificacao_novos_pedidos_id` | UUID | NULL | ID do som de notificação (FK → som_notificacao) |
| `ativa` | BOOLEAN | `true` | Se configuração está ativa |
| `atualizado_por_email` | VARCHAR(255) | NULL | Email de quem atualizou |
| `created_at` | TIMESTAMP TZ | `NOW()` | Criação |
| `updated_at` | TIMESTAMP TZ | `NOW()` | Última atualização |

**Constraints:**
- `CHECK modo_exibicao IN ('pedidos-propaganda','pedidos-only','propaganda-only')`

**Exemplo de Registro:**
```json
{
  "id": "660f9511-f39c-52e5-b827-557766551111",
  "autostart": true,
  "modo_exibicao": "pedidos-propaganda",
  "intervalo_exibicao_seg": 10,
  "exibir_numero_pedido": true,
  "exibir_observacao_pedido": true,
  "cor_fundo_principal": "#000000",
  "cor_texto_principal": "#FFFFFF",
  "cor_destaque_numero": "#FFD700",
  "imagem_fundo_id": null,
  "video_propaganda_id": null,
  "som_notificacao_novos_pedidos_id": null,
  "ativa": true,
  "atualizado_por_email": "admin@cadoz.com",
  "created_at": "2026-02-14T10:00:00+00:00",
  "updated_at": "2026-02-14T10:00:00+00:00"
}
```

---

### 3️⃣ TABELA: `midia_propaganda`

**Descrição:** Imagens e vídeos para exibição na tela de propaganda

```sql
CREATE TABLE midia_propaganda (
    id UUID PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(20),
    url_arquivo VARCHAR(500) NOT NULL,
    tamanho_bytes INTEGER,
    mime_type VARCHAR(100),
    dimensoes_w INTEGER,
    dimensoes_h INTEGER,
    ordem INTEGER,
    ativa BOOLEAN,
    deletado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
```

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `id` | UUID | `gen_random_uuid()` | Identificador único |
| `nome` | VARCHAR(255) | - | Nome descritivo da mídia |
| `tipo` | VARCHAR(20) | - | 'imagem' ou 'video' |
| `url_arquivo` | VARCHAR(500) | - | URL ou caminho do arquivo |
| `tamanho_bytes` | INTEGER | NULL | Tamanho em bytes |
| `mime_type` | VARCHAR(100) | NULL | ex: 'image/png', 'video/mp4' |
| `dimensoes_w` | INTEGER | NULL | Largura em pixels |
| `dimensoes_h` | INTEGER | NULL | Altura em pixels |
| `ordem` | INTEGER | `0` | Ordem de exibição |
| `ativa` | BOOLEAN | `true` | Se está ativa/visível |
| `deletado_em` | TIMESTAMP TZ | NULL | Soft delete (NULL = ativo) |
| `created_at` | TIMESTAMP TZ | `NOW()` | Criação |
| `updated_at` | TIMESTAMP TZ | `NOW()` | Última atualização |

**Constraints:**
- `CHECK tipo IN ('imagem','video')`

**Índices:**
- `idx_midia_propaganda_tipo` ON `tipo`
- `idx_midia_propaganda_ativa` ON `ativa`

**Exemplo:**
```json
{
  "id": "770g0612-g40d-63f6-c938-668877662222",
  "nome": "Banner Promoção Fevereiro",
  "tipo": "imagem",
  "url_arquivo": "https://storage.supabase.co/bucket/banner-fev.png",
  "tamanho_bytes": 2048000,
  "mime_type": "image/png",
  "dimensoes_w": 1920,
  "dimensoes_h": 1080,
  "ordem": 1,
  "ativa": true,
  "deletado_em": null,
  "created_at": "2026-02-10T08:00:00+00:00",
  "updated_at": "2026-02-10T08:00:00+00:00"
}
```

---

### 4️⃣ TABELA: `som_notificacao`

**Descrição:** Sons de alerta para novos pedidos

```sql
CREATE TABLE som_notificacao (
    id UUID PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    url_arquivo VARCHAR(500) NOT NULL,
    tamanho_bytes INTEGER,
    mime_type VARCHAR(100),
    duracao_ms INTEGER,
    ativo BOOLEAN,
    deletado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
```

| Campo | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `id` | UUID | `gen_random_uuid()` | Identificador único |
| `nome` | VARCHAR(255) | - | Nome do som (ex: "Aviso Novo Pedido") |
| `url_arquivo` | VARCHAR(500) | - | URL ou caminho do arquivo MP3/WAV |
| `tamanho_bytes` | INTEGER | NULL | Tamanho em bytes |
| `mime_type` | VARCHAR(100) | NULL | ex: 'audio/mpeg', 'audio/wav' |
| `duracao_ms` | INTEGER | NULL | Duração em milissegundos |
| `ativo` | BOOLEAN | `true` | Se está ativo |
| `deletado_em` | TIMESTAMP TZ | NULL | Soft delete |
| `created_at` | TIMESTAMP TZ | `NOW()` | Criação |
| `updated_at` | TIMESTAMP TZ | `NOW()` | Última atualização |

**Índices:**
- `idx_som_notificacao_ativo` ON `ativo`

**Exemplo:**
```json
{
  "id": "880h1723-h51e-74g7-d049-779988773333",
  "nome": "Aviso Novo Pedido",
  "url_arquivo": "https://storage.supabase.co/sounds/beep-notification.mp3",
  "tamanho_bytes": 512000,
  "mime_type": "audio/mpeg",
  "duracao_ms": 3000,
  "ativo": true,
  "deletado_em": null,
  "created_at": "2026-02-10T08:00:00+00:00",
  "updated_at": "2026-02-10T08:00:00+00:00"
}
```

---

### 5️⃣ TABELA: `log_alteracoes_propaganda`

**Descrição:** Auditoria de mudanças em configurações

```sql
CREATE TABLE log_alteracoes_propaganda (
    id UUID PRIMARY KEY,
    usuario_email VARCHAR(255),
    parametro_alterado VARCHAR(100),
    valor_anterior TEXT,
    valor_novo TEXT,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `usuario_email` | VARCHAR(255) | Quem fez a alteração |
| `parametro_alterado` | VARCHAR(100) | Nome do campo alterado |
| `valor_anterior` | TEXT | Valor antes |
| `valor_novo` | TEXT | Valor depois |
| `observacao` | TEXT | Notas opcionais |
| `created_at` | TIMESTAMP TZ | Data/hora da alteração |

**Índices:**
- `idx_log_alteracoes_propaganda_data` ON `created_at DESC`

---

## 🔗 Relacionamentos (Foreign Keys)

```
parametros_app_pedidos_propaganda
├─── imagem_fundo_id ─────────────→ midia_propaganda.id (ON DELETE SET NULL)
├─── video_propaganda_id ────────→ midia_propaganda.id (ON DELETE SET NULL)
└─── som_notificacao_novos_pedidos_id → som_notificacao.id (ON DELETE SET NULL)
```

---

## 🔄 Triggers Automáticos

### Trigger 1: `pedidos_sync_data_pedido`
**O quê:** Sincroniza automaticamente `data_pedido` com a data de `data_hora`  
**Quando:** Antes de INSERT ou UPDATE  
**Tabela:** `pedidos`

```sql
CREATE TRIGGER trigger_pedidos_sync_data_pedido
BEFORE INSERT OR UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION pedidos_sync_data_pedido();
```

### Trigger 2: `app_pedidos_propaganda_set_updated_at`
**O quê:** Atualiza automaticamente `updated_at` para NOW()  
**Quando:** Antes de UPDATE  
**Tabelas:** 
- `pedidos`
- `parametros_app_pedidos_propaganda`
- `midia_propaganda`
- `som_notificacao`

```sql
CREATE TRIGGER trigger_pedidos_updated_at
BEFORE UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION app_pedidos_propaganda_set_updated_at();
```

---

## 📱 Como Acessar via Android Apps

### Usando Supabase SDK (Flutter/Kotlin)

**Listar pedidos novos:**
```dart
final response = await Supabase.instance.client
  .from('pedidos')
  .select()
  .eq('status', 'novo')
  .order('data_hora', ascending: false);
```

**Atualizar status do pedido:**
```dart
await Supabase.instance.client
  .from('pedidos')
  .update({'status': 'processando'})
  .eq('id', pedidoId);
```

**Obter configuração de exibição:**
```dart
final config = await Supabase.instance.client
  .from('parametros_app_pedidos_propaganda')
  .select()
  .order('created_at', ascending: false)
  .limit(1)
  .single();
```

**Buscar imagem de propaganda:**
```dart
final midia = await Supabase.instance.client
  .from('midia_propaganda')
  .select()
  .eq('tipo', 'imagem')
  .eq('ativa', true)
  .order('ordem');
```

---

## 🔐 Segurança - Row Level Security (RLS)

**Recomendações:**

```sql
-- Permitir leitura de pedidos para qualquer usuário autenticado
CREATE POLICY "Qualquer um pode ler pedidos"
ON pedidos FOR SELECT
USING (TRUE);

-- Apenas admin pode criar/atualizar/deletar pedidos
CREATE POLICY "Apenas admin pode modificar pedidos"
ON pedidos FOR INSERT, UPDATE, DELETE
USING (
  (SELECT role FROM users WHERE email = auth.jwt()->>'email') = 'admin'
);

-- Qualquer um pode ler parâmetros
CREATE POLICY "Qualquer um pode ler parâmetros"
ON parametros_app_pedidos_propaganda FOR SELECT
USING (TRUE);

-- Qualquer um pode ler mídias ativas
CREATE POLICY "Qualquer um pode ler mídias ativas"
ON midia_propaganda FOR SELECT
USING (ativa = true AND deletado_em IS NULL);
```

---

## 📊 Diagrama Entidade-Relacionamento

```
┌─────────────────────────┐
│     PEDIDOS             │
├─────────────────────────┤
│ ⭐ id (UUID)            │
│ numero_pedido (INT)     │
│ observacao (TEXT)       │
│ data_hora (TIMESTAMP)   │
│ data_pedido (DATE)      │
│ status (VARCHAR)        │
│ usuario_email           │
│ deletado_em             │
│ created_at              │
│ updated_at              │
└─────────────────────────┘

┌────────────────────────────────────────────┐
│  PARAMETROS_APP_PEDIDOS_PROPAGANDA        │
├────────────────────────────────────────────┤
│ ⭐ id (UUID)                                │
│ autostart (BOOLEAN)                        │
│ modo_exibicao (VARCHAR)                    │
│ intervalo_exibicao_seg (INTEGER)           │
│ exibir_numero_pedido (BOOLEAN)              │
│ exibir_observacao_pedido (BOOLEAN)          │
│ cor_fundo_principal (VARCHAR)               │
│ cor_texto_principal (VARCHAR)               │
│ cor_destaque_numero (VARCHAR)               │
│ 🔗 imagem_fundo_id ──────────────┐         │
│ 🔗 video_propaganda_id ──────────┤──→ MIDIA_PROPAGANDA
│ 🔗 som_notificacao_novos_         │         │
│    pedidos_id ────────────────────┤──→ SOM_NOTIFICACAO
│ ativa (BOOLEAN)                  │         │
│ atualizado_por_email             │         │
│ created_at / updated_at          │         │
└────────────────────────────────────────────┘

┌────────────────────────────┐
│  MIDIA_PROPAGANDA          │
├────────────────────────────┤
│ ⭐ id (UUID)                │
│ nome (VARCHAR)              │
│ tipo (VARCHAR)              │
│ url_arquivo (VARCHAR)       │
│ tamanho_bytes (INTEGER)     │
│ mime_type (VARCHAR)         │
│ dimensoes_w/h (INTEGER)     │
│ ordem (INTEGER)             │
│ ativa (BOOLEAN)             │
│ deletado_em (TIMESTAMP)     │
│ created_at / updated_at     │
└────────────────────────────┘

┌────────────────────────────┐
│  SOM_NOTIFICACAO           │
├────────────────────────────┤
│ ⭐ id (UUID)                │
│ nome (VARCHAR)              │
│ url_arquivo (VARCHAR)       │
│ tamanho_bytes (INTEGER)     │
│ mime_type (VARCHAR)         │
│ duracao_ms (INTEGER)        │
│ ativo (BOOLEAN)             │
│ deletado_em (TIMESTAMP)     │
│ created_at / updated_at     │
└────────────────────────────┘

┌────────────────────────────────┐
│  LOG_ALTERACOES_PROPAGANDA     │
├────────────────────────────────┤
│ ⭐ id (UUID)                    │
│ usuario_email (VARCHAR)        │
│ parametro_alterado (VARCHAR)   │
│ valor_anterior (TEXT)          │
│ valor_novo (TEXT)              │
│ observacao (TEXT)              │
│ created_at (TIMESTAMP)         │
└────────────────────────────────┘
```

---

## ✅ Checklist de Implementação

- [x] Tabela `pedidos` criada
- [x] Tabela `parametros_app_pedidos_propaganda` criada (corrigida v1.0)
- [x] Tabela `midia_propaganda` criada
- [x] Tabela `som_notificacao` criada
- [x] Tabela `log_alteracoes_propaganda` criada
- [x] Triggers para `updated_at` criados
- [x] Trigger para sincronização de `data_pedido` criado
- [x] Índices para performance criados
- [ ] Row Level Security (RLS) implementado
- [ ] Backup automático configurado

---

## 📞 Contato

**Desenvolvido com ❤️ para o MVP3**  
**Última atualização:** 14 de Fevereiro de 2026
