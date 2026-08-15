import { 
  RawAccountEntry, 
  ProcessedAccount, 
  AccountCategory, 
  BalanceSheet,
  FinancialRatios,
  DiscriminantAnalysisResult
} from './types';

/**
 * Clasifica dinámicamente una cuenta en base a palabras clave en su nombre
 */
export function classifyAccount(nombre: string): { categoria: AccountCategory; esDepreciable: boolean } {
  const cleanName = nombre.toLowerCase().trim();

  // Regla estricta de negocio: Terrenos NUNCA se deprecian
  if (cleanName.includes('terreno')) {
    return { categoria: 'ACTIVO_NO_CORRIENTE', esDepreciable: false };
  }

  // Activos No Corrientes Depreciables
  if (
    cleanName.includes('maquinaria') || 
    cleanName.includes('vehiculo') || 
    cleanName.includes('edificio') || 
    cleanName.includes('equipo') ||
    cleanName.includes('mueble')
  ) {
    return { categoria: 'ACTIVO_NO_CORRIENTE', esDepreciable: true };
  }

  // Activos Corrientes
  if (
    cleanName.includes('caja') || 
    cleanName.includes('banco') || 
    cleanName.includes('cliente') || 
    cleanName.includes('cuenta por cobrar') || 
    cleanName.includes('inventario') ||
    cleanName.includes('mercaderia')
  ) {
    return { categoria: 'ACTIVO_CORRIENTE', esDepreciable: false };
  }

  // Pasivos Corrientes
  if (
    cleanName.includes('proveedor') || 
    cleanName.includes('cuenta por pagar') || 
    cleanName.includes('impuesto') || 
    cleanName.includes('sueldo por pagar') ||
    cleanName.includes('pasivo corriente')
  ) {
    return { categoria: 'PASIVO_CORRIENTE', esDepreciable: false };
  }

  // Pasivos No Corrientes
  if (
    cleanName.includes('prestamo largo plazo') || 
    cleanName.includes('hipoteca') || 
    cleanName.includes('bono por pagar')
  ) {
    return { categoria: 'PASIVO_NO_CORRIENTE', esDepreciable: false };
  }

  // Patrimonio
  if (
    cleanName.includes('capital') || 
    cleanName.includes('reserva') || 
    cleanName.includes('utilidad') || 
    cleanName.includes('patrimonio')
  ) {
    return { categoria: 'PATRIMONIO', esDepreciable: false };
  }

  // Por defecto si no coincide con las reglas previas
  return { categoria: 'ACTIVO_CORRIENTE', esDepreciable: false };
}

/**
 * Procesa la lista desordenada del CSV y construye el Balance General
 */
export function buildBalanceSheet(rawEntries: RawAccountEntry[]): BalanceSheet {
  const sheet: BalanceSheet = {
    activoCorriente: [],
    activoNoCorriente: [],
    pasivoCorriente: [],
    pasivoNoCorriente: [],
    patrimonio: [],
    totalActivoCorriente: 0,
    totalActivoNoCorriente: 0,
    totalActivo: 0,
    totalPasivoCorriente: 0,
    totalPasivoNoCorriente: 0,
    totalPasivo: 0,
    totalPatrimonio: 0,
    totalPasivoMasPatrimonio: 0,
    estaEquilibrado: false,
    diferenciaDescuadre: 0
  };

  rawEntries.forEach((entry, index) => {
    const { categoria, esDepreciable } = classifyAccount(entry.cuenta);
    
    // Cálculo de Depreciación en Línea Recta: (Costo - Salvamento) / Vida Útil
    let depreciacion = 0;
    if (esDepreciable && entry.vidaUtilAnios && entry.vidaUtilAnios > 0) {
      const valorSalvamento = entry.valorSalvamento || 0;
      depreciacion = (entry.saldo - valorSalvamento) / entry.vidaUtilAnios;
    }

    const processed: ProcessedAccount = {
      id: `acc-${index}`,
      nombre: entry.cuenta,
      saldoOriginal: entry.saldo,
      depreciacionAcumulada: depreciacion,
      saldoNeto: entry.saldo - depreciacion,
      categoria,
      esDepreciable
    };

    // Agrupación por categoría
    switch (categoria) {
      case 'ACTIVO_CORRIENTE':
        sheet.activoCorriente.push(processed);
        sheet.totalActivoCorriente += processed.saldoNeto;
        break;
      case 'ACTIVO_NO_CORRIENTE':
        sheet.activoNoCorriente.push(processed);
        sheet.totalActivoNoCorriente += processed.saldoNeto;
        break;
      case 'PASIVO_CORRIENTE':
        sheet.pasivoCorriente.push(processed);
        sheet.totalPasivoCorriente += processed.saldoNeto;
        break;
      case 'PASIVO_NO_CORRIENTE':
        sheet.pasivoNoCorriente.push(processed);
        sheet.totalPasivoNoCorriente += processed.saldoNeto;
        break;
      case 'PATRIMONIO':
        sheet.patrimonio.push(processed);
        sheet.totalPatrimonio += processed.saldoNeto;
        break;
    }
  });

  sheet.totalActivo = sheet.totalActivoCorriente + sheet.totalActivoNoCorriente;
  sheet.totalPasivo = sheet.totalPasivoCorriente + sheet.totalPasivoNoCorriente;
  sheet.totalPasivoMasPatrimonio = sheet.totalPasivo + sheet.totalPatrimonio;

  // Validación de la Ecuación Fundamental: Activo = Pasivo + Patrimonio
  sheet.diferenciaDescuadre = Math.abs(sheet.totalActivo - sheet.totalPasivoMasPatrimonio);
  sheet.estaEquilibrado = sheet.diferenciaDescuadre < 0.01; // Tolerancia por redondeos flotantes

  return sheet;
}