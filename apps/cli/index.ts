#!/usr/bin/env node
// import { resolve } from 'node:path';
import { LoadConfigUseCase } from '../../src/features/config/index.js';
import { RunRepo2TxtUseCase } from '../../src/app/index.js';
import { parseArgs } from './options.js';
import { buildConfigFromCli } from './command.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cliOptions = parseArgs(args);
  const cliConfig = buildConfigFromCli(cliOptions);

  const config = new LoadConfigUseCase().execute({
    cli: cliConfig,
  });

  const runner = new RunRepo2TxtUseCase(config);
  await runner.execute();

  console.log(`✅ repo2txt generated: ${config.output}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
