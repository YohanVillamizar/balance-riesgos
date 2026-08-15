import { BalanceSheet, FinancialRatios, DiscriminantAnalysisResult } from './types';

/**
 * Calcula el panel de razones financieras
 */
export function calculateFinancialRatios(sheet: BalanceSheet): FinancialRatios {
  // Extraer inventario para la Prueba Ácida
  const inventarioAcc = sheet.activoCorriente.find(acc => 
    acc.nombre.toLowerCase().includes('inventario') || acc.nombre.toLowerCase().includes('mercaderia')
  );
  const valorInventario = inventarioAcc ? inventarioAcc.saldoNeto : 0;

  // Razón Circulante (X1)
  const razonCirculante = sheet.totalPasivoCorriente > 0 
    ? sheet.totalActivoCorriente / sheet.totalPasivoCorriente 
    : 0;

  // Prueba Ácida
  const pruebaAcida = sheet.totalPasivoCorriente > 0 
    ? (sheet.totalActivoCorriente - valorInventario) / sheet.totalPasivoCorriente 
    : 0;

  // Razón de Endeudamiento
  const razonEndeudamiento = sheet.totalActivo > 0 
    ? sheet.totalPasivo / sheet.totalActivo 
    : 0;

  // Apalancamiento Interno (X2)
  const apalancamientoInterno = sheet.totalPatrimonio > 0 
    ? sheet.totalPasivo / sheet.totalPatrimonio 
    : 0;

  return {
    liquidez: {
      razonCirculante,
      pruebaAcida
    },
    apalancamiento: {
      razonEndeudamiento,
      apalancamientoInterno
    },
    actividad: {},
    rentabilidad: {}
  };
}

/**
 * Calcula el Score Z del Modelo Discriminante y emite el dictamen crediticio
 * Fórmula: Z = 0.4 * X1 + 0.6 * X2
 */
export function evaluateCreditRisk(ratios: FinancialRatios): DiscriminantAnalysisResult {
  const x1 = ratios.liquidez.razonCirculante;
  const x2 = ratios.apalancamiento.apalancamientoInterno;

  const scoreZ = (0.4 * x1) + (0.6 * x2);

  let dictamen: 'EXCELENTE' | 'NORMAL' | 'MALO' = 'NORMAL';
  let descripcion = '';

  if (scoreZ > 1.4) {
    dictamen = 'EXCELENTE';
    descripcion = 'Crédito excelente: La organización presenta sólidas métricas de liquidez y estructura de capital.';
  } else if (scoreZ >= 0.66) {
    dictamen = 'NORMAL';
    descripcion = 'Crédito de riesgo normal: La organización presenta niveles operativos aceptables pero requiere monitoreo contínuo.';
  } else {
    dictamen = 'MALO';
    descripcion = 'Crédito malo: Alto riesgo de impago o solvencia comprometida.';
  }

  return {
    x1_razonCirculante: x1,
    x2_apalancamientoInterno: x2,
    scoreZ,
    dictamen,
    descripcion
  };
}