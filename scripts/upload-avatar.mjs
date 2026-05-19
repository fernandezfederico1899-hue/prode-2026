// Sube un archivo local como avatar del admin user en Vercel Blob.
// Uso: node scripts/upload-avatar.mjs <path-al-archivo> [email]

import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const filePath = process.argv[2];
const email = process.argv[3] ?? process.env.ADMIN_EMAIL;

if (!filePath) {
  console.error("Uso: node scripts/upload-avatar.mjs <archivo> [email]");
  process.exit(1);
}
if (!email) {
  console.error("No email definido (ADMIN_EMAIL ni argv)");
  process.exit(1);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN no definido");
  process.exit(1);
}

const buffer = readFileSync(filePath);
const ext = extname(filePath).slice(1).toLowerCase() || "jpg";
const name = basename(filePath, extname(filePath));
const contentType = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
}[ext] ?? "application/octet-stream";

const path = `avatars/${name}-${Date.now()}.${ext}`;
console.log(`→ Subiendo ${filePath} (${(buffer.length / 1024).toFixed(1)} KB) como ${path}`);

const blob = await put(path, buffer, {
  access: "public",
  contentType,
  token: process.env.BLOB_READ_WRITE_TOKEN,
  addRandomSuffix: false,
});

console.log(`✓ Subido a: ${blob.url}`);

// Update user
const sql = neon(process.env.DATABASE_URL);
const result = await sql`
  UPDATE users SET image = ${blob.url}, updated_at = NOW()
  WHERE email = ${email}
  RETURNING id, name, image
`;
if (result.length === 0) {
  console.error(`✗ No se encontró user con email ${email}`);
  process.exit(1);
}
console.log(`✓ User actualizado: ${result[0].name} (${result[0].id})`);
console.log(`  Image: ${result[0].image}`);
