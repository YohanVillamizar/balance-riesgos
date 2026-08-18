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
  const apalancamientoInterno = sheet.totalPasivo > 0 
    ? sheet.totalPatrimonio / sheet.totalPasivo 
    : 0;

  // Actividad (Rotación de Inventario)
  const rotacionInventario = (valorInventario > 0 && sheet.totalCostoVentas > 0)
    ? sheet.totalCostoVentas / valorInventario
    : undefined;

  // Rentabilidad (ROA y ROE)
  const roa = (sheet.totalActivo > 0 && sheet.utilidadNeta !== 0)
    ? (sheet.utilidadNeta / sheet.totalActivo) * 100
    : undefined;

  const roe = (sheet.totalPatrimonio > 0 && sheet.utilidadNeta !== 0)
    ? (sheet.utilidadNeta / sheet.totalPatrimonio) * 100
    : undefined;

  return {
    liquidez: {
      razonCirculante,
      pruebaAcida
    },
    apalancamiento: {
      razonEndeudamiento,
      apalancamientoInterno
    },
    actividad: {
      rotacionInventario
    },
    rentabilidad: {
      roa,
      roe
    }
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