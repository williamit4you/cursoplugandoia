# Projeto de conteúdo — Funko Brasil

Programa: `FUNKO_COLECIONAVEIS`

Loja: `funko-brasil`

CTA: `/go/loja/funko-brasil`

Risco: `LOW`, com controle de propriedade intelectual e atualidade

## 1. Tese

Criar um portal de colecionismo e cultura geek. A aquisição segue universo → franquia → personagem → coleção/edição → produto. A marca entra no fundo do funil; o portal também atende iniciantes, presentes, lançamentos e organização de coleção.

## 2. Arquitetura

```text
/colecionaveis
├── /funko-pop
│   ├── /animes
│   │   ├── /one-piece
│   │   ├── /naruto
│   │   └── /dragon-ball
│   ├── /marvel
│   ├── /dc
│   ├── /games
│   ├── /filmes
│   └── /series
├── /lancamentos-funko-pop
├── /funko-pop-exclusivos
├── /guias-para-colecionadores
└── /presentes-geek
```

Prioridade: animes, começando por One Piece e expandindo somente conforme catálogo e demanda.

## 3. Lote inicial — 30 pautas

### Fundação — 7

1. Guia Funko Pop;
2. O que é Funko Pop;
3. Como começar uma coleção;
4. Como conservar Funko Pop;
5. O que significam os números das caixas;
6. O que significa Chase;
7. Funko comum x exclusivo.

### Anime e franquias — 13

8. Funko Pop de anime: guia;
9. Funko Pop One Piece;
10. Melhores Funkos de One Piece, com método;
11. Guia de Funkos do Luffy;
12. Guia de Funkos do Zoro;
13. Lista verificável de One Piece;
14. Funko Pop Naruto;
15. Melhores Funkos de Naruto;
16. Lista verificável de Naruto;
17. Funko Pop Dragon Ball;
18. Melhores Funkos de Dragon Ball;
19. Funko Pop Demon Slayer;
20. Como acompanhar lançamentos de anime.

### Comercial e presente — 10

21. Como escolher o primeiro Funko;
22. Funkos exclusivos disponíveis no Brasil, página volátil;
23. Presentes para fãs de One Piece;
24. Presentes para fãs de Naruto;
25. Presentes para fãs de anime;
26. Presentes para gamers;
27. Presentes geek para amigo secreto;
28. Como organizar coleção e prateleiras;
29. Análise de produto prioritário com demanda;
30. Funko com caixa x fora da caixa: conservação.

Páginas “até R$ X” só entram com atualização de preço/estoque automatizada.

## 4. SEO programático permitido

A estrutura franquia/personagem/modelo pode gerar pautas, mas não publicação automática. Uma página só nasce quando possui:

- demanda ou relevância editorial;
- inventário verificável;
- texto original;
- diferença clara frente ao hub/franquia;
- links internos naturais;
- atualização possível.

Não gerar todo produto, personagem ou combinação por padrão.

## 5. Review/lista

Registrar franquia, personagem, coleção, número, edição, tamanho, exclusividade verificada, características, preço/data e disponibilidade. Lista deve informar escopo e data, pois coleções mudam. Não usar “lista completa” sem método capaz de sustentá-la.

## 6. Guardrails

- não copiar descrições, bases ou imagens sem permissão;
- registrar licença/origem de cada imagem;
- não afirmar raridade, exclusividade ou autenticidade sem fonte;
- não especular lançamento como fato;
- separar notícia verificada de rumor;
- rankings explicam critérios;
- páginas de preço/estoque expiram rapidamente;
- CTA usa somente a Funko Brasil cadastrada.

## 7. Canais e job

- job diário; até 5 publicações por semana;
- bootstrap de 30 pautas;
- operação adicional `MONITOR_RELEASES` com fonte oficial;
- conteúdo visual aprovado pode derivar para Discover, Pinterest e social;
- páginas de lançamento ganham revisão curta e arquivamento/atualização definido.

## 8. KPIs

- tráfego por franquia/personagem;
- retorno a checklists/listas;
- velocidade e precisão de lançamentos;
- cliques afiliados por lista/review/presente;
- páginas vencidas por estoque;
- incidentes de imagem/licença, meta zero.
