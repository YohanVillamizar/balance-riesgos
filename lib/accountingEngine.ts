import { 
  RawAccountEntry, 
  ProcessedAccount, 
  AccountCategory, 
  BalanceSheet 
} from './types';

/**
 * Parsea texto CSV a objetos RawAccountEntry detectando cabeceras dinámicamente
 */
export function parseCSV(text: string): RawAccountEntry[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(line => line.length > 0);
  if (lines.length === 0) return [];

  // Analizar cabecera
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  
  const hasHeaders = headers.some(h => 
    h.includes('cuenta') || h.includes('descripcion') || h.includes('saldo') || h.includes('monto') || h.includes('tipo')
  );

  let idxId = headers.findIndex(h => h === 'id' || h === 'id_cuenta');
  let idxCuenta = headers.findIndex(h => h.includes('descripcion') || h.includes('cuenta') || h.includes('nombre'));
  let idxTipo = headers.findIndex(h => h.includes('tipo'));
  let idxSaldo = headers.findIndex(h => h.includes('monto') || h.includes('saldo') || h.includes('valor'));
  let idxVidaUtil = headers.findIndex(h => h.includes('vida') || h.includes('util'));
  let idxSalvamento = headers.findIndex(h => h.includes('salvamento') || h.includes('residual'));

  // Posiciones por defecto si no hay cabeceras explícitas
  if (idxCuenta === -1) idxCuenta = 0;
  if (idxSaldo === -1) idxSaldo = 1;

  const startIndex = hasHeaders ? 1 : 0;
  const entries: RawAccountEntry[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const rawCols = lines[i].split(',').map(col => col.trim().replace(/^"|"$/g, ''));
    if (rawCols.length < 2) continue;

    const cuenta = rawCols[idxCuenta] || (rawCols.length > 1 && isNaN(Number(rawCols[0])) ? rawCols[0] : rawCols[1]);
    const saldoRaw = rawCols[idxSaldo] !== undefined ? rawCols[idxSaldo] : rawCols[1];
    const saldo = parseFloat(saldoRaw) || 0;
    
    const tipoSaldo = idxTipo !== -1 ? rawCols[idxTipo] : undefined;
    const vidaUtilAnios = idxVidaUtil !== -1 && rawCols[idxVidaUtil] ? parseFloat(rawCols[idxVidaUtil]) : (rawCols[2] && !isNaN(Number(rawCols[2])) ? parseFloat(rawCols[2]) : undefined);
    const valorSalvamento = idxSalvamento !== -1 && rawCols[idxSalvamento] ? parseFloat(rawCols[idxSalvamento]) : (rawCols[3] && !isNaN(Number(rawCols[3])) ? parseFloat(rawCols[3]) : undefined);

    if (cuenta && cuenta !== '') {
      entries.push({
        id: idxId !== -1 ? rawCols[idxId] : `acc-${i}`,
        cuenta,
        saldo,
        tipoSaldo,
        vidaUtilAnios: isNaN(vidaUtilAnios as number) ? undefined : vidaUtilAnios,
        valorSalvamento: isNaN(valorSalvamento as number) ? undefined : valorSalvamento
      });
    }
  }

  return entries;
}

/**
 * Clasifica dinámicamente una cuenta en base a su tipo_saldo y/o palabras clave
 */
export function classifyAccount(nombre: string, tipoSaldo?: string): { categoria: AccountCategory; esDepreciable: boolean } {
  const cleanName = nombre.toLowerCase().trim();
  const cleanTipo = (tipoSaldo || '').toLowerCase().trim();

  // Regla estricta de negocio: Terrenos NUNCA se deprecian
  if (cleanName.includes('terreno')) {
    return { categoria: 'ACTIVO_NO_CORRIENTE', esDepreciable: false };
  }

  // 1. Clasificación por tipo_saldo explícito si viene en el CSV
  if (cleanTipo.includes('ingreso')) {
    return { categoria: 'INGRESO', esDepreciable: false };
  }
  if (cleanTipo.includes('egreso') || cleanTipo.includes('gasto')) {
    return { categoria: 'EGRESO', esDepreciable: false };
  }
  if (cleanTipo.includes('costo')) {
    return { categoria: 'COSTO', esDepreciable: false };
  }
  if (cleanTipo.includes('inversion')) {
    return { categoria: 'ACTIVO_NO_CORRIENTE', esDepreciable: true };
  }
  if (cleanTipo.includes('deuda_corto')) {
    return { categoria: 'PASIVO_CORRIENTE', esDepreciable: false };
  }
  if (cleanTipo.includes('deuda_largo')) {
    return { categoria: 'PASIVO_NO_CORRIENTE', esDepreciable: false };
  }
  if (cleanTipo.includes('propietario') || cleanTipo.includes('patrimonio')) {
    return { categoria: 'PATRIMONIO', esDepreciable: false };
  }
  if (cleanTipo.includes('liquidez') || cleanTipo.includes('almacen') || cleanTipo.includes('derecho_cobro')) {
    return { categoria: 'ACTIVO_CORRIENTE', esDepreciable: false };
  }

  // 2. Clasificación heurística por nombre de la cuenta
  // Ingresos / Egresos
  if (cleanName.includes('venta') || cleanName.includes('ingreso')) {
    return { categoria: 'INGRESO', esDepreciable: false };
  }
  if (cleanName.includes('costo de venta') || cleanName.includes('costo')) {
    return { categoria: 'COSTO', esDepreciable: false };
  }
  if (cleanName.includes('gasto') || cleanName.includes('egreso')) {
    return { categoria: 'EGRESO', esDepreciable: false };
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

  // Pasivos No Corrientes (Largo Plazo)
  if (
    cleanName.includes('largo plazo') || 
    cleanName.includes('hipoteca') || 
    cleanName.includes('bono por pagar') ||
    cleanName.includes('deuda largo')
  ) {
    return { categoria: 'PASIVO_NO_CORRIENTE', esDepreciable: false };
  }

  // Pasivos Corrientes (Corto Plazo)
  if (
    cleanName.includes('proveedor') || 
    cleanName.includes('cuenta por pagar') || 
    cleanName.includes('impuesto') || 
    cleanName.includes('sueldo por pagar') ||
    cleanName.includes('prestamo') ||
    cleanName.includes('corto plazo') ||
    cleanName.includes('pasivo corriente')
  ) {
    return { categoria: 'PASIVO_CORRIENTE', esDepreciable: false };
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

  // Activos Corrientes por defecto
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
    ingresos: [],
    egresos: [],
    totalActivoCorriente: 0,
    totalActivoNoCorriente: 0,
    totalActivo: 0,
    totalPasivoCorriente: 0,
    totalPasivoNoCorriente: 0,
    totalPasivo: 0,
    totalPatrimonio: 0,
    totalPasivoMasPatrimonio: 0,
    totalVentas: 0,
    totalCostoVentas: 0,
    totalGastos: 0,
    utilidadNeta: 0,
    estaEquilibrado: false,
    diferenciaDescuadre: 0
  };

  let totalDepreciacionEjercicio = 0;

  rawEntries.forEach((entry, index) => {
    const { categoria, esDepreciable } = classifyAccount(entry.cuenta, entry.tipoSaldo);
    
    // Cálculo de Depreciación en Línea Recta: (Costo - Salvamento) / Vida Útil
    let depreciacion = 0;
    if (esDepreciable && entry.vidaUtilAnios && entry.vidaUtilAnios > 0) {
      const valorSalvamento = entry.valorSalvamento || 0;
      depreciacion = (entry.saldo - valorSalvamento) / entry.vidaUtilAnios;
      totalDepreciacionEjercicio += depreciacion;
    }

    const processed: ProcessedAccount = {
      id: entry.id ? String(entry.id) : `acc-${index}`,
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
      case 'INGRESO':
        sheet.ingresos.push(processed);
        sheet.totalVentas += processed.saldoOriginal;
        break;
      case 'COSTO':
        sheet.egresos.push(processed);
        sheet.totalCostoVentas += processed.saldoOriginal;
        break;
      case 'EGRESO':
        sheet.egresos.push(processed);
        sheet.totalGastos += processed.saldoOriginal;
        break;
    }
  });

  sheet.totalActivo = sheet.totalActivoCorriente + sheet.totalActivoNoCorriente;
  sheet.totalPasivo = sheet.totalPasivoCorriente + sheet.totalPasivoNoCorriente;
  
  // Utilidad Neta del Ejercicio si hay cuentas de Estado de Resultados
  sheet.utilidadNeta = sheet.totalVentas - sheet.totalCostoVentas - sheet.totalGastos - totalDepreciacionEjercicio;

  sheet.totalPasivoMasPatrimonio = sheet.totalPasivo + sheet.totalPatrimonio;

  // Validación de la Ecuación Fundamental: Activo = Pasivo + Patrimonio
  sheet.diferenciaDescuadre = Math.abs(sheet.totalActivo - sheet.totalPasivoMasPatrimonio);
  sheet.estaEquilibrado = sheet.diferenciaDescuadre < 0.01;

  return sheet;
}