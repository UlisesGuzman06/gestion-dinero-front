import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

const originalFetch = globalThis.fetch;
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const res = await originalFetch(input, init);
  if (res.status === 401) {
    console.warn("API 401 Unauthorized: Logging out...");
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
  return res;
};

// Shadow fetch for all functions below in this file
const fetch = customFetch;

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token || ""}`,
  };
}

export async function getBalance() {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/balance`, { headers });
  return res.json();
}

export async function getIngresos() {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/ingresos`, { headers });
  return res.json();
}

export async function getGastos() {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/gastos`, { headers });
  return res.json();
}

export async function getInversiones() {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/inversiones`, { headers });
  return res.json();
}

export async function createIngreso(data: any) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/ingresos`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear ingreso");
  if (res.status === 204 || res.headers.get("content-length") === "0") return { success: true };
  return res.json();
}

export async function createGasto(data: any) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/gastos`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear gasto");
  if (res.status === 204 || res.headers.get("content-length") === "0") return { success: true };
  return res.json();
}

export async function createInversion(data: any) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/inversiones`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear inversión");
  if (res.status === 204 || res.headers.get("content-length") === "0") return { success: true };
  return res.json();
}

// Funciones de Eliminación
export async function deleteMovement(id: string, type: "ingreso" | "gasto" | "inversion") {
  const endpoint = type === "ingreso" ? "ingresos" : type === "gasto" ? "gastos" : "inversiones";
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/${endpoint}/${id}`, {
    method: "DELETE",
    headers
  });
  
  if (!res.ok) throw new Error("Error al eliminar el movimiento");
  
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return { success: true };
  }
  
  return res.json();
}

// Funciones de Actualización
export async function updateMovement(id: string, type: "ingreso" | "gasto" | "inversion", data: any) {
  const endpoint = type === "ingreso" ? "ingresos" : type === "gasto" ? "gastos" : "inversiones";
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/${endpoint}/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  
  if (!res.ok) throw new Error("Error en la actualización");
  
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return { success: true };
  }
  
  return res.json();
}

// Gastos Fijos
export async function getGastosFijos() {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/gastos-fijos`, { headers });
  return res.json();
}

export async function createGastoFijo(data: any) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/gastos-fijos`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear gasto fijo");
  if (res.status === 204 || res.headers.get("content-length") === "0") return { success: true };
  return res.json();
}

export async function deleteGastoFijo(id: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/gastos-fijos/${id}`, {
    method: "DELETE",
    headers
  });
  
  if (!res.ok) throw new Error("Error al eliminar el gasto fijo");
  
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return { success: true };
  }
  
  return res.json();
}

export async function updateGastoFijo(id: string, data: any) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/gastos-fijos/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  
  if (!res.ok) throw new Error("Error al actualizar el gasto fijo");
  
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return { success: true };
  }
  
  return res.json();
}

// Mercado Pago
export async function createPaymentPreference(title: string, amount: number) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/mercadopago/create-preference`, {
    method: "POST",
    headers,
    body: JSON.stringify({ title, amount }),
  });
  return res.json();
}
export async function getPaymentHistory() {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/mercadopago/transactions`, { headers });
  return res.json();
}

export async function getCotizaciones() {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/cotizaciones`, { headers });
  if (!res.ok) throw new Error("Error al obtener cotizaciones");
  return res.json();
}

export async function processSmartInput(text: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/ia/smart-input`, {
    method: "POST",
    headers,
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Error al procesar con IA");
  }
  return res.json();
}
