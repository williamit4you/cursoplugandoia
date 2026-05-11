# Task Plan: Shopee Scraper Pipeline & UI

## Goal
Create an end-to-end pipeline to scrape Shopee products (extracting title, details, description, video, and images), store media in MinIO and metadata in PostgreSQL, create an AI agent to generate sales copy prompts, and build a frontend UI to register URLs and trigger the execution.

## Current Phase
Phase 1

## Phases

### Phase 1: Requirements & Architecture Discovery
- [x] Understand user intent and system boundaries
- [x] Identify schema changes needed (`coletaDadosShoppe`, `linksVideosImagens`)
- [x] Define Python backend endpoint requirements for scraping
- [x] Define MinIO integration for media storage
- [x] Define AI agent creation parameters for the sales copy prompt
- [x] Outline frontend UI changes
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: Database & Prisma Setup
- [x] Define the Prisma models for `coletaDadosShoppe` and `linksVideosImagens`
- [x] Add AI agent specific fields for the prompt generation
- [x] Create and run migration
- **Status:** complete

### Phase 3: Python Scraping Backend
- [x] Create a new FastAPI endpoint (in the existing Python worker) for Shopee scraping
- [x] Implement web scraping logic for Shopee (handling dynamic content if needed)
- [x] Implement downloading logic for videos and images
- [x] Implement MinIO upload and get public URLs
- [x] Implement extraction logic for title, details, and description
- [x] Send data back or save directly to DB
- **Status:** complete

### Phase 4: Next.js API & AI Agent
- [x] Create API route in Next.js to trigger the Python scraper
- [x] Setup the AI agent prompt logic for the digital marketing copy (link in bio)
- [x] Update DB with the AI generated prompt
- **Status:** complete

### Phase 5: Frontend Implementation
- [x] Create UI for `Coleta Shopee`
- [x] Add "Cadastrar URL" manually
- [x] List saved URLs
- [x] Add "Executar scraping" button (inside form and on list)
- **Status:** complete

### Phase 6: Testing & Delivery
- [x] Test scraping end-to-end with the provided URL
- [x] Test MinIO uploads
- [x] Test AI prompt generation
- [x] Test frontend integration
- **Status:** complete

## Key Questions
1. Should the Python worker save to DB directly or return data to Next.js API to save?
2. How to handle Shopee's anti-scraping mechanisms (Playwright, Selenium, undetected-chromedriver)?
3. Does the system already have a Python FastAPI worker running? Let's check the current architecture.

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use Python for Scraping | Better ecosystem for scraping (BeautifulSoup, Playwright/Selenium, yt-dlp/similar) |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
|       | 1       |            |

## Notes
- Will use `planning-with-files` to track progress.
