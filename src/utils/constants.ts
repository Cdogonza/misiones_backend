export const VALORES_OFICINAS = [
    'Sala I',
    'Sala II',
    'Sala III',
    'Sala IV',
    'Sala V (informatica)',
    'Sala V (telefonia)',
    'Rec. y Entrega',
    'Inspecciones',
    'Adquisiciones',
    'Misiones',
    'Deposito Base',
    'Jefe de Seccion Mant.',
    'Jefe de Seccion Abast.',
    'Cte. de Ca.',
    '2do Jefe',
    'Jefe'
] as const;

export type Oficina = (typeof VALORES_OFICINAS)[number];
