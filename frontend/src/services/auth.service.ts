const API = (import.meta.env.VITE_API_URL || "http://localhost:3001") + "/api";

export type LoginResponse = {
  token: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    role: string;
    roleLabel: string;
  };
};

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();

  if (!res.ok || !json?.ok) {
    throw new Error(json?.mensaje || "No se pudo iniciar sesiÃ³n.");
  }

  return json.data;
}

export async function meRequest(token: string) {
  const res = await fetch(`${API}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (!res.ok || !json?.ok) {
    throw new Error(json?.mensaje || "No se pudo validar la sesiÃ³n.");
  }

  return json.data;
}

