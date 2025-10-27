// main.js

import { Command } from 'commander';
import http from 'http';
import fs from 'fs';
import { XMLBuilder } from 'fast-xml-parser';
import url from 'url';

const program = new Command();

program
  .requiredOption('-i, --input <path>', 'input JSON file path')
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port');

program.parse(process.argv);

const options = program.opts();

// Перевірка наявності файлу
if (!fs.existsSync(options.input)) {
  console.error("Cannot find input file");
  process.exit(1);
}

// Створення сервера
const server = http.createServer(async (req, res) => {
  const query = url.parse(req.url, true).query;

  try {
const data = await fs.promises.readFile(options.input, 'utf-8');

// Розбиваємо файл на рядки, кожен парсимо окремо
let flights = data
  .split("\n")
  .filter(line => line.trim() !== "")
  .map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  })
  .filter(item => item !== null);

    // Якщо дані — це об’єкт з ключем (наприклад, {"flights": [...]})
    if (!Array.isArray(flights)) {
      flights = flights.flights || Object.values(flights);
    }

    // Фільтрація за параметрами URL
    if (query.airtime_min) {
      const minTime = Number(query.airtime_min);
      flights = flights.filter(f => Number(f.AIR_TIME) > minTime);
    }

    // Формування об’єктів для XML
    const result = flights.map(f => {
      const obj = {
        air_time: f.AIR_TIME,
        distance: f.DISTANCE
      };
      if (query.date === 'true') obj.date = f.FL_DATE;
      return obj;
    });

    // Побудова XML
    const builder = new XMLBuilder({ format: true });
    const xml = builder.build({ flights: { flight: result } });

    // Відправка відповіді
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(xml);

  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Error reading or processing file');
  }
});

// Запуск сервера
server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});