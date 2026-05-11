# Findings: Shopee Scraper

## System Architecture Context
- To be discovered: Location and setup of the Python worker.
- To be discovered: Existing MinIO client configuration in the project.

## Schema Requirements
Table: `coletaDadosShoppe`
- `id`
- `url`
- `titulo`
- `detalhes`
- `descricao`
- `ai_prompt_vendas` (The generated prompt)

Table: `linksVideosImagens`
- `id`
- `coletaId`
- `tipo` (video, imagem)
- `urlMinio`

## Prompt Requirements
- Agent persona: Expert in digital marketing and sales copy.
- Structure: Persuasive copy about the product, details, finishing always with "para ter acesso ao produto, o link está na bio".

## Scraping Requirements
- Sample URL provided: `https://shopee.com.br/Caixa-de-Som-Bluetooth-Potente-Com-4-Alto-Falantes-30W-Soundbar-PC-Notebook-TV-i.1351679961.21498150153?extraParams=...`
- Need to grab video (if exists) and images.
- Need to extract title, details, and description.
