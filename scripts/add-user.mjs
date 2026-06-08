import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);

// Usage: node scripts/add-user.mjs <email> [name]
const rawEmail = process.argv[2];
if (!rawEmail) {
  console.error("Falta el email. Uso: node scripts/add-user.mjs <email> [name]");
  process.exit(1);
}

// Google entrega el email en minúsculas; normalizamos para que matchee en el login.
const email = rawEmail.trim().toLowerCase();
const name = process.argv[3] ?? email.split("@")[0];
const approver = process.env.ADMIN_EMAIL ?? "admin";

const existing = await sql`SELECT id, status FROM users WHERE email = ${email}`;

if (existing.length > 0) {
  console.log(`✓ Usuario ya existe (${existing[0].id}, status=${existing[0].status})`);
  if (existing[0].status !== "approved") {
    await sql`
      UPDATE users SET status = 'approved', approved_at = NOW(),
        approved_by_email = ${approver}
      WHERE email = ${email}
    `;
    console.log("  → Subido a approved.");
  }
} else {
  const result = await sql`
    INSERT INTO users (email, name, status, approved_at, approved_by_email)
    VALUES (${email}, ${name}, 'approved', NOW(), ${approver})
    RETURNING id
  `;
  console.log(`✓ Usuario creado: ${result[0].id} (${email}, approved)`);
}
