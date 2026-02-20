const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const filePath = path.join(__dirname, "../Data/employees.json");

const readData = () => {
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
};

const writeData = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

function normalizeDepartments(departments) {
  if (Array.isArray(departments)) return departments;
  if (typeof departments === "string" && departments.trim()) return [departments.trim()];
  return [];
}

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

  const salary = Number(basicSalary) || 0;
  const addOn = Number(allowances) || 0;
  const cut = Number(deductions) || 0;

  const newEmployee = {
    id: uuidv4(),
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

  employees.push(newEmployee);
  writeData(employees);

  res.status(201).json(newEmployee);
});

router.get("/", (req, res) => {
  const employees = readData();
  res.json(employees);
});

router.get("/:id", (req, res) => {
  const employees = readData();
  const employee = employees.find((emp) => emp.id === req.params.id);

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json(employee);
});

router.put("/:id", (req, res) => {
  const employees = readData();
  const index = employees.findIndex((emp) => emp.id === req.params.id);

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
    ...employees[index],
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

router.delete("/:id", (req, res) => {
  const employees = readData();
  const filteredEmployees = employees.filter((emp) => emp.id !== req.params.id);

  writeData(filteredEmployees);

  res.json({ message: "Employee deleted successfully" });
});

module.exports = router;
