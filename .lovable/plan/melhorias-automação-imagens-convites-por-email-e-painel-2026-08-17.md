# Melhorias: automação, imagens, convites por email e painel

Foco no que pediu, mantendo o custo baixo e sem quebrar o deploy.

## 1. Convites de administrador por email

Hoje o convite gera um link que tem de ser copiado e enviado à mão. Passa a ser
enviado automaticamente por email para o convidado, com o link já dentro.

- Botão "Convidar" envia o email; o link continua disponível para copiar (plano B).
- Estado do convite visível: Pendente / Utilizado / Expirado, com "Reenviar email".
- Nota: para enviar emails é preciso um serviço de envio (Resend). Preciso da sua
  confirmação e de uma chave — se preferir evitar isso, mantemos só o link copiável.

## 2. Lista de administradores

Nova secção na aba Administradores com todos os admins atuais:
email, data em que se tornou admin, e botão "Remover acesso" (não permite remover-se
a si próprio, para nunca ficar sem administrador). A base de dados já tem a função
para isto — falta apenas mostrá-la no painel.

## 3. Upload de imagens mais fácil

- Arrastar e largar a foto, ou colar diretamente (Ctrl+V).
- Pré-visualização imediata e barra de progresso.
- Redimensionamento automático no browser antes de enviar (escudos e fotos de
  jogadores ficam leves) — poupa dados móveis e acelera o site.
- Vários ficheiros de uma vez na galeria das notícias.

## 4. Automação de atividades

- **Criar jornada em lote**: escolher a jornada, a data e emparelhar equipas numa
  só tela; gera todos os jogos de uma vez.
- **Resultado num só passo**: ao inserir golos por jogador, o resultado, a
  classificação e as estatísticas (golos, assistências, cartões) atualizam sozinhos.
- **Estado automático do jogo**: agendado / a decorrer / terminado, calculado pela
  hora, sem intervenção.
- **Guardar automático** nos formulários e confirmação antes de eliminar.

## 5. Painel de visualizações completo

Aba "Visão geral" reforçada:

- Cartões de resumo (equipas, jogadores inscritos, jogos disputados/por disputar, golos).
- Gráfico de golos por jornada e média de golos por jogo.
- Próximo jogo em destaque com contagem decrescente.
- Melhores marcadores e melhores assistentes (top 5).
- Equipa mais goleadora e mais indisciplinada (cartões).
- Últimos resultados registados, com link direto para editar.

## 6. Ideias minhas (extra, opcionais)

- Páginas próprias de equipa e de jogo (escudos, plantel, marcadores por minuto).
- Jornadas com separadores no calendário e nos resultados.
- Forma recente (últimos 5: V/E/D a cores) na classificação.
- Botão de partilha para WhatsApp com imagem bonita do link.
- Menu inferior fixo no telemóvel (Início / Calendário / Classificação).

## Notas técnicas

- Emails via função de servidor com Resend; template simples em português.
- Lista de admins lê `user_roles` (já com coluna `email`); remoção via `remove_admin`.
- Redimensionamento com canvas no browser antes do upload para o armazenamento.
- Gráficos com `recharts`, já instalado — sem novas dependências pesadas.
- Sem alterações que afetem o arranque no Render.

## Ordem sugerida

1 e 2 (convites por email + lista de admins), depois 5 (painel), depois 3 e 4.
Os extras da secção 6 ficam para uma fase seguinte.
