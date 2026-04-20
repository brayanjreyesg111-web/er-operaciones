import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "er_operaciones_secret_dev";

type JwtPayload = {
  userId: number;
  role: string;
  email: string;
};

function normalizarRol(nombreRol: string) {
  const txt = String(nombreRol || "").trim().toUpperCase().replace(/\s+/g, "_");

  if (txt.includes("FINAN")) return "ADMINISTRATIVO_FINANZAS";
  if (txt.includes("CLIENT")) return "CLIENTE";
  if (txt.includes("SUPER")) return "SUPERVISOR";
  if (txt.includes("TEC")) return "TECNICO";
  if (txt.includes("ADMIN")) return "ADMINISTRADOR";

  return txt;
}

export async function loginService(email: string, password: string) {
  const usuario = await prisma.user.findFirst({
    where: { email: email.trim().toLowerCase(), activo: true },
    include: { role: true },
  });

  if (!usuario) {
    throw new Error("Usuario o contraseña incorrectos.");
  }

  const passwordOk = await bcrypt.compare(password, usuario.passwordHash).catch(() => false);

  if (!passwordOk) {
    throw new Error("Usuario o contraseña incorrectos.");
  }

  const role = normalizarRol(usuario.role.nombre);

  const token = jwt.sign(
    { userId: usuario.id, role, email: usuario.email } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: "12h" }
  );

  return {
    token,
    user: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      role,
      roleLabel: usuario.role.nombre,
    },
  };
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
