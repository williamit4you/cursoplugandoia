"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { Box, Typography, ButtonGroup, Button } from "@mui/material";

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
}

type SizeBy = "totalViews" | "viewsLongs" | "viewsShorts" | "subscribers";

export default function YtBubbleChart({ categoryId }: YtBubbleChartProps) {
  const [data, setData] = useState<ChannelBubble[]>([]);
  const [sizeBy, setSizeBy] = useState<SizeBy>("totalViews");
  const [fullscreen, setFullscreen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    for (const n of nodes as any[]) {
      const base = d3.color(n.categoryColor) || d3.color("#6366f1");
      const c1 = base?.brighter(1.2)?.formatHex() || "#93c5fd";
      const c2 = base?.darker(0.3)?.formatHex() || "#1d4ed8";
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
      .force("charge", d3.forceManyBody().strength(8))
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

    nodeGroup
      .append("circle")
      .attr("r", (d: any) => d.r)
      .attr("fill", (d: any) => `url(#grad-${d.id})`)
      .attr("stroke", "rgba(0,0,0,0.12)")
      .attr("stroke-width", 1)
      .style("opacity", 0.98);

    const textGroup = nodeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .style("fill", "#fff")
      .style("font-weight", "900")
      .style("text-shadow", "0px 1px 3px rgba(0,0,0,0.6)");

    textGroup
      .append("tspan")
      .attr("x", 0)
      .attr("y", (d: any) => (d.r > 25 ? -5 : 4))
      .style("font-size", (d: any) => Math.max(10, Math.min(16, d.r / 3)) + "px")
      .text((d: any) =>
        d.r > 20 ? (d.name.length > 12 ? d.name.substring(0, 10) + "..." : d.name) : ""
      );

    textGroup
      .append("tspan")
      .attr("x", 0)
      .attr("y", (d: any) => (d.r > 25 ? 12 : 0))
      .style("font-size", (d: any) => Math.max(9, Math.min(12, d.r / 4)) + "px")
      .style("opacity", 0.9)
      .text((d: any) => (d.r > 25 ? formatNumber(metric(d)) : ""));

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
  }, [data, metric, sizeBy, fullscreen]);

  return (
    <Box
      sx={{
        mt: 4,
        bgcolor: "#f8fafc",
        borderRadius: 4,
        p: { xs: 2, md: 3 },
        border: "1px solid #e2e8f0",
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
        </Box>
      </Box>

      <Box
        ref={containerRef}
        sx={{
          width: "100%",
          height: fullscreen ? "calc(100vh - 280px)" : 600,
          overflow: "hidden",
          borderRadius: 3,
          bgcolor: "#ffffff",
          border: "1px solid #f1f5f9",
          boxShadow: "inset 0 2px 10px rgba(0,0,0,0.02)",
        }}
      >
        <svg ref={svgRef} width="100%" height="100%" />
      </Box>
    </Box>
  );
}

