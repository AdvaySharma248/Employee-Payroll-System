const fs = require("fs").promises; // .promises gives async (non-blocking) versions of fs methods
const path = require("path");

const filePath = path.join(__dirname, "..", "employees.json");

async function read() {
  try {
    const data = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : []; // safety check: always return an array
  } catch (error) {
    if (error.code === "ENOENT") {
      return []; // ENOENT = file doesn't exist yet, not a real error
    }
    console.error("Error reading employees file:", error.message);
    return [];
  }
}

async function write(data) {
  try {
    const payload = JSON.stringify(data, null, 2); // null = no filter, 2 = indent with 2 spaces
    await fs.writeFile(filePath, payload, "utf8");
    return true;
  } catch (error) {
    console.error("Error writing employees file:", error.message);
    return false;
  }
}

module.exports = { read, write };
