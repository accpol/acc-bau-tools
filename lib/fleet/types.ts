export type Language = "pl" | "en" | "de";
export type FleetRole = "admin" | "worker";
export interface FleetMember { id: string; name: string; role: FleetRole; active: boolean; auth_version: number }
export type VehicleStatus = "available" | "in_use" | "service" | "out_of_service" | "sold";
export type PlanKind = "inspection" | "insurance" | "udt" | "oil" | "oil_filter" | "air_filter" | "cabin_filter" | "fuel_filter" | "timing_belt" | "brake_fluid" | "tyres" | "tachograph" | "extinguisher" | "other";
export interface ServicePlan {
  id: string; kind: PlanKind; label: string; dueDate: string | null; dueMileage: number | null;
  intervalMonths: number | null; intervalKm: number | null; warnDays: number; warnKm: number;
  lastDoneDate: string | null; lastDoneMileage: number | null; notes: string; archived: boolean;
}
export type ComplianceKind = "registration" | "insurance" | "inspection" | "udt";
export type ComplianceRequirement = "required" | "not_required";
/** Optional JSON extension. Old vehicles need no migration or initialization write. */
export interface ComplianceRecord {
  requirement?: ComplianceRequirement;
  reason?: string;
  planId?: string;
  fileIds?: string[];
  documentDueDate?: string | null;
  updatedBy?: string;
  updatedAt?: string;
}
export interface VehicleCompliance {
  responsible?: string;
  udtNumber?: string;
  registration?: ComplianceRecord;
  insurance?: ComplianceRecord;
  inspection?: ComplianceRecord;
  udt?: ComplianceRecord;
}
export interface VehicleData {
  plate: string; name: string; make: string; model: string; vin: string; year: string;
  category: string; country: string; fuel: string; transmission: string; company: string;
  ownership: string; firstRegistration: string; purchaseDate: string; purchasePrice: string;
  purchaseCurrency: string; leasingUntil: string; policyNumber: string; insurer: string;
  assistancePhone: string; engine: string; power: string; maxMass: string; payload: string;
  seats: string; tyreSize: string; project: string; location: string; notes: string;
  coverFileId: string; status: VehicleStatus; driver: string; mileage: number | null; mileageDate: string | null;
  archived: boolean; archivedAt: string | null; plans: ServicePlan[]; openDefects: number;
  compliance?: VehicleCompliance;
}
export interface Vehicle { id: string; data: VehicleData; version: number; created_at: string; updated_at: string }
export type EventKind = "created" | "updated" | "mileage" | "assignment" | "service" | "repair" | "inspection" | "defect" | "defect_closed" | "plan_added" | "plan_updated" | "plan_archived" | "archived" | "restored" | "document" | "documents_added" | "mileage_correction";
export interface FleetEventData {
  title: string; notes: string; mileage?: number | null; workshop?: string; invoiceNumber?: string;
  cost?: number | null; currency?: string; costBasis?: "net" | "gross";
  from?: string; to?: string; driver?: string; priority?: "low" | "normal" | "urgent";
  resolvedId?: string; correctedId?: string; correctedMileage?: number; reason?: string;
  relatedEventId?: string; previousPlan?: ServicePlan; completedPlans?: string[]; fileIds?: string[]; plan?: ServicePlan; changedFields?: string[];
  before?: Partial<VehicleData>; after?: Partial<VehicleData>;
  complianceKind?: ComplianceKind; documentIds?: string[]; previousDueDate?: string | null; dueDate?: string | null;
}
export interface FleetEvent { id: string; vehicle_id: string; kind: EventKind; happened_on: string; data: FleetEventData; created_by: string; created_at: string }
export type FileCategory = "photo" | "invoice" | "document";
export interface FleetFile { id: string; vehicle_id: string; event_id: string | null; name: string; mime: string; size: number; category: FileCategory; state: "pending" | "ready"; created_by: string; created_at: string }
export interface VehicleDetail { vehicle: Vehicle; events: FleetEvent[]; files: FleetFile[] }
export interface FleetCommand {
  commandId: string; vehicleId: string; expectedVersion: number; type: string;
  payload: Record<string, unknown>; fileIds?: string[];
}
export interface PreparedCommand { data: VehicleData; event: { kind: EventKind; happened_on: string; data: FleetEventData } }
export interface PlanAlert { plan: ServicePlan; severity: "overdue" | "soon" | "ok" | "missing"; days: number | null; km: number | null }
