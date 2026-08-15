import { RawAccountEntry } from './types';

// CSV de Prueba 1: Equilibrado
export const mockBalancedCSV: RawAccountEntry[] = [
  { cuenta: 'Caja y Bancos', saldo: 15000 },
  { cuenta: 'Cuentas por Cobrar', saldo: 25000 },
  { cuenta: 'Inventario de Mercadería', saldo: 30000 },
  { cuenta: 'Terrenos', saldo: 50000 }, // No se deprecia
  { cuenta: 'Maquinaria y Equipo', saldo: 40000, vidaUtilAnios: 10, valorSalvamento: 0 }, // Depreciación 4000
  { cuenta: 'Proveedores', saldo: 20000 },
  { cuenta: 'Cuentas por Pagar Corto Plazo', saldo: 15000 },
  { cuenta: 'Préstamo Bancario Largo Plazo', saldo: 35000 },
  { cuenta: 'Capital Social', saldo: 86000 }
];

// CSV de Prueba 2: Descuadrado (Para testear la alerta)
export const mockUnbalancedCSV: RawAccountEntry[] = [
  { cuenta: 'Caja y Bancos', saldo: 10000 },
  { cuenta: 'Cuentas por Cobrar', saldo: 5000 },
  { cuenta: 'Proveedores', saldo: 50000 },
  { cuenta: 'Capital Social', saldo: 10000 }
];