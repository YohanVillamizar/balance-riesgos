'use client';

import React, { useState, useEffect } from 'react';
import { RawAccountEntry } from '@/lib/types';
import { buildBalanceSheet } from '@/lib/accountingEngine';
import { calculateFinancialRatios, evaluateCreditRisk } from '@/lib/ratiosEngine';
import { mockBalancedCSV } from '@/lib/mockData';
import { FileUpload } from '@/components/FileUpload';
import { BalanceSheetView } from '@/components/BalanceSheetView';
import { CreditScoreWidget } from '@/components/CreditScoreWidget';

export default function Dashboard() {
  const [rawEntries, setRawEntries] = useState<RawAccountEntry[]>(mockBalancedCSV);

  const balanceSheet = buildBalanceSheet(rawEntries);
  const ratios = calculateFinancialRatios(balanceSheet);
  const creditRisk = evaluateCreditRisk(ratios);

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Encabezado Principal */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Motor Computacional de Análisis Financiero
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Procesamiento contable dinámico y predicción discriminante del riesgo de crédito.
            </p>
          </div>
        </header>

        {/* Zona de Carga de CSV */}
        <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
            Fase 1: Entrada de Datos Contables
          </h2>
          <FileUpload onDataLoaded={(data) => setRawEntries(data)} />
        </section>

        {/* Panel Predictivo y Métricas */}
        {balanceSheet.estaEquilibrado && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <CreditScoreWidget result={creditRisk} />
            </div>

            {/* Tarjetas de Razones Clave */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
                Fase 2: Razones Financieras Clave
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Razón Circulante (X₁)
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {ratios.liquidez.razonCirculante.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Prueba Ácida
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {ratios.liquidez.pruebaAcida.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Apalancamiento Interno (X₂)
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {ratios.apalancamiento.apalancamientoInterno.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Razón de Endeudamiento
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {(ratios.apalancamiento.razonEndeudamiento * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Vista del Balance General */}
        <section>
          <BalanceSheetView sheet={balanceSheet} />
        </section>

      </div>
    </main>
  );
}