import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
if (!ADMIN_EMAIL) {
  console.error("ADMIN_EMAIL no definido en .env.local");
  process.exit(1);
}

// Si ya existe, lo dejamos como está. Sino lo creamos approved.
const existing = await sql`
  SELECT id, status FROM users WHERE email = ${ADMIN_EMAIL}
`;

if (existing.length > 0) {
  console.log(`✓ Admin ya existe (${existing[0].id}, status=${existing[0].status})`);
  if (existing[0].status !== "approved") {
    await sql`
      UPDATE users SET status = 'approved', approved_at = NOW(),
        approved_by_email = ${ADMIN_EMAIL}
      WHERE email = ${ADMIN_EMAIL}
    `;
    console.log("  → Subido a approved.");
  }
} else {
  const result = await sql`
    INSERT INTO users (email, name, status, approved_at, approved_by_email)
    VALUES (${ADMIN_EMAIL}, 'Federico', 'approved', NOW(), ${ADMIN_EMAIL})
    RETURNING id
  `;
  console.log(`✓ Admin creado: ${result[0].id}`);
}
