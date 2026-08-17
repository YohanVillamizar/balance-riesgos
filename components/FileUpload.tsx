'use client';

import React, { useRef, useState } from 'react';
import { RawAccountEntry } from '@/lib/types';
import { parseCSV } from '@/lib/accountingEngine';

interface FileUploadProps {
  onDataLoaded: (data: RawAccountEntry[], fileName?: string) => void;
  currentFileName?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, currentFileName }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(currentFileName || 'datos.csv');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const entries = parseCSV(text);
        if (entries.length > 0) {
          onDataLoaded(entries, file.name);
        }
      }
    };
    reader.readAsText(file);
  };

  const loadDefaultCSV = async () => {
    try {
      const res = await fetch('/datos.csv');
      if (!res.ok) throw new Error('No se pudo cargar datos.csv');
      const text = await res.text();
      const entries = parseCSV(text);
      setFileName('datos.csv');
      onDataLoaded(entries, 'datos.csv');
    } catch (err) {
      console.error('Error al cargar /datos.csv:', err);
    }
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
            {fileName ? `Archivo activo: ${fileName}` : 'Haz clic o arrastra un archivo CSV contable aquí'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Formatos soportados: CSV con cabeceras (<code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">id_cuenta, descripcion_cuenta, tipo_saldo, monto, vida_util_anios</code>) o columnas estándar.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-500 font-medium">Archivo base del sistema:</span>
        <button
          type="button"
          onClick={loadDefaultCSV}
          className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/80 font-medium transition-colors flex items-center gap-1.5"
        >
          <span>↺</span> Recargar datos.csv (public/)
        </button>
      </div>
    </div>
  );
};