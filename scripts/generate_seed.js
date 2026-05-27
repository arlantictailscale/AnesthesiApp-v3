const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("Compiling lib/cbt-default-data.ts to JS...");
const tempDir = path.join(__dirname, 'temp');

try {
  // Use tsc to compile default data file to JS
  execSync(`npx tsc --module commonjs --target es2020 --outDir "${tempDir}" "${path.join(__dirname, '../lib/cbt-default-data.ts')}"`, { stdio: 'inherit' });
  
  // Require the compiled JS file
  const { DEFAULT_CBT_PACKAGE } = require(path.join(tempDir, 'cbt-default-data.js'));
  
  console.log(`Successfully loaded default package: "${DEFAULT_CBT_PACKAGE.name}" with ${DEFAULT_CBT_PACKAGE.questions.length} questions.`);

  const serializedQuestions = JSON.stringify(DEFAULT_CBT_PACKAGE.questions);
  
  // Format SQL INSERT statement with escaped single quotes
  const escapedQuestions = serializedQuestions.replace(/'/g, "''");
  const escapedName = DEFAULT_CBT_PACKAGE.name.replace(/'/g, "''");
  const escapedDesc = DEFAULT_CBT_PACKAGE.description.replace(/'/g, "''");
  
  const sqlSeed = `
-- --- SEED DEFAULT QUESTION PACKAGE ---
-- This statement inserts the official 100-question national board practice package into cbt_packages.
insert into public.cbt_packages (id, name, description, questions, user_id)
values (
  '${DEFAULT_CBT_PACKAGE.id}',
  '${escapedName}',
  '${escapedDesc}',
  '${escapedQuestions}'::jsonb,
  null -- public system package
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  questions = excluded.questions;
`;

  // Read current SQL tables file
  const tablesFile = path.join(__dirname, '004_create_cbt_tables.sql');
  let currentSql = fs.readFileSync(tablesFile, 'utf8');
  
  // Remove any previous seed block if exists to prevent duplication
  const seedSplit = currentSql.split('-- --- SEED DEFAULT QUESTION PACKAGE ---');
  let baseSql = seedSplit[0].trim();
  
  // Write the updated SQL file
  fs.writeFileSync(tablesFile, baseSql + '\n' + sqlSeed.trim() + '\n');
  console.log(`Successfully seeded default package into ${tablesFile}!`);

} catch (err) {
  console.error("Failed to generate seed SQL:", err);
  process.exit(1);
} finally {
  // Clean up temp directory
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (e) {
    // ignore
  }
}
