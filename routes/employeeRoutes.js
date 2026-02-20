const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid"); // v4 renamed to uuidv4 — generates random unique IDs

const filePath = path.join(__dirname, "../Data/employees.json");

const readData = () => {
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
};

const writeData = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); // null = no filter, 2 = indent spaces
};

// ensures departments is always an array even if a single string is sent
function normalizeDepartments(departments) {
  if (Array.isArray(departments)) return departments;
  if (typeof departments === "string" && departments.trim()) return [departments.trim()];
  return [];
}

// ─── POST / — Create a new employee ────────────────────────
router.post("/", (req, res) => {
  const {
    name,
    basicSalary,
    allowances,
    deductions,
    gender,
    departments,
    startDate,
    profileImage,
    notes
  } = req.body;

  const employees = readData();

  // Number() converts string to number, || 0 is fallback if conversion fails (NaN)
  const salary = Number(basicSalary) || 0;
  const addOn = Number(allowances) || 0;
  const cut = Number(deductions) || 0;

  const newEmployee = {
    id: uuidv4(),
    name,
    basicSalary: salary,
    allowances: addOn,
    deductions: cut,
    totalSalary: salary + addOn - cut, // auto-computed: basic + allowances - deductions
    gender: gender || "",
    departments: normalizeDepartments(departments),
    startDate: startDate || "",
    profileImage: profileImage || "",
    notes: notes || ""
  };

  employees.push(newEmployee);
  writeData(employees);

  res.status(201).json(newEmployee); // 201 = "Created" status code
});

// ─── GET / — Retrieve all employees ────────────────────────
router.get("/", (req, res) => {
  const employees = readData();
  res.json(employees);
});

// ─── GET /:id — Retrieve a single employee by ID ───────────
router.get("/:id", (req, res) => {
  const employees = readData();
  const employee = employees.find((emp) => emp.id === req.params.id); // req.params.id comes from the URL

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json(employee);
});

// ─── PUT /:id — Update an existing employee ─────────────────
router.put("/:id", (req, res) => {
  const employees = readData();
  const index = employees.findIndex((emp) => emp.id === req.params.id); // findIndex returns position, -1 if not found

  if (index === -1) {
    return res.status(404).json({ message: "Employee not found" });
  }

  const {
    name,
    basicSalary,
    allowances,
    deductions,
    gender,
    departments,
    startDate,
    profileImage,
    notes
  } = req.body;

  const salary = Number(basicSalary) || 0;
  const addOn = Number(allowances) || 0;
  const cut = Number(deductions) || 0;

  employees[index] = {
    ...employees[index], // spread: copies all existing fields (preserves id)
    name,
    basicSalary: salary,
    allowances: addOn,
    deductions: cut,
    totalSalary: salary + addOn - cut,
    gender: gender || "",
    departments: normalizeDepartments(departments),
    startDate: startDate || "",
    profileImage: profileImage || "",
    notes: notes || ""
  };

  writeData(employees);
  res.json(employees[index]);
});

// ─── DELETE /:id — Remove an employee ───────────────────────
router.delete("/:id", (req, res) => {
  const employees = readData();
  // filter keeps all employees whose id does NOT match — effectively removing the target
  const filteredEmployees = employees.filter((emp) => emp.id !== req.params.id);

  writeData(filteredEmployees);
  res.json({ message: "Employee deleted successfully" });
});

module.exports = router;
