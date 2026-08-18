import {
  RawAccountEntry,
  ProcessedAccount,
  AccountCategory,
  BalanceSheet
} from './types';

/**
 * Normaliza textos:
 * - minúsculas
 * - elimina tildes
 * - elimina espacios extremos
 */
function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normaliza encabezados del CSV.
 *
 * Ejemplo:
 * "Vida Útil Años" -> "vida_util_anos"
 */
function normalizeHeader(value: string): string {
  return normalizeText(value)
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

/**
 * Divide correctamente una línea CSV.
 * Soporta textos entre comillas que puedan contener comas.
 */
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Maneja comillas dobles escapadas ""
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());

  return result;
}

/**
 * Devuelve el primer índice >= 0.
 */
function firstValidIndex(...indexes: number[]): number {
  return indexes.find(index => index >= 0) ?? -1;
}

/**
 * Convierte un valor a número.
 */
function parseNumber(value?: string): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const cleanValue = value
    .trim()
    .replace(/\s/g, '')
    .replace(/\$/g, '');

  if (cleanValue === '') {
    return undefined;
  }

  const number = Number(cleanValue);

  return Number.isFinite(number) ? number : undefined;
}

/**
 * Parsea texto CSV a objetos RawAccountEntry
 * detectando las cabeceras dinámicamente.
 *
 * Soporta especialmente el formato del profesor:
 *
 * id_cuenta,
 * descripcion_cuenta,
 * tipo_saldo,
 * monto,
 * vida_util_anios
 */
export function parseCSV(text: string): RawAccountEntry[] {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  // ======================================================
  // LEER PRIMERA FILA
  // ======================================================

  const firstRow = splitCSVLine(lines[0]);

  const headers = firstRow.map(header =>
    header.replace(/^\uFEFF/, '').trim()
  );

  const normalizedHeaders = headers.map(normalizeHeader);

  // ======================================================
  // DETECTAR SI EXISTEN ENCABEZADOS
  // ======================================================

  const hasHeaders = normalizedHeaders.some(header =>
    header === 'id_cuenta' ||
    header === 'descripcion_cuenta' ||
    header === 'tipo_saldo' ||
    header === 'monto' ||
    header === 'vida_util_anios' ||
    header === 'vida_util_anos' ||
    header.includes('descripcion') ||
    header.includes('monto')
  );

  // ======================================================
  // ID
  // ======================================================

  let idxId = firstValidIndex(
    normalizedHeaders.findIndex(h => h === 'id_cuenta'),
    normalizedHeaders.findIndex(h => h === 'id')
  );

  // ======================================================
  // DESCRIPCIÓN DE LA CUENTA
  //
  // Es MUY IMPORTANTE buscar descripcion_cuenta antes que
  // cualquier encabezado que simplemente contenga "cuenta".
  //
  // Esto evita:
  //
  // id_cuenta -> tomado incorrectamente como nombre.
  // ======================================================

  let idxCuenta = firstValidIndex(
    normalizedHeaders.findIndex(
      h => h === 'descripcion_cuenta'
    ),

    normalizedHeaders.findIndex(
      h => h === 'descripcion'
    ),

    normalizedHeaders.findIndex(
      h => h === 'nombre_cuenta'
    ),

    normalizedHeaders.findIndex(
      h => h === 'nombre'
    ),

    normalizedHeaders.findIndex(
      h => h.includes('descripcion')
    ),

    normalizedHeaders.findIndex(
      h => h.includes('nombre')
    ),

    normalizedHeaders.findIndex(
      h =>
        h.includes('cuenta') &&
        h !== 'id_cuenta' &&
        !h.startsWith('id_')
    )
  );

  // ======================================================
  // TIPO DE SALDO
  // ======================================================

  let idxTipo = firstValidIndex(
    normalizedHeaders.findIndex(
      h => h === 'tipo_saldo'
    ),

    normalizedHeaders.findIndex(
      h => h === 'tipo'
    ),

    normalizedHeaders.findIndex(
      h => h.includes('tipo')
    )
  );

  // ======================================================
  // MONTO
  //
  // IMPORTANTE:
  // "tipo_saldo" NO puede ser tomado como saldo.
  // ======================================================

  let idxSaldo = firstValidIndex(
    normalizedHeaders.findIndex(
      h => h === 'monto'
    ),

    normalizedHeaders.findIndex(
      h => h === 'saldo'
    ),

    normalizedHeaders.findIndex(
      h => h === 'saldo_cuenta'
    ),

    normalizedHeaders.findIndex(
      h => h === 'valor'
    ),

    normalizedHeaders.findIndex(
      h => h.includes('monto')
    ),

    normalizedHeaders.findIndex(
      h =>
        h.includes('saldo') &&
        h !== 'tipo_saldo' &&
        !h.includes('tipo')
    ),

    normalizedHeaders.findIndex(
      h =>
        h.includes('valor') &&
        !h.includes('salvamento') &&
        !h.includes('residual')
    )
  );

  // ======================================================
  // VIDA ÚTIL
  // ======================================================

  let idxVidaUtil = firstValidIndex(
    normalizedHeaders.findIndex(
      h => h === 'vida_util_anios'
    ),

    normalizedHeaders.findIndex(
      h => h === 'vida_util_anos'
    ),

    normalizedHeaders.findIndex(
      h => h === 'vida_util'
    ),

    normalizedHeaders.findIndex(
      h => h.includes('vida') && h.includes('util')
    )
  );

  // ======================================================
  // VALOR DE SALVAMENTO
  //
  // El CSV del profesor NO trae esta columna.
  // Si no existe se tomará 0.
  // ======================================================

  let idxSalvamento = firstValidIndex(
    normalizedHeaders.findIndex(
      h => h === 'valor_salvamento'
    ),

    normalizedHeaders.findIndex(
      h => h === 'salvamento'
    ),

    normalizedHeaders.findIndex(
      h => h === 'valor_residual'
    ),

    normalizedHeaders.findIndex(
      h => h === 'residual'
    ),

    normalizedHeaders.findIndex(
      h =>
        h.includes('salvamento') ||
        h.includes('residual')
    )
  );

  // ======================================================
  // VALIDACIÓN DE ENCABEZADOS
  // ======================================================

  if (hasHeaders) {
    if (idxCuenta === -1) {
      throw new Error(
        'No se encontró la columna de descripción de la cuenta.'
      );
    }

    if (idxSaldo === -1) {
      throw new Error(
        'No se encontró la columna de monto o saldo.'
      );
    }
  }

  // ======================================================
  // COMPATIBILIDAD CON CSV SIN ENCABEZADOS
  // ======================================================

  if (!hasHeaders) {
    idxCuenta = 0;
    idxSaldo = 1;

    idxId = -1;
    idxTipo = -1;
    idxVidaUtil = 2;
    idxSalvamento = 3;
  }

  const startIndex = hasHeaders ? 1 : 0;

  const entries: RawAccountEntry[] = [];

  // ======================================================
  // PROCESAR FILAS
  // ======================================================

  for (let i = startIndex; i < lines.length; i++) {
    const rawCols = splitCSVLine(lines[i]);

    if (rawCols.length === 0) {
      continue;
    }

    const cuenta =
      idxCuenta >= 0
        ? rawCols[idxCuenta]?.trim()
        : undefined;

    const saldoRaw =
      idxSaldo >= 0
        ? rawCols[idxSaldo]
        : undefined;

    const saldo = parseNumber(saldoRaw);

    // Si no existe descripción ignoramos la fila
    if (!cuenta) {
      continue;
    }

    // Si el monto no es válido, lanzamos error.
    // Es preferible esto a convertir silenciosamente todo en $0.
    if (saldo === undefined) {
      throw new Error(
        `Monto inválido en la fila ${i + 1}: "${cuenta}".`
      );
    }

    const id =
      idxId >= 0
        ? rawCols[idxId]?.trim()
        : `acc-${i}`;

    const tipoSaldo =
      idxTipo >= 0
        ? rawCols[idxTipo]?.trim()
        : undefined;

    const vidaUtilAnios =
      idxVidaUtil >= 0
        ? parseNumber(rawCols[idxVidaUtil])
        : undefined;

    // Si el CSV no trae salvamento usamos 0.
    const valorSalvamento =
      idxSalvamento >= 0
        ? parseNumber(rawCols[idxSalvamento]) ?? 0
        : 0;

    entries.push({
      id,
      cuenta,
      saldo,
      tipoSaldo,
      vidaUtilAnios,
      valorSalvamento
    });
  }

  return entries;
}

/**
 * Clasifica dinámicamente una cuenta en base
 * a tipo_saldo y palabras clave.
 */
export function classifyAccount(
  nombre: string,
  tipoSaldo?: string
): {
  categoria: AccountCategory;
  esDepreciable: boolean;
} {
  const cleanName = normalizeText(nombre);

  const cleanTipo = normalizeText(tipoSaldo || '')
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');

  // ======================================================
  // REGLA ESPECIAL: TERRENO
  //
  // Es el único activo fijo que NO se deprecia.
  // ======================================================

  if (cleanName.includes('terreno')) {
    return {
      categoria: 'ACTIVO_NO_CORRIENTE',
      esDepreciable: false
    };
  }

  // ======================================================
  // COSTO DE VENTAS
  //
  // Debe comprobarse ANTES de tratar cualquier "Egreso"
  // como gasto general.
  //
  // El CSV del profesor trae:
  //
  // Costo de Ventas,Egreso,120000
  //
  // Por eso debemos usar el nombre de la cuenta.
  // ======================================================

  if (
    cleanName.includes('costo de venta') ||
    cleanName === 'costo ventas'
  ) {
    return {
      categoria: 'COSTO',
      esDepreciable: false
    };
  }

  // ======================================================
  // CLASIFICACIÓN UTILIZANDO TIPO_SALDO
  // ======================================================

  if (cleanTipo.includes('ingreso')) {
    return {
      categoria: 'INGRESO',
      esDepreciable: false
    };
  }

  if (cleanTipo.includes('costo')) {
    return {
      categoria: 'COSTO',
      esDepreciable: false
    };
  }

  if (
    cleanTipo.includes('egreso') ||
    cleanTipo.includes('gasto')
  ) {
    return {
      categoria: 'EGRESO',
      esDepreciable: false
    };
  }

  if (cleanTipo.includes('inversion')) {
    return {
      categoria: 'ACTIVO_NO_CORRIENTE',
      esDepreciable: true
    };
  }

  if (
    cleanTipo.includes('deuda_corto') ||
    cleanTipo.includes('deuda_corto_plazo')
  ) {
    return {
      categoria: 'PASIVO_CORRIENTE',
      esDepreciable: false
    };
  }

  if (
    cleanTipo.includes('deuda_largo') ||
    cleanTipo.includes('deuda_largo_plazo')
  ) {
    return {
      categoria: 'PASIVO_NO_CORRIENTE',
      esDepreciable: false
    };
  }

  if (
    cleanTipo.includes('propietario') ||
    cleanTipo.includes('patrimonio')
  ) {
    return {
      categoria: 'PATRIMONIO',
      esDepreciable: false
    };
  }

  if (
    cleanTipo.includes('liquidez') ||
    cleanTipo.includes('almacen') ||
    cleanTipo.includes('derecho_cobro')
  ) {
    return {
      categoria: 'ACTIVO_CORRIENTE',
      esDepreciable: false
    };
  }

  // ======================================================
  // CLASIFICACIÓN POR NOMBRE
  // ======================================================

  // INGRESOS
  if (
    cleanName.includes('venta') ||
    cleanName.includes('ingreso')
  ) {
    return {
      categoria: 'INGRESO',
      esDepreciable: false
    };
  }

  // COSTOS
  if (
    cleanName.includes('costo de venta') ||
    cleanName.includes('costo')
  ) {
    return {
      categoria: 'COSTO',
      esDepreciable: false
    };
  }

  // GASTOS
  if (
    cleanName.includes('gasto') ||
    cleanName.includes('egreso')
  ) {
    return {
      categoria: 'EGRESO',
      esDepreciable: false
    };
  }

  // ======================================================
  // ACTIVOS NO CORRIENTES
  // ======================================================

  if (
    cleanName.includes('maquinaria') ||
    cleanName.includes('vehiculo') ||
    cleanName.includes('edificio') ||
    cleanName.includes('equipo') ||
    cleanName.includes('mueble') ||
    cleanName.includes('mobiliario')
  ) {
    return {
      categoria: 'ACTIVO_NO_CORRIENTE',
      esDepreciable: true
    };
  }

  // ======================================================
  // PASIVO NO CORRIENTE
  // ======================================================

  if (
    cleanName.includes('largo plazo') ||
    cleanName.includes('hipoteca') ||
    cleanName.includes('bono por pagar') ||
    cleanName.includes('deuda largo')
  ) {
    return {
      categoria: 'PASIVO_NO_CORRIENTE',
      esDepreciable: false
    };
  }

  // ======================================================
  // PASIVO CORRIENTE
  // ======================================================

  if (
    cleanName.includes('proveedor') ||
    cleanName.includes('cuenta por pagar') ||
    cleanName.includes('cuentas por pagar') ||
    cleanName.includes('impuesto') ||
    cleanName.includes('sueldo por pagar') ||
    cleanName.includes('prestamo') ||
    cleanName.includes('corto plazo') ||
    cleanName.includes('pasivo corriente')
  ) {
    return {
      categoria: 'PASIVO_CORRIENTE',
      esDepreciable: false
    };
  }

  // ======================================================
  // PATRIMONIO
  // ======================================================

  if (
    cleanName.includes('capital') ||
    cleanName.includes('reserva') ||
    cleanName.includes('utilidad acumulada') ||
    cleanName.includes('utilidades acumuladas') ||
    cleanName.includes('patrimonio')
  ) {
    return {
      categoria: 'PATRIMONIO',
      esDepreciable: false
    };
  }

  // ======================================================
  // ACTIVOS CORRIENTES
  // ======================================================

  if (
    cleanName.includes('efectivo') ||
    cleanName.includes('caja') ||
    cleanName.includes('banco') ||
    cleanName.includes('inventario') ||
    cleanName.includes('cuenta por cobrar') ||
    cleanName.includes('cuentas por cobrar')
  ) {
    return {
      categoria: 'ACTIVO_CORRIENTE',
      esDepreciable: false
    };
  }

  /**
   * Si el CSV trae una cuenta que no conocemos,
   * mantenemos el comportamiento original.
   */
  return {
    categoria: 'ACTIVO_CORRIENTE',
    esDepreciable: false
  };
}

/**
 * Procesa las cuentas y construye el Balance General.
 */
export function buildBalanceSheet(
  rawEntries: RawAccountEntry[]
): BalanceSheet {
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
    const {
      categoria,
      esDepreciable
    } = classifyAccount(
      entry.cuenta,
      entry.tipoSaldo
    );

    // ======================================================
    // DEPRECIACIÓN POR LÍNEA RECTA
    //
    // (Costo - Salvamento) / Vida útil
    // ======================================================

    let depreciacion = 0;

    if (
      esDepreciable &&
      entry.vidaUtilAnios &&
      entry.vidaUtilAnios > 0
    ) {
      const valorSalvamento =
        entry.valorSalvamento ?? 0;

      depreciacion =
        (entry.saldo - valorSalvamento) /
        entry.vidaUtilAnios;

      // Evitamos depreciación negativa
      if (depreciacion < 0) {
        depreciacion = 0;
      }

      totalDepreciacionEjercicio += depreciacion;
    }

    const processed: ProcessedAccount = {
      id: entry.id
        ? String(entry.id)
        : `acc-${index}`,

      nombre: entry.cuenta,

      saldoOriginal: entry.saldo,

      depreciacionAcumulada: depreciacion,

      saldoNeto:
        categoria === 'ACTIVO_NO_CORRIENTE'
          ? entry.saldo - depreciacion
          : entry.saldo,

      categoria,

      esDepreciable
    };

    // ======================================================
    // AGRUPAR POR CATEGORÍA
    // ======================================================

    switch (categoria) {
      case 'ACTIVO_CORRIENTE':
        sheet.activoCorriente.push(processed);
        sheet.totalActivoCorriente +=
          processed.saldoNeto;
        break;

      case 'ACTIVO_NO_CORRIENTE':
        sheet.activoNoCorriente.push(processed);
        sheet.totalActivoNoCorriente +=
          processed.saldoNeto;
        break;

      case 'PASIVO_CORRIENTE':
        sheet.pasivoCorriente.push(processed);
        sheet.totalPasivoCorriente +=
          processed.saldoOriginal;
        break;

      case 'PASIVO_NO_CORRIENTE':
        sheet.pasivoNoCorriente.push(processed);
        sheet.totalPasivoNoCorriente +=
          processed.saldoOriginal;
        break;

      case 'PATRIMONIO':
        sheet.patrimonio.push(processed);
        sheet.totalPatrimonio +=
          processed.saldoOriginal;
        break;

      case 'INGRESO':
        sheet.ingresos.push(processed);
        sheet.totalVentas +=
          processed.saldoOriginal;
        break;

      case 'COSTO':
        sheet.egresos.push(processed);
        sheet.totalCostoVentas +=
          processed.saldoOriginal;
        break;

      case 'EGRESO':
        sheet.egresos.push(processed);
        sheet.totalGastos +=
          processed.saldoOriginal;
        break;
    }
  });

  // ======================================================
  // TOTALES DEL BALANCE
  // ======================================================

  sheet.totalActivo =
    sheet.totalActivoCorriente +
    sheet.totalActivoNoCorriente;

  sheet.totalPasivo =
    sheet.totalPasivoCorriente +
    sheet.totalPasivoNoCorriente;

  sheet.totalPasivoMasPatrimonio =
    sheet.totalPasivo +
    sheet.totalPatrimonio;

  // ======================================================
  // RESULTADO DEL EJERCICIO
  // ======================================================

  sheet.utilidadNeta =
    sheet.totalVentas -
    sheet.totalCostoVentas -
    sheet.totalGastos -
    totalDepreciacionEjercicio;

  // ======================================================
  // ECUACIÓN CONTABLE
  //
  // ACTIVO = PASIVO + PATRIMONIO
  // ======================================================

  sheet.diferenciaDescuadre = Math.abs(
    sheet.totalActivo -
    sheet.totalPasivoMasPatrimonio
  );

  sheet.estaEquilibrado =
    sheet.diferenciaDescuadre < 0.01;

  return sheet;
}