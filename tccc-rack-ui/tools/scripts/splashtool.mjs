#!/usr/bin/env node
import devkit from '@nx/devkit';
import archiver from 'archiver';
import chalk from 'chalk';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import fs from 'fs';
import path from 'path';
const { readCachedProjectGraph } = devkit;

const [, , projectName] = process.argv;

const graph = readCachedProjectGraph();
const project = graph.nodes[projectName];
const config = dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

dotenvExpand.expand(config);
const splashOptions = project.data?.targets?.splash?.options;

const { outputPath, layerName, startPath } = splashOptions;
const installPath = process.env.KOS_INSTALL_PATH;
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const srcPath = path.resolve(project.data.sourceRoot);

const outPath = path.resolve(outputPath);

function copyDirectory(source, destination) {
  try {
    fs.cpSync(source, destination, { recursive: true });
    console.log(`Directory copied from ${source} to ${destination}`);
  } catch (err) {
    console.error(`Error copying directory: ${err}`);
  }
}

copyDirectory(srcPath, outPath);

function generateGensquashfsPack(inputDir, outputDir) {
  const lines = ['dir  /usr/share/www 0755 0 0']; // Start with the root directory

  function walkDir(currentDir, relativeDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const relativePath = path.join(relativeDir, item);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        // Add a directory entry
        lines.push(`dir  ${path.join(outputDir, relativePath)} 0755 0 0`);
        walkDir(fullPath, relativePath); // Recurse into the directory
      } else if (stats.isFile()) {
        // Add a file entry
        lines.push(
          `file ${path.join(outputDir, relativePath)} 0644 0 0 .${
            path.sep
          }${relativePath}`
        );
      }
    }
  }

  walkDir(inputDir, '');
  return lines.join('\n'); // Join all lines into a single string
}

const inputDir = srcPath; // Your source directory
const outputDir = '/usr/share/www'; // Target path in gensquashfs
const packFileText = generateGensquashfsPack(inputDir, outputDir);

console.log(packFileText); // Print the pack file text
const packPath = path.resolve(outputPath, 'layer.pack');
if (!fs.existsSync(packPath)) {
  fs.writeFileSync(
    packPath,
    packFileText,

    { encoding: 'utf-8' }
  );
}
createDiskImage({
  outputPath,
  layerName: `${layerName}.img`,
  packPath,
  installPath,
})
  .then((imgPath) => {
    console.log('imgPath: ', imgPath);
    const zipPath = path.resolve(outputPath, `${layerName}.zip`);
    console.log('zipPath: ', zipPath);
    return archiveDiskImage({ zipPath, imgPath });
  })
  .then((zipPath) => {
    console.log('zipPath from archive: ', zipPath);
    const kabName = `${layerName}.kab`;
    return createKabFile({
      zipPath,
      kabName,
      outputPath,
      installPath,
      layerName,
    }).then(() => {
      console.log(chalk.green('done'));
    });
  });
async function createDiskImage({
  outputPath,
  layerName,
  packPath,
  installPath,
}) {
  return new Promise((resolve, reject) => {
    console.log(`packPath: ${packPath}`);

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    const layerPath = path.resolve(outputPath, layerName);
    console.log(`layerName: ${layerPath}`);

    const genSquashFsLocation =
      process.platform === 'darwin'
        ? path.join(
            'Contents',
            'MacOS',
            'lib',
            'squashfs-tools-ng',
            'bin',
            'gensquashfs'
          )
        : path.join(
            'release',
            'lib',
            'squashfs-tools-ng',
            'bin',
            'gensquashfs'
          );

    const isLocal = process.env.KOS_LOCAL === 'true';
    const gensquashfsPath = isLocal
      ? path.resolve(installPath, genSquashFsLocation)
      : '/usr/bin/gensquashfs';

    const command = gensquashfsPath;
    console.log('gensquashfsPath: ', gensquashfsPath);
    const baseBuildArgs = [
      '-F',
      packPath,
      '--compressor=gzip',
      '--force',
      layerPath,
    ];

    const args = [...baseBuildArgs];

    const ps = spawn(command, args);

    ps.stdout.on('data', (data) => {
      console.log(chalk.blue(`studio: ${data}`));
    });

    ps.stderr.on('data', (data) => {
      console.error(chalk.red(`studio: ${data}`));
    });

    ps.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      if (code === 0) {
        resolve(layerPath);
      } else {
        reject();
      }
    });
  });
}
async function archiveDiskImage({ zipPath, imgPath }) {
  console.log(`archiveDiskImage: zipPath: ${zipPath}, imgPath: ${imgPath}`);
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Sets the compression level.
    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function () {
      console.log(archive.pointer() + ' total bytes');
      console.log(
        'archiver has been finalized and the output file descriptor has closed.'
      );
      resolve(zipPath);
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function () {
      console.log('Data has been drained');
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        // throw error
        reject();
      }
    });

    // good practice to catch this error explicitly
    archive.on('error', function (err) {
      reject();
    });

    // pipe archive data to the file
    archive.pipe(output);

    // append a file from stream

    // append files from a sub-directory, putting its contents at the root of archive
    archive.file(imgPath, { name: 'layer.img' });

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    archive.finalize();
  });
}

async function createKabFile({
  zipPath,
  kabName,
  outputPath,
  installPath,
  layerName,
}) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    const kabPath = path.resolve(outputPath, kabName);
    console.log(`kabPath: ${kabPath}`);

    const isLocal = process.env.KOS_LOCAL === 'true';

    const kabtoolLocation =
      process.platform === 'darwin'
        ? path.join('Contents', 'MacOS', 'bin', 'kabtool')
        : path.join('release', 'bin', 'kabtool');

    const kabtoolPath = isLocal
      ? path.resolve(installPath, kabtoolLocation)
      : '/usr/local/bin/kabtool';
    console.log(kabtoolPath);
    const command = kabtoolPath;

    const baseBuildArgs = [
      '-b',
      '-t',
      'kos.layer',
      '-n',
      layerName,
      '-v',
      '0.0.1',
      '-z',
      zipPath,
    ];

    const args = [...baseBuildArgs, kabPath];

    console.log(command, args);
    const ps = spawn(command, args);

    ps.stdout.on('data', (data) => {
      console.log(chalk.blue(`studio: ${data}`));
    });

    ps.stderr.on('data', (data) => {
      console.error(chalk.red(`studio: ${data}`));
    });

    ps.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
}
