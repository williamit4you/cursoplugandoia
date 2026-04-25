"use client";

import React, { useEffect, useRef, useState } from "react";
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

export default function YtBubbleChart({ categoryId }: YtBubbleChartProps) {
  const [data, setData] = useState<ChannelBubble[]>([]);
  const [sizeBy, setSizeBy] = useState<"views" | "subscribers">("views");
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/youtube-analytics/bubbles?sizeBy=${sizeBy}${categoryId ? `&categoryId=${categoryId}` : ''}`)
      .then(res => res.json())
      .then(json => setData(json))
      .catch(console.error);
  }, [categoryId, sizeBy]);

  useEffect(() => {
    if (!data.length || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Limpa SVG

    const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

    // Escalas de tamanho
    const sizeDomain = d3.extent(data, d => sizeBy === "views" ? d.totalViews : d.subscribers) as [number, number];
    const sizeScale = d3.scaleSqrt().domain([0, sizeDomain[1]]).range([15, 80]);

    // Formatadores
    const formatNumber = (num: number) => {
      if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
      if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
      if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
      return num.toString();
    };

    // Dados com nós do D3
    const nodes = data.map(d => ({
      ...d,
      r: sizeScale(sizeBy === "views" ? d.totalViews : d.subscribers),
      x: Math.random() * width - width / 2,
      y: Math.random() * height - height / 2,
    }));

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "d3-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(15, 23, 42, 0.9)")
      .style("color", "#fff")
      .style("padding", "12px 16px")
      .style("border-radius", "8px")
      .style("pointer-events", "none")
      .style("font-family", "Inter, sans-serif")
      .style("font-size", "13px")
      .style("z-index", 9999)
      .style("box-shadow", "0 10px 25px rgba(0,0,0,0.2)")
      .style("opacity", 0);

    // D3 Force Simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force("charge", d3.forceManyBody().strength(10))
      .force("collide", d3.forceCollide().radius((d: any) => d.r + 2).iterations(2))
      .force("x", d3.forceX().strength(0.04))
      .force("y", d3.forceY().strength(0.04));

    // Desenhando os nós
    const nodeGroup = g.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .on("mouseover", (event, d: any) => {
        d3.select(event.currentTarget).select("circle").attr("stroke", "#fff").attr("stroke-width", 3);
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <strong style="font-size: 15px; border-bottom: 1px solid #334155; padding-bottom: 4px;">${d.name}</strong>
            <span style="color: ${d.categoryColor}; font-weight: 600;">${d.category}</span>
            <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 4px;">
              <span>Inscritos:</span> <strong>${formatNumber(d.subscribers)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span>Total Views:</span> <strong>${formatNumber(d.totalViews)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px; color: ${d.growth >= 0 ? '#4ade80' : '#f87171'}; font-weight: bold; margin-top: 4px;">
              <span>Cresc. Semanal:</span> <span>${d.growth >= 0 ? '+' : ''}${d.growth}%</span>
            </div>
          </div>
        `)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 15) + "px");
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).select("circle").attr("stroke", "rgba(0,0,0,0.1)").attr("stroke-width", 1);
        tooltip.transition().duration(500).style("opacity", 0);
      })
      .on("click", (event, d: any) => {
        window.open(d.url, "_blank");
      });

    // Círculos
    nodeGroup.append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => d.categoryColor)
      .attr("stroke", "rgba(0,0,0,0.1)")
      .attr("stroke-width", 1)
      .style("opacity", 0.95)
      .style("box-shadow", "0 4px 10px rgba(0,0,0,0.2)");

    // Texto interno
    const textGroup = nodeGroup.append("text")
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .style("fill", "#fff")
      .style("font-weight", "800")
      .style("text-shadow", "0px 1px 3px rgba(0,0,0,0.6)");

    textGroup.append("tspan")
      .attr("x", 0)
      .attr("y", d => d.r > 25 ? -5 : 4)
      .style("font-size", d => Math.max(10, Math.min(16, d.r / 3)) + "px")
      .text(d => d.r > 20 ? (d.name.length > 12 ? d.name.substring(0, 10) + '...' : d.name) : "");

    textGroup.append("tspan")
      .attr("x", 0)
      .attr("y", d => d.r > 25 ? 12 : 0)
      .style("font-size", d => Math.max(9, Math.min(12, d.r / 4)) + "px")
      .style("opacity", 0.9)
      .text(d => d.r > 25 ? formatNumber(sizeBy === "views" ? d.totalViews : d.subscribers) : "");

    simulation.on("tick", () => {
      nodeGroup.attr("transform", d => `translate(${Math.max(-width/2 + d.r, Math.min(width/2 - d.r, d.x))},${Math.max(-height/2 + d.r, Math.min(height/2 - d.r, d.y))})`);
    });

    return () => {
      simulation.stop();
      d3.selectAll(".d3-tooltip").remove();
    };
  }, [data, sizeBy]);

  return (
    <Box sx={{ mt: 4, bgcolor: '#f8fafc', borderRadius: 4, p: { xs: 2, md: 3 }, border: '1px solid #e2e8f0' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" fontWeight="900" color="#1e293b">
          Mapa de Canais (Bubble View)
        </Typography>
        <ButtonGroup size="small" sx={{ bgcolor: '#fff' }}>
          <Button 
            variant={sizeBy === "views" ? "contained" : "outlined"}
            onClick={() => setSizeBy("views")}
            disableElevation
          >
            Por Views
          </Button>
          <Button 
            variant={sizeBy === "subscribers" ? "contained" : "outlined"}
            onClick={() => setSizeBy("subscribers")}
            disableElevation
          >
            Por Inscritos
          </Button>
        </ButtonGroup>
      </Box>
      <Box 
        ref={containerRef} 
        sx={{ 
          width: '100%', 
          height: 600, 
          overflow: 'hidden', 
          borderRadius: 3, 
          bgcolor: '#ffffff', 
          border: '1px solid #f1f5f9',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' 
        }}
      >
        <svg ref={svgRef} width="100%" height="100%"></svg>
      </Box>
    </Box>
  );
}
