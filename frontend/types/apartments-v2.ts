/**
 * TypeScript types for Apartments V2 API
 * Aligned with backend schemas in: backend/app/schemas/apartment_v2.py
 *
 * Este archivo contiene todos los tipos TypeScript para el módulo de apartamentos,
 * incluyendo interfaces de entidades, DTOs, enums y parámetros de consulta.
 *
 * @version 2.0
 * @since 2025-01-12
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Tipos de habitaciones en notación japonesa estándar
 *
 * Define los tipos de habitaciones disponibles según la nomenclatura
 * japonesa para apartamentos (1K, 1DK, 1LDK, etc.).
 *
 * @enum {string}
 *
 * @example
 * ```typescript
 * const apartment = {
 *   room_type: RoomType.LDK,
 *   name: "Apartamento Tokyo"
 * }
 * ```
 *
 * @see {@link ApartmentBase.room_type}
 */
export enum RoomType {
  /** Room - Habitación individual (usado en 1K, 1DK, etc.) */
  R = 'R',
  /** Kitchen - Cocina (usado en 1K) */
  K = 'K',
  /** Dining Kitchen - Cocina-comedor (usado en 1DK) */
  DK = 'DK',
  /** Living Dining Kitchen - Sala-comedor-cocina (usado en 1LDK, 2LDK, etc.) */
  LDK = 'LDK',
  /** Single room - Habitación individual sin divisiones */
  S = 'S',
}

/**
 * Tipos de cargos adicionales que pueden aplicarse a una asignación
 *
 * Define las categorías de cargos que pueden generarse durante
 * o al finalizar una asignación de apartamento.
 *
 * @enum {string}
 *
 * @example
 * ```typescript
 * const charge: AdditionalChargeCreate = {
 *   charge_type: ChargeType.CLEANING,
 *   amount: 15000,
 *   description: "Limpieza profunda al finalizar contrato"
 * }
 * ```
 *
 * @see {@link AdditionalChargeBase.charge_type}
 */
export enum ChargeType {
  /** Limpieza (cleaning fee) - Cargo por servicio de limpieza */
  CLEANING = 'cleaning',
  /** Reparación - Cargo por reparaciones o daños */
  REPAIR = 'repair',
  /** Depósito - Cargo por depósito de seguridad */
  DEPOSIT = 'deposit',
  /** Penalización - Cargo por incumplimiento o violación de reglas */
  PENALTY = 'penalty',
  /** Otro - Cargo no categorizado */
  OTHER = 'other',
}

/**
 * Estados de una asignación de empleado a apartamento
 *
 * Representa el ciclo de vida de una asignación desde que se crea
 * hasta que finaliza o se cancela.
 *
 * @enum {string}
 *
 * @example
 * ```typescript
 * const assignment: AssignmentCreate = {
 *   status: AssignmentStatus.ACTIVE,
 *   start_date: "2025-01-01",
 *   end_date: null // Indefinido
 * }
 * ```
 *
 * @see {@link AssignmentBase.status}
 */
export enum AssignmentStatus {
  /** Asignación activa - El empleado actualmente vive en el apartamento */
  ACTIVE = 'active',
  /** Asignación finalizada - El empleado ya no vive en el apartamento */
  ENDED = 'ended',
  /** Asignación cancelada - Asignación cancelada antes de comenzar */
  CANCELLED = 'cancelled',
}

/**
 * Estados de una deducción de renta mensual
 *
 * Representa el flujo de procesamiento de una deducción desde
 * que se genera hasta que se paga.
 *
 * @enum {string}
 *
 * @example
 * ```typescript
 * const deduction: DeductionBase = {
 *   status: DeductionStatus.PENDING,
 *   year: 2025,
 *   month: 1,
 *   total_amount: 60000
 * }
 * ```
 *
 * @see {@link DeductionBase.status}
 */
export enum DeductionStatus {
  /** Pendiente - Deducción generada pero aún no procesada */
  PENDING = 'pending',
  /** Procesada - Deducción procesada y lista para pago */
  PROCESSED = 'processed',
  /** Pagada - Deducción ya pagada al empleado */
  PAID = 'paid',
  /** Cancelada - Deducción cancelada (no se aplicará) */
  CANCELLED = 'cancelled',
}

/**
 * Estados de un cargo adicional
 *
 * Representa el flujo de aprobación y pago de un cargo adicional
 * aplicado a una asignación.
 *
 * @enum {string}
 *
 * @example
 * ```typescript
 * const charge: AdditionalChargeCreate = {
 *   status: ChargeStatus.PENDING,
 *   charge_type: ChargeType.REPAIR,
 *   amount: 5000,
 *   description: "Reparación de ventana rota"
 * }
 * ```
 *
 * @see {@link AdditionalChargeBase.status}
 */
export enum ChargeStatus {
  /** Pendiente - Cargo generado esperando aprobación */
  PENDING = 'pending',
  /** Aprobado - Cargo aprobado por administrador */
  APPROVED = 'approved',
  /** Cancelado - Cargo cancelado (no se aplicará) */
  CANCELLED = 'cancelled',
  /** Pagado - Cargo ya pagado */
  PAID = 'paid',
}

// =============================================================================
// APARTMENT TYPES
// =============================================================================

/**
 * Campos base de un apartamento
 *
 * Define todos los campos comunes para crear o actualizar un apartamento,
 * incluyendo información de ubicación, precios, y datos del contrato.
 * Esta interfaz se extiende para crear los DTOs de creación y actualización.
 *
 * @interface ApartmentBase
 *
 * @example
 * ```typescript
 * const apartment: ApartmentBase = {
 *   name: "Apartamento Tokyo 101",
 *   building_name: "Torre Shinjuku",
 *   room_number: "101",
 *   floor_number: 1,
 *   base_rent: 60000,
 *   prefecture: "Tokyo",
 *   city: "Shinjuku",
 *   room_type: RoomType.LDK,
 *   status: "active"
 * }
 * ```
 *
 * @see {@link ApartmentCreate} - DTO para crear apartamento
 * @see {@link ApartmentUpdate} - DTO para actualizar apartamento
 * @see {@link ApartmentResponse} - Respuesta con datos completos
 */
export interface ApartmentBase {
  /**
   * Nombre del apartamento o identificador
   * @type {string}
   * @minLength 1
   * @maxLength 200
   * @example "Apartamento Tokyo 101"
   */
  name: string;

  /**
   * Nombre del edificio o complejo
   * @type {string | null}
   * @maxLength 200
   * @example "Torre Shinjuku"
   */
  building_name?: string | null;

  /**
   * Número de habitación o unidad
   * @type {string | null}
   * @maxLength 50
   * @example "101", "A-205"
   */
  room_number?: string | null;

  /**
   * Número de piso
   * @type {number | null}
   * @minimum 0
   * @maximum 100
   * @example 3
   */
  floor_number?: number | null;

  /**
   * Código postal japonés (formato: XXX-XXXX)
   * @type {string | null}
   * @pattern "^\d{3}-\d{4}$"
   * @example "160-0023"
   */
  postal_code?: string | null;

  /**
   * Prefectura (都道府県)
   * @type {string | null}
   * @maxLength 50
   * @example "Tokyo", "Osaka", "Kanagawa"
   */
  prefecture?: string | null;

  /**
   * Ciudad o municipio (市区町村)
   * @type {string | null}
   * @maxLength 100
   * @example "Shinjuku", "Yokohama"
   */
  city?: string | null;

  /**
   * Dirección línea 1 (calle, número)
   * @type {string | null}
   * @maxLength 200
   * @example "1-2-3 Nishi-Shinjuku"
   */
  address_line1?: string | null;

  /**
   * Dirección línea 2 (edificio, piso, apartamento)
   * @type {string | null}
   * @maxLength 200
   * @example "Torre A, Piso 3, Apto 301"
   */
  address_line2?: string | null;

  /**
   * Tipo de habitación (1K, 1DK, 1LDK, etc.)
   * @type {RoomType | null}
   * @example RoomType.LDK
   */
  room_type?: RoomType | null;

  /**
   * Tamaño en metros cuadrados
   * @type {number | null}
   * @minimum 5
   * @maximum 500
   * @example 35.5
   */
  size_sqm?: number | null;

  /**
   * Tipo de propiedad (apartamento, casa, etc.)
   * @type {string | null}
   * @maxLength 100
   * @example "Mansión", "Apāto", "Casa individual"
   */
  property_type?: string | null;

  // === PRECIOS ===

  /**
   * Renta base mensual en yenes
   * @type {number}
   * @minimum 0
   * @example 60000
   * @required
   */
  base_rent: number;

  /**
   * Tarifa de administración mensual (管理費)
   * @type {number}
   * @minimum 0
   * @default 0
   * @example 5000
   */
  management_fee?: number;

  /**
   * Depósito de seguridad (敷金)
   * @type {number}
   * @minimum 0
   * @default 0
   * @example 60000
   */
  deposit?: number;

  /**
   * Dinero de llave o gratificación (礼金)
   * @type {number}
   * @minimum 0
   * @default 0
   * @example 60000
   */
  key_money?: number;

  /**
   * Tarifa de limpieza por defecto
   * @type {number}
   * @minimum 0
   * @default 0
   * @example 15000
   */
  default_cleaning_fee?: number;

  /**
   * Número de espacios de estacionamiento disponibles
   * @type {number | null}
   * @minimum 0
   * @example 1
   */
  parking_spaces?: number | null;

  /**
   * Precio por espacio de estacionamiento (mensual)
   * @type {number | null}
   * @minimum 0
   * @example 10000
   */
  parking_price_per_unit?: number | null;

  /**
   * Cargo inicial adicional (初期費用追加)
   * @type {number | null}
   * @minimum 0
   * @example 20000
   */
  initial_plus?: number | null;

  // === CONTRATO ===

  /**
   * Fecha de inicio del contrato
   * @type {string | null}
   * @pattern "YYYY-MM-DD"
   * @example "2025-01-01"
   */
  contract_start_date?: string | null;

  /**
   * Fecha de fin del contrato
   * @type {string | null}
   * @pattern "YYYY-MM-DD"
   * @example "2027-12-31"
   */
  contract_end_date?: string | null;

  /**
   * Nombre del propietario (大家)
   * @type {string | null}
   * @maxLength 200
   * @example "Tanaka Taro"
   */
  landlord_name?: string | null;

  /**
   * Contacto del propietario (teléfono/email)
   * @type {string | null}
   * @maxLength 200
   * @example "03-1234-5678"
   */
  landlord_contact?: string | null;

  /**
   * Agencia inmobiliaria (不動産会社)
   * @type {string | null}
   * @maxLength 200
   * @example "Tokyo Real Estate Co."
   */
  real_estate_agency?: string | null;

  /**
   * Contacto de emergencia
   * @type {string | null}
   * @maxLength 200
   * @example "090-1234-5678"
   */
  emergency_contact?: string | null;

  /**
   * Notas adicionales
   * @type {string | null}
   * @example "Cerca de estación de metro"
   */
  notes?: string | null;

  /**
   * Estado del apartamento
   * @type {string}
   * @default "active"
   * @example "active", "inactive", "maintenance"
   */
  status?: string;
}

/**
 * DTO para crear un nuevo apartamento
 *
 * Extiende ApartmentBase sin modificaciones. Utilizado en el endpoint POST /apartments.
 * Todos los campos requeridos en ApartmentBase deben ser proporcionados.
 *
 * @interface ApartmentCreate
 * @extends {ApartmentBase}
 *
 * @example
 * ```typescript
 * const newApartment: ApartmentCreate = {
 *   name: "Apartamento Shibuya 505",
 *   building_name: "Residencia Sakura",
 *   base_rent: 80000,
 *   management_fee: 5000,
 *   prefecture: "Tokyo",
 *   city: "Shibuya",
 *   room_type: RoomType.LDK,
 *   status: "active"
 * }
 * await api.post('/apartments', newApartment)
 * ```
 *
 * @see {@link ApartmentBase}
 * @see {@link ApartmentResponse}
 */
export interface ApartmentCreate extends ApartmentBase {}

/**
 * DTO para actualizar un apartamento existente
 *
 * Todos los campos son opcionales (Partial<ApartmentBase>).
 * Solo se actualizan los campos proporcionados. Utilizado en el endpoint PATCH /apartments/{id}.
 *
 * @interface ApartmentUpdate
 * @extends {Partial<ApartmentBase>}
 *
 * @example
 * ```typescript
 * const update: ApartmentUpdate = {
 *   base_rent: 75000,  // Solo actualizar renta
 *   status: "inactive"  // Y estado
 * }
 * await api.patch('/apartments/1', update)
 * ```
 *
 * @see {@link ApartmentBase}
 * @see {@link ApartmentResponse}
 */
export interface ApartmentUpdate extends Partial<ApartmentBase> {}

/**
 * Respuesta completa de un apartamento con campos calculados
 *
 * Incluye todos los campos de ApartmentBase más campos adicionales generados
 * por el backend: ID, timestamps, dirección completa, costo total mensual,
 * y número de asignaciones activas.
 *
 * @interface ApartmentResponse
 * @extends {ApartmentBase}
 *
 * @example
 * ```typescript
 * const apartment: ApartmentResponse = {
 *   id: 1,
 *   name: "Apartamento Tokyo 101",
 *   building_name: "Torre Shinjuku",
 *   base_rent: 60000,
 *   management_fee: 5000,
 *   deposit: 60000,
 *   key_money: 0,
 *   default_cleaning_fee: 15000,
 *   status: "active",
 *   created_at: "2025-01-01T00:00:00Z",
 *   full_address: "Tokyo, Shinjuku, 1-2-3 Nishi-Shinjuku, Torre Shinjuku 101",
 *   total_monthly_cost: 65000,
 *   active_assignments: 2
 * }
 * ```
 *
 * @see {@link ApartmentBase}
 * @see {@link ApartmentWithStats} - Versión con estadísticas de ocupación
 */
export interface ApartmentResponse extends ApartmentBase {
  /**
   * ID único del apartamento
   * @type {number}
   * @example 1
   */
  id: number;

  /**
   * Renta base mensual en yenes (siempre presente en respuesta)
   * @type {number}
   * @minimum 0
   * @example 60000
   */
  base_rent: number;

  /**
   * Tarifa de administración mensual (siempre presente)
   * @type {number}
   * @minimum 0
   * @default 0
   * @example 5000
   */
  management_fee: number;

  /**
   * Depósito de seguridad (siempre presente)
   * @type {number}
   * @minimum 0
   * @default 0
   * @example 60000
   */
  deposit: number;

  /**
   * Dinero de llave (siempre presente)
   * @type {number}
   * @minimum 0
   * @default 0
   * @example 0
   */
  key_money: number;

  /**
   * Tarifa de limpieza por defecto (siempre presente)
   * @type {number}
   * @minimum 0
   * @default 0
   * @example 15000
   */
  default_cleaning_fee: number;

  /**
   * Espacios de estacionamiento (siempre presente)
   * @type {number | null}
   */
  parking_spaces?: number | null;

  /**
   * Precio por estacionamiento (siempre presente)
   * @type {number | null}
   */
  parking_price_per_unit?: number | null;

  /**
   * Cargo inicial adicional (siempre presente)
   * @type {number | null}
   */
  initial_plus?: number | null;

  /**
   * Estado del apartamento (siempre presente)
   * @type {string}
   * @example "active", "inactive", "maintenance"
   */
  status: string;

  /**
   * Fecha de creación del registro
   * @type {string}
   * @pattern "ISO 8601"
   * @example "2025-01-01T00:00:00Z"
   */
  created_at: string;

  /**
   * Fecha de última actualización
   * @type {string | null}
   * @pattern "ISO 8601"
   * @example "2025-01-15T12:30:00Z"
   */
  updated_at?: string | null;

  // === CAMPOS CALCULADOS ===

  /**
   * Dirección completa formateada (calculada por backend)
   * @type {string | null}
   * @example "Tokyo, Shinjuku, 1-2-3 Nishi-Shinjuku, Torre Shinjuku 101"
   */
  full_address?: string | null;

  /**
   * Costo mensual total (base_rent + management_fee)
   * @type {number}
   * @example 65000
   */
  total_monthly_cost?: number;

  /**
   * Número de asignaciones activas
   * @type {number}
   * @minimum 0
   * @example 2
   */
  active_assignments?: number;
}

/**
 * Apartamento con estadísticas de ocupación y asociaciones de fábricas
 *
 * Extiende ApartmentResponse con métricas calculadas de ocupación,
 * disponibilidad, duración promedio de estadía, y asociaciones con fábricas cercanas.
 * Se usa en dashboards, reportes, y vistas de gestión de capacidad.
 *
 * @interface ApartmentWithStats
 * @extends {ApartmentResponse}
 *
 * @example
 * ```typescript
 * const apartment: ApartmentWithStats = {
 *   id: 1,
 *   name: "Apartamento Tokyo 101",
 *   base_rent: 60000,
 *   current_occupancy: 2,
 *   max_occupancy: 2,
 *   occupancy_rate: 1.0,
 *   is_available: false,
 *   last_assignment_date: "2025-01-01",
 *   average_stay_duration: 180,
 *   primary_factory: {
 *     id: 5,
 *     factory_id: "F-001",
 *     company_name: "Toyota Motors",
 *     plant_name: "Planta Tokyo"
 *   },
 *   factory_associations: [...]
 * }
 * ```
 *
 * @see {@link ApartmentResponse}
 * @see {@link FactoryAssociation}
 */
export interface ApartmentWithStats extends ApartmentResponse {
  /**
   * Número de empleados actualmente asignados
   * @type {number}
   * @minimum 0
   * @example 2
   */
  current_occupancy: number;

  /**
   * Capacidad máxima basada en tipo de habitación
   * @type {number}
   * @minimum 1
   * @example 2
   */
  max_occupancy: number;

  /**
   * Tasa de ocupación actual (current_occupancy / max_occupancy)
   * @type {number}
   * @minimum 0
   * @maximum 1
   * @example 1.0  // 100% ocupado
   */
  occupancy_rate: number;

  /**
   * Indica si el apartamento tiene espacio disponible
   * @type {boolean}
   * @example false
   */
  is_available: boolean;

  /**
   * Fecha de la última asignación
   * @type {string | null}
   * @pattern "YYYY-MM-DD"
   * @example "2025-01-15"
   */
  last_assignment_date?: string | null;

  /**
   * Duración promedio de estadía en días
   * @type {number | null}
   * @minimum 0
   * @example 180  // 6 meses promedio
   */
  average_stay_duration?: number | null;

  // === ASOCIACIONES CON FÁBRICAS ===

  /**
   * ID de región geográfica
   * @type {number | null}
   * @example 3
   */
  region_id?: number | null;

  /**
   * Zona geográfica (norte, sur, este, oeste)
   * @type {string | null}
   * @example "Tokyo-Este"
   */
  zone?: string | null;

  /**
   * Lista de fábricas asociadas a este apartamento
   * @type {FactoryAssociation[]}
   * @see {@link FactoryAssociation}
   */
  factory_associations?: FactoryAssociation[];

  /**
   * Fábrica principal más cercana o prioritaria
   * @type {FactoryInfo | null}
   * @see {@link FactoryInfo}
   */
  primary_factory?: FactoryInfo | null;
}

// =============================================================================
// FACTORY ASSOCIATION TYPES (NEW)
// =============================================================================

/**
 * Información resumida de una fábrica
 *
 * Contiene los datos básicos de una fábrica para mostrar en
 * listas y asociaciones con apartamentos.
 *
 * @interface FactoryInfo
 *
 * @example
 * ```typescript
 * const factory: FactoryInfo = {
 *   id: 5,
 *   factory_id: "F-001",
 *   company_name: "Toyota Motors",
 *   plant_name: "Planta Tokyo Norte",
 *   address: "1-1 Toyota-cho, Toyota, Aichi"
 * }
 * ```
 *
 * @see {@link FactoryAssociation}
 */
export interface FactoryInfo {
  /**
   * ID interno de la fábrica
   * @type {number}
   * @example 5
   */
  id: number;

  /**
   * Código único de la fábrica
   * @type {string}
   * @example "F-001"
   */
  factory_id: string;

  /**
   * Nombre de la empresa
   * @type {string}
   * @example "Toyota Motors"
   */
  company_name: string;

  /**
   * Nombre de la planta específica
   * @type {string}
   * @example "Planta Tokyo Norte"
   */
  plant_name: string;

  /**
   * Dirección de la fábrica
   * @type {string | null}
   * @example "1-1 Toyota-cho, Toyota, Aichi"
   */
  address?: string | null;
}

/**
 * Asociación entre un apartamento y una fábrica
 *
 * Define la relación entre un apartamento y una fábrica, incluyendo
 * distancia, tiempo de commute, prioridad, y periodo de vigencia.
 * Se usa para asignar empleados a apartamentos cercanos a su lugar de trabajo.
 *
 * @interface FactoryAssociation
 *
 * @example
 * ```typescript
 * const association: FactoryAssociation = {
 *   id: 10,
 *   apartment_id: 1,
 *   factory_id: 5,
 *   is_primary: true,
 *   priority: 1,
 *   distance_km: 5.2,
 *   commute_minutes: 15,
 *   effective_from: "2025-01-01",
 *   effective_until: null,
 *   factory: {
 *     id: 5,
 *     factory_id: "F-001",
 *     company_name: "Toyota Motors",
 *     plant_name: "Planta Tokyo Norte"
 *   },
 *   employee_count: 3
 * }
 * ```
 *
 * @see {@link FactoryInfo}
 * @see {@link ApartmentWithStats}
 */
export interface FactoryAssociation {
  /**
   * ID de la asociación
   * @type {number}
   * @example 10
   */
  id: number;

  /**
   * ID del apartamento
   * @type {number}
   * @example 1
   */
  apartment_id: number;

  /**
   * ID de la fábrica
   * @type {number}
   * @example 5
   */
  factory_id: number;

  /**
   * Indica si es la fábrica principal para este apartamento
   * @type {boolean}
   * @example true
   */
  is_primary: boolean;

  /**
   * Prioridad de la asociación (menor = mayor prioridad)
   * @type {number}
   * @minimum 1
   * @example 1
   */
  priority: number;

  /**
   * Distancia en kilómetros desde el apartamento a la fábrica
   * @type {number | null}
   * @minimum 0
   * @example 5.2
   */
  distance_km?: number | null;

  /**
   * Tiempo estimado de commute en minutos
   * @type {number | null}
   * @minimum 0
   * @example 15
   */
  commute_minutes?: number | null;

  /**
   * Fecha desde la cual es válida la asociación
   * @type {string}
   * @pattern "YYYY-MM-DD"
   * @example "2025-01-01"
   */
  effective_from: string;

  /**
   * Fecha hasta la cual es válida la asociación (null = indefinida)
   * @type {string | null}
   * @pattern "YYYY-MM-DD"
   * @example "2025-12-31"
   */
  effective_until?: string | null;

  /**
   * Notas adicionales sobre la asociación
   * @type {string | null}
   * @example "Cerca de estación de tren principal"
   */
  notes?: string | null;

  /**
   * Información de la fábrica asociada
   * @type {FactoryInfo}
   * @see {@link FactoryInfo}
   */
  factory: FactoryInfo;

  /**
   * Número de empleados actualmente asignados de esta fábrica
   * @type {number}
   * @minimum 0
   * @example 3
   */
  employee_count?: number;
}

// =============================================================================
// ASSIGNMENT TYPES
// =============================================================================

/**
 * Campos base de una asignación de empleado a apartamento
 *
 * Define los datos fundamentales de una asignación, incluyendo fechas,
 * cálculos de renta prorrateada, y estado. Una asignación representa
 * el periodo durante el cual un empleado vive en un apartamento específico.
 *
 * @interface AssignmentBase
 *
 * @example
 * ```typescript
 * const assignment: AssignmentBase = {
 *   apartment_id: 1,
 *   employee_id: 123,
 *   start_date: "2025-01-15",
 *   end_date: null,  // Asignación indefinida
 *   monthly_rent: 60000,
 *   days_in_month: 31,
 *   days_occupied: 17,  // Del 15 al 31
 *   prorated_rent: 32903,  // Calculado proporcionalmente
 *   is_prorated: true,
 *   total_deduction: 32903,
 *   status: AssignmentStatus.ACTIVE,
 *   contract_type: "monthly",
 *   notes: "Primera asignación del empleado"
 * }
 * ```
 *
 * @see {@link AssignmentCreate} - DTO para crear asignación
 * @see {@link AssignmentResponse} - Respuesta con datos completos
 * @see {@link AssignmentStatus} - Estados posibles
 */
export interface AssignmentBase {
  /**
   * ID del apartamento asignado
   * @type {number}
   * @example 1
   */
  apartment_id: number;

  /**
   * ID del empleado asignado
   * @type {number}
   * @example 123
   */
  employee_id: number;

  /**
   * Fecha de inicio de la asignación
   * @type {string}
   * @pattern "YYYY-MM-DD"
   * @example "2025-01-15"
   */
  start_date: string;

  /**
   * Fecha de fin de la asignación (null = indefinida)
   * @type {string | null}
   * @pattern "YYYY-MM-DD"
   * @example "2025-06-30"
   */
  end_date?: string | null;

  // === CÁLCULOS ===

  /**
   * Renta mensual completa del apartamento
   * @type {number}
   * @minimum 0
   * @example 60000
   */
  monthly_rent: number;

  /**
   * Días totales en el mes de la asignación
   * @type {number}
   * @minimum 28
   * @maximum 31
   * @example 31
   */
  days_in_month: number;

  /**
   * Días efectivamente ocupados en el mes
   * @type {number}
   * @minimum 0
   * @maximum 31
   * @example 17
   */
  days_occupied: number;

  /**
   * Renta calculada proporcionalmente
   * @type {number}
   * @minimum 0
   * @example 32903
   */
  prorated_rent: number;

  /**
   * Indica si la renta fue calculada proporcionalmente
   * @type {boolean}
   * @example true
   */
  is_prorated: boolean;

  /**
   * Deducción total (renta + cargos adicionales)
   * @type {number}
   * @minimum 0
   * @example 32903
   */
  total_deduction: number;

  // === METADATA ===

  /**
   * Tipo de contrato (mensual, anual, etc.)
   * @type {string | null}
   * @example "monthly", "annual", "temporary"
   */
  contract_type?: string | null;

  /**
   * Notas adicionales sobre la asignación
   * @type {string | null}
   * @example "Primera asignación del empleado"
   */
  notes?: string | null;

  /**
   * Estado actual de la asignación
   * @type {AssignmentStatus}
   * @see {@link AssignmentStatus}
   */
  status: AssignmentStatus;
}

/**
 * DTO para crear una nueva asignación de empleado a apartamento
 *
 * Extiende AssignmentBase sin modificaciones. Utilizado en el endpoint POST /assignments.
 * El backend calcula automáticamente la renta prorrateada y deducciones.
 *
 * @interface AssignmentCreate
 * @extends {AssignmentBase}
 *
 * @example
 * ```typescript
 * const newAssignment: AssignmentCreate = {
 *   apartment_id: 1,
 *   employee_id: 123,
 *   start_date: "2025-01-15",
 *   end_date: null,
 *   monthly_rent: 60000,
 *   days_in_month: 31,
 *   days_occupied: 17,
 *   prorated_rent: 32903,
 *   is_prorated: true,
 *   total_deduction: 32903,
 *   status: AssignmentStatus.ACTIVE
 * }
 * await api.post('/assignments', newAssignment)
 * ```
 *
 * @see {@link AssignmentBase}
 * @see {@link AssignmentResponse}
 */
export interface AssignmentCreate extends AssignmentBase {}

/**
 * DTO para actualizar una asignación existente
 *
 * Permite actualizar fechas, cálculos, agregar cargos adicionales,
 * y cambiar el estado de una asignación. Utilizado en el endpoint PATCH /assignments/{id}.
 *
 * @interface AssignmentUpdate
 *
 * @example
 * ```typescript
 * // Finalizar asignación y agregar cleaning fee
 * const update: AssignmentUpdate = {
 *   end_date: "2025-06-30",
 *   status: AssignmentStatus.ENDED,
 *   include_cleaning_fee: true,
 *   cleaning_fee: 15000,
 *   additional_charges: [
 *     {
 *       charge_type: ChargeType.REPAIR,
 *       description: "Reparación de ventana",
 *       amount: 5000,
 *       charge_date: "2025-06-30"
 *     }
 *   ],
 *   notes: "Mudanza completada sin incidentes"
 * }
 * await api.patch('/assignments/1', update)
 * ```
 *
 * @see {@link AssignmentBase}
 * @see {@link ChargeType}
 */
export interface AssignmentUpdate {
  /**
   * Nueva fecha de fin
   * @type {string | null}
   * @pattern "YYYY-MM-DD"
   */
  end_date?: string | null;

  /**
   * Actualizar días ocupados
   * @type {number}
   * @minimum 0
   * @maximum 31
   */
  days_occupied?: number;

  /**
   * Actualizar renta prorrateada
   * @type {number}
   * @minimum 0
   */
  prorated_rent?: number;

  /**
   * Actualizar deducción total
   * @type {number}
   * @minimum 0
   */
  total_deduction?: number;

  /**
   * Incluir tarifa de limpieza al finalizar
   * @type {boolean}
   * @default false
   */
  include_cleaning_fee?: boolean;

  /**
   * Monto de la tarifa de limpieza
   * @type {number}
   * @minimum 0
   */
  cleaning_fee?: number;

  /**
   * Cargos adicionales a agregar
   * @type {Array<{charge_type, description, amount, charge_date}>}
   */
  additional_charges?: Array<{
    /** Tipo de cargo */
    charge_type: ChargeType;
    /** Descripción del cargo */
    description: string;
    /** Monto en yenes */
    amount: number;
    /** Fecha del cargo */
    charge_date: string;
  }>;

  /**
   * Actualizar notas
   * @type {string | null}
   */
  notes?: string | null;

  /**
   * Cambiar estado
   * @type {AssignmentStatus}
   */
  status?: AssignmentStatus;
}

/**
 * Respuesta completa de una asignación con datos relacionados
 *
 * Incluye todos los campos de AssignmentBase más ID, timestamps,
 * y datos relacionados (apartamento, empleado, cargos, deducciones).
 * Los datos relacionados se cargan de forma lazy según el parámetro include.
 *
 * @interface AssignmentResponse
 * @extends {AssignmentBase}
 *
 * @example
 * ```typescript
 * const assignment: AssignmentResponse = {
 *   id: 1,
 *   apartment_id: 1,
 *   employee_id: 123,
 *   start_date: "2025-01-15",
 *   end_date: null,
 *   monthly_rent: 60000,
 *   days_in_month: 31,
 *   days_occupied: 17,
 *   prorated_rent: 32903,
 *   is_prorated: true,
 *   total_deduction: 32903,
 *   status: AssignmentStatus.ACTIVE,
 *   created_at: "2025-01-15T00:00:00Z",
 *   apartment: { ...apartmentData },
 *   employee: { ...employeeData },
 *   additional_charges: [],
 *   deductions: []
 * }
 * ```
 *
 * @see {@link AssignmentBase}
 * @see {@link ApartmentResponse}
 * @see {@link AdditionalChargeResponse}
 * @see {@link DeductionResponse}
 */
export interface AssignmentResponse extends AssignmentBase {
  /**
   * ID único de la asignación
   * @type {number}
   * @example 1
   */
  id: number;

  /**
   * Fecha de creación del registro
   * @type {string}
   * @pattern "ISO 8601"
   * @example "2025-01-15T00:00:00Z"
   */
  created_at: string;

  /**
   * Fecha de última actualización
   * @type {string | null}
   * @pattern "ISO 8601"
   * @example "2025-01-20T12:30:00Z"
   */
  updated_at?: string | null;

  // === DATOS RELACIONADOS (Lazy Loaded) ===

  /**
   * Datos completos del apartamento (incluir con ?include=apartment)
   * @type {ApartmentResponse}
   * @see {@link ApartmentResponse}
   */
  apartment?: ApartmentResponse;

  /**
   * Datos completos del empleado (incluir con ?include=employee)
   * @type {any}
   * @todo Tipar con interfaz Employee cuando esté disponible
   */
  employee?: any;

  /**
   * Lista de cargos adicionales (incluir con ?include=charges)
   * @type {AdditionalChargeResponse[]}
   * @see {@link AdditionalChargeResponse}
   */
  additional_charges?: AdditionalChargeResponse[];

  /**
   * Lista de deducciones mensuales (incluir con ?include=deductions)
   * @type {DeductionResponse[]}
   * @see {@link DeductionResponse}
   */
  deductions?: DeductionResponse[];
}

/**
 * Item resumido de asignación para listados
 *
 * Contiene los campos esenciales de una asignación más campos
 * denormalizados para evitar JOINs en listados. Se usa en tablas
 * y vistas de listado donde no se necesitan todos los detalles.
 *
 * @interface AssignmentListItem
 *
 * @example
 * ```typescript
 * const listItem: AssignmentListItem = {
 *   id: 1,
 *   apartment_id: 1,
 *   employee_id: 123,
 *   start_date: "2025-01-15",
 *   end_date: null,
 *   status: AssignmentStatus.ACTIVE,
 *   total_deduction: 32903,
 *   created_at: "2025-01-15T00:00:00Z",
 *   apartment_name: "Apartamento Tokyo 101",
 *   apartment_code: "TKY-101",
 *   employee_name_kanji: "田中太郎",
 *   employee_name_kana: "タナカタロウ"
 * }
 * ```
 *
 * @see {@link AssignmentResponse} - Versión completa con datos relacionados
 */
export interface AssignmentListItem {
  /**
   * ID de la asignación
   * @type {number}
   */
  id: number;

  /**
   * ID del apartamento
   * @type {number}
   */
  apartment_id: number;

  /**
   * ID del empleado
   * @type {number}
   */
  employee_id: number;

  /**
   * Fecha de inicio
   * @type {string}
   * @pattern "YYYY-MM-DD"
   */
  start_date: string;

  /**
   * Fecha de fin (null = indefinida)
   * @type {string | null}
   * @pattern "YYYY-MM-DD"
   */
  end_date?: string | null;

  /**
   * Estado de la asignación
   * @type {AssignmentStatus}
   */
  status: AssignmentStatus;

  /**
   * Deducción total
   * @type {number}
   * @minimum 0
   */
  total_deduction: number;

  /**
   * Fecha de creación
   * @type {string}
   * @pattern "ISO 8601"
   */
  created_at: string;

  // === CAMPOS DENORMALIZADOS ===

  /**
   * Nombre del apartamento (denormalizado)
   * @type {string}
   * @example "Apartamento Tokyo 101"
   */
  apartment_name: string;

  /**
   * Código del apartamento (denormalizado)
   * @type {string | null}
   * @example "TKY-101"
   */
  apartment_code?: string | null;

  /**
   * Nombre del empleado en kanji (denormalizado)
   * @type {string}
   * @example "田中太郎"
   */
  employee_name_kanji: string;

  /**
   * Nombre del empleado en katakana (denormalizado)
   * @type {string | null}
   * @example "タナカタロウ"
   */
  employee_name_kana?: string | null;
}

// =============================================================================
// TRANSFER TYPES
// =============================================================================

/**
 * Solicitud para transferir un empleado entre apartamentos
 *
 * Define los datos necesarios para realizar una transferencia de apartamento.
 * La transferencia finaliza la asignación actual y crea una nueva automáticamente.
 *
 * @interface TransferRequest
 *
 * @example
 * ```typescript
 * const transfer: TransferRequest = {
 *   employee_id: 123,
 *   current_apartment_id: 1,
 *   new_apartment_id: 5,
 *   transfer_date: "2025-02-01",
 *   notes: "Transferencia por solicitud del empleado - más cerca de la fábrica"
 * }
 * await api.post('/assignments/transfer', transfer)
 * ```
 *
 * @see {@link TransferResponse}
 */
export interface TransferRequest {
  /**
   * ID del empleado a transferir
   * @type {number}
   * @example 123
   */
  employee_id: number;

  /**
   * ID del apartamento actual
   * @type {number}
   * @example 1
   */
  current_apartment_id: number;

  /**
   * ID del nuevo apartamento
   * @type {number}
   * @example 5
   */
  new_apartment_id: number;

  /**
   * Fecha efectiva de la transferencia
   * @type {string}
   * @pattern "YYYY-MM-DD"
   * @example "2025-02-01"
   */
  transfer_date: string;

  /**
   * Notas sobre la transferencia
   * @type {string | null}
   * @example "Transferencia por solicitud del empleado"
   */
  notes?: string | null;
}

/**
 * Respuesta después de realizar una transferencia
 *
 * Incluye las asignaciones antigua y nueva, costos comparativos,
 * y un desglose detallado de los cálculos realizados.
 *
 * @interface TransferResponse
 *
 * @example
 * ```typescript
 * const response: TransferResponse = {
 *   ended_assignment: { id: 1, status: "ended", ... },
 *   new_assignment: { id: 2, status: "active", ... },
 *   old_apartment_cost: 65000,
 *   new_apartment_cost: 70000,
 *   total_monthly_cost: 70000,
 *   breakdown: {
 *     old_prorated: 21667,
 *     new_prorated: 70000,
 *     cleaning_fee: 15000,
 *     total_transfer_cost: 36667
 *   }
 * }
 * ```
 *
 * @see {@link TransferRequest}
 * @see {@link AssignmentResponse}
 */
export interface TransferResponse {
  /**
   * Asignación anterior (ahora finalizada)
   * @type {AssignmentResponse}
   * @see {@link AssignmentResponse}
   */
  ended_assignment: AssignmentResponse;

  /**
   * Nueva asignación (activa)
   * @type {AssignmentResponse}
   * @see {@link AssignmentResponse}
   */
  new_assignment: AssignmentResponse;

  /**
   * Costo mensual del apartamento anterior
   * @type {number}
   * @minimum 0
   * @example 65000
   */
  old_apartment_cost: number;

  /**
   * Costo mensual del nuevo apartamento
   * @type {number}
   * @minimum 0
   * @example 70000
   */
  new_apartment_cost: number;

  /**
   * Costo mensual total después de la transferencia
   * @type {number}
   * @minimum 0
   * @example 70000
   */
  total_monthly_cost: number;

  /**
   * Desglose detallado de costos de la transferencia
   * @type {Record<string, any>}
   * @example { old_prorated: 21667, new_prorated: 70000, cleaning_fee: 15000 }
   */
  breakdown: Record<string, any>;
}

// =============================================================================
// CHARGE TYPES
// =============================================================================

/**
 * Campos base de un cargo adicional
 *
 * Define los datos fundamentales de un cargo adicional aplicado a una asignación.
 * Los cargos adicionales pueden ser por limpieza, reparaciones, penalizaciones, etc.
 *
 * @interface AdditionalChargeBase
 *
 * @example
 * ```typescript
 * const charge: AdditionalChargeBase = {
 *   assignment_id: 1,
 *   employee_id: 123,
 *   apartment_id: 1,
 *   charge_type: ChargeType.REPAIR,
 *   description: "Reparación de ventana rota",
 *   amount: 5000,
 *   charge_date: "2025-01-20",
 *   status: ChargeStatus.PENDING,
 *   notes: "Ventana rota por accidente"
 * }
 * ```
 *
 * @see {@link AdditionalChargeCreate}
 * @see {@link AdditionalChargeResponse}
 * @see {@link ChargeType}
 * @see {@link ChargeStatus}
 */
export interface AdditionalChargeBase {
  /**
   * ID de la asignación a la que pertenece el cargo
   * @type {number}
   * @example 1
   */
  assignment_id: number;

  /**
   * ID del empleado al que se le aplica el cargo
   * @type {number}
   * @example 123
   */
  employee_id: number;

  /**
   * ID del apartamento donde ocurrió el cargo
   * @type {number}
   * @example 1
   */
  apartment_id: number;

  /**
   * Tipo de cargo
   * @type {ChargeType}
   * @see {@link ChargeType}
   */
  charge_type: ChargeType;

  /**
   * Descripción detallada del cargo
   * @type {string}
   * @minLength 1
   * @maxLength 500
   * @example "Reparación de ventana rota en habitación principal"
   */
  description: string;

  /**
   * Monto del cargo en yenes
   * @type {number}
   * @minimum 0
   * @example 5000
   */
  amount: number;

  /**
   * Fecha en que se generó el cargo
   * @type {string}
   * @pattern "YYYY-MM-DD"
   * @example "2025-01-20"
   */
  charge_date: string;

  /**
   * Estado del cargo
   * @type {ChargeStatus}
   * @see {@link ChargeStatus}
   */
  status: ChargeStatus;

  /**
   * Notas adicionales sobre el cargo
   * @type {string | null}
   * @example "Ventana rota por accidente durante mudanza"
   */
  notes?: string | null;
}

/**
 * DTO para crear un nuevo cargo adicional
 *
 * Extiende AdditionalChargeBase sin modificaciones. Utilizado en el endpoint POST /charges.
 *
 * @interface AdditionalChargeCreate
 * @extends {AdditionalChargeBase}
 *
 * @example
 * ```typescript
 * const newCharge: AdditionalChargeCreate = {
 *   assignment_id: 1,
 *   employee_id: 123,
 *   apartment_id: 1,
 *   charge_type: ChargeType.CLEANING,
 *   description: "Limpieza profunda al finalizar contrato",
 *   amount: 15000,
 *   charge_date: "2025-06-30",
 *   status: ChargeStatus.PENDING
 * }
 * await api.post('/charges', newCharge)
 * ```
 *
 * @see {@link AdditionalChargeBase}
 * @see {@link AdditionalChargeResponse}
 */
export interface AdditionalChargeCreate extends AdditionalChargeBase {}

/**
 * DTO para actualizar un cargo adicional existente
 *
 * Permite actualizar descripción, monto, estado y notas de un cargo.
 * Utilizado en el endpoint PATCH /charges/{id}.
 *
 * @interface AdditionalChargeUpdate
 *
 * @example
 * ```typescript
 * const update: AdditionalChargeUpdate = {
 *   status: ChargeStatus.APPROVED,
 *   notes: "Aprobado por gerente - cargo justificado"
 * }
 * await api.patch('/charges/1', update)
 * ```
 *
 * @see {@link AdditionalChargeBase}
 */
export interface AdditionalChargeUpdate {
  /**
   * Nueva descripción
   * @type {string}
   * @minLength 1
   * @maxLength 500
   */
  description?: string;

  /**
   * Nuevo monto
   * @type {number}
   * @minimum 0
   */
  amount?: number;

  /**
   * Nuevo estado
   * @type {ChargeStatus}
   */
  status?: ChargeStatus;

  /**
   * Nuevas notas
   * @type {string | null}
   */
  notes?: string | null;
}

/**
 * Respuesta completa de un cargo adicional con información de aprobación
 *
 * Incluye todos los campos de AdditionalChargeBase más ID, timestamps,
 * información de aprobación y datos denormalizados para listados.
 *
 * @interface AdditionalChargeResponse
 * @extends {AdditionalChargeBase}
 *
 * @example
 * ```typescript
 * const charge: AdditionalChargeResponse = {
 *   id: 1,
 *   assignment_id: 1,
 *   employee_id: 123,
 *   apartment_id: 1,
 *   charge_type: ChargeType.REPAIR,
 *   description: "Reparación de ventana rota",
 *   amount: 5000,
 *   charge_date: "2025-01-20",
 *   status: ChargeStatus.APPROVED,
 *   approved_by: 5,
 *   approved_at: "2025-01-21T10:00:00Z",
 *   created_at: "2025-01-20T15:30:00Z",
 *   employee_name: "田中太郎",
 *   apartment_name: "Apartamento Tokyo 101",
 *   approver_name: "佐藤花子"
 * }
 * ```
 *
 * @see {@link AdditionalChargeBase}
 * @see {@link AdditionalChargeCreate}
 */
export interface AdditionalChargeResponse extends AdditionalChargeBase {
  /**
   * ID único del cargo
   * @type {number}
   * @example 1
   */
  id: number;

  /**
   * ID del usuario que aprobó el cargo
   * @type {number | null}
   * @example 5
   */
  approved_by?: number | null;

  /**
   * Fecha y hora de aprobación
   * @type {string | null}
   * @pattern "ISO 8601"
   * @example "2025-01-21T10:00:00Z"
   */
  approved_at?: string | null;

  /**
   * Fecha de creación del cargo
   * @type {string}
   * @pattern "ISO 8601"
   * @example "2025-01-20T15:30:00Z"
   */
  created_at: string;

  /**
   * Fecha de última actualización
   * @type {string | null}
   * @pattern "ISO 8601"
   * @example "2025-01-22T08:15:00Z"
   */
  updated_at?: string | null;

  // === DATOS DENORMALIZADOS ===

  /**
   * Nombre del empleado (denormalizado)
   * @type {string | null}
   * @example "田中太郎"
   */
  employee_name?: string | null;

  /**
   * Nombre del apartamento (denormalizado)
   * @type {string | null}
   * @example "Apartamento Tokyo 101"
   */
  apartment_name?: string | null;

  /**
   * Nombre del aprobador (denormalizado)
   * @type {string | null}
   * @example "佐藤花子"
   */
  approver_name?: string | null;
}

// =============================================================================
// DEDUCTION TYPES
// =============================================================================

/**
 * Campos base de una deducción de renta mensual
 *
 * Define los datos de una deducción que se aplicará al salario del empleado,
 * incluyendo renta base, cargos adicionales y total a deducir.
 *
 * @interface DeductionBase
 *
 * @example
 * ```typescript
 * const deduction: DeductionBase = {
 *   assignment_id: 1,
 *   employee_id: 123,
 *   apartment_id: 1,
 *   year: 2025,
 *   month: 1,
 *   base_rent: 32903,
 *   additional_charges: 0,
 *   total_amount: 32903,
 *   status: DeductionStatus.PENDING,
 *   notes: "Renta prorrateada - ingreso 15 de enero"
 * }
 * ```
 *
 * @see {@link DeductionResponse}
 * @see {@link DeductionStatus}
 */
export interface DeductionBase {
  /**
   * ID de la asignación asociada
   * @type {number}
   * @example 1
   */
  assignment_id: number;

  /**
   * ID del empleado
   * @type {number}
   * @example 123
   */
  employee_id: number;

  /**
   * ID del apartamento
   * @type {number}
   * @example 1
   */
  apartment_id: number;

  /**
   * Año de la deducción
   * @type {number}
   * @minimum 2020
   * @maximum 2100
   * @example 2025
   */
  year: number;

  /**
   * Mes de la deducción (1-12)
   * @type {number}
   * @minimum 1
   * @maximum 12
   * @example 1
   */
  month: number;

  /**
   * Renta base (puede estar prorrateada)
   * @type {number}
   * @minimum 0
   * @example 32903
   */
  base_rent: number;

  /**
   * Suma de cargos adicionales del mes
   * @type {number}
   * @minimum 0
   * @default 0
   * @example 5000
   */
  additional_charges: number;

  /**
   * Monto total a deducir (base_rent + additional_charges)
   * @type {number}
   * @minimum 0
   * @example 37903
   */
  total_amount: number;

  /**
   * Estado de la deducción
   * @type {DeductionStatus}
   * @see {@link DeductionStatus}
   */
  status: DeductionStatus;

  /**
   * Notas sobre la deducción
   * @type {string | null}
   * @example "Renta prorrateada - ingreso 15 de enero"
   */
  notes?: string | null;
}

/**
 * Respuesta completa de una deducción con información de prorrateo
 *
 * Incluye todos los campos de DeductionBase más ID, timestamps,
 * información de prorrateo y datos denormalizados.
 *
 * @interface DeductionResponse
 * @extends {DeductionBase}
 *
 * @example
 * ```typescript
 * const deduction: DeductionResponse = {
 *   id: 1,
 *   assignment_id: 1,
 *   employee_id: 123,
 *   apartment_id: 1,
 *   year: 2025,
 *   month: 1,
 *   base_rent: 32903,
 *   additional_charges: 0,
 *   total_amount: 32903,
 *   status: DeductionStatus.PROCESSED,
 *   days_in_month: 31,
 *   days_occupied: 17,
 *   was_prorated: true,
 *   created_at: "2025-01-15T00:00:00Z",
 *   employee_name: "田中太郎",
 *   apartment_name: "Apartamento Tokyo 101"
 * }
 * ```
 *
 * @see {@link DeductionBase}
 * @see {@link DeductionStatus}
 */
export interface DeductionResponse extends DeductionBase {
  /**
   * ID único de la deducción
   * @type {number}
   * @example 1
   */
  id: number;

  /**
   * Días totales en el mes
   * @type {number}
   * @minimum 28
   * @maximum 31
   * @example 31
   */
  days_in_month: number;

  /**
   * Días efectivamente ocupados en el mes
   * @type {number}
   * @minimum 0
   * @maximum 31
   * @example 17
   */
  days_occupied: number;

  /**
   * Indica si la renta fue prorrateada
   * @type {boolean}
   * @example true
   */
  was_prorated: boolean;

  /**
   * Fecha de creación de la deducción
   * @type {string}
   * @pattern "ISO 8601"
   * @example "2025-01-15T00:00:00Z"
   */
  created_at: string;

  /**
   * Fecha de última actualización
   * @type {string | null}
   * @pattern "ISO 8601"
   * @example "2025-01-20T12:00:00Z"
   */
  updated_at?: string | null;

  // === DATOS DENORMALIZADOS ===

  /**
   * Nombre del empleado (denormalizado)
   * @type {string | null}
   * @example "田中太郎"
   */
  employee_name?: string | null;

  /**
   * Nombre del apartamento (denormalizado)
   * @type {string | null}
   * @example "Apartamento Tokyo 101"
   */
  apartment_name?: string | null;
}

// =============================================================================
// PRORATED CALCULATION TYPES
// =============================================================================

/**
 * Solicitud para calcular renta prorrateada
 *
 * Define los parámetros necesarios para calcular la renta prorrateada
 * de un empleado según las fechas de inicio/fin de ocupación.
 *
 * @interface ProratedCalculationRequest
 *
 * @example
 * ```typescript
 * const request: ProratedCalculationRequest = {
 *   monthly_rent: 60000,
 *   start_date: "2025-01-15",
 *   end_date: null,
 *   year: 2025,
 *   month: 1
 * }
 * const calculation = await api.post('/calculate-prorated', request)
 * ```
 *
 * @see {@link ProratedCalculationResponse}
 */
export interface ProratedCalculationRequest {
  /**
   * Renta mensual completa
   * @type {number}
   * @minimum 0
   * @example 60000
   */
  monthly_rent: number;

  /**
   * Fecha de inicio de ocupación
   * @type {string}
   * @pattern "YYYY-MM-DD"
   * @example "2025-01-15"
   */
  start_date: string;

  /**
   * Fecha de fin de ocupación (null = hasta fin de mes)
   * @type {string | null}
   * @pattern "YYYY-MM-DD"
   * @example "2025-01-31"
   */
  end_date?: string | null;

  /**
   * Año para el cálculo
   * @type {number}
   * @example 2025
   */
  year: number;

  /**
   * Mes para el cálculo (1-12)
   * @type {number}
   * @minimum 1
   * @maximum 12
   * @example 1
   */
  month: number;
}

/**
 * Respuesta con el cálculo de renta prorrateada
 *
 * Incluye el resultado del cálculo con todos los detalles:
 * días del mes, días ocupados, tarifa diaria, renta prorrateada,
 * y la fórmula utilizada para el cálculo.
 *
 * @interface ProratedCalculationResponse
 *
 * @example
 * ```typescript
 * const calculation: ProratedCalculationResponse = {
 *   monthly_rent: 60000,
 *   days_in_month: 31,
 *   days_occupied: 17,
 *   prorated_rent: 32903,
 *   daily_rate: 1935.48,
 *   is_prorated: true,
 *   calculation_formula: "60000 / 31 * 17 = 32903"
 * }
 * ```
 *
 * @see {@link ProratedCalculationRequest}
 */
export interface ProratedCalculationResponse {
  /**
   * Renta mensual completa
   * @type {number}
   * @example 60000
   */
  monthly_rent: number;

  /**
   * Días totales en el mes
   * @type {number}
   * @minimum 28
   * @maximum 31
   * @example 31
   */
  days_in_month: number;

  /**
   * Días efectivamente ocupados
   * @type {number}
   * @minimum 0
   * @maximum 31
   * @example 17
   */
  days_occupied: number;

  /**
   * Renta prorrateada calculada
   * @type {number}
   * @minimum 0
   * @example 32903
   */
  prorated_rent: number;

  /**
   * Tarifa diaria (monthly_rent / days_in_month)
   * @type {number}
   * @minimum 0
   * @example 1935.48
   */
  daily_rate: number;

  /**
   * Indica si se aplicó prorrateo
   * @type {boolean}
   * @example true
   */
  is_prorated: boolean;

  /**
   * Fórmula de cálculo en formato legible
   * @type {string}
   * @example "60000 / 31 * 17 = 32903"
   */
  calculation_formula: string;
}

// =============================================================================
// LIST PARAMS
// =============================================================================

/**
 * Parámetros de consulta para listar apartamentos
 *
 * Define todos los filtros, paginación y ordenamiento disponibles
 * para la consulta de apartamentos. Utilizado en el endpoint GET /apartments.
 *
 * @interface ApartmentListParams
 *
 * @example
 * ```typescript
 * const params: ApartmentListParams = {
 *   page: 1,
 *   page_size: 20,
 *   status: "active",
 *   min_rent: 50000,
 *   max_rent: 100000,
 *   prefecture: "Tokyo",
 *   available_only: true,
 *   sort_by: "base_rent",
 *   sort_order: "asc",
 *   factory_id: 5
 * }
 * const apartments = await api.get('/apartments', { params })
 * ```
 *
 * @see {@link ApartmentResponse}
 * @see {@link ApartmentWithStats}
 */
export interface ApartmentListParams {
  /**
   * Número de página (base 1)
   * @type {number}
   * @minimum 1
   * @default 1
   * @example 1
   */
  page?: number;

  /**
   * Tamaño de página
   * @type {number}
   * @minimum 1
   * @maximum 100
   * @default 20
   * @example 20
   */
  page_size?: number;

  /**
   * Filtrar por estado
   * @type {string}
   * @example "active", "inactive", "maintenance"
   */
  status?: string;

  /**
   * Renta mínima
   * @type {number}
   * @minimum 0
   * @example 50000
   */
  min_rent?: number;

  /**
   * Renta máxima
   * @type {number}
   * @minimum 0
   * @example 100000
   */
  max_rent?: number;

  /**
   * Filtrar por prefectura
   * @type {string}
   * @example "Tokyo", "Osaka"
   */
  prefecture?: string;

  /**
   * Filtrar por ciudad
   * @type {string}
   * @example "Shinjuku", "Yokohama"
   */
  city?: string;

  /**
   * Solo apartamentos disponibles (con espacio)
   * @type {boolean}
   * @default false
   * @example true
   */
  available_only?: boolean;

  /**
   * Búsqueda en nombre, dirección, notas
   * @type {string}
   * @example "Tokyo"
   */
  search?: string;

  /**
   * Campo por el cual ordenar
   * @type {string}
   * @example "base_rent", "created_at", "name"
   */
  sort_by?: string;

  /**
   * Orden ascendente o descendente
   * @type {'asc' | 'desc'}
   * @default "asc"
   * @example "asc"
   */
  sort_order?: 'asc' | 'desc';

  // === FILTROS DE FÁBRICA (NUEVOS) ===

  /**
   * Filtrar por fábrica asociada
   * @type {number}
   * @example 5
   */
  factory_id?: number;

  /**
   * Filtrar por región
   * @type {number}
   * @example 3
   */
  region_id?: number;

  /**
   * Filtrar por zona
   * @type {string}
   * @example "Tokyo-Este"
   */
  zone?: string;

  /**
   * Solo apartamentos con fábrica asociada
   * @type {boolean}
   * @default false
   * @example true
   */
  has_factory?: boolean;
}

/**
 * Parámetros de consulta para listar asignaciones
 *
 * Define todos los filtros, paginación y ordenamiento disponibles
 * para la consulta de asignaciones. Utilizado en el endpoint GET /assignments.
 *
 * @interface AssignmentListParams
 *
 * @example
 * ```typescript
 * const params: AssignmentListParams = {
 *   page: 1,
 *   page_size: 20,
 *   status: AssignmentStatus.ACTIVE,
 *   apartment_id: 1,
 *   start_date_from: "2025-01-01",
 *   sort_by: "start_date",
 *   sort_order: "desc"
 * }
 * const assignments = await api.get('/assignments', { params })
 * ```
 *
 * @see {@link AssignmentResponse}
 * @see {@link AssignmentListItem}
 */
export interface AssignmentListParams {
  /**
   * Número de página (base 1)
   * @type {number}
   * @minimum 1
   * @default 1
   */
  page?: number;

  /**
   * Tamaño de página
   * @type {number}
   * @minimum 1
   * @maximum 100
   * @default 20
   */
  page_size?: number;

  /**
   * Filtrar por apartamento
   * @type {number}
   * @example 1
   */
  apartment_id?: number;

  /**
   * Filtrar por empleado
   * @type {number}
   * @example 123
   */
  employee_id?: number;

  /**
   * Filtrar por estado
   * @type {AssignmentStatus}
   * @see {@link AssignmentStatus}
   */
  status?: AssignmentStatus;

  /**
   * Fecha de inicio desde (inclusive)
   * @type {string}
   * @pattern "YYYY-MM-DD"
   * @example "2025-01-01"
   */
  start_date_from?: string;

  /**
   * Fecha de inicio hasta (inclusive)
   * @type {string}
   * @pattern "YYYY-MM-DD"
   * @example "2025-12-31"
   */
  start_date_to?: string;

  /**
   * Fecha de fin desde (inclusive)
   * @type {string}
   * @pattern "YYYY-MM-DD"
   * @example "2025-01-01"
   */
  end_date_from?: string;

  /**
   * Fecha de fin hasta (inclusive)
   * @type {string}
   * @pattern "YYYY-MM-DD"
   * @example "2025-12-31"
   */
  end_date_to?: string;

  /**
   * Búsqueda en nombres y notas
   * @type {string}
   * @example "Tokyo"
   */
  search?: string;

  /**
   * Campo por el cual ordenar
   * @type {string}
   * @example "start_date", "total_deduction", "created_at"
   */
  sort_by?: string;

  /**
   * Orden ascendente o descendente
   * @type {'asc' | 'desc'}
   * @default "asc"
   */
  sort_order?: 'asc' | 'desc';
}

/**
 * Parámetros de consulta para listar cargos adicionales
 *
 * Define todos los filtros, paginación y ordenamiento disponibles
 * para la consulta de cargos. Utilizado en el endpoint GET /charges.
 *
 * @interface ChargeListParams
 *
 * @example
 * ```typescript
 * const params: ChargeListParams = {
 *   page: 1,
 *   page_size: 20,
 *   charge_type: ChargeType.REPAIR,
 *   status: ChargeStatus.PENDING,
 *   date_from: "2025-01-01",
 *   date_to: "2025-12-31",
 *   sort_by: "charge_date",
 *   sort_order: "desc"
 * }
 * const charges = await api.get('/charges', { params })
 * ```
 *
 * @see {@link AdditionalChargeResponse}
 * @see {@link ChargeType}
 * @see {@link ChargeStatus}
 */
export interface ChargeListParams {
  /**
   * Número de página (base 1)
   * @type {number}
   * @minimum 1
   * @default 1
   */
  page?: number;

  /**
   * Tamaño de página
   * @type {number}
   * @minimum 1
   * @maximum 100
   * @default 20
   */
  page_size?: number;

  /**
   * Filtrar por asignación
   * @type {number}
   * @example 1
   */
  assignment_id?: number;

  /**
   * Filtrar por empleado
   * @type {number}
   * @example 123
   */
  employee_id?: number;

  /**
   * Filtrar por apartamento
   * @type {number}
   * @example 1
   */
  apartment_id?: number;

  /**
   * Filtrar por tipo de cargo
   * @type {ChargeType}
   * @see {@link ChargeType}
   */
  charge_type?: ChargeType;

  /**
   * Filtrar por estado
   * @type {ChargeStatus}
   * @see {@link ChargeStatus}
   */
  status?: ChargeStatus;

  /**
   * Fecha de cargo desde (inclusive)
   * @type {string}
   * @pattern "YYYY-MM-DD"
   * @example "2025-01-01"
   */
  date_from?: string;

  /**
   * Fecha de cargo hasta (inclusive)
   * @type {string}
   * @pattern "YYYY-MM-DD"
   * @example "2025-12-31"
   */
  date_to?: string;

  /**
   * Búsqueda en descripción y notas
   * @type {string}
   * @example "reparación"
   */
  search?: string;

  /**
   * Campo por el cual ordenar
   * @type {string}
   * @example "charge_date", "amount", "created_at"
   */
  sort_by?: string;

  /**
   * Orden ascendente o descendente
   * @type {'asc' | 'desc'}
   * @default "asc"
   */
  sort_order?: 'asc' | 'desc';
}

/**
 * Parámetros de consulta para listar deducciones
 *
 * Define todos los filtros, paginación y ordenamiento disponibles
 * para la consulta de deducciones. Utilizado en el endpoint GET /deductions.
 *
 * @interface DeductionListParams
 *
 * @example
 * ```typescript
 * const params: DeductionListParams = {
 *   page: 1,
 *   page_size: 20,
 *   year: 2025,
 *   month: 1,
 *   status: DeductionStatus.PENDING,
 *   sort_by: "total_amount",
 *   sort_order: "desc"
 * }
 * const deductions = await api.get('/deductions', { params })
 * ```
 *
 * @see {@link DeductionResponse}
 * @see {@link DeductionStatus}
 */
export interface DeductionListParams {
  /**
   * Número de página (base 1)
   * @type {number}
   * @minimum 1
   * @default 1
   */
  page?: number;

  /**
   * Tamaño de página
   * @type {number}
   * @minimum 1
   * @maximum 100
   * @default 20
   */
  page_size?: number;

  /**
   * Filtrar por año
   * @type {number}
   * @minimum 2020
   * @maximum 2100
   * @example 2025
   */
  year?: number;

  /**
   * Filtrar por mes (1-12)
   * @type {number}
   * @minimum 1
   * @maximum 12
   * @example 1
   */
  month?: number;

  /**
   * Filtrar por empleado
   * @type {number}
   * @example 123
   */
  employee_id?: number;

  /**
   * Filtrar por apartamento
   * @type {number}
   * @example 1
   */
  apartment_id?: number;

  /**
   * Filtrar por estado
   * @type {DeductionStatus}
   * @see {@link DeductionStatus}
   */
  status?: DeductionStatus;

  /**
   * Búsqueda en nombres y notas
   * @type {string}
   * @example "Tokyo"
   */
  search?: string;

  /**
   * Campo por el cual ordenar
   * @type {string}
   * @example "year", "month", "total_amount", "created_at"
   */
  sort_by?: string;

  /**
   * Orden ascendente o descendente
   * @type {'asc' | 'desc'}
   * @default "asc"
   */
  sort_order?: 'asc' | 'desc';
}

// =============================================================================
// REPORT TYPES
// =============================================================================

/**
 * Reporte de ocupación de apartamentos
 *
 * Proporciona análisis completo de ocupación incluyendo tasas, tendencias,
 * y detalles por apartamento y estado. Se utiliza en el dashboard de reportes
 * para visualizar disponibilidad y tasas de ocupación en tiempo real.
 *
 * @interface OccupancyReport
 *
 * @example
 * ```typescript
 * const report: OccupancyReport = await apartmentsV2Service.getOccupancyReport('Tokyo')
 * console.log(`Tasa de ocupación: ${report.summary.occupancy_rate}%`)
 * console.log(`Apartamentos ocupados: ${report.summary.occupied_apartments}/${report.summary.total_apartments}`)
 * ```
 *
 * @see {@link ApartmentWithStats} - Estadísticas individuales de apartamentos
 * @see {@link ApartmentResponse} - Estructura base de apartamentos
 * @see {@link AssignmentResponse} - Detalles de asignaciones activas
 */
export interface OccupancyReport {
  /**
   * Resumen general de ocupación
   */
  summary: {
    /** Total de apartamentos */
    total_apartments: number;
    /** Capacidad total (personas) */
    total_capacity: number;
    /** Total de personas ocupando */
    total_occupied: number;
    /** Espacios disponibles */
    available_spaces: number;
    /** Tasa de ocupación actual (%) */
    occupancy_rate: number;
    /** Tasa del periodo anterior (%) */
    previous_period_rate: number;
  };

  /**
   * Detalle por apartamento
   */
  by_apartment: {
    id: number;
    apartment_code: string;
    address: string;
    capacity: number;
    occupied: number;
    occupancy_rate: number;
    status: string;
    monthly_rent: number;
  }[];

  /**
   * Tendencias de ocupación en el tiempo
   */
  trends: {
    date: string;
    occupancy_rate: number;
    occupied_units: number;
    available_units: number;
  }[];

  /**
   * Ocupación agrupada por estado
   */
  by_status: {
    status: string;
    count: number;
    capacity: number;
    occupied: number;
  }[];
}

/**
 * Reporte de pagos pendientes (atrasos)
 *
 * Análisis de deducciones pendientes, tasas de cobranza,
 * y listado de deudores principales. Utilizado para monitorear
 * la salud financiera del sistema de apartamentos y detectar
 * empleados con pagos atrasados.
 *
 * @interface ArrearsReport
 *
 * @example
 * ```typescript
 * const report: ArrearsReport = await apartmentsV2Service.getArrearsReport(2025, 1)
 * console.log(`Tasa de cobranza: ${report.summary.collection_rate}%`)
 * console.log(`Total pendiente: ¥${report.summary.total_pending.toLocaleString()}`)
 * console.log(`Deudores: ${report.summary.total_debtors}`)
 * ```
 *
 * @see {@link DeductionResponse} - Estructura de deducciones individuales
 * @see {@link AssignmentResponse} - Asignaciones relacionadas con deudas
 * @see {@link DeductionListParams} - Parámetros para filtrar deducciones
 */
export interface ArrearsReport {
  /**
   * Resumen de pagos
   */
  summary: {
    /** Total esperado a cobrar */
    total_expected: number;
    /** Total ya pagado */
    total_paid: number;
    /** Total pendiente */
    total_pending: number;
    /** Tasa de cobranza (%) */
    collection_rate: number;
    /** Número de deudores */
    total_debtors: number;
    /** Promedio de deuda por deudor */
    average_debt: number;
  };

  /**
   * Tendencias mensuales de cobranza
   */
  monthly_trends: {
    month: string;
    expected: number;
    paid: number;
    pending: number;
    collection_rate: number;
  }[];

  /**
   * Distribución por estado de pago
   */
  by_status: {
    status: string;
    count: number;
    total_amount: number;
  }[];

  /**
   * Top deudores
   */
  top_debtors: {
    employee_id: number;
    employee_name: string;
    apartment_name: string;
    total_pending: number;
    oldest_pending_date: string;
    pending_months: number;
  }[];

  /**
   * Pendientes agrupados por apartamento
   */
  by_apartment: {
    apartment_id: number;
    apartment_name: string;
    total_pending: number;
    pending_deductions: number;
    latest_payment_date: string;
  }[];
}

/**
 * Reporte de mantenimiento y cargos adicionales
 *
 * Análisis de costos de mantenimiento, distribución por tipo de cargo,
 * y apartamentos con más incidentes. Utilizado para monitorear gastos
 * operativos, identificar patrones de daños, y gestionar presupuestos
 * de mantenimiento preventivo y correctivo.
 *
 * @interface MaintenanceReport
 *
 * @example
 * ```typescript
 * const report: MaintenanceReport = await apartmentsV2Service.getMaintenanceReport('6months', 'repair')
 * console.log(`Costo total: ¥${report.summary.total_cost.toLocaleString()}`)
 * console.log(`Promedio por apto: ¥${report.summary.average_cost_per_apartment.toLocaleString()}`)
 * console.log(`Tipo más común: ${report.summary.most_common_type}`)
 * ```
 *
 * @see {@link AdditionalChargeResponse} - Estructura de cargos individuales
 * @see {@link ApartmentResponse} - Apartamentos relacionados con incidentes
 * @see {@link ChargeListParams} - Parámetros para filtrar cargos
 */
export interface MaintenanceReport {
  /**
   * Resumen de mantenimiento
   */
  summary: {
    /** Total de cargos registrados */
    total_charges: number;
    /** Costo total en yenes */
    total_cost: number;
    /** Costo promedio por apartamento */
    average_cost_per_apartment: number;
    /** Tipo de cargo más común */
    most_common_type: string;
    /** Apartamentos con incidentes */
    apartments_with_issues: number;
  };

  /**
   * Distribución por tipo de cargo
   */
  by_charge_type: {
    charge_type: string;
    count: number;
    total_cost: number;
    average_cost: number;
    percentage: number;
  }[];

  /**
   * Tendencias mensuales de costos
   */
  monthly_trends: {
    month: string;
    total_charges: number;
    total_cost: number;
    cleaning: number;
    repair: number;
    other: number;
  }[];

  /**
   * Top apartamentos con más problemas
   */
  top_apartments: {
    apartment_id: number;
    apartment_name: string;
    total_charges: number;
    total_cost: number;
    most_common_type: string;
    latest_charge_date: string;
  }[];

  /**
   * Incidentes recientes
   */
  recent_incidents: {
    id: number;
    apartment_name: string;
    employee_name: string;
    charge_type: string;
    description: string;
    amount: number;
    charge_date: string;
    status: string;
  }[];
}

/**
 * Reporte de análisis de costos y rentabilidad
 *
 * Análisis financiero completo incluyendo ingresos, gastos, ganancias,
 * y rentabilidad por apartamento. Proporciona métricas clave para evaluar
 * el desempeño financiero del sistema de apartamentos y tomar decisiones
 * estratégicas sobre inversiones y expansión.
 *
 * @interface CostAnalysisReport
 *
 * @example
 * ```typescript
 * const report: CostAnalysisReport = await apartmentsV2Service.getCostAnalysisReport(2025, 1)
 * console.log(`Margen de ganancia: ${report.summary.profit_margin}%`)
 * console.log(`Ganancia neta: ¥${report.summary.net_profit.toLocaleString()}`)
 * console.log(`Ingresos: ¥${report.summary.total_revenue.toLocaleString()}`)
 * console.log(`Gastos: ¥${report.summary.total_expenses.toLocaleString()}`)
 * ```
 *
 * @see {@link ApartmentWithStats} - Estadísticas financieras por apartamento
 * @see {@link DeductionResponse} - Deducciones que generan ingresos
 * @see {@link AdditionalChargeResponse} - Cargos que generan gastos
 */
export interface CostAnalysisReport {
  /**
   * Resumen financiero
   */
  summary: {
    /** Ingresos totales */
    total_revenue: number;
    /** Gastos totales */
    total_expenses: number;
    /** Ganancia neta */
    net_profit: number;
    /** Margen de ganancia (%) */
    profit_margin: number;
    /** Renta promedio */
    average_rent: number;
    /** Ganancia del periodo anterior */
    previous_period_profit: number;
  };

  /**
   * Desglose de ingresos
   */
  revenue_breakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];

  /**
   * Desglose de gastos
   */
  expense_breakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];

  /**
   * Rentabilidad por apartamento
   */
  by_apartment: {
    id: number;
    apartment_code: string;
    address: string;
    revenue: number;
    expenses: number;
    profit: number;
    profit_margin: number;
  }[];

  /**
   * Tendencias financieras mensuales
   */
  monthly_trends: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
}
