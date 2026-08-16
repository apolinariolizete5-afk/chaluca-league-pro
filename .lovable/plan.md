# Sugestões de melhoria — Campeonato Recreativo de Chalucuane

Propostas de melhoria organizadas por prioridade. Pode aprovar tudo ou dizer quais quer.

## 1. Página de cada equipa (alto impacto)
Hoje as equipas aparecem numa lista. Criar uma página própria por equipa com:
escudo, plantel completo com fotos e dorsais, últimos resultados, próximos jogos e
totais da equipa (golos marcados/sofridos, cartões).

## 2. Página de cada jogo
Ficha do jogo: escudos, resultado, marcadores por minuto, cartões, local e hora.
Link a partir do calendário e dos resultados.

## 3. Perfil de jogador
Foto, equipa, dorsal, golos, cartões e jogos em que participou.

## 4. Jornadas no calendário e resultados
Agrupar jogos por jornada com separadores (Jornada 1, 2, ...) e um filtro por equipa.
Torna a navegação muito mais rápida quando houver muitos jogos.

## 5. Classificação mais rica
- Forma recente (últimos 5 jogos: V/E/D em cores).
- Destaque de líder e zona de descida (opcional, configurável).
- Separador de estatísticas: melhores marcadores, cartões amarelos/vermelhos, médias do campeonato.

## 6. Melhorias no painel de administração
- Pesquisa e filtro nas listas de equipas, jogadores, jogos e publicações.
- Confirmação antes de eliminar (evita apagar por engano).
- Criação de jornada em lote: gerar vários jogos de uma vez.
- Guardar rascunho/publicar nas notícias com pré-visualização.
- Registo simples de alterações (quem criou/alterou o quê).

## 7. Partilha e visibilidade
- Imagem de partilha (Open Graph) por notícia e por jogo, para o link ficar bonito no WhatsApp/Facebook.
- Botão "partilhar" nos resultados e notícias.
- Sitemap e dados estruturados para melhor indexação no Google.

## 8. Experiência móvel
Como o site é muito usado no telemóvel: tabelas com deslocamento horizontal suave,
cartões de jogo maiores, e menu inferior fixo com Início/Calendário/Classificação.

## 9. Desempenho e imagens
Redimensionar as fotos no upload (escudos e jogadores), carregamento diferido e
espaços reservados enquanto carrega, para poupar dados móveis.

## 10. Extras opcionais
- Modo escuro.
- Notícias em destaque na página inicial (carrossel).
- Exportar classificação e calendário em PDF/imagem para partilhar.
- Contador para o próximo jogo na página inicial.

## Notas técnicas
- Novas rotas: `/equipas/$id`, `/jogos/$id`, `/jogadores/$id`, `/classificacao` com separadores.
- Forma recente e estatísticas calculadas a partir dos jogos já guardados (nada duplicado na base de dados).
- `head()` próprio por rota nova, com título, descrição e imagem de partilha.
- Redimensionamento de imagens feito no browser antes do upload para o armazenamento.

## Sugestão de ordem
Primeiro 1, 2 e 4 (páginas de equipa e jogo + jornadas), depois 5 e 6, e por fim 7-9.
