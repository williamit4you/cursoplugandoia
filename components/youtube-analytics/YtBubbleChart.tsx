"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import {
  Box,
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

interface ChannelBubble {
  id: string;
  name: string;
  totalViews: number;
  subscribers: number;
  viewsShorts: number;
  viewsLongs: number;
  growth: number;
  url: string;
  category: string;
  categoryColor: string;
  thumbnailUrl: string | null;
}

interface YtBubbleChartProps {
  categoryId?: string;
  startFullscreen?: boolean;
}

type SizeBy = "totalViews" | "viewsLongs" | "viewsShorts" | "subscribers";

export default function YtBubbleChart({
  categoryId,
  startFullscreen,
}: YtBubbleChartProps) {
  const [data, setData] = useState<ChannelBubble[]>([]);
  const [sizeBy, setSizeBy] = useState<SizeBy>("totalViews");
  const [fullscreen, setFullscreen] = useState(!!startFullscreen);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (startFullscreen) setFullscreen(true);
  }, [startFullscreen]);

  const [stylePreset, setStylePreset] = useState<"crypto" | "soft">("crypto");
  const [holeRatio, setHoleRatio] = useState(0.62); // 0..0.9
  const [ringThickness, setRingThickness] = useState(10); // px
  const [ringOpacity, setRingOpacity] = useState(0.9);
  const [glowStrength, setGlowStrength] = useState(0.9);
  const [nameSize, setNameSize] = useState<"sm" | "md" | "lg">("md");
  const [showPercent, setShowPercent] = useState(true);

  const background = stylePreset === "crypto" ? "#0b0f14" : "#ffffff";
  const holeColor = background;

  const metric = useMemo(() => {
    return (d: ChannelBubble) => {
      if (sizeBy === "subscribers") return d.subscribers;
      if (sizeBy === "viewsShorts") return d.viewsShorts;
      if (sizeBy === "viewsLongs") return d.viewsLongs;
      return d.totalViews;
    };
  }, [sizeBy]);

  useEffect(() => {
    fetch(
      `/api/youtube-analytics/bubbles?sizeBy=${sizeBy}${
        categoryId ? `&categoryId=${categoryId}` : ""
      }`
    )
      .then((res) => res.json())
      .then((json) => setData(Array.isArray(json) ? json : []))
      .catch(console.error);
  }, [categoryId, sizeBy]);

  useEffect(() => {
    if (!data.length || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = fullscreen ? Math.max(520, window.innerHeight - 260) : 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.style("background", background);

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const sizeDomain = d3.extent(data, (d) => metric(d)) as [number, number];
    const sizeScale = d3
      .scaleSqrt()
      .domain([0, sizeDomain[1] || 1])
      .range([14, 86]);

    const formatNumber = (num: number) => {
      if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
      if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
      if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
      return num.toString();
    };

    const nodes = data.map((d) => ({
      ...d,
      r: sizeScale(metric(d)),
      x: Math.random() * width - width / 2,
      y: Math.random() * height - height / 2,
    }));

    const defs = svg.append("defs");

    const filter = defs
      .append("filter")
      .attr("id", "bubble-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", 7)
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    for (const n of nodes as any[]) {
      const base = d3.color(n.categoryColor) || d3.color("#22c55e");
      const c1 = base?.brighter(1.8)?.formatHex() || "#86efac";
      const c2 = base?.darker(0.6)?.formatHex() || "#166534";
      const id = `grad-${n.id}`;
      const grad = defs
        .append("radialGradient")
        .attr("id", id)
        .attr("cx", "30%")
        .attr("cy", "25%")
        .attr("r", "80%");
      grad.append("stop").attr("offset", "0%").attr("stop-color", c1);
      grad
        .append("stop")
        .attr("offset", "60%")
        .attr("stop-color", n.categoryColor)
        .attr("stop-opacity", 0.95);
      grad.append("stop").attr("offset", "100%").attr("stop-color", c2);

      const ringId = `ring-${n.id}`;
      const ring = defs
        .append("radialGradient")
        .attr("id", ringId)
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "70%");
      ring.append("stop").attr("offset", "0%").attr("stop-color", c1).attr("stop-opacity", 0.0);
      ring.append("stop").attr("offset", "55%").attr("stop-color", c1).attr("stop-opacity", 0.2);
      ring.append("stop").attr("offset", "72%").attr("stop-color", c1).attr("stop-opacity", 0.95);
      ring.append("stop").attr("offset", "100%").attr("stop-color", c2).attr("stop-opacity", 0.95);
    }

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "d3-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(15, 23, 42, 0.92)")
      .style("color", "#fff")
      .style("padding", "12px 16px")
      .style("border-radius", "10px")
      .style("pointer-events", "none")
      .style("font-family", "Inter, sans-serif")
      .style("font-size", "13px")
      .style("z-index", 9999)
      .style("box-shadow", "0 10px 25px rgba(0,0,0,0.25)")
      .style("opacity", 0);

    const simulation = d3
      .forceSimulation(nodes as any)
      .force("charge", d3.forceManyBody().strength(10))
      .force(
        "collide",
        d3
          .forceCollide()
          .radius((d: any) => d.r + 2)
          .iterations(2)
      )
      .force("x", d3.forceX().strength(0.04))
      .force("y", d3.forceY().strength(0.04));

    const nodeGroup = g
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .on("mouseover", (event, d: any) => {
        d3.select(event.currentTarget)
          .select("circle")
          .attr("stroke", "#fff")
          .attr("stroke-width", 3);
        tooltip.transition().duration(180).style("opacity", 1);
        tooltip
          .html(
            `
            <div style="display:flex; flex-direction:column; gap:6px;">
              <strong style="font-size:15px; border-bottom:1px solid #334155; padding-bottom:4px;">${d.name}</strong>
              <span style="color:${d.categoryColor}; font-weight:700;">${d.category}</span>
              <div style="display:flex; justify-content:space-between; gap:16px;"><span>Inscritos:</span><strong>${formatNumber(
                d.subscribers
              )}</strong></div>
              <div style="display:flex; justify-content:space-between; gap:16px;"><span>Total views:</span><strong>${formatNumber(
                d.totalViews
              )}</strong></div>
              <div style="display:flex; justify-content:space-between; gap:16px;"><span>Views (long):</span><strong>${formatNumber(
                d.viewsLongs
              )}</strong></div>
              <div style="display:flex; justify-content:space-between; gap:16px;"><span>Views (short):</span><strong>${formatNumber(
                d.viewsShorts
              )}</strong></div>
              <div style="display:flex; justify-content:space-between; gap:16px; color:${
                d.growth >= 0 ? "#4ade80" : "#f87171"
              }; font-weight:900; margin-top:4px;"><span>Cresc. Semanal:</span><span>${
                d.growth >= 0 ? "+" : ""
              }${d.growth}%</span></div>
            </div>
            `
          )
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 15 + "px");
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget)
          .select("circle")
          .attr("stroke", "rgba(0,0,0,0.12)")
          .attr("stroke-width", 1);
        tooltip.transition().duration(350).style("opacity", 0);
      })
      .on("click", (event, d: any) => {
        window.open(d.url, "_blank");
      });

    // Outer glow ring (crypto bubbles style)
    nodeGroup
      .append("circle")
      .attr("r", (d: any) => d.r)
      .attr("fill", (d: any) => `url(#ring-${d.id})`)
      .style("opacity", ringOpacity)
      .style("filter", glowStrength > 0.05 ? "url(#bubble-glow)" : "none");

    // Outer body
    nodeGroup
      .append("circle")
      .attr("r", (d: any) => Math.max(1, d.r - Math.max(1, ringThickness)))
      .attr("fill", (d: any) => `url(#grad-${d.id})`)
      .attr("stroke", "rgba(255,255,255,0.10)")
      .attr("stroke-width", 1)
      .style("opacity", 0.9);

    // Inner transparent hole
    nodeGroup
      .append("circle")
      .attr("r", (d: any) => Math.max(1, (d.r - Math.max(1, ringThickness)) * holeRatio))
      .attr("fill", holeColor)
      .attr("fill-opacity", stylePreset === "crypto" ? 0.55 : 0.25)
      .attr("stroke", stylePreset === "crypto" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)")
      .attr("stroke-width", 1);

    const textGroup = nodeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .style("fill", stylePreset === "crypto" ? "rgba(255,255,255,0.95)" : "#0f172a")
      .style("font-weight", "600")
      .style("text-shadow", stylePreset === "crypto" ? "0px 1px 3px rgba(0,0,0,0.7)" : "none");

    const nameFactor = nameSize === "sm" ? 0.9 : nameSize === "lg" ? 1.15 : 1.0;

    textGroup
      .append("tspan")
      .attr("x", 0)
      .attr("y", (d: any) => (d.r > 30 && showPercent ? -6 : 4))
      .style("font-size", (d: any) => Math.max(10, Math.min(18, (d.r / 3) * nameFactor)) + "px")
      .text((d: any) =>
        d.r > 22 ? (d.name.length > 14 ? d.name.substring(0, 12) + "…" : d.name) : ""
      );

    if (showPercent) {
      textGroup
        .append("tspan")
        .attr("x", 0)
        .attr("y", (d: any) => (d.r > 30 ? 14 : 0))
        .style("font-size", (d: any) => Math.max(10, Math.min(15, d.r / 4.2)) + "px")
        .style("opacity", 0.85)
        .style("font-weight", "500")
        .text((d: any) => {
          if (d.r <= 30) return "";
          const pct = Number(d.growth || 0);
          const sign = pct >= 0 ? "+" : "";
          return `${sign}${pct.toFixed(1)}%`;
        });
    }

    simulation.on("tick", () => {
      nodeGroup.attr("transform", (d: any) => {
        const x = Math.max(-width / 2 + d.r, Math.min(width / 2 - d.r, d.x));
        const y = Math.max(-height / 2 + d.r, Math.min(height / 2 - d.r, d.y));
        return `translate(${x},${y})`;
      });
    });

    return () => {
      simulation.stop();
      d3.selectAll(".d3-tooltip").remove();
    };
  }, [
    data,
    metric,
    sizeBy,
    fullscreen,
    stylePreset,
    holeRatio,
    ringThickness,
    ringOpacity,
    glowStrength,
    nameSize,
    showPercent,
    background,
    holeColor,
  ]);

  return (
    <Box
      sx={{
        mt: 4,
        bgcolor: fullscreen ? background : "#f8fafc",
        borderRadius: 4,
        p: { xs: 2, md: 3 },
        border: fullscreen ? "1px solid rgba(255,255,255,0.10)" : "1px solid #e2e8f0",
        ...(fullscreen
          ? { position: "fixed", inset: 16, zIndex: 2000, overflow: "auto" }
          : {}),
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: "900", color: "#1e293b" }}>
          Mapa de Canais (Bubble View)
        </Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <ButtonGroup size="small" sx={{ bgcolor: "#fff" }}>
            <Button
              variant={sizeBy === "totalViews" ? "contained" : "outlined"}
              onClick={() => setSizeBy("totalViews")}
              disableElevation
            >
              Total views
            </Button>
            <Button
              variant={sizeBy === "viewsLongs" ? "contained" : "outlined"}
              onClick={() => setSizeBy("viewsLongs")}
              disableElevation
            >
              Views longos
            </Button>
            <Button
              variant={sizeBy === "viewsShorts" ? "contained" : "outlined"}
              onClick={() => setSizeBy("viewsShorts")}
              disableElevation
            >
              Views shorts
            </Button>
            <Button
              variant={sizeBy === "subscribers" ? "contained" : "outlined"}
              onClick={() => setSizeBy("subscribers")}
              disableElevation
            >
              Inscritos
            </Button>
          </ButtonGroup>
          <Button
            size="small"
            variant={fullscreen ? "contained" : "outlined"}
            onClick={() => setFullscreen((v) => !v)}
            disableElevation
          >
            {fullscreen ? "Sair do fullscreen" : "Fullscreen"}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            onClick={() => {
              const url = `/admin/youtube-analytics/bubbles${categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : ""}`;
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            Abrir separado
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr 1fr" },
          gap: 2,
          mb: 2,
          p: 2,
          borderRadius: 3,
          border: fullscreen ? "1px solid rgba(255,255,255,0.10)" : "1px solid #e2e8f0",
          bgcolor: fullscreen ? "rgba(255,255,255,0.03)" : "#fff",
        }}
      >
        <FormControl size="small">
          <InputLabel>Estilo</InputLabel>
          <Select label="Estilo" value={stylePreset} onChange={(e) => setStylePreset(e.target.value as any)}>
            <MenuItem value="crypto">Crypto (dark)</MenuItem>
            <MenuItem value="soft">Soft</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Nome</InputLabel>
          <Select label="Nome" value={nameSize} onChange={(e) => setNameSize(e.target.value as any)}>
            <MenuItem value="sm">Pequeno</MenuItem>
            <MenuItem value="md">Médio</MenuItem>
            <MenuItem value="lg">Grande</MenuItem>
          </Select>
        </FormControl>

        <Box>
          <Typography variant="caption" sx={{ color: fullscreen ? "rgba(255,255,255,0.8)" : "text.secondary" }}>
            Transparência (meio)
          </Typography>
          <Slider
            value={holeRatio}
            min={0.35}
            max={0.85}
            step={0.01}
            onChange={(_e, v) => setHoleRatio(v as number)}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: fullscreen ? "rgba(255,255,255,0.8)" : "text.secondary" }}>
            Espessura do anel
          </Typography>
          <Slider
            value={ringThickness}
            min={4}
            max={22}
            step={1}
            onChange={(_e, v) => setRingThickness(v as number)}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: fullscreen ? "rgba(255,255,255,0.8)" : "text.secondary" }}>
            Opacidade do anel
          </Typography>
          <Slider
            value={ringOpacity}
            min={0.2}
            max={1}
            step={0.02}
            onChange={(_e, v) => setRingOpacity(v as number)}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: fullscreen ? "rgba(255,255,255,0.8)" : "text.secondary" }}>
            Glow
          </Typography>
          <Slider
            value={glowStrength}
            min={0}
            max={1}
            step={0.02}
            onChange={(_e, v) => setGlowStrength(v as number)}
          />
        </Box>

        <FormControl size="small">
          <InputLabel>%</InputLabel>
          <Select
            label="%"
            value={showPercent ? "on" : "off"}
            onChange={(e) => setShowPercent(e.target.value === "on")}
          >
            <MenuItem value="on">Mostrar</MenuItem>
            <MenuItem value="off">Ocultar</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box
        ref={containerRef}
        sx={{
          width: "100%",
          height: fullscreen ? "calc(100vh - 280px)" : 600,
          overflow: "hidden",
          borderRadius: 3,
          bgcolor: background,
          border: fullscreen ? "1px solid rgba(255,255,255,0.10)" : "1px solid #f1f5f9",
          boxShadow: stylePreset === "crypto" ? "inset 0 2px 14px rgba(0,0,0,0.45)" : "inset 0 2px 10px rgba(0,0,0,0.02)",
        }}
      >
        <svg ref={svgRef} width="100%" height="100%" />
      </Box>
    </Box>
  );
}
