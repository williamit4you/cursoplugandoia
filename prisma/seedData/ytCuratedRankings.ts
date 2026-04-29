export type CuratedYtSeedChannel = {
  name: string;
  category: string;
  subscribersLabel: string;
};

const csvNoticias = `Rank,Nome do Canal,Inscritos
1,"Rubinho Nunes",1.2M
2,"Santander Brasil",1M
3,"Canal do Psiu",670.6K
4,"Gugah TUBE",656.1K
5,"Novo Brasil",638.5K
6,"Manchete Política do BR",623.5K
7,"Lucro FC",548.5K
8,"Professor Leonardo",442.1K
9,"PRIMEIRA PÁGINA",407.5K
10,"Petró Advocacia",385.6K
11,"Mobile Gameplays",347.9K
12,"ANTÔNIO LOPES DA SILVA",319.5K
13,"Você Investidor",317.5K
14,"Ela Investe",302.5K
15,"Dr. Br",268.5K
16,"Medeiros",262.5K
17,"Canal do Vaguinha",261.5K
18,"Quadrangular Oficial",258.5K
19,"RedNews",257.1K
20,"Renda Com Dividendos",253.5K
21,"Cortes Red News",253K
22,"Arcomtec Refrigeração",251.5K
23,"Gilson Moraes",249.5K
24,"Portal Metro1",217.6K
25,"Investimento em AÇÃO",216.5K
26,"Mystic Falls",216.5K
27,"Ricardo Alencar",207.5K
28,"O PROVOCADOR",196.5K
29,"João paulo grandão",190.5K
30,"Vasco Giant Channel",188K
31,"TV Grabois",183.4K
32,"Jeck Ferraz",160.6K
33,"Marcos Rogério",156.5K
34,"Davi Vieira",153.5K
35,"Lucas Fii",153.1K
36,"HEY Rubem",149.5K
37,"África do Jeito Que Nunca Viu",148.5K
38,"Adriane Fauth",146.2K
39,"BR Bodybuilding News",144.4K
40,"Endireitando Brasil",139.5K
41,"Collar Repórter",133.5K
42,"Moacir Pereira",128.6K
43,"Fogão do Meu Coração",128.6K
44,"Tabata Amaral",124.4K
45,"Loteria Dominada",124.4K
46,"LUKAS NEWS",121.5K
47,"Bitcoinheiros",120.5K
48,"TioFiis - Mateus Lima",110.5K
49,"Gabriel Porto FIIs",106.5K
50,"MGLCONCURSOS",104.5K
51,"RESENHA ALVIVERDE",91.2K
52,"Rita Gonçalves",87.4K
53,"Fábio Roque Araújo",84.8K
54,"Emanuel Summers",84.1K
55,"Desempregado Rico - Neto",81.7K
56,"Gustavo Ribeiro",75.7K
57,"Seu Benefício",75K
58,"Lucas Jordan",70K
59,"desert",65.3K
60,"Viver de Dividendos",58.6K
61,"Canal 10 Santos FC",56K
62,"Caroline De Toni",55.9K
63,"Capitão Wagner Sousa",55.3K
64,"Papa Concursos",55.2K
65,"GP Concursos",50.1K
66,"TJSP - Oficial",48.7K
67,"Marcas e Máquinas",48.3K
68,"Rolo de Fumo",48.2K
69,"Blog do Anderson",48.2K
70,"Samário de Oliveira",47.7K
71,"Eduarda Campopiano",46.1K
72,"Rick Covil",45.3K
73,"the news cc",39.4K
74,"Liberdade é Logo Ali",39K
75,"angeli10",38.6K
76,"Arthur Lima Show",38.6K
77,"Guto Nunes",38.2K
78,"Димитрије Ј.",36.2K
79,"Conta pra mim",31.6K
80,"Renaud Adorno",31.5K
81,"Josuel do Espirito Santo",30.7K
82,"Felipe FT Miranda",29.3K
83,"Programa Acorda Cidade",29.1K
84,"Carlos Zarattini",28K
85,"Rádio Uirapuru",26.8K
86,"Trígono Capital",26.7K
87,"SaldoInvest",26.3K
88,"Wellington Araújo",25.7K
89,"iHUB Conteúdos",25.3K
90,"Cibele Laura",25.1K
91,"André Massaro",25.1K
92,"Cigano Iago do Oriente",24.9K
93,"Método Supera Concursos",24K
94,"Elvio Fernandez",23.8K
95,"Scofield",23.8K
96,"Rádio Cultura Nordeste",23.8K
97,"NandaPlay Hytale",23.2K
98,"Fabio Ostermann",23.2K
99,"Trade for Life",23.2K
100,"ACM Neto",23K`;

const csvEsportes = `Rank,Nome do Canal,Inscritos
1,"CADUH Trem",1.4M
2,"Gamer BR - M1l Grau",1M
3,"Duuh Messias",440.5K
4,"FLA GUERREIRO",337.5K
5,"Canal do Vaguinha",261.5K
6,"IDENTIDADE CORINTHIANA",247.5K
7,"Tv 100 Futuro de Betânia - CE",225.5K
8,"Roberto Nascimento TV",218.5K
9,"FKBrasil Football",212.6K
10,"Cortes do Euro Fut [OFICIAL]",212.6K
11,"Ricardo Alencar",207.5K
12,"10 E FAIXA",203.5K
13,"PALPITES DA HORA",195.5K
14,"Canal Camisas e Chuteiras",192.5K
15,"Plantão do Paulinho",186.6K
16,"Canal WAMO",185.6K
17,"Braune - Esportes",170.5K
18,"Varanda Futebol Debate",169.4K
19,"Mlk Freestyleiro",159K
20,"Marco Droid",156.4K
21,"Only Corinthians",150.4K
22,"BARÃO e-GAMER",138.6K
23,"Collar Repórter",133.5K
24,"98 Live Esportes",129.5K
25,"Fogão do Meu Coração",128.6K
26,"Palpites Sports",125.4K
27,"Futmania",122.5K
28,"Alemão SPFC",115.5K
29,"RaFla Mello II",114.6K
30,"Liga Brasileira de Futevôlei",114.6K
31,"TLD",108.5K
32,"MASK FOOTBALL",99.9K
33,"Canal do Fragoso",95K
34,"Live Basketball BR",94.2K
35,"RESENHA ALVIVERDE",91.2K
36,"TV E RADIO MARCÃO DA FIEL",90.7K
37,"Breno Galante",89.2K
38,"Academia das Apostas Brasil",79.5K
39,"Léo Gamer",74.1K
40,"Jogada",71.8K
41,"Isabel Nascimento",66.4K
42,"21onze",56.4K
43,"Canal 10 Santos FC",56K
44,"Tricolada",54.6K
45,"DantheBNN",54.4K
46,"Diário do Peixe",50K
47,"Canal Juliana pires",49.5K
48,"Rick Covil",45.3K
49,"ECVídeos",45K
50,"Pernambuquinho Oficial",44.2K
51,"CSA Oficial",43.1K
52,"Historado",42.3K
53,"VozãoCast",41.9K
54,"CBM TV OFICIAL",40K
55,"Palmeiras Uma História Gloriosa",38.7K
56,"Canal do Emershow",38.6K
57,"Atlético Mineiro Galo_FC",38.5K
58,"Sudaca Brasil",37.5K
59,"TV Belo",37K
60,"Matheus Capanema",36.8K
61,"Três Pontos",35.9K
62,"Astral Luna",35.1K
63,"R1 na Mira",35K
64,"Jennifer Soares",34.2K
65,"Rádio Coringão",33.7K
66,"MATHEUSIN FOOTBALL",33.7K
67,"Vitor Gomes",31.7K
68,"RELIGIÃO RUBRO-NEGRO",30.6K
69,"Felipe FT Miranda",29.3K
70,"Fogo na Rede",29.1K
71,"MANÉ CARTOLA",27.8K
72,"GERALSC",27.7K
73,"GOL DO CORINTHIANS",27.3K
74,"Grêmio Esportivo Brasil",27.2K
75,"Acervo do Galo",27K
76,"CBF7 Futebol 7",26.3K
77,"TaçoTV",26K
78,"Wellington Araújo",25.7K
79,"Futebol Interior",25.2K
80,"Cobras da Bola",25.2K
81,"Marginal Influencer",25K
82,"Olimpíada Todo Dia",24.5K
83,"Scofield",23.8K
84,"DragãoTV",23.8K
85,"Sesi Franca Basquete",23.5K
86,"Canal Verdão Info",22.8K
87,"Eraldo Leite Na Cara do Gol",22.6K
88,"Academia das Apostas",22.6K
89,"CANAL MONTI SHOW",22.4K
90,"Cronômetro Zerado",22.3K
91,"MOVIDOS PELA GRAÇA",21.8K
92,"ESPALMA RONALDO",21.2K
93,"PB Esportes",20.6K
94,"Tube Sport",19.9K
95,"Nilson Luiz Repórter",19.6K
96,"Apostador Esportivo",19.1K
97,"Poker Esportes",18.9K
98,"Anderson Batista",18.8K
99,"TV Novorizontino",18.7K
100,"Teólogo RUY Barbosa Trancozo",18.4K`;

const csvEducacao = `Rank,Nome do Canal,Inscritos
1,"Davi Oliveira - Física 2.0",953.1K
2,"Prof. JeanGrafia",653K
3,"Reavivados por Sua Palavra NT",574.5K
4,"Anhanguera",400.1K
5,"Aprender Crochet con Yanexi",344.5K
6,"Concurseiro Nômade",321.6K
7,"Estratégia Militares",305.4K
8,"PEDAGOFLIX",223.1K
9,"Elisa Paiva",215.5K
10,"Curso Mege",206.5K
11,"Padre José Carlos Pereira",197.5K
12,"Dr. Renato Palmeira | ENEM 2026",156K
13,"Dani Mengue",156K
14,"Iracy Santos Crochê",148.5K
15,"Filosofia Vermelha",146.6K
16,"Adriane Fauth",146.2K
17,"Ana Gomes",137K
18,"O Primo Primata",126.5K
19,"Leiliane Rocha Psicóloga",121.5K
20,"Escola da Liberdade",115.5K
21,"MGLCONCURSOS",104.5K
22,"Mesterlab",103.5K
23,"Laryssa Neves",88.3K
24,"Cesar Annunciato - Teorema",70.7K
25,"TESHUVA TOTAL",68.9K
26,"Nuvem de Fios Ateliê",60.7K
27,"English With Teacher Levi",58.9K
28,"bcb.tutoriais",57K
29,"Papa Concursos",55.2K
30,"AprendaCom Aline Aurora",52.5K
31,"GP Concursos",50.1K
32,"Professor Mateus Silveira",48.3K
33,"Academia Dulcis Domus",45.8K
34,"Projeto Aprovação",43.7K
35,"Fundação Bradesco",36.2K
36,"GOIANOLOGIA-Prof. Chagas",31.6K
37,"CENTRAL AREA",30.5K
38,"Prof. Josevaldo Melo",30.3K
39,"Mike School - Matemática Mike",29.7K
40,"MFIT Personal",29.7K
41,"Escola Superior de Educação, Humanidades e Línguas",29.5K
42,"EAD Das Plantas",29.4K
43,"Prof. Murilo Marques",28.6K
44,"Literatura e Redação",26.6K
45,"Rodrigo Alencar",26.1K
46,"APP-Sindicato",26K
47,"Josue Yrion Oficial",25.9K
48,"Adriele Seibel",25.8K
49,"Lucas Guerreiro",25.6K
50,"Prof. Tiago Benedetti",25.3K
51,"VFK EDUCAÇÃO OFICIAL",24.4K
52,"Renata Valim",24.3K
53,"IBP-Belém",23.9K
54,"Matemática Humanista",23.6K
55,"ANPEd Nacional",23.3K
56,"Escola Superior Politécnica",23.2K
57,"DAISSEN Zen Budismo",23.1K
58,"AM Concursos",22.8K
59,"Engenhando",22.8K
60,"Sérgio Nogueira",22.6K
61,"Maria Lucia Lee",22K
62,"Igreja Transformando Vidas",21.5K
63,"Ulbra",21.3K
64,"SBEBM",20.8K
65,"Ezequiel",20.6K
66,"CRCSC Oficial",20.2K
67,"Luiz Fuganti",19.9K
68,"Colégio Pedro II",19.9K
69,"TV CRCRS",19.9K
70,"Afro Designer",19.9K
71,"TV IFSULDEMINAS",19.7K
72,"Adventistas Goiás",19.2K
73,"Tanach Para A Vida",18.9K
74,"TVIFCE",18.8K
75,"Faculdade Jesuíta",18.4K
76,"ObjetivoOficial",17.9K
77,"Sinagoga Beit Miklat Brasil, RJ",17.9K
78,"Troféu Bateria",17.4K
79,"Alexandre Soares Necrópsia",16.9K
80,"Sérgio Merola - Servidores, Licitações e Concursos",16.8K
81,"Universidade Federal de Minas Gerais - UFMG",16.4K
82,"Canal ILB",16.3K
83,"Movimento dos Focolares",16.2K
84,"Canal da UTFPR",15.9K
85,"Uniregistral",15.7K
86,"delta thiago",15.5K
87,"Teologia UniCesumar",15.2K
88,"Rômulo Monteiro",15.2K
89,"Mauro Pennafort",15.1K
90,"Filipe Iorio",14.8K
91,"Minha Igreja na Cidade",14.6K
92,"IEADPE RIBEIRÃO",14.5K
93,"Isabela Alves",14.2K
94,"Faculdade de Educação Unicamp",14K
95,"IBBIS - Instituto Brasileiro",13.6K
96,"Prof. Saulo Bezerra",13.1K
97,"Professor Jorge Alonso",12.8K
98,"TV CRCMG",12.5K
99,"Fraternidade Espírita",12.3K
100,"Mauro Brucoli Violoncelo",12.3K`;

const csvFitness = `Rank,Nome do Canal,Inscritos
1,"Leandro Twin",3.9M
2,"EUANGELTV",2.9M
3,"Thaisa Leal Nutricionista",1.2M
4,"Hayka Ritbox",888.5K
5,"Um Diabético",347.2K
6,"Fernando Cantarelli",244K
7,"BR Bodybuilding News",144.4K
8,"Corrida Simples",141.5K
9,"Rafael Andrade",133.5K
10,"Kyra Gracie",111.5K
11,"Victor Pareto",108.5K
12,"Juliane Costa",68.9K
13,"Vitamina D Medicina e Saude",63.4K
14,"Juliana Ota - Método MOVA",40.2K
15,"Renato Personal Trainer",36.8K
16,"Edvan Palmeira Pro",32.3K
17,"Saulo Arruda",30.2K
18,"Jayme Sandall Karate Shotokan",29.3K
19,"UNIGUAÇU BRASIL",29.3K
20,"Aretha Lab",25.1K
21,"Olimpíada Todo Dia",24.5K
22,"Beatriz Medeiros",23.9K
23,"Froemming Tutoriais",23.6K
24,"SABER VIVER NA MENOPAUSA",23.5K
25,"Gabriel Martins Fitness",21.8K
26,"sejateamsousa",20.9K
27,"Programa Academia Carioca",20.8K
28,"NascenTV EPCAR",19K
29,"Michel Monteiro",17.9K
30,"O AMADOR",17.8K
31,"Lojão do Caipira",17.1K
32,"Rebeca Dantas",15.8K
33,"Thiago Varella",14.5K
34,"Yoga em Casa",13.6K
35,"Otto Leone Personal",13.1K
36,"Eden Carllos Mov. Natural",12.6K
37,"Camilli Viaja",12.5K
38,"Rose França",12.2K
39,"No Corre",12.2K
40,"Caroline Mariotto",11.9K
41,"FRITA BACON",11.7K
42,"GABRIEL.S",11.5K
43,"Felipe Kutianski",11K
44,"arthur roveda weiand",10.4K
45,"Bora Correr Galera",9.4K
46,"Cleya Oliveira",9.3K
47,"Federação Paulista Karate",8.6K
48,"LC Alpha",8.6K
49,"JONATHAN MITCHEL",7.9K
50,"Federação Portuguesa Ciclismo",6.9K
51,"Pegada Multimidia",6.9K
52,"Flávio Pontes Fisio",6.8K
53,"Tissi Menezes",6.7K
54,"Gabriel Personal",6.7K
55,"Isa Abrahão",5.8K
56,"Olympico Club",5.7K
57,"Amanda Soares",5.7K
58,"Team Nogueira SP Zona Sul",5.6K
59,"Vanessa 7 Ramos",5.5K
60,"Rafaela Guimarães",4.1K
61,"Rádio Norte Gaúcho",3.4K
62,"Mudando A Rotina",3.3K
63,"Marcelo Martins",3.2K
64,"Canal Shirley Matos",2.7K
65,"Giselle Dantax",2.4K
66,"BODY FIT BRASIL",2.4K
67,"PROSA DA VIDA REAL",2.3K
68,"Carilu Torres",2.2K
69,"Personal Márcio LEAL",2.2K
70,"Clara Moulin",1.6K
71,"Claudio Maktub (Dinho)",1.4K
72,"Deise De Lima",623`;

function parseCsvChannels(csv: string, category: string): CuratedYtSeedChannel[] {
  return csv
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\d+,"(.+)",([^,]+)$/);
      if (!match) return null;
      return {
        name: match[1],
        category,
        subscribersLabel: match[2].trim(),
      };
    })
    .filter((item): item is CuratedYtSeedChannel => item !== null);
}

function parseRankNameList(list: string, category: string): CuratedYtSeedChannel[] {
  return list
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^rank\b/i.test(line))
    .map((line) => {
      const firstComma = line.indexOf(",");
      if (firstComma === -1) return null;
      const maybeRank = line.slice(0, firstComma).trim();
      if (!/^\d+$/.test(maybeRank)) return null;
      const name = line.slice(firstComma + 1).trim();
      if (!name) return null;
      return {
        name,
        category,
        subscribersLabel: "",
      };
    })
    .filter((item): item is CuratedYtSeedChannel => item !== null);
}

const listIa = `Rank,Nome do Canal
1,Riley Brown
2,Peter Yang
3,Eric Tech
4,Jack Roberts
5,Zinho Automates
6,Alex Finn
7,Two Minute Papers
8,Google DeepMind
9,Matthew Berman
10,The Daily AI Brief
11,The AI Grid
12,AI Explained
13,Willian IA
14,Inventor Miguel`;

const listDev = `Rank,Nome do Canal
1,Filipe Deschamps
2,Micael Mota
3,Michelli Brito
4,Attekita Dev
5,Filho da Nuvem
6,Loiane Groner
7,Programador Lhama
8,Glaucia Lemos
9,Canal Peixe Babel
10,Universo Discreto
11,Abel Siqueira
12,Data Hackers
13,Sujeito Programador`;

const listAutomoveis = `Rank,Nome do Canal
1,Opinião Sincera
2,Acelerados
3,Veneto Studio
4,Carro Chefe
5,Meu Carro LifeStyle
6,Auto Super
7,WANDERSON VÍDEOS TRUCK
8,Backstage
9,Borracheiro PE
10,Victor041
11,Macchina
12,Max Hobby
13,Raylan Som
14,Samuel Vagner
15,Rodrigo Moreira
16,Anderson Dick
17,Escolha Certa`;

const listNerd = `Rank,Nome do Canal
1,Ei Nerd
2,mikannn
3,Pipocando
4,Daniel Greene
5,Nostalgia
6,Coisa de Nerd
7,Jovem Nerd
8,Matheux Mendex
9,Entre Migas
10,Natália Kreuser
11,Carol Moreira
12,Tolkienista
13,Super Oito`;

const listBeleza = `Rank,Nome do Canal
1,Mari Maria Makeup
2,Camila Nunes
3,Karol Pinheiro
4,Fashion MiMi
5,Chata de Galocha
6,Boca Rosa
7,Nanda Lima
8,Nátaly Neri
9,Diuly Ottobeli
10,Romolo Cricca
11,Glenda Mayeres Beauty
12,Hi Bia
13,Franciny Ehlke`;

const listReligiao = `Rank,Nome do Canal
1,Bispo Bruno Leonardo
2,Padre José Carlos Pereira
3,Quadrangular Oficial
4,Reavivados por Sua Palavra NT
5,Josue Yrion Oficial
6,DAISSEN | Zen Budismo
7,Igreja Transformando Vidas`;

const listCulinaria = `Rank,Nome do Canal
1,TudoGostoso
2,Igor Rocha
3,Erick Jacquin Com Tômpero
4,Juliana Lima
5,Tastemade Brasil
6,Andre Marques
7,Beca Milano
8,Patricio Carvalho
9,Receitas de Pai
10,Cozinha para 2
11,Miolos Fritos
12,Receitas de Minuto
13,Presunto Vegetariano
14,Rolê Gourmet
15,Ana Maria Brógui
16,Cozinha Bossa e Malagueta`;

const listViagens = `Rank,Nome do Canal
1,Mauro Nakada
2,Travel and Share
3,Becca Pires
4,Estevam pelo Mundo
5,Louco por viagens
6,Carioca no Mundo
7,Sonho e Destino
8,Viaje na Viagem
9,Num Pulo
10,Apure Guria
11,Outside in Juiz de Fora
12,Vamos Fugir Blog
13,Claudião
14,Papo de Dinheiro com João Paulo
15,Pajô Aventuras
16,The Way We Sea
17,Papo na Estrada
18,Ministério 24 Horas Diante do Senhor
19,Oh lala Dani
20,Rosi Camargo e Alex`;

const listInfantil = `Rank,Nome do Canal
1,LUCCAS NETO
2,Maria Clara & JP
3,DUDU e CAROL
4,Rafa & Luiz
5,Emilly Vick
6,Masha e o Urso
7,José Totoy em Português (BR)
8,Little Angel
9,Peppa Pig
10,Crescendo com Luluca
11,Valentina Pontes
12,Bela Bagunça
13,Planeta das Gêmeas
14,Monica Toy
15,Bolofofos`;

const listHumor = `Rank,Nome do Canal
1,Whindersson Nunes
2,Spider Slack
3,M kriwat
4,Canal Canalha
5,Galo Frito
6,Enaldinho
7,O Que Não Dizer Oficial
8,MALOUCOS
9,Tales Bento
10,Parafernalha
11,Everson Zoio`;

const listMusica = `Rank,Nome do Canal
1,Canal KondZilla
2,GR6 EXPLODE
3,Galinha Pintadinha
4,Marília Mendonça
5,Dan-Sa / Daniel Saboya
6,7 Minutoz
7,Top Music Brasil (AI)
8,Zé Neto e Cristiano
9,Luan Santana
10,Gusttavo Lima Oficial`;

const listGames = `Rank,Nome do Canal
1,Jazzghost
2,Cadres
3,Robin Hood Gamer
4,AuthenticGames
5,Spiderbritto
6,Jooj Natu
7,NOBRU
8,Julia MineGirl
9,Paulinho Papile
10,ANONY
11,Sales Júnior Armeiro
12,Plantão Das Feiras Com Campos Salles
13,Lilian mãe de 3 meninos
14,Josiane Szewczuk
15,ADRIANO PERES
16,Zanon2K
17,Hoxton Gamer
18,TIo Lou Games
19,Jhoon Salles
20,Gs Films
21,LuKinas
22,XimenesPlay
23,Junior Ituano Gamer
24,Eu sou Vinny
25,Ashzão
26,Capzinha
27,Winterflash
28,Canal do Deivão`;

const listPodcasts = `Rank,Nome do Canal
1,Mil e uma TrETAS
2,Não Inviabilize
3,Café Com Deus Pai
4,Estranha História
5,Platitudes
6,Uma Tupá no Tempo
7,Mamilos
8,Café da Manhã
9,Inteligência Ltda
10,Jota Jota Podcast
11,O Assunto
12,NerdCast
13,Futuramente
14,the news tns
15,NÃO IMPORTA (Porta dos Fundos)
16,Podpah
17,Quinta Misteriosa
18,TICARACATICAST
19,Billions Club
20,Medo e Delírio em Brasília
21,Bom dia Obvious
22,vibes em análise
23,Os Sócios Podcast
24,Rádio Novelo Apresenta
25,Café com Pastel
26,Pretinho Básico
27,Era Uma Vez Um Podcast
28,Café Com Crime
29,Beto Ribeiro
30,Oeste Sem Filtro
31,Pastor Sandro Rocha`;

const listMarketing = `Rank,Nome do Canal
1,Camila Renaux
2,Ecommerce na Prática
3,Hotmart
4,Endeavor Brasil
5,Arsenal Empreendedor
6,Geração de Valor
7,Startupi
8,TV Sebrae
9,Canal do Empreendedor
10,Empreendedor do Zero
11,Gustavo Cerbasi
12,Espaçonave
13,Conta Azul
14,Jonny Viccari
15,Brasileirinho
16,Matheus Amaral - Negociador Z
17,Joba
18,Bruno Faggion`;

export const YT_CURATED_SEED_CHANNELS: CuratedYtSeedChannel[] = [
  ...parseCsvChannels(csvNoticias, "politica-atualidades"),
  ...parseCsvChannels(csvEsportes, "futebol-esportes"),
  ...parseCsvChannels(csvEducacao, "educacao-aulas"),
  ...parseCsvChannels(csvFitness, "saude-fitness"),
  ...parseRankNameList(listIa, "tecnologia-ia"),
  ...parseRankNameList(listDev, "tecnologia-ia"),
  ...parseRankNameList(listAutomoveis, "automoveis-motos"),
  ...parseRankNameList(listNerd, "cinema-series-anime"),
  ...parseRankNameList(listBeleza, "beleza-moda"),
  ...parseRankNameList(listReligiao, "religiao-gospel"),
  ...parseRankNameList(listCulinaria, "receitas-culinaria"),
  ...parseRankNameList(listViagens, "viagens-turismo"),
  ...parseRankNameList(listInfantil, "infantil"),
  ...parseRankNameList(listHumor, "entretenimento-humor"),
  ...parseRankNameList(listMusica, "musica"),
  ...parseRankNameList(listGames, "games"),
  ...parseRankNameList(listPodcasts, "podcast-cortes"),
  ...parseRankNameList(listMarketing, "empreendedorismo"),
];
