// Tipos de cuenta según la taxonomía contable
export type AccountCategory = 
  | 'ACTIVO_CORRIENTE'
  | 'ACTIVO_NO_CORRIENTE'
  | 'PASIVO_CORRIENTE'
  | 'PASIVO_NO_CORRIENTE'
  | 'PATRIMONIO';

// Registro directo desde el archivo CSV
export interface RawAccountEntry {
  cuenta: string;
  saldo: number;
  vidaUtilAnios?: number; // Opcional, para activos fijos depreciables
  valorSalvamento?: number; // Opcional, para activos fijos
}

// Estructura procesada de una cuenta
export interface ProcessedAccount {
  id: string;
  nombre: string;
  saldoOriginal: number;
  depreciacionAcumulada: number;
  saldoNeto: number;
  categoria: AccountCategory;
  esDepreciable: boolean;
}

// Estructura completa del Balance General
export interface BalanceSheet {
  activoCorriente: ProcessedAccount[];
  activoNoCorriente: ProcessedAccount[];
  pasivoCorriente: ProcessedAccount[];
  pasivoNoCorriente: ProcessedAccount[];
  patrimonio: ProcessedAccount[];
  
  totalActivoCorriente: number;
  totalActivoNoCorriente: number;
  totalActivo: number;
  
  totalPasivoCorriente: number;
  totalPasivoNoCorriente: number;
  totalPasivo: number;
  
  totalPatrimonio: number;
  totalPasivoMasPatrimonio: number;
  
  estaEquilibrado: boolean;
  diferenciaDescuadre: number;
}

// Indicadores Financieros (Fase 2)
export interface FinancialRatios {
  liquidez: {
    razonCirculante: number; // X1
    pruebaAcida: number;
  };
  apalancamiento: {
    razonEndeudamiento: number;
    apalancamientoInterno: number; // X2
  };
  actividad: {
    rotacionInventario?: number;
  };
  rentabilidad: {
    roa?: number;
    roe?: number;
  };
}

// Dictamen de Crédito (Fase 3)
export type CreditRiskCategory = 'EXCELENTE' | 'NORMAL' | 'MALO';

export interface DiscriminantAnalysisResult {
  x1_razonCirculante: number;
  x2_apalancamientoInterno: number;
  scoreZ: number;
  dictamen: CreditRiskCategory;
  descripcion: string;
}