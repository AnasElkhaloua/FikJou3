const gate = process.argv[2];

const phaseZeroGates = new Set(["migration", "seed"]);

if (!phaseZeroGates.has(gate)) {
  throw new Error(`Unknown phase gate: ${gate ?? "missing"}`);
}

console.log(
  `${gate} verification is not applicable in Phase 00: no schema or seed exists.`,
);
