export type Role = 'ADMIN' | 'ENGINEER' | 'VIEWER';

export interface User {
  id?: string;
  username: string;
  fullName: string;
  role: Role;
  token?: string;
}

export type AssetStatus = 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'RETIRED';

export interface Asset {
  id: string;
  assetCode: string;
  name: string;
  department: string;
  manufacturer: string;
  status: AssetStatus;
  serviceIntervalDays: number;
  lastServicedDate: string;
  nextServiceDueDate: string;
  createdAt?: string;
}

export interface AssetRequest {
  assetCode: string;
  name: string;
  department: string;
  manufacturer: string;
  serviceIntervalDays: number;
  status?: AssetStatus;
  lastServicedDate?: string;
}

export interface SparePart {
  id: string;
  partNumber: string;
  name: string;
  stockQuantity: number;
  reorderLevel: number;
  unitCost: number;
  locationBin: string;
}

export interface SparePartRequest {
  partNumber: string;
  name: string;
  stockQuantity: number;
  reorderLevel: number;
  unitCost: number;
  locationBin: string;
}

export type TicketType = 'BREAKDOWN' | 'PREVENTATIVE';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export interface PartUsage {
  partId: string;
  partNumber: string;
  quantityUsed: number;
  unitCostAtTime: number;
}

export interface PartUsageRequest {
  partId: string;
  quantityUsed: number;
}

export interface MaintenanceTicket {
  id: string;
  ticketCode: string;
  assetId: string;
  assetCode: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  issueDescription: string;
  resolutionNotes?: string;
  downtimeMinutes: number;
  partsUsed: PartUsage[];
  openedBy: string;
  openedAt: string;
  closedAt?: string;
}

export interface TicketCreateRequest {
  assetId: string;
  type: TicketType;
  priority: TicketPriority;
  issueDescription: string;
}

export interface TicketCloseRequest {
  resolutionNotes: string;
  downtimeMinutes: number;
  partsUsed: PartUsageRequest[];
}

export interface DowntimeSummaryDTO {
  assetId: string;
  assetCode: string;
  assetName: string;
  totalDowntimeMinutes: number;
  totalDowntimeHours: number;
  breakdownCount: number;
  totalPartsCost: number;
}
