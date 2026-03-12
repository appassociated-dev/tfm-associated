/**
 * Plantillas predefinidas de planes de cuota por tipo de colectividad.
 * Datos estáticos utilizados para la importación inicial y consulta de plantillas.
 */

/** Estructura de una plantilla de plan de cuota. */
export interface FeePlanTemplate {
  code: string;
  name: string;
  description: string | null;
  type: string;
  frequency: string;
  amount: number;
  billingMonths: number[];
  collectivityType: string;
}

/** Plantillas disponibles para todos los tipos de colectividad. */
export const FEE_PLAN_TEMPLATES: readonly FeePlanTemplate[] = Object.freeze([
  // --- ASSOCIATION (Asociación) ---
  {
    code: 'CUOTA-ANUAL',
    name: 'Cuota Anual',
    description: 'Cuota anual estándar para socios de asociación',
    type: 'RECURRING',
    frequency: 'ANNUAL',
    amount: 6000, // 60.00 EUR
    billingMonths: [1],
    collectivityType: 'ASSOCIATION',
  },
  {
    code: 'CUOTA-SEMESTRAL',
    name: 'Cuota Semestral',
    description: 'Cuota semestral para socios de asociación',
    type: 'RECURRING',
    frequency: 'BIANNUAL',
    amount: 3500, // 35.00 EUR
    billingMonths: [1, 7],
    collectivityType: 'ASSOCIATION',
  },
  {
    code: 'CUOTA-TRIMESTRAL',
    name: 'Cuota Trimestral',
    description: 'Cuota trimestral para socios de asociación',
    type: 'RECURRING',
    frequency: 'QUARTERLY',
    amount: 2000, // 20.00 EUR
    billingMonths: [1, 4, 7, 10],
    collectivityType: 'ASSOCIATION',
  },
  {
    code: 'INSCRIPCION',
    name: 'Cuota de Inscripción',
    description: 'Cuota de inscripción única para nuevos socios',
    type: 'ONE_TIME',
    frequency: 'ANNUAL',
    amount: 2500, // 25.00 EUR
    billingMonths: [],
    collectivityType: 'ASSOCIATION',
  },

  // --- CLUB (Club deportivo / social) ---
  {
    code: 'CUOTA-ANUAL',
    name: 'Cuota Anual',
    description: 'Cuota anual estándar para socios de club',
    type: 'RECURRING',
    frequency: 'ANNUAL',
    amount: 12000, // 120.00 EUR
    billingMonths: [1],
    collectivityType: 'CLUB',
  },
  {
    code: 'CUOTA-MENSUAL',
    name: 'Cuota Mensual',
    description: 'Cuota mensual para socios de club',
    type: 'RECURRING',
    frequency: 'MONTHLY',
    amount: 1500, // 15.00 EUR
    billingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    collectivityType: 'CLUB',
  },
  {
    code: 'INSCRIPCION',
    name: 'Cuota de Inscripción',
    description: 'Cuota de inscripción única para nuevos socios de club',
    type: 'ONE_TIME',
    frequency: 'ANNUAL',
    amount: 5000, // 50.00 EUR
    billingMonths: [],
    collectivityType: 'CLUB',
  },
  {
    code: 'CUOTA-JUVENIL',
    name: 'Cuota Juvenil Anual',
    description: 'Cuota anual reducida para socios juveniles de club',
    type: 'RECURRING',
    frequency: 'ANNUAL',
    amount: 6000, // 60.00 EUR
    billingMonths: [9],
    collectivityType: 'CLUB',
  },

  // --- FEDERATION (Federación) ---
  {
    code: 'CUOTA-FEDERATIVA',
    name: 'Cuota Federativa Anual',
    description: 'Cuota anual obligatoria para entidades federadas',
    type: 'RECURRING',
    frequency: 'ANNUAL',
    amount: 25000, // 250.00 EUR
    billingMonths: [1],
    collectivityType: 'FEDERATION',
  },
  {
    code: 'LICENCIA-DEPORTIVA',
    name: 'Licencia Deportiva',
    description: 'Cuota anual de licencia deportiva federativa',
    type: 'RECURRING',
    frequency: 'ANNUAL',
    amount: 8000, // 80.00 EUR
    billingMonths: [9],
    collectivityType: 'FEDERATION',
  },
  {
    code: 'INSCRIPCION-ENTIDAD',
    name: 'Inscripción de Entidad',
    description: 'Cuota de inscripción única para nuevas entidades federadas',
    type: 'ONE_TIME',
    frequency: 'ANNUAL',
    amount: 10000, // 100.00 EUR
    billingMonths: [],
    collectivityType: 'FEDERATION',
  },
]);
