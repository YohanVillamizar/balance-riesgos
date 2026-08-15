'use client';

import React from 'react';
import { BalanceSheet } from '@/lib/types';

interface BalanceSheetViewProps {
  sheet: BalanceSheet;
}

export const BalanceSheetView: React.FC<BalanceSheetViewProps> = ({ sheet }) => {
  return (
    <div className="space-y-6">
      {/* Alerta de Descuadre Contable (Requisito Fase 1) */}
      {!sheet.estaEquilibrado && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 flex items-start space-x-3">
          <svg className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="font-bold text-sm">¡Error de Ecuación Contable!</h4>
            <p className="text-xs mt-1">
              El Activo Total (${sheet.totalActivo.toLocaleString()}) no concuerda con el Pasivo + Patrimonio (${sheet.totalPasivoMasPatrimonio.toLocaleString()}).
            </p>
            <p className="text-xs font-bold mt-1">
              Descuadre detectado: ${sheet.diferenciaDescuadre.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Tablas del Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado de Activos */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
            1. ACTIVOS
          </h3>
          
          {/* Activo Corriente */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Activo Corriente</p>
            {sheet.activoCorriente.map((acc) => (
              <div key={acc.id} className="flex justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-600 dark:text-slate-300">{acc.nombre}</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">${acc.saldoNeto.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs font-bold pt-1 text-slate-700 dark:text-slate-200">
              <span>Subtotal Activo Corriente</span>
              <span className="font-mono">${sheet.totalActivoCorriente.toLocaleString()}</span>
            </div>
          </div>

          {/* Activo No Corriente */}
          <div className="space-y-1 pt-3">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Activo No Corriente</p>
            {sheet.activoNoCorriente.map((acc) => (
              <div key={acc.id} className="flex justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-600 dark:text-slate-300">
                  {acc.nombre} {acc.depreciacionAcumulada > 0 && <span className="text-[10px] text-slate-400">(Dep. -${acc.depreciacionAcumulada})</span>}
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200">${acc.saldoNeto.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs font-bold pt-1 text-slate-700 dark:text-slate-200">
              <span>Subtotal Activo No Corriente</span>
              <span className="font-mono">${sheet.totalActivoNoCorriente.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-between text-sm font-black pt-4 border-t-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
            <span>TOTAL ACTIVOS</span>
            <span className="font-mono">${sheet.totalActivo.toLocaleString()}</span>
          </div>
        </div>

        {/* Lado de Pasivos y Patrimonio */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
            2. PASIVOS Y PATRIMONIO
          </h3>

          {/* Pasivo Corriente */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Pasivo Corriente</p>
            {sheet.pasivoCorriente.map((acc) => (
              <div key={acc.id} className="flex justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-600 dark:text-slate-300">{acc.nombre}</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">${acc.saldoNeto.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Pasivo No Corriente */}
          <div className="space-y-1 pt-2">
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Pasivo No Corriente</p>
            {sheet.pasivoNoCorriente.map((acc) => (
              <div key={acc.id} className="flex justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-600 dark:text-slate-300">{acc.nombre}</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">${acc.saldoNeto.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs font-bold pt-1 text-slate-700 dark:text-slate-200">
              <span>Total Pasivos</span>
              <span className="font-mono">${sheet.totalPasivo.toLocaleString()}</span>
            </div>
          </div>

          {/* Patrimonio */}
          <div className="space-y-1 pt-3">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Patrimonio</p>
            {sheet.patrimonio.map((acc) => (
              <div key={acc.id} className="flex justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-600 dark:text-slate-300">{acc.nombre}</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">${acc.saldoNeto.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs font-bold pt-1 text-slate-700 dark:text-slate-200">
              <span>Total Patrimonio</span>
              <span className="font-mono">${sheet.totalPatrimonio.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-between text-sm font-black pt-4 border-t-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
            <span>TOTAL PASIVO + PATRIMONIO</span>
            <span className="font-mono">${sheet.totalPasivoMasPatrimonio.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};