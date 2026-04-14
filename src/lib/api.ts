const API_URL = "http://localhost:8002";

export async function getBalance() {
  const res = await fetch(`${API_URL}/balance`);
  return res.json();
}

export async function getIngresos() {
  const res = await fetch(`${API_URL}/ingresos`);
  return res.json();
}

export async function getGastos() {
  const res = await fetch(`${API_URL}/gastos`);
  return res.json();
}

export async function getInversiones() {
  const res = await fetch(`${API_URL}/inversiones`);
  return res.json();
}

export async function createIngreso(data: any) {
  const res = await fetch(`${API_URL}/ingresos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear ingreso");
  if (res.status === 204 || res.headers.get("content-length") === "0") return { success: true };
  return res.json();
}

export async function createGasto(data: any) {
  const res = await fetch(`${API_URL}/gastos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear gasto");
  if (res.status === 204 || res.headers.get("content-length") === "0") return { success: true };
  return res.json();
}

export async function createInversion(data: any) {
  const res = await fetch(`${API_URL}/inversiones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear inversión");
  if (res.status === 204 || res.headers.get("content-length") === "0") return { success: true };
  return res.json();
}

// Funciones de Eliminación
export async function deleteMovement(id: string, type: "ingreso" | "gasto" | "inversion") {
  const endpoint = type === "ingreso" ? "ingresos" : type === "gasto" ? "gastos" : "inversiones";
  const res = await fetch(`${API_URL}/${endpoint}/${id}`, {
    method: "DELETE",
  });
  
  if (!res.ok) throw new Error("Error al eliminar el movimiento");
  
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return { success: true };
  }
  
  return res.json();
}

// Funciones de Actualización (Opcional por ahora, pero implementada la base)
export async function updateMovement(id: string, type: "ingreso" | "gasto" | "inversion", data: any) {
  const endpoint = type === "ingreso" ? "ingresos" : type === "gasto" ? "gastos" : "inversiones";
  const res = await fetch(`${API_URL}/${endpoint}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) throw new Error("Error en la actualización");
  
  // Si no hay contenido, no intentamos parsear JSON
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return { success: true };
  }
  
  return res.json();
}

// Gastos Fijos
export async function getGastosFijos() {
  const res = await fetch(`${API_URL}/gastos-fijos`);
  return res.json();
}

export async function createGastoFijo(data: any) {
  const res = await fetch(`${API_URL}/gastos-fijos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear gasto fijo");
  if (res.status === 204 || res.headers.get("content-length") === "0") return { success: true };
  return res.json();
}

export async function deleteGastoFijo(id: string) {
  const res = await fetch(`${API_URL}/gastos-fijos/${id}`, {
    method: "DELETE",
  });
  
  if (!res.ok) throw new Error("Error al eliminar el gasto fijo");
  
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return { success: true };
  }
  
  return res.json();
}

export async function updateGastoFijo(id: string, data: any) {
  const res = await fetch(`${API_URL}/gastos-fijos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${API_URL}/mercadopago/create-preference`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, amount }),
  });
  return res.json();
}
