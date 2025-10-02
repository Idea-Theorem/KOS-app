import chalk from "chalk";
import { execSync } from "child_process";
const [, , sdk, ddk] = process.argv;
const kos = [
  "@kosdev-code/kos-core-model",
  "@kosdev-code/kos-dispense-sdk",
  "@kosdev-code/kos-sdk-common",
  "@kosdev-code/kos-ui-core",
  "@kosdev-code/kos-ui-sdk",
  "@kosdev-code/kos-ui-components",
  "@kosdev-code/kos-dispense-ui",
  "@kosdev-code/kos-dispense-model",
]
  .map((dep) => `${dep}@${sdk}`)
  .join(" ");

const freestyle = [
  "@kosdev-code/kos-freestyle-sdk",
  "@kosdev-code/kos-freestyle-ui",
  "@kosdev-code/kos-freestyle-model",
]
  .map((dep) => `${dep}@${sdk}`)
  .join(" ");

const cms = [
  "@kosdev-code/kos-cms-sdk",
  "@kosdev-code/kos-cms-ui",
  "@kosdev-code/kos-cms-model",
]
  .map((dep) => `${dep}@${sdk}`)
  .join(" ");

const ddkDeps = [
  "@kosdev-code/kos-ddk",
  "@kosdev-code/kos-ddk-components",
  "@kosdev-code/kos-ddk-models",
  "@kosdev-code/kos-ddk-model-components",
  "@kosdev-code/kos-ddk-styles",
  "@kosdev-code/kos-ui-plugin",
]
  .map((dep) => `${dep}@${ddk}`)
  .join(" ");

const flags = [
  "--loglevel error",
  "--no-progress",
  "--no-audit",
  "--no-fund",
].join(" ");
console.log(chalk.green("Updating dependencies..."));
console.log(chalk.green("Updating kos dependencies..."));
execSync(`npm i ${kos}  --save ${flags}`, {
  stdio: "inherit",
});

console.log(chalk.green("Updating freestyle dependencies..."));
execSync(`npm i ${freestyle}  --save ${flags}`, {
  stdio: "inherit",
});

console.log(chalk.green("Updating cms dependencies..."));
execSync(`npm i ${cms} --save ${flags}`, {
  stdio: "inherit",
});

console.log(chalk.green("Updating ddk dependencies..."));
execSync(`npm i ${ddkDeps} --save ${flags}`, {
  stdio: "inherit",
});

console.log(chalk.green("Updating kos-ui-cli..."));
execSync(`npm i -g @kosdev-code/kos-ui-cli@${sdk} ${flags}`, {
  stdio: "inherit",
});
