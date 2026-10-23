// Prova executável de que as fronteiras da arquitetura estão protegidas:
// cada caso simula um import proibido e exige que o ESLint o rejeite.
// Uso: npm run lint:boundaries
import { ESLint } from 'eslint';

const eslint = new ESLint();

const cases = [
  {
    name: 'componente não acessa o serviço de requisições',
    file: 'src/app/features/tracks/components/track-card/x.ts',
    code: "import { TrackApiService } from '../../services/track-api.service';",
  },
  {
    name: 'componente não usa HttpClient diretamente',
    file: 'src/app/features/tracks/pages/tracks-page/x.ts',
    code: "import { HttpClient } from '@angular/common/http';",
  },
  {
    name: 'página injeta a porta, não a implementação do store (DIP)',
    file: 'src/app/features/tracks/pages/tracks-page/x.ts',
    code: "import { TracksSignalStore } from '../../store/tracks.store';",
  },
  {
    name: 'store depende da porta de dados, não do serviço HTTP (DIP)',
    file: 'src/app/features/tracks/store/x.ts',
    code: "import { TrackApiService } from '../services/track-api.service';",
  },
  {
    name: 'portas não conhecem implementações',
    file: 'src/app/features/tracks/ports/x.ts',
    code: "import { TracksSignalStore } from '../store/tracks.store';",
  },
  {
    name: 'store não depende de componentes',
    file: 'src/app/features/tracks/store/x.ts',
    code: "import { TrackCardComponent } from '../components/track-card/track-card.component';",
  },
  {
    name: 'serviço não depende do store',
    file: 'src/app/features/tracks/services/x.ts',
    code: "import { TracksStore } from '../store/tracks.store';",
  },
  {
    name: 'utils são lógica pura, sem Angular',
    file: 'src/app/features/tracks/utils/x.ts',
    code: "import { signal } from '@angular/core';",
  },
  {
    name: 'shared não depende de features',
    file: 'src/app/shared/pipes/x.ts',
    code: "import type { Track } from '@features/tracks/models/track.model';",
  },
  {
    name: 'sair da feature exige alias',
    file: 'src/app/features/tracks/components/track-card/x.ts',
    code: "import { DurationPipe } from '../../../../shared/pipes/duration.pipe';",
  },
];

let failures = 0;
for (const { name, file, code } of cases) {
  const [result] = await eslint.lintText(
    `${code}\nexport const used = [${code.match(/\{ (\w+) \}/)[1]}];\n`,
    {
      filePath: file,
    },
  );
  const blocked = result.messages.some((m) => m.ruleId === 'no-restricted-imports');
  console.log(`${blocked ? '✔ bloqueado' : '✘ PERMITIDO'}  ${name}`);
  if (!blocked) failures++;
}

if (failures) {
  console.error(`\n${failures} fronteira(s) sem proteção.`);
  process.exit(1);
}
console.log(`\nTodas as ${cases.length} fronteiras estão protegidas.`);
