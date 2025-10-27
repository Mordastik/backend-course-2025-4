
const { Command } = require('commander');
const fs = require('fs/promises');
const http = require('http');

const program = new Command();

program
  .requiredOption('-i, --input <path>', ' до  JSON з  ()')
  .requiredOption('-h, --host <address>', '  ()')
  .requiredOption('-p, --port <number>', '  ()')
  .parse(process.argv);

const options = program.opts();

async function checkInputFile(filePath) {
    try {
        await fs.access(filePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error("Cannot find input file");
            process.exit(1);
        }
        throw error;
    }
}

async function startServer() {
    await checkInputFile(options.input);

    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`Server is running at ${options.host}:${options.port}.`);
    });

    server.listen(options.port, options.host, () => {
        console.log(`Server running at http://${options.host}:${options.port}/`);
    });
}

startServer().catch(err => {
    console.error("An error occurred during server startup:", err.message);
    process.exit(1);
});