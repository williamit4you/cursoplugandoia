import assert from "node:assert/strict";
import test from "node:test";
import { buildLongFormVisualScenes } from "../lib/longFormVisualScenes";

test("plano visual longo usa o conteudo real sem placeholders repetitivos", () => {
  const narrationText = Array.from({ length: 90 }, (_, index) =>
    `Na explicacao ${index + 1}, analisamos uma decisao concreta do vendedor e mostramos o efeito dessa escolha no resultado da operacao.`,
  ).join(" ");
  const scenes = buildLongFormVisualScenes({
    title: "Como estruturar sua primeira operacao de vendas",
    narrationText,
    subtopics: [
      "Escolha do produto",
      "Calculo de custos",
      "Criacao do anuncio",
      "Atendimento ao cliente",
      "Analise dos resultados",
    ],
    durationSec: 600,
    assets: [],
    briefs: [],
  });

  assert.ok(scenes.length >= 24 && scenes.length <= 48);
  assert.equal(
    scenes.reduce((total, scene) => total + scene.durationSec, 0),
    600,
  );
  const serialized = JSON.stringify(scenes);
  assert.doesNotMatch(serialized, /Ponto importante/i);
  assert.doesNotMatch(serialized, /Exemplo pratico/i);
  assert.doesNotMatch(serialized, /Como aplicar agora/i);

  const titles = scenes
    .map((scene) => String((scene.props as any)?.title || (scene.props as any)?.subtitle || ""))
    .filter(Boolean);
  assert.ok(new Set(titles).size >= Math.floor(titles.length * 0.6));
  assert.ok(new Set(scenes.map((scene) => scene.sceneTemplate)).size >= 3);
});
