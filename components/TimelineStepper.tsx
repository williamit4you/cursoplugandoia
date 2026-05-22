"use client";

import React from "react";
import CheckCircle from "@mui/icons-material/CheckCircle";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";
import ErrorOutlined from "@mui/icons-material/ErrorOutlined";
import SkipNext from "@mui/icons-material/SkipNext";
import CircularProgress from "@mui/material/CircularProgress";

export type StepStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";

export interface PipelineStep {
  id: string;
  name: string;
  status: StepStatus;
  errorMessage?: string;
  logs?: string[];
}

interface TimelineStepperProps {
  steps: PipelineStep[];
}

export default function TimelineStepper({ steps }: TimelineStepperProps) {
  return (
    <div className="flex flex-col space-y-4">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        
        let icon;
        let lineClass = "border-slate-200";
        let textClass = "text-slate-500";
        
        switch (step.status) {
          case "SUCCESS":
            icon = <CheckCircle className="text-emerald-500" fontSize="small" />;
            lineClass = "border-emerald-500";
            textClass = "text-emerald-700 font-medium";
            break;
          case "RUNNING":
            icon = <CircularProgress size={20} className="text-blue-500" />;
            lineClass = "border-blue-300 border-dashed animate-pulse";
            textClass = "text-blue-600 font-bold animate-pulse";
            break;
          case "FAILED":
            icon = <ErrorOutlined className="text-red-500" fontSize="small" />;
            lineClass = "border-red-500";
            textClass = "text-red-600 font-medium";
            break;
          case "SKIPPED":
            icon = <SkipNext className="text-yellow-500" fontSize="small" />;
            lineClass = "border-yellow-500 border-dashed";
            textClass = "text-yellow-600 font-medium";
            break;
          case "PENDING":
          default:
            icon = <RadioButtonUnchecked className="text-slate-300" fontSize="small" />;
            textClass = "text-slate-400";
            break;
        }

        return (
          <div key={step.id} className="relative flex items-start gap-4">
            {/* Timeline Line */}
            {!isLast && (
              <div className={`absolute left-[11px] top-8 bottom-[-16px] w-[2px] border-l-2 ${lineClass}`} />
            )}
            
            {/* Step Icon */}
            <div className="relative z-10 w-6 h-6 flex items-center justify-center bg-white rounded-full mt-0.5 shadow-sm">
              {icon}
            </div>
            
            {/* Step Content */}
            <div className="flex-1 pb-4">
              <h4 className={`text-sm ${textClass} transition-colors duration-300`}>
                {step.name}
              </h4>
              {step.status === "FAILED" && step.errorMessage && (
                <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
                  {step.errorMessage}
                </div>
              )}
              {step.logs && step.logs.length > 0 && (
                <div className="mt-2 bg-slate-900 text-green-400 font-mono text-[10px] p-3 rounded-lg overflow-x-auto max-h-40 overflow-y-auto">
                  {step.logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
