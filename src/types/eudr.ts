// Types pour le module EUDR Compliance Pack

export type EUDRRole = 
  | "importer" 
  | "exporter" 
  | "producer" 
  | "trader" 
  | "manufacturer" 
  | "retailer";

export type EUDRCommodity = 
  | "wood" 
  | "cocoa" 
  | "coffee" 
  | "soy" 
  | "beef" 
  | "palm_oil" 
  | "rubber"
  | "wood_derived"
  | "cocoa_derived"
  | "coffee_derived"
  | "soy_derived"
  | "beef_derived"
  | "palm_oil_derived"
  | "rubber_derived";

export type LotStatus = 
  | "Draft" 
  | "In Progress" 
  | "Ready for Review" 
  | "Changes Requested" 
  | "Approved" 
  | "Rejected";

export type ChecklistItemStatus = 
  | "Missing" 
  | "Provided" 
  | "Needs Review" 
  | "Accepted" 
  | "Rejected";

export type EvidenceType = 
  | "attestation" 
  | "contract" 
  | "invoice" 
  | "traceability" 
  | "geodata" 
  | "other";

export type UserRole = "client" | "consultant" | "auditor" | "admin";

// 1) EUDR_Assessment
export interface EUDRAssessment {
  id: string;
  dossier_id: string;
  is_in_scope: boolean;
  role_in_supply_chain: EUDRRole[];
  commodities_in_scope: EUDRCommodity[];
  countries_of_origin: string[];
  estimated_volume?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// 2) EUDR_Supplier
export interface EUDRSupplier {
  id: string;
  dossier_id: string;
  name: string;
  country: string;
  contact_email?: string;
  internal_ref?: string;
  risk_notes?: string;
  created_at: string;
}

// 3) EUDR_Lot
export interface EUDRLot {
  id: string;
  dossier_id: string;
  supplier_id: string;
  commodity: EUDRCommodity;
  product_description: string;
  quantity: number;
  unit: string;
  shipment_date: string;
  country_of_origin: string;
  geo_data_type?: "text" | "coordinates" | "file";
  geo_text?: string;
  geo_lat?: number;
  geo_lng?: number;
  no_deforestation_declared: "yes" | "no" | "unknown";
  local_law_compliance_declared: "yes" | "no" | "unknown";
  status: LotStatus;
  assigned_to?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

// 4) EUDR_ChecklistItem
export interface EUDRChecklistItem {
  id: string;
  lot_id: string;
  item_code: string;
  item_label: string;
  requirement_level: "mandatory" | "recommended";
  status: ChecklistItemStatus;
  comment?: string;
  updated_by?: string;
  updated_at: string;
}

// Template checklist items
export const EUDR_CHECKLIST_TEMPLATE: Omit<EUDRChecklistItem, "id" | "lot_id" | "status" | "updated_at">[] = [
  {
    item_code: "EUDR-01",
    item_label: "Commodity confirmed",
    requirement_level: "mandatory"
  },
  {
    item_code: "EUDR-02",
    item_label: "Country of origin provided",
    requirement_level: "mandatory"
  },
  {
    item_code: "EUDR-03",
    item_label: "Supplier identified",
    requirement_level: "mandatory"
  },
  {
    item_code: "EUDR-04",
    item_label: "Geolocation provided (text or coords or attachment)",
    requirement_level: "mandatory"
  },
  {
    item_code: "EUDR-05",
    item_label: "No deforestation after 2020-12-31 declaration",
    requirement_level: "mandatory"
  },
  {
    item_code: "EUDR-06",
    item_label: "Local laws compliance declaration",
    requirement_level: "mandatory"
  },
  {
    item_code: "EUDR-07",
    item_label: "Transaction proof uploaded (invoice/PO)",
    requirement_level: "mandatory"
  },
  {
    item_code: "EUDR-08",
    item_label: "Supplier attestation uploaded",
    requirement_level: "mandatory"
  },
  {
    item_code: "EUDR-09",
    item_label: "Traceability document uploaded (any form)",
    requirement_level: "recommended"
  }
];

// 5) EUDR_Evidence
export interface EUDREvidence {
  id: string;
  lot_id: string;
  evidence_type: EvidenceType;
  file_url?: string;
  file_name?: string;
  link_url?: string;
  title: string;
  description?: string;
  uploaded_by: string;
  uploaded_at: string;
}

// 6) EUDR_AuditLog
export interface EUDRAuditLog {
  id: string;
  entity_type: "Assessment" | "Lot" | "ChecklistItem" | "Evidence" | "Supplier";
  entity_id: string;
  action: "create" | "update" | "status_change" | "comment" | "request_more_info" | "approve" | "reject";
  actor_user_id: string;
  actor_user_name: string;
  timestamp: string;
  details: string;
}

// Helpers pour les labels
export const COMMODITY_LABELS: Record<EUDRCommodity, string> = {
  wood: "Bois",
  cocoa: "Cacao",
  coffee: "Café",
  soy: "Soja",
  beef: "Bœuf",
  palm_oil: "Huile de palme",
  rubber: "Caoutchouc",
  wood_derived: "Dérivé bois",
  cocoa_derived: "Dérivé cacao",
  coffee_derived: "Dérivé café",
  soy_derived: "Dérivé soja",
  beef_derived: "Dérivé bœuf",
  palm_oil_derived: "Dérivé huile de palme",
  rubber_derived: "Dérivé caoutchouc"
};

export const ROLE_LABELS: Record<EUDRRole, string> = {
  importer: "Importateur",
  exporter: "Exportateur",
  producer: "Producteur",
  trader: "Négociant",
  manufacturer: "Fabricant",
  retailer: "Détaillant"
};

export const STATUS_LABELS: Record<LotStatus, string> = {
  "Draft": "Brouillon",
  "In Progress": "En cours",
  "Ready for Review": "Prêt pour revue",
  "Changes Requested": "Modifications demandées",
  "Approved": "Approuvé",
  "Rejected": "Rejeté"
};

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  attestation: "Attestation",
  contract: "Contrat",
  invoice: "Facture",
  traceability: "Traçabilité",
  geodata: "Géolocalisation",
  other: "Autre"
};
