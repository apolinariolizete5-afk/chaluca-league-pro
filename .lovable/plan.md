# Campeonato Recreativo de Chalucuane — recriar o site

Recriação do projeto "liga-show" neste projeto novo, com backend próprio (Lovable Cloud), sem nenhuma credencial de administrador antiga. O nome do site passa a ser **Campeonato Recreativo de Chalucuane**.

## 1. Acesso de administração (limpo)

- Base de dados nova: nenhum admin, nenhuma palavra-passe herdada do projeto antigo.
- O primeiro administrador é criado por si (registo único inicial protegido); a partir daí só se entra por convite.
- Qualquer admin pode convidar outro admin: cria-se um convite com email + link único com prazo de validade.
- O convidado abre o link, escolhe a **sua própria palavra-passe** e fica admin. Ninguém define palavra-passe por ele.
- Ecrã de convites: lista de convites pendentes, reenviar, cancelar, e lista de admins com opção de remover.
- Papéis guardados em tabela separada (`user_roles`) com verificação no servidor.

## 2. Site público

- Início, Notícias, Equipas, Calendário, Resultados, Classificação.
- Nome e identidade "Campeonato Recreativo de Chalucuane".

## 3. Painel de administração

**Visão geral (dashboard)**: cartões com número de equipas, jogadores inscritos, jogos marcados, jogos realizados, publicações, e próximos jogos.

**Publicações**: criar/editar/eliminar notícias com **upload de fotos** (armazenamento de ficheiros no Cloud, imagem de capa + galeria).

**Equipas**: adicionar e remover equipas (nome, escudo por upload). Dentro de cada equipa: adicionar e remover jogadores com **nome, foto, número (dorsal)** e interruptor **Inscrito / Não inscrito**.

**Calendário**: adicionar e remover jogos (data, hora, local, equipa casa/fora).

**Resultados**: lançar e remover resultados de cada jogo (golos casa/fora + marcadores, cartões).

## 4. Classificação e estatísticas automáticas

Ao guardar ou remover um resultado, a classificação e as estatísticas recalculam sozinhas:

- Classificação: J, V, E, D, GM, GS, DG, Pts (3/1/0), ordenada por pontos → diferença de golos → golos marcados.
- Estatísticas: melhores marcadores, cartões, e totais do campeonato.
- Cálculo feito no servidor a partir dos resultados guardados, para nunca ficar dessincronizado.

## Notas técnicas

- TanStack Start + Lovable Cloud (Postgres, auth, storage).
- Tabelas: `profiles`, `user_roles`, `admin_invites`, `teams`, `players`, `matches`, `match_events`, `posts`, `site_settings`.
- RLS: leitura pública nas tabelas do campeonato; escrita apenas para admins verificados no servidor. Convites validados por token com expiração e uso único.
- Buckets de storage para escudos, fotos de jogadores e imagens de publicações.
- Classificação como vista/consulta derivada dos jogos com resultado.

## Confirmações pedidas

1. O primeiro admin será a sua conta — confirma que quer criá-la no arranque?
2. Convites por link (para copiar/partilhar) chega, ou quer também envio automático por email?
