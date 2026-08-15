'use client';

import React from 'react';
import { DiscriminantAnalysisResult } from '@/lib/types';

interface CreditScoreWidgetProps {
  result: DiscriminantAnalysisResult;
}

export const CreditScoreWidget: React.FC<CreditScoreWidgetProps> = ({ result }) => {
  const getBadgeStyle = () => {
    switch (result.dictamen) {
      case 'EXCELENTE':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-300';
      case 'NORMAL':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300';
      case 'MALO':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border-rose-300';
    }
  };

  // Posición porcentual de la aguja en la barra (rango 0 a 2.5)
  const normalizedPercentage = Math.min(Math.max((result.scoreZ / 2.5) * 100, 5), 95);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Modelo Predictivo Discriminante (Score Z)
          </h3>
          <p className="text-xs text-slate-500">Evaluación del riesgo crediticio de la organización</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getBadgeStyle()}`}>
          {result.dictamen}
        </span>
      </div>

      {/* Valor principal del Score Z */}
      <div className="flex items-baseline space-x-3">
        <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Z = {result.scoreZ.toFixed(3)}
        </span>
        <span className="text-xs text-slate-500">
          (0.4 × X₁: {result.x1_razonCirculante.toFixed(2)} + 0.6 × X₂: {result.x2_apalancamientoInterno.toFixed(2)})
        </span>
      </div>

      {/* Barra de Progreso / Calibrador */}
      <div className="space-y-2">
        <div className="relative w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div className="w-[26.4%] bg-rose-500 h-full" title="Riesgo Malo (< 0.66)" />
          <div className="w-[29.6%] bg-amber-500 h-full" title="Riesgo Normal (0.66 - 1.4)" />
          <div className="w-[44%] bg-emerald-500 h-full" title="Excelente (> 1.4)" />
          
          {/* Marcador / Aguja */}
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-slate-900 dark:bg-white shadow-md transition-all duration-500 transform -translate-x-1/2"
            style={{ left: `${normalizedPercentage}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0.0 (Malo)</span>
          <span>0.66</span>
          <span>1.40</span>
          <span>2.5+ (Excelente)</span>
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
        {result.descripcion}
      </p>
    </div>
  );
};