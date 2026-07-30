export interface Tank {
  id: string;
  tankName: string;
  fuelType: string;
  capacity: number;
  openingQuantity: number;
}

export interface Product {
  id: string;
  name: string;
  category: 'Fuel' | 'Oil & Lubes';
  unit: string;
  hsnCode: string;
}

export interface Employee {
  id: string;
  name: string;
  employeeCode: string;
  pan: string;
  aadhar: string;
  esicNumber: string;
  pfNumber: string;
  contact: string;
  email: string;
  photo?: string;
  designation?: string;
  joiningDate?: string;
  dateOfTermination?: string;
  status?: 'Active' | 'Inactive';
}

export interface Shift {
  id: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  shiftType: 'Morning' | 'Afternoon' | 'Night';
  description: string;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  phone: string;
  isActive: boolean;
  isLocked?: boolean;
  lastLoginAt?: string;
  lastLoginIp?: string;
  permissionsJson?: string;
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  make: string;
  model: string;
  year: string;
  fuelType: string;
  capacity: string;
  mileage: string;
  color: string;
  chassisNumber: string;
  engineNumber: string;
  insuranceExpiry: string;
  pucExpiry: string;
  status: string;
}

export interface Nozzle {
  id?: string;
  nozzleName: string;
  fuelType: string;
  connectedTank: string;
}

export interface MPD {
  id: string;
  mpdName: string;
  numberOfNozzles: number;
  nozzles: Nozzle[];
}


export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface BaseQueryParams {
  page?: number;
  size?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  status?: string;
}

export interface TankQueryParams extends BaseQueryParams {
  fuelType?: string;
}

export interface ProductQueryParams extends BaseQueryParams {
  category?: string;
}

export interface ShiftQueryParams extends BaseQueryParams {
  shiftType?: string;
}

export interface UserQueryParams extends BaseQueryParams {
  role?: string;
  isActive?: boolean;
}

export interface VehicleQueryParams extends BaseQueryParams {
  vehicleType?: string;
  status?: string;
  expiredInsurance?: boolean;
  expiredPuc?: boolean;
}

export interface MPDQueryParams extends BaseQueryParams {
}

// --- Customer Interfaces ---
export interface CustomerVehicle {
  id?: string;
  vehicleNumber: string;
  vehicleType: string;
  make?: string;
  model?: string;
  color?: string;
  fuelType?: string;
}

export interface Customer {
  id?: string;
  customerCode: string;
  customerName: string;
  contactPerson: string;
  aadharNo: string;
  creditLimit?: string;
  openingBalance?: number;
  creditPeriod?: number;
  creditDate?: string;
  phoneNo?: string;
  mobileNo: string;
  email: string;
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNo?: string;
  panNo?: string;
  cinNo?: string;
  status: 'Active' | 'Inactive';
  vehicles: CustomerVehicle[];
}

export interface CustomerQueryParams extends BaseQueryParams {
}


export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export function formatDateToDMY(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  // Check if it's already in DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  
  // Parse YYYY-MM-DD
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}-${month}-${year}`;
  }
  
  // Fallback: try parsing with standard Date
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (e) {}
  
  return dateStr;
}

// Helper parser for Spring Data Page vs Array
function parsePaginatedResponse<T>(data: any, transformItem: (item: any) => T): PaginatedResponse<T> {
  if (Array.isArray(data)) {
    return {
      content: data.map(transformItem),
      totalPages: 1,
      totalElements: data.length,
      number: 0,
      size: data.length,
    };
  }
  return {
    content: (data.content || []).map(transformItem),
    totalPages: data.totalPages ?? 1,
    totalElements: data.totalElements ?? 0,
    number: data.number ?? 0,
    size: data.size ?? 10,
  };
}

// --- Tank API ---
export async function fetchTanks(params: TankQueryParams = {}): Promise<PaginatedResponse<Tank>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.search) query.set('search', params.search);
  if (params.fuelType && params.fuelType !== 'ALL') query.set('fuelType', params.fuelType);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortDir) query.set('sortDir', params.sortDir);

  const res = await fetch(`${API_BASE_URL}/tanks?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();
  return parsePaginatedResponse(data, (item) => ({
    id: String(item.id),
    tankName: item.tankName,
    fuelType: item.fuelType,
    capacity: Number(item.capacity),
    openingQuantity: Number(item.openingQuantity),
  }));
}

export async function createTankApi(tankData: Omit<Tank, 'id'>): Promise<Tank> {
  const res = await fetch(`${API_BASE_URL}/tanks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tankData),
  });
  if (!res.ok) throw new Error(`Failed to create tank: ${res.statusText}`);
  const data = await res.json();
  return { ...data, id: String(data.id) };
}

export async function updateTankApi(id: string, tankData: Omit<Tank, 'id'>): Promise<Tank> {
  const res = await fetch(`${API_BASE_URL}/tanks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tankData),
  });
  if (!res.ok) throw new Error(`Failed to update tank: ${res.statusText}`);
  const data = await res.json();
  return { ...data, id: String(data.id) };
}

export async function deleteTankApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/tanks/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    let msg = `Failed to delete tank (${res.status})`;
    try { const body = await res.json(); msg = body.message || msg; } catch {}
    throw new Error(msg);
  }
}

// --- Product API ---
export async function fetchProducts(params: ProductQueryParams = {}): Promise<PaginatedResponse<Product>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.search) query.set('search', params.search);
  if (params.category && params.category !== 'ALL') query.set('category', params.category);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortDir) query.set('sortDir', params.sortDir);

  const res = await fetch(`${API_BASE_URL}/products?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();
  return parsePaginatedResponse(data, (item) => ({
    id: String(item.id),
    name: item.name,
    category: item.category as 'Fuel' | 'Oil & Lubes',
    unit: item.unit,
    hsnCode: item.hsnCode,
  }));
}

export async function createProductApi(productData: Omit<Product, 'id'>): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  if (!res.ok) throw new Error(`Failed to create product: ${res.statusText}`);
  const data = await res.json();
  return { ...data, id: String(data.id) };
}

export async function updateProductApi(id: string, productData: Omit<Product, 'id'>): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  if (!res.ok) throw new Error(`Failed to update product: ${res.statusText}`);
  const data = await res.json();
  return { ...data, id: String(data.id) };
}

export async function deleteProductApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete product: ${res.statusText}`);
}

// --- Employee API ---
export async function fetchEmployees(params: BaseQueryParams = {}): Promise<PaginatedResponse<Employee>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.search) query.set('search', params.search);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortDir) query.set('sortDir', params.sortDir);
  if (params.status) query.set('status', params.status);

  const res = await fetch(`${API_BASE_URL}/employees?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();
  return parsePaginatedResponse(data, (item) => ({
    id: String(item.id),
    name: item.name,
    employeeCode: item.employeeCode,
    pan: item.pan,
    aadhar: item.aadhar,
    esicNumber: item.esicNumber,
    pfNumber: item.pfNumber,
    contact: item.contact,
    email: item.email,
    photo: item.photo,
    designation: item.designation,
    joiningDate: item.joiningDate,
    dateOfTermination: item.dateOfTermination,
    status: item.status,
  }));
}

export async function fetchDesignations(): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/employees/designations`);
  if (!res.ok) throw new Error(`Failed to fetch designations: ${res.statusText}`);
  return res.json();
}

export async function fetchNextEmployeeCode(): Promise<{ code: string }> {
  const res = await fetch(`${API_BASE_URL}/employees/next-code`);
  if (!res.ok) throw new Error(`Failed to fetch next employee code: ${res.statusText}`);
  return res.json();
}

export async function createEmployeeApi(employeeData: Omit<Employee, 'id'>): Promise<Employee> {
  const res = await fetch(`${API_BASE_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employeeData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to create employee: ${res.statusText}`);
  }
  const data = await res.json();
  return { ...data, id: String(data.id) };
}

export async function updateEmployeeApi(id: string, employeeData: Omit<Employee, 'id'>): Promise<Employee> {
  const res = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employeeData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to update employee: ${res.statusText}`);
  }
  const data = await res.json();
  return { ...data, id: String(data.id) };
}

export async function deleteEmployeeApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/employees/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete employee: ${res.statusText}`);
}

// --- Shift API ---
export async function fetchShifts(params: ShiftQueryParams = {}): Promise<PaginatedResponse<Shift>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.search) query.set('search', params.search);
  if (params.shiftType && params.shiftType !== 'ALL') query.set('shiftType', params.shiftType);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortDir) query.set('sortDir', params.sortDir);

  const res = await fetch(`${API_BASE_URL}/shifts?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();
  return parsePaginatedResponse(data, (item) => ({
    id: String(item.id),
    shiftName: item.shiftName,
    startTime: item.startTime,
    endTime: item.endTime,
    shiftType: item.shiftType as 'Morning' | 'Afternoon' | 'Night',
    description: item.description,
  }));
}

export async function createShiftApi(shiftData: Omit<Shift, 'id'>): Promise<Shift> {
  const res = await fetch(`${API_BASE_URL}/shifts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shiftData),
  });
  if (!res.ok) throw new Error(`Failed to create shift: ${res.statusText}`);
  const data = await res.json();
  return { ...data, id: String(data.id) };
}

export async function updateShiftApi(id: string, shiftData: Omit<Shift, 'id'>): Promise<Shift> {
  const res = await fetch(`${API_BASE_URL}/shifts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shiftData),
  });
  if (!res.ok) throw new Error(`Failed to update shift: ${res.statusText}`);
  const data = await res.json();
  return { ...data, id: String(data.id) };
}

export async function deleteShiftApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/shifts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete shift: ${res.statusText}`);
}

// --- User API ---
export async function fetchUsers(params: UserQueryParams = {}): Promise<PaginatedResponse<UserAccount>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.search) query.set('search', params.search);
  if (params.role && params.role !== 'ALL') query.set('role', params.role);
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortDir) query.set('sortDir', params.sortDir);

  const res = await fetch(`${API_BASE_URL}/users?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();
  return parsePaginatedResponse(data, (item) => ({
    id: String(item.id),
    name: item.name,
    username: item.username,
    email: item.email,
    role: item.role,
    phone: item.phone,
    isActive: Boolean(item.isActive),
    isLocked: Boolean(item.isLocked),
    lastLoginAt: item.lastLoginAt || null,
    lastLoginIp: item.lastLoginIp || null,
    permissionsJson: item.permissionsJson,
  }));
}

export async function createUserApi(userData: Omit<UserAccount, 'id'>): Promise<UserAccount> {
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to create user: ${res.statusText}`);
  }
  const data = await res.json();
  return { ...data, id: String(data.id) };
}

export async function updateUserApi(id: string, userData: Omit<UserAccount, 'id'>): Promise<UserAccount> {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to update user: ${res.statusText}`);
  }
  const data = await res.json();
  return { ...data, id: String(data.id) };
}

export async function deleteUserApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete user: ${res.statusText}`);
}

export async function toggleUserLockApi(id: string): Promise<UserAccount> {
  const res = await fetch(`${API_BASE_URL}/users/${id}/toggle-lock`, { method: 'PATCH' });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to toggle lock: ${res.statusText}`);
  }
  const data = await res.json();
  return { ...data, id: String(data.id) };
}

export async function resetUserPasswordApi(id: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/users/${id}/reset-password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to reset password: ${res.statusText}`);
  }
}

// --- Vehicle API ---
export async function fetchVehicles(params: VehicleQueryParams = {}): Promise<PaginatedResponse<Vehicle>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.search) query.set('search', params.search);
  if (params.vehicleType && params.vehicleType !== 'ALL') query.set('vehicleType', params.vehicleType);
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.expiredInsurance !== undefined) query.set('expiredInsurance', String(params.expiredInsurance));
  if (params.expiredPuc !== undefined) query.set('expiredPuc', String(params.expiredPuc));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortDir) query.set('sortDir', params.sortDir);

  const res = await fetch(`${API_BASE_URL}/vehicles?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();
  return parsePaginatedResponse(data, (item) => ({
    id: String(item.id),
    vehicleNumber: item.vehicleNumber,
    vehicleType: item.vehicleType,
    make: item.make,
    model: item.model,
    year: item.year,
    fuelType: item.fuelType,
    capacity: item.capacity,
    mileage: item.mileage,
    color: item.color,
    chassisNumber: item.chassisNumber,
    engineNumber: item.engineNumber,
    insuranceExpiry: item.insuranceExpiry,
    pucExpiry: item.pucExpiry,
    status: item.status,
  }));
}

export async function createVehicleApi(vehicleData: Omit<Vehicle, 'id'>): Promise<Vehicle> {
  const res = await fetch(`${API_BASE_URL}/vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vehicleData),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to create vehicle: ${res.statusText}`);
  }
  const data = await res.json();
  return { ...data, id: String(data.id) };
}

export async function updateVehicleApi(id: string, vehicleData: Omit<Vehicle, 'id'>): Promise<Vehicle> {
  const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vehicleData),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to update vehicle: ${res.statusText}`);
  }
  const data = await res.json();
  return { ...data, id: String(data.id) };
}

export async function deleteVehicleApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete vehicle: ${res.statusText}`);
}

// --- MPD API ---
export async function fetchMpds(params: MPDQueryParams = {}): Promise<PaginatedResponse<MPD>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.search) query.set('search', params.search);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortDir) query.set('sortDir', params.sortDir);

  const res = await fetch(`${API_BASE_URL}/mpds?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();
  return parsePaginatedResponse(data, (item) => ({
    id: String(item.id),
    mpdName: item.mpdName,
    numberOfNozzles: Number(item.numberOfNozzles),
    nozzles: (item.nozzles || []).map((n: any) => ({
      id: String(n.id),
      nozzleName: n.nozzleName,
      fuelType: n.fuelType,
      connectedTank: n.connectedTank
    }))
  }));
}

export async function fetchMpdsAll(): Promise<MPD[]> {
  const res = await fetch(`${API_BASE_URL}/mpds/all`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();
  return (data || []).map((item: any) => ({
    id: String(item.id),
    mpdName: item.mpdName,
    numberOfNozzles: Number(item.numberOfNozzles),
    nozzles: (item.nozzles || []).map((n: any) => ({
      id: String(n.id),
      nozzleName: n.nozzleName,
      fuelType: n.fuelType,
      connectedTank: n.connectedTank
    }))
  }));
}

export async function createMpdApi(mpdData: Omit<MPD, 'id'>): Promise<MPD> {
  const res = await fetch(`${API_BASE_URL}/mpds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mpdData),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to create MPD: ${res.statusText}`);
  }
  const data = await res.json();
  return {
    ...data,
    id: String(data.id),
    nozzles: (data.nozzles || []).map((n: any) => ({ ...n, id: String(n.id) }))
  };
}

export async function updateMpdApi(id: string, mpdData: Omit<MPD, 'id'>): Promise<MPD> {
  const res = await fetch(`${API_BASE_URL}/mpds/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mpdData),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to update MPD: ${res.statusText}`);
  }
  const data = await res.json();
  return {
    ...data,
    id: String(data.id),
    nozzles: (data.nozzles || []).map((n: any) => ({ ...n, id: String(n.id) }))
  };
}

export async function deleteMpdApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/mpds/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete MPD: ${res.statusText}`);
}


// --- Shift Master API ---
export interface ShiftMaster {
  id: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  description?: string;
}

export async function fetchShiftsAll(): Promise<ShiftMaster[]> {
  const res = await fetch(`${API_BASE_URL}/shifts/all`);
  if (!res.ok) throw new Error(`Failed to fetch shift master: ${res.statusText}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((item: any) => ({
    id: String(item.id),
    shiftName: item.shiftName,
    startTime: item.startTime,
    endTime: item.endTime,
    shiftType: item.shiftType,
    description: item.description
  }));
}


// --- Employee Assignment API ---
export interface EmployeeAssignment {
  id: string;
  assignDate: string;
  shiftId: string;
  shiftName: string;
  shiftType: string;
  mpdId: string;
  mpdName: string;
  nozzleId: string;
  nozzleName: string;
  fuelType: string;
  employeeId: string | null;
  employeeName: string | null;
  employeeCode: string | null;
  employeeDesignation: string | null;
  employeePhoto: string | null;
  status: string;
  createdAt: string;
}

export interface AssignmentHistoryParams {
  fromDate: string;
  toDate: string;
  shiftId?: string;
  page?: number;
  size?: number;
}

export interface NozzleAssignmentPayload {
  mpdId: string;
  mpdName: string;
  nozzleId: string;
  nozzleName: string;
  fuelType: string;
  employeeId: string | null;
  status?: string;
}

export async function fetchEmployeeAssignments(date: string, shiftId: string): Promise<EmployeeAssignment[]> {
  const res = await fetch(`${API_BASE_URL}/employee-assignments?date=${date}&shiftId=${shiftId}`);
  if (!res.ok) throw new Error(`Failed to fetch assignments: ${res.statusText}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((item: any) => ({
    id: String(item.id),
    assignDate: item.assignDate,
    shiftId: String(item.shiftId),
    shiftName: item.shiftName,
    shiftType: item.shiftType,
    mpdId: item.mpdId,
    mpdName: item.mpdName,
    nozzleId: item.nozzleId,
    nozzleName: item.nozzleName,
    fuelType: item.fuelType,
    employeeId: item.employeeId ? String(item.employeeId) : null,
    employeeName: item.employeeName,
    employeeCode: item.employeeCode,
    employeeDesignation: item.employeeDesignation,
    employeePhoto: item.employeePhoto,
    status: item.status || 'Active',
    createdAt: item.createdAt,
  }));
}

export async function saveEmployeeAssignments(
  date: string,
  shiftId: string,
  assignments: NozzleAssignmentPayload[]
): Promise<EmployeeAssignment[]> {
  const res = await fetch(`${API_BASE_URL}/employee-assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, shiftId, assignments }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to save assignments: ${res.statusText}`);
  }
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((item: any) => ({
    id: String(item.id),
    assignDate: item.assignDate,
    shiftId: String(item.shiftId),
    shiftName: item.shiftName,
    shiftType: item.shiftType,
    mpdId: item.mpdId,
    mpdName: item.mpdName,
    nozzleId: item.nozzleId,
    nozzleName: item.nozzleName,
    fuelType: item.fuelType,
    employeeId: item.employeeId ? String(item.employeeId) : null,
    employeeName: item.employeeName,
    employeeCode: item.employeeCode,
    employeeDesignation: item.employeeDesignation,
    employeePhoto: item.employeePhoto,
    status: item.status || 'Active',
    createdAt: item.createdAt,
  }));
}

export async function fetchAssignmentHistory(
  params: AssignmentHistoryParams
): Promise<PaginatedResponse<EmployeeAssignment>> {
  const query = new URLSearchParams();
  query.set('fromDate', params.fromDate);
  query.set('toDate', params.toDate);
  if (params.shiftId) query.set('shiftId', params.shiftId);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));

  const res = await fetch(`${API_BASE_URL}/employee-assignments/history?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch assignment history: ${res.statusText}`);
  const data = await res.json();
  return parsePaginatedResponse(data, (item: any) => ({
    id: String(item.id),
    assignDate: item.assignDate,
    shiftId: String(item.shiftId),
    shiftName: item.shiftName,
    shiftType: item.shiftType,
    mpdId: item.mpdId,
    mpdName: item.mpdName,
    nozzleId: item.nozzleId,
    nozzleName: item.nozzleName,
    fuelType: item.fuelType,
    employeeId: item.employeeId ? String(item.employeeId) : null,
    employeeName: item.employeeName,
    employeeCode: item.employeeCode,
    employeeDesignation: item.employeeDesignation,
    employeePhoto: item.employeePhoto,
    status: item.status || 'Active',
    createdAt: item.createdAt,
  }));
}

export async function checkAssignmentConflict(
  date: string,
  shiftId: string,
  employeeId: string,
  mpdId: string
): Promise<boolean> {
  const query = new URLSearchParams({ date, shiftId, employeeId, mpdId });
  const res = await fetch(`${API_BASE_URL}/employee-assignments/conflict-check?${query.toString()}`);
  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data.conflict);
}

// --- Cash Collection Interfaces ---
export interface CashCollectionRecord {
  id: string;
  date: string;
  shift?: string;
  employeeId: string;
  employeeName: string;
  mpdId: string;
  mpdName: string;
  depositTime: string;
  depositAmount: number;
  status: 'Pending' | 'Completed' | 'Verified';
  notes500: number;
  notes200: number;
  notes100: number;
  notes50: number;
  notes20: number;
  notes10: number;
  coins: number;
  createdAt?: string;
}

export interface CashCollectionStats {
  totalAmount: number;
  totalEntries: number;
  verifiedCount: number;
  avgCollection: number;
}

export interface CashCollectionQueryParams extends BaseQueryParams {
  shift?: string;
  fromDate?: string;
  toDate?: string;
}

// --- Cash Collection API ---
export async function fetchCashCollections(
  params: CashCollectionQueryParams = {}
): Promise<PaginatedResponse<CashCollectionRecord>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.shift && params.shift !== 'ALL') query.set('shift', params.shift);
  if (params.fromDate) query.set('fromDate', params.fromDate);
  if (params.toDate) query.set('toDate', params.toDate);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortDir) query.set('sortDir', params.sortDir);

  const res = await fetch(`${API_BASE_URL}/cash-collections?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch cash collections: ${res.statusText}`);
  const data = await res.json();
  return parsePaginatedResponse(data, (item: any) => ({
    id: String(item.id),
    date: item.date,
    shift: item.shift || 'Morning Shift (06:00-14:00)',
    employeeId: String(item.employeeId),
    employeeName: item.employeeName,
    mpdId: item.mpdId,
    mpdName: item.mpdName,
    depositTime: item.depositTime,
    depositAmount: Number(item.depositAmount),
    status: item.status,
    notes500: Number(item.notes500 || 0),
    notes200: Number(item.notes200 || 0),
    notes100: Number(item.notes100 || 0),
    notes50: Number(item.notes50 || 0),
    notes20: Number(item.notes20 || 0),
    notes10: Number(item.notes10 || 0),
    coins: Number(item.coins || 0),
    createdAt: item.createdAt,
  }));
}

export async function fetchCashCollectionStats(
  params: { search?: string; status?: string; shift?: string; fromDate?: string; toDate?: string } = {}
): Promise<CashCollectionStats> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.shift && params.shift !== 'ALL') query.set('shift', params.shift);
  if (params.fromDate) query.set('fromDate', params.fromDate);
  if (params.toDate) query.set('toDate', params.toDate);

  const res = await fetch(`${API_BASE_URL}/cash-collections/stats?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch cash collection stats: ${res.statusText}`);
  return await res.json();
}

export async function fetchCashCollectionById(id: string): Promise<CashCollectionRecord> {
  const res = await fetch(`${API_BASE_URL}/cash-collections/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch cash collection detail: ${res.statusText}`);
  const item = await res.json();
  return {
    id: String(item.id),
    date: item.date,
    employeeId: String(item.employeeId),
    employeeName: item.employeeName,
    mpdId: item.mpdId,
    mpdName: item.mpdName,
    depositTime: item.depositTime,
    depositAmount: Number(item.depositAmount),
    status: item.status,
    notes500: Number(item.notes500 || 0),
    notes200: Number(item.notes200 || 0),
    notes100: Number(item.notes100 || 0),
    notes50: Number(item.notes50 || 0),
    notes20: Number(item.notes20 || 0),
    notes10: Number(item.notes10 || 0),
    coins: Number(item.coins || 0),
    createdAt: item.createdAt,
  };
}

export async function createCashCollection(payload: Omit<CashCollectionRecord, 'id'>): Promise<CashCollectionRecord> {
  const res = await fetch(`${API_BASE_URL}/cash-collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create cash collection: ${res.statusText}`);
  const item = await res.json();
  return { ...item, id: String(item.id) };
}

export async function updateCashCollection(id: string, payload: Omit<CashCollectionRecord, 'id'>): Promise<CashCollectionRecord> {
  const res = await fetch(`${API_BASE_URL}/cash-collections/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update cash collection: ${res.statusText}`);
  const item = await res.json();
  return { ...item, id: String(item.id) };
}

export async function deleteCashCollection(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/cash-collections/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete cash collection: ${res.statusText}`);
}

// --- Customer API ---
export async function fetchCustomers(
  params: CustomerQueryParams = {}
): Promise<PaginatedResponse<Customer>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortDir) query.set('sortDir', params.sortDir);

  const res = await fetch(`${API_BASE_URL}/customers?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch customers: ${res.statusText}`);
  const data = await res.json();
  return parsePaginatedResponse(data, (item: any) => ({
    id: String(item.id),
    customerCode: item.customerCode,
    customerName: item.customerName,
    contactPerson: item.contactPerson,
    aadharNo: item.aadharNo,
    creditLimit: item.creditLimit,
    openingBalance: Number(item.openingBalance || 0),
    creditPeriod: Number(item.creditPeriod || 0),
    creditDate: item.creditDate,
    phoneNo: item.phoneNo,
    mobileNo: item.mobileNo,
    email: item.email,
    address: item.address,
    area: item.area,
    city: item.city,
    state: item.state,
    pincode: item.pincode,
    gstNo: item.gstNo,
    panNo: item.panNo,
    cinNo: item.cinNo,
    status: item.status,
    vehicles: (item.vehicles || []).map((v: any) => ({
      id: String(v.id),
      vehicleNumber: v.vehicleNumber,
      vehicleType: v.vehicleType,
      make: v.make,
      model: v.model,
      color: v.color,
      fuelType: v.fuelType,
    })),
  }));
}

export async function fetchCustomerById(id: string): Promise<Customer> {
  const res = await fetch(`${API_BASE_URL}/customers/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch customer: ${res.statusText}`);
  const item = await res.json();
  return {
    id: String(item.id),
    customerCode: item.customerCode,
    customerName: item.customerName,
    contactPerson: item.contactPerson,
    aadharNo: item.aadharNo,
    creditLimit: item.creditLimit,
    openingBalance: Number(item.openingBalance || 0),
    creditPeriod: Number(item.creditPeriod || 0),
    creditDate: item.creditDate,
    phoneNo: item.phoneNo,
    mobileNo: item.mobileNo,
    email: item.email,
    address: item.address,
    area: item.area,
    city: item.city,
    state: item.state,
    pincode: item.pincode,
    gstNo: item.gstNo,
    panNo: item.panNo,
    cinNo: item.cinNo,
    status: item.status,
    vehicles: (item.vehicles || []).map((v: any) => ({
      id: String(v.id),
      vehicleNumber: v.vehicleNumber,
      vehicleType: v.vehicleType,
      make: v.make,
      model: v.model,
      color: v.color,
      fuelType: v.fuelType,
    })),
  };
}

export async function createCustomer(payload: Omit<Customer, 'id' | 'customerCode'>): Promise<Customer> {
  const res = await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create customer: ${res.statusText}`);
  }
  const item = await res.json();
  return { ...item, id: String(item.id) };
}

export async function updateCustomer(id: string, payload: Omit<Customer, 'id' | 'customerCode'>): Promise<Customer> {
  const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update customer: ${res.statusText}`);
  }
  const item = await res.json();
  return { ...item, id: String(item.id) };
}

export async function deleteCustomer(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete customer: ${res.statusText}`);
}

export async function fetchNextCustomerCode(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/customers/next-code`);
  if (!res.ok) throw new Error(`Failed to fetch next customer code: ${res.statusText}`);
  const data = await res.json();
  return data.code;
}
