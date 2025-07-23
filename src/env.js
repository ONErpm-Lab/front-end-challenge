const fs = require("fs");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, ".env") });

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
  console.error("Variáveis CLIENT_ID ou CLIENT_SECRET não definidas no .env");
  process.exit(1);
}

// Lista dos arquivos a atualizar
const filesToUpdate = [
  "./environments/environment.ts",
  "./environments/environment.dev.ts",
];

// Função para substituir ou adicionar as propriedades clientId e clientSecret
function updateProperty(content, key, value) {
  const regex = new RegExp(`(${key}:\\s*)'[^']*'`, "m");
  if (regex.test(content)) {
    return content.replace(regex, `$1'${value}'`);
  } else {
    return content.replace(/(\};?\s*)$/, `  ${key}: '${value}',\n$1`);
  }
}

filesToUpdate.forEach((relativePath) => {
  const targetPath = path.resolve(__dirname, relativePath);

  let content = "";
  try {
    content = fs.readFileSync(targetPath, "utf-8");
  } catch (err) {
    console.warn(
      `Arquivo ${relativePath} não encontrado, criando novo arquivo básico.`
    );
    content = `export const environment = {\n  production: false,\n};\n`;
  }

  content = updateProperty(content, "client_id", process.env.CLIENT_ID);
  content = updateProperty(content, "client_secret", process.env.CLIENT_SECRET);

  fs.writeFileSync(targetPath, content, "utf-8");
  console.log(`Arquivo ${relativePath} atualizado com as variáveis do .env`);
});
