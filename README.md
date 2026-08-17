Análisis de la Arquitectura del Sistema
Diseño realizado con: Next.js + TypeScript + Tailwind CSS desplegado en Vercel.

<img width="491" height="636" alt="image" src="https://github.com/user-attachments/assets/7a6b5455-51b7-4f04-8564-fcf26c0b6a2c" />

Desglose de Requisitos Técnicos por Fase
1. Fase 1: Motor Contable y Depreciación
- Carga de CSV: Parseo dinámico (podemos usar PapaParse en el frontend para procesar el CSV al instante sin depender de un servidor externo).
- Clasificación Dinámica: Un mapeo que identifique cuentas como:
  - Activo Corriente: Caja, Bancos, Cuentas por Cobrar, Inventarios.
  - Activo No Corriente: Maquinaria, Vehículos, Edificios, Terrenos.
  - Pasivo Corriente: Cuentas por Pagar, Proveedores, Impuestos por Pagar.
  - Pasivo No Corriente: Préstamos Bancarios a Largo Plazo, Hipotecas.
  -  Patrimonio: Capital Social, Utilidades Retenidas.
- Depreciación en Línea Recta:

  $$\text{Depreciación Anual} = \frac{\text{Costo Histórico} - \text{Valor de Salvamento}}{\text{Vida Útil}}$$
  
  - Regla estricta: Terreno tiene depreciación $= 0$.
