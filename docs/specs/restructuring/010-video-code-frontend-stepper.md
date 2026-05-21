# SDD-010: Vídeo com Código Stepper UI Component

## 1. Objective
Specify the React layout of the code-to-video stepper running view.

---

## 2. UI Layout
* **Editor/Prompt Input**: Create view allowing prompt entry, aspect ratio selection, voice, and speed configuration.
* **Vertical Timeline Progress View**:
  1. *Prompt AI Analyser* (Analyses concept)
  2. *Escrita do Roteiro / Código* (Builds Remotion canvas code)
  3. *Geração de Áudio* (Edge-TTS)
  4. *Renderizador Remotion* (Compiles MP4)
* **Progress logs overlay**: Integrates the standard polling component.
