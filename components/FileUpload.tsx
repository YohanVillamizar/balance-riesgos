'use client';

import React, { useRef, useState } from 'react';
import { RawAccountEntry } from '@/lib/types';
import { mockBalancedCSV, mockUnbalancedCSV } from '@/lib/mockData';

interface FileUploadProps {
  onDataLoaded: (data: RawAccountEntry[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return;

    const entries: RawAccountEntry[] = [];
    // Omitir cabecera (línea 0)
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map(col => col.trim().replace(/^"|"$/g, ''));
      if (columns.length >= 2) {
        const cuenta = columns[0];
        const saldo = parseFloat(columns[1]) || 0;
        const vidaUtilAnios = columns[2] ? parseFloat(columns[2]) : undefined;
        const valorSalvamento = columns[3] ? parseFloat(columns[3]) : undefined;

        if (cuenta) {
          entries.push({ cuenta, saldo, vidaUtilAnios, valorSalvamento });
        }
      }
    }

    if (entries.length > 0) {
      onDataLoaded(entries);
    }
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) parseCSVText(text);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50 dark:bg-slate-900/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {fileName ? `Archivo cargado: ${fileName}` : 'Haz clic o arrastra un archivo CSV contable aquí'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Estructura: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">Cuenta, Saldo, [VidaUtil], [Salvamento]</code>
          </p>
        </div>
      </div>

      {/* Botones de prueba rápida para la Defensa */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-500 font-medium">Carga rápida para demo en vivo:</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setFileName('demo-balanceado.csv');
              onDataLoaded(mockBalancedCSV);
            }}
            className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 font-medium transition-colors"
          >
            ✓ Cargar CSV Equilibrado
          </button>
          <button
            type="button"
            onClick={() => {
              setFileName('demo-descuadrado.csv');
              onDataLoaded(mockUnbalancedCSV);
            }}
            className="px-3 py-1.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-lg hover:bg-rose-200 font-medium transition-colors"
          >
            ✕ Cargar CSV Descuadrado
          </button>
        </div>
      </div>
    </div>
  );
};