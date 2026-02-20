const express = require("express");
const path = require("path");
const fileHandler = require("./modules/fileHandler");

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true })); // parses form-submitted data from POST requests
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ensures departments is always a clean array (handles string, array, or empty input)
function normalizeDepartments(departments) {
  if (Array.isArray(departments)) return departments.filter(Boolean).map((d) => String(d).trim()).filter(Boolean);
  if (typeof departments === "string" && departments.trim()) return [departments.trim()];
  return [];
}

// combines separate day/month/year form fields into a single "YYYY-MM-DD" string
function parseStartDate(body) {
  const year = Number(body.startYear || 0);
  const month = Number(body.startMonth || 0);
  const day = Number(body.startDay || 0);

  if (!year || !month || !day) {
    return String(body.startDate || "").trim();
  }

  // padStart(2, "0") adds leading zero → 3 becomes "03"
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseAndValidateEmployee(body) {
  const name = String(body.name || "").trim();
  const manualDepartment = String(body.department || "").trim();
  const departments = normalizeDepartments(body.departments);
  const basicSalary = Number(body.basicSalary ?? body.salary); // ?? = use salary if basicSalary is null/undefined

  if (!name) {
    return { error: "Name is required." };
  }

  if (!Number.isFinite(basicSalary) || basicSalary < 0) {
    return { error: "Basic salary must be a valid non-negative number." };
  }

  if (!manualDepartment && departments.length === 0) {
    return { error: "Please select at least one department." };
  }

  const resolvedDepartments = departments.length ? departments : [manualDepartment];

  return {
    value: {
      name,
      department: manualDepartment || resolvedDepartments.join(", "),
      departments: resolvedDepartments,
      basicSalary,
      gender: String(body.gender || "").trim(),
      profileImage: String(body.profileImage || "").trim(),
      startDate: parseStartDate(body),
      notes: String(body.notes || "").trim(),
    },
  };
}

// ─── Routes ────────────────────────────────────────────────

app.get("/", async (req, res) => {
  const employees = await fileHandler.read();
  res.render("index", { employees, formError: null, formData: null, editingId: null });
});

app.get("/add", (req, res) => {
  res.render("add", { error: null, employee: { name: "", department: "", basicSalary: "" } });
});

app.post("/add", async (req, res) => {
  const result = parseAndValidateEmployee(req.body);

  if (result.error) {
    const employees = await fileHandler.read();
    return res.status(400).render("index", {
      employees,
      formError: result.error,
      formData: req.body, // pass back so form fields stay filled on error
      editingId: null,
    });
  }

  const employees = await fileHandler.read();
  employees.push({
    id: Date.now(),    // timestamp used as unique ID
    ...result.value,   // spread: merges all validated fields into this object
  });

  await fileHandler.write(employees);
  res.redirect("/"); // POST-Redirect-GET: prevents duplicate submission on page refresh
});

app.get("/edit/:id", async (req, res) => {
  const id = Number(req.params.id);
  const employees = await fileHandler.read();
  const employee = employees.find((emp) => Number(emp.id) === id);

  if (!employee) {
    return res.redirect("/");
  }

  res.render("edit", { error: null, employee });
});

app.post("/edit/:id", async (req, res) => {
  const id = Number(req.params.id);
  const employees = await fileHandler.read();
  const index = employees.findIndex((emp) => Number(emp.id) === id);

  if (index === -1) {
    return res.redirect("/");
  }

  const result = parseAndValidateEmployee(req.body);

  if (result.error) {
    return res.status(400).render("index", {
      employees,
      formError: result.error,
      formData: req.body,
      editingId: id,
    });
  }

  employees[index] = {
    ...employees[index], // spread: keeps existing fields like id that aren't in the form
    ...result.value,
  };

  await fileHandler.write(employees);
  res.redirect("/");
});

app.get("/delete/:id", async (req, res) => {
  const id = Number(req.params.id);
  const employees = await fileHandler.read();
  // filter keeps every employee whose id does NOT match — effectively removing the target
  const filtered = employees.filter((emp) => Number(emp.id) !== id);

  await fileHandler.write(filtered);
  res.redirect("/");
});

// IIFE: Immediately Invoked Function Expression — needed to use async/await at top level
(async () => {
  const employees = await fileHandler.read();
  console.log("Employees loaded on startup:", employees);

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
})();
