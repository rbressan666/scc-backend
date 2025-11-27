-- MVP3 - Seed de perguntas padrão (gerais) para checklists de entrada e saída
-- Nota: perguntas gerais (setor_id = NULL). Perguntas específicas por setor podem ser inseridas em migração futura.

INSERT INTO checklist_perguntas (tipo, setor_id, pergunta, instrucao, ativa, ordem)
VALUES
  ('entrada', NULL, 'A contagem de entrada foi realizada?', 'Abra a tela de Contagem e registre os itens do inventário no início do turno.', TRUE, 10),
  ('entrada', NULL, 'Verificação de equipamentos concluída?', 'Verifique leitores, impressoras, luzes de rampa e PDVs. Ex.: para acender luzes da rampa use o botão branco no topo da rampa, próximo à porta de ferro.', TRUE, 20),
  ('entrada', NULL, 'Conferência de produtos realizada?', 'Garanta que produtos estejam organizados, etiquetados e em suas posições.', TRUE, 30),
  ('entrada', NULL, 'Validação do sistema OK?', 'Confirme acesso ao sistema e conexões de rede.', TRUE, 40),

  ('saida',   NULL, 'A contagem de saída foi realizada?', 'Abra a tela de Contagem e registre os itens para fechamento do turno.', TRUE, 10),
  ('saida',   NULL, 'Todos os alertas foram resolvidos?', 'Verifique a tela de Alertas e trate pendências antes do fechamento.', TRUE, 20),
  ('saida',   NULL, 'Relatórios gerados?', 'Gere e salve os relatórios necessários para o fechamento.', TRUE, 30),
  ('saida',   NULL, 'Equipamentos desligados?', 'Desligue os equipamentos conforme o procedimento do setor.', TRUE, 40)
ON CONFLICT DO NOTHING;
