/**
 * Plantillas predefinidas de tipos de socio por tipo de colectividad.
 * Cada tipo de colectividad tiene una serie de categorías de socios recomendadas.
 */

/** Interfaz de una plantilla de tipo de socio. */
export interface MemberTypeTemplate {
  code: string;
  name: string;
  description: string;
  ageRangeMin: number | null;
  ageRangeMax: number | null;
  votingRight: boolean;
  eligibleForOffice: boolean;
  minimumSeniorityForVoting: number;
  minimumSeniorityForOffice: number;
  rulesConfig: object;
}

/** Plantillas para Cofradías (US-015). */
const COFRADIA_TEMPLATES: MemberTypeTemplate[] = [
  {
    code: 'NUMERARIO',
    name: 'Hermano Numerario',
    description: 'Hermano de pleno derecho con voto y capacidad para cargos directivos.',
    ageRangeMin: 18,
    ageRangeMax: null,
    votingRight: true,
    eligibleForOffice: true,
    minimumSeniorityForVoting: 24, // Carencia de 2 años para voto
    minimumSeniorityForOffice: 60, // Carencia de 5 años para elegibilidad
    rulesConfig: {},
  },
  {
    code: 'HONORARIO',
    name: 'Hermano Honorario',
    description: 'Hermano distinguido por méritos especiales. Sin cuota obligatoria.',
    ageRangeMin: null,
    ageRangeMax: null,
    votingRight: false,
    eligibleForOffice: false,
    minimumSeniorityForVoting: 0,
    minimumSeniorityForOffice: 0,
    rulesConfig: {},
  },
  {
    code: 'ASPIRANTE',
    name: 'Hermano Aspirante',
    description: 'Persona en periodo de admisión. Sin derecho a voto ni cargo. Carencia de 1 año.',
    ageRangeMin: 18,
    ageRangeMax: null,
    votingRight: false,
    eligibleForOffice: false,
    minimumSeniorityForVoting: 12, // Carencia de 1 año
    minimumSeniorityForOffice: 0,
    rulesConfig: {},
  },
  {
    code: 'MENOR_EDAD',
    name: 'Hermano Menor de Edad',
    description: 'Menor inscrito por sus tutores legales. Sin derechos de participación activa.',
    ageRangeMin: 0,
    ageRangeMax: 17,
    votingRight: false,
    eligibleForOffice: false,
    minimumSeniorityForVoting: 0,
    minimumSeniorityForOffice: 0,
    rulesConfig: {},
  },
];

/** Plantillas para Peñas (US-016). */
const PENA_TEMPLATES: MemberTypeTemplate[] = [
  {
    code: 'ADULTO',
    name: 'Socio Adulto',
    description: 'Socio de 35 o más años con plenos derechos de voto y cargo.',
    ageRangeMin: 35,
    ageRangeMax: null,
    votingRight: true,
    eligibleForOffice: true,
    minimumSeniorityForVoting: 0,
    minimumSeniorityForOffice: 12,
    rulesConfig: {},
  },
  {
    code: 'JUVENIL',
    name: 'Socio Juvenil',
    description: 'Socio entre 18 y 34 años con derecho a voto sin elegibilidad para cargos.',
    ageRangeMin: 18,
    ageRangeMax: 34,
    votingRight: true,
    eligibleForOffice: false,
    minimumSeniorityForVoting: 0,
    minimumSeniorityForOffice: 0,
    rulesConfig: {},
  },
  {
    code: 'INFANTIL',
    name: 'Socio Infantil',
    description: 'Menor de 18 años inscrito por sus tutores. Sin derecho a voto.',
    ageRangeMin: 0,
    ageRangeMax: 17,
    votingRight: false,
    eligibleForOffice: false,
    minimumSeniorityForVoting: 0,
    minimumSeniorityForOffice: 0,
    rulesConfig: {},
  },
  {
    code: 'HONOR',
    name: 'Socio de Honor',
    description: 'Socio distinguido por la peña. Con derecho a voto y elegibilidad. Sin cuota.',
    ageRangeMin: null,
    ageRangeMax: null,
    votingRight: true,
    eligibleForOffice: true,
    minimumSeniorityForVoting: 0,
    minimumSeniorityForOffice: 0,
    rulesConfig: {},
  },
];

/** Plantillas para Clubes Deportivos (US-017). */
const CLUB_DEPORTIVO_TEMPLATES: MemberTypeTemplate[] = [
  {
    code: 'SOCIO_CLUB',
    name: 'Socio del Club',
    description: 'Socio con derecho a voto y participación en asambleas.',
    ageRangeMin: 18,
    ageRangeMax: null,
    votingRight: true,
    eligibleForOffice: true,
    minimumSeniorityForVoting: 3,
    minimumSeniorityForOffice: 12,
    rulesConfig: {},
  },
  {
    code: 'DEPORT_FED',
    name: 'Deportista Federado',
    description:
      'Deportista con licencia federativa. Participa en competiciones oficiales. Sin voto.',
    ageRangeMin: null,
    ageRangeMax: null,
    votingRight: false,
    eligibleForOffice: false,
    minimumSeniorityForVoting: 0,
    minimumSeniorityForOffice: 0,
    rulesConfig: {},
  },
  {
    code: 'SOCIO_DEP',
    name: 'Socio Deportista',
    description:
      'Deportista con licencia y derecho a voto. Combina deporte y participación societaria.',
    ageRangeMin: null,
    ageRangeMax: null,
    votingRight: true,
    eligibleForOffice: false,
    minimumSeniorityForVoting: 0,
    minimumSeniorityForOffice: 0,
    rulesConfig: {},
  },
  {
    code: 'FAMILIAR',
    name: 'Socio Familiar',
    description: 'Familiar de un socio. Acceso a instalaciones con cuota reducida. Sin voto.',
    ageRangeMin: null,
    ageRangeMax: null,
    votingRight: false,
    eligibleForOffice: false,
    minimumSeniorityForVoting: 0,
    minimumSeniorityForOffice: 0,
    rulesConfig: {},
  },
];

/** Plantillas para Asociaciones Culturales (US-018). */
const ASOCIACION_CULTURAL_TEMPLATES: MemberTypeTemplate[] = [
  {
    code: 'ORDINARIO',
    name: 'Socio Ordinario',
    description: 'Socio con plenos derechos de participación, voto y actividades.',
    ageRangeMin: 18,
    ageRangeMax: null,
    votingRight: true,
    eligibleForOffice: true,
    minimumSeniorityForVoting: 0,
    minimumSeniorityForOffice: 6,
    rulesConfig: {},
  },
  {
    code: 'FUNDADOR',
    name: 'Socio Fundador',
    description: 'Miembro fundador de la asociación. Voto, actividades y distintivo especial.',
    ageRangeMin: 18,
    ageRangeMax: null,
    votingRight: true,
    eligibleForOffice: true,
    minimumSeniorityForVoting: 0,
    minimumSeniorityForOffice: 0,
    rulesConfig: {},
  },
  {
    code: 'HONOR_AC',
    name: 'Socio Honorario',
    description: 'Persona distinguida por la asociación. Acceso a actividades sin derecho a voto.',
    ageRangeMin: null,
    ageRangeMax: null,
    votingRight: false,
    eligibleForOffice: false,
    minimumSeniorityForVoting: 0,
    minimumSeniorityForOffice: 0,
    rulesConfig: {},
  },
  {
    code: 'PROTECTOR',
    name: 'Socio Protector',
    description:
      'Persona o entidad que apoya económicamente la asociación. Con derecho a voto y actividades.',
    ageRangeMin: null,
    ageRangeMax: null,
    votingRight: true,
    eligibleForOffice: false,
    minimumSeniorityForVoting: 0,
    minimumSeniorityForOffice: 0,
    rulesConfig: {},
  },
];

/** Mapa de plantillas por tipo de colectividad. */
const TEMPLATES_MAP: Record<string, MemberTypeTemplate[]> = {
  COFRADIA: COFRADIA_TEMPLATES,
  PENA: PENA_TEMPLATES,
  CLUB_DEPORTIVO: CLUB_DEPORTIVO_TEMPLATES,
  ASOCIACION_CULTURAL: ASOCIACION_CULTURAL_TEMPLATES,
};

/**
 * Obtiene las plantillas de tipos de socio para un tipo de colectividad.
 * @param collectivityType Tipo de colectividad.
 * @returns Lista de plantillas o lista vacía si el tipo no tiene plantillas.
 */
export function getTemplatesForCollectivityType(collectivityType: string): MemberTypeTemplate[] {
  return TEMPLATES_MAP[collectivityType] ?? [];
}
