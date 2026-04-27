const API = "/api";
const page = document.body.dataset.page || "login";

// ── Token helpers ────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("token") || "";

// ── Core API helper ──────────────────────────────────────────────────────────
const api = async (url, options = {}) => {
  const token = getToken();
  const response = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  if (response.status === 401) {
    localStorage.removeItem("token");
    location.href = "/index.html";
    return;
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
};

const byId = (id) => document.getElementById(id);

// ── Toast notification system ────────────────────────────────────────────────
const toast = (msg, type = "info", title = "") => {
  let container = byId("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const icons = { success: "✅", error: "❌", warn: "⚠️", info: "ℹ️" };
  const titles = { success: "Success", error: "Error", warn: "Warning", info: "Notice" };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-body">
      <div class="toast-title">${title || titles[type] || "Notice"}</div>
      <div class="toast-msg">${msg}</div>
    </div>
  `;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = "slideIn .25s ease reverse";
    setTimeout(() => el.remove(), 250);
  }, 3500);
};

// ── Dark mode ────────────────────────────────────────────────────────────────
const initDarkMode = () => {
  const btn = byId("darkToggle");
  const applyTheme = (isLight) => {
    document.body.classList.toggle("light", isLight);
    if (btn) {
      btn.innerHTML = isLight
        ? `<span class="icon">🌙</span> Dark Mode`
        : `<span class="icon">☀️</span> Light Mode`;
    }
  };
  // Restore saved preference
  const saved = localStorage.getItem("themeLight");
  applyTheme(saved === "1");

  btn?.addEventListener("click", (e) => {
    e.preventDefault();
    const isLight = !document.body.classList.contains("light");
    applyTheme(isLight);
    localStorage.setItem("themeLight", isLight ? "1" : "0");
  });
};

// ── Mobile sidebar ───────────────────────────────────────────────────────────
const initMobileSidebar = () => {
  const sidebar  = byId("sidebar");
  const overlay  = byId("sidebarOverlay");
  const toggle   = byId("menuToggle");
  if (!sidebar || !overlay || !toggle) return;

  const open  = () => { sidebar.classList.add("open");  overlay.classList.add("open"); };
  const close = () => { sidebar.classList.remove("open"); overlay.classList.remove("open"); };

  toggle.addEventListener("click", () => sidebar.classList.contains("open") ? close() : open());
  overlay.addEventListener("click", close);
};

// ── Logout ───────────────────────────────────────────────────────────────────
const initLogout = () => {
  byId("logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    location.href = "/index.html";
  });
};

// ── Grade helper ─────────────────────────────────────────────────────────────
const grade = (score, max) => {
  const p = (score / Math.max(max, 1)) * 100;
  if (p >= 90) return "A+";
  if (p >= 80) return "A";
  if (p >= 70) return "B";
  if (p >= 60) return "C";
  if (p >= 50) return "D";
  return "F";
};

const gradeBadge = (g) => {
  const cls = g === "A+" ? "badge-A" : `badge-${g}`;
  return `<span class="badge ${cls}">${g}</span>`;
};

// ── Login page ───────────────────────────────────────────────────────────────
const setupLogin = () => {
  byId("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Signing in…";
    try {
      const email    = byId("email")?.value.trim();
      const password = byId("password")?.value.trim();
      const data = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      localStorage.setItem("token", data.token);
      location.href = "/dashboard.html";
    } catch (error) {
      toast(error instanceof Error ? error.message : "Login failed.", "error");
      btn.disabled = false;
      btn.textContent = "Sign In →";
    }
  });
};

// ── Register page ────────────────────────────────────────────────────────────
const setupRegister = () => {
  byId("registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Creating account…";
    try {
      const name     = byId("name")?.value.trim();
      const email    = byId("email")?.value.trim();
      const password = byId("password")?.value.trim();
      await api("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
      const loginData = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      localStorage.setItem("token", loginData.token);
      location.href = "/dashboard.html";
    } catch (error) {
      toast(error instanceof Error ? error.message : "Registration failed.", "error");
      btn.disabled = false;
      btn.textContent = "Create Account →";
    }
  });
};

// ── Students page ────────────────────────────────────────────────────────────
const renderStudents = async () => {
  const tbody = byId("studentTableBody");
  if (!tbody) return;
  try {
    const students = await api("/students");
    const query = (byId("searchStudent")?.value || "").toLowerCase();
    const subjectFilter = byId("filterSubject")?.value || "";

    const filtered = students.filter((s) => {
      const matchesQuery = `${s.name} ${s.rollNo} ${s.email}`.toLowerCase().includes(query);
      const matchesSubject = !subjectFilter || s.subject === subjectFilter;
      return matchesQuery && matchesSubject;
    });

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="6">
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <p>${students.length ? "No students match your search" : "No students yet — add one!"}</p>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((s) => `
      <tr>
        <td><strong>${s.name}</strong><br><span class="text-muted" style="font-size:11px;">${s.email}</span></td>
        <td><span style="font-family:var(--mono);font-size:13px;">${s.rollNo}</span></td>
        <td>${s.section || "—"}</td>
        <td>${s.subject}</td>
        <td>Sem ${s.semester}</td>
        <td>
          <button class="btn btn-danger btn-xs" data-action="delete-student" data-id="${s._id}">Delete</button>
        </td>
      </tr>`).join("");
  } catch (error) {
    console.error("renderStudents error:", error);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger)">Failed to load students</td></tr>`;
  }
};

const setupStudents = () => {
  byId("studentForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Saving…";
    try {
      const payload = {
        name:     byId("sName")?.value.trim(),
        rollNo:   byId("sRoll")?.value.trim(),
        email:    byId("sEmail")?.value.trim(),
        section:  byId("sSection")?.value,
        subject:  byId("sSubject")?.value,
        semester: Number(byId("sSem")?.value || 1)
      };
      await api("/students", { method: "POST", body: JSON.stringify(payload) });
      toast(`${payload.name} added successfully!`, "success");
      byId("studentForm").reset();
      await renderStudents();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to save student.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Save Student";
    }
  });

  document.addEventListener("click", async (e) => {
    const target = e.target;
    if (target.dataset.action === "delete-student" && target.dataset.id) {
      if (!confirm("Delete this student? This action cannot be undone.")) return;
      try {
        await api(`/students/${target.dataset.id}`, { method: "DELETE" });
        toast("Student deleted.", "warn");
        await renderStudents();
      } catch (error) {
        toast(error instanceof Error ? error.message : "Delete failed.", "error");
      }
    }
  });

  ["searchStudent", "filterSubject"].forEach((id) => {
    byId(id)?.addEventListener("input", renderStudents);
    byId(id)?.addEventListener("change", renderStudents);
  });

  void renderStudents();
};

// ── Assignments page ─────────────────────────────────────────────────────────
const renderAssignmentList = async () => {
  const tbody = byId("assignmentListBody");
  const countBadge = byId("assignmentCount");
  if (!tbody) return;
  try {
    const assignments = await api("/assignments");
    if (countBadge) countBadge.textContent = String(assignments.length);
    if (!assignments.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📋</div><p>No assignments yet — create one above!</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = assignments.map((a, i) => {
      const totalMax = (a.rubric || []).reduce((sum, r) => sum + (r.maxMarks || 0), 0);
      const rubricNames = (a.rubric || []).map(r => r.criteria).join(", ") || "—";
      const due = a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—";
      return `<tr>
        <td style="font-family:var(--mono);color:var(--muted);">${i + 1}</td>
        <td><strong>${a.title}</strong>${a.templateName ? `<br><span class="text-muted" style="font-size:11px;">${a.templateName}</span>` : ""}</td>
        <td><span style="font-family:var(--mono);font-size:13px;">${a.subject}</span></td>
        <td>${due}</td>
        <td style="font-size:12px;color:var(--text2);">${rubricNames}</td>
        <td><strong>${totalMax}</strong></td>
        <td><button class="btn btn-danger btn-xs" data-action="delete-assignment" data-id="${a._id}" data-title="${a.title}">Delete</button></td>
      </tr>`;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--danger)">Failed to load assignments</td></tr>`;
  }
  // Wire delete buttons
  tbody.querySelectorAll("[data-action='delete-assignment']").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const title = btn.getAttribute("data-title");
      if (!confirm(`Delete assignment "${title}"? This cannot be undone.`)) return;
      try {
        await api(`/assignments/${id}`, { method: "DELETE" });
        toast(`Assignment "${title}" deleted.`, "success");
        await renderAssignmentList();
      } catch (err) {
        toast("Failed to delete assignment.", "error");
      }
    });
  });
};

const makeRubricRow = () => {
  const div = document.createElement("div");
  div.className = "rubric-row";
  div.innerHTML = `
    <input class="criteria" placeholder="Criteria name (e.g. Code Quality)" required />
    <input class="maxMarks" type="number" min="1" placeholder="Max marks" required />
    <button type="button" class="rubric-remove" title="Remove">×</button>
  `;
  div.querySelector(".rubric-remove").addEventListener("click", () => {
    const wrap = byId("rubricWrap");
    if (wrap && wrap.querySelectorAll(".rubric-row").length > 1) {
      div.remove();
    } else {
      toast("You need at least one rubric criteria.", "warn");
    }
  });
  return div;
};

const setupAssignments = () => {
  // Wire up initial remove button
  byId("rubricWrap")?.querySelectorAll(".rubric-row").forEach((row) => {
    row.querySelector(".rubric-remove")?.addEventListener("click", () => {
      const wrap = byId("rubricWrap");
      if (wrap && wrap.querySelectorAll(".rubric-row").length > 1) row.remove();
      else toast("You need at least one rubric criteria.", "warn");
    });
  });

  byId("addRubric")?.addEventListener("click", () => {
    byId("rubricWrap")?.appendChild(makeRubricRow());
  });

  byId("assignmentForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Creating…";
    try {
      const rubricRows = Array.from(document.querySelectorAll(".rubric-row"));
      const rubric = rubricRows.map((row) => ({
        criteria: row.querySelector(".criteria").value.trim(),
        maxMarks: Number(row.querySelector(".maxMarks").value)
      })).filter(r => r.criteria && r.maxMarks > 0);

      if (rubric.length === 0) {
        toast("Add at least one valid rubric criteria.", "warn");
        btn.disabled = false;
        btn.textContent = "✅ Create Assignment";
        return;
      }

      const payload = {
        title:        byId("aTitle")?.value.trim(),
        subject:      byId("aSubject")?.value,
        dueDate:      byId("aDue")?.value,
        templateName: byId("aTemplate")?.value.trim(),
        rubric
      };
      await api("/assignments", { method: "POST", body: JSON.stringify(payload) });
      toast(`"${payload.title}" created successfully!`, "success");
      byId("assignmentForm").reset();
      const wrap = byId("rubricWrap");
      if (wrap) {
        wrap.innerHTML = "";
        wrap.appendChild(makeRubricRow());
      }
      await renderAssignmentList();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to create assignment.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "✅ Create Assignment";
    }
  });
};

// ── Evaluation page ──────────────────────────────────────────────────────────
const setupEvaluation = async () => {
  try {
    const [students, assignments] = await Promise.all([api("/students"), api("/assignments")]);
    const studentSelect    = byId("eStudent");
    const assignmentSelect = byId("eAssignment");
    if (!studentSelect || !assignmentSelect) return;

    if (!students.length) {
      toast("No students found. Please add students first.", "warn");
    }
    if (!assignments.length) {
      toast("No assignments found. Please create assignments first.", "warn");
    }

    studentSelect.innerHTML = students.length
      ? students.map((s) => `<option value="${s._id}">${s.name} (${s.rollNo})</option>`).join("")
      : `<option value="">— No students found —</option>`;

    assignmentSelect.innerHTML = assignments.length
      ? assignments.map((a) => `<option value="${a._id}">${a.title} — ${a.subject}</option>`).join("")
      : `<option value="">— No assignments found —</option>`;

    const updateLiveScore = () => {
      const inputs = Array.from(document.querySelectorAll(".awarded"));
      if (!inputs.length) return;
      const total = inputs.reduce((s, inp) => s + Number(inp.value || 0), 0);
      const max   = inputs.reduce((s, inp) => s + Number(inp.dataset.max || 0), 0);
      const g     = grade(total, max);
      const preview = byId("scorePreview");
      const liveScore = byId("liveScore");
      const liveGrade = byId("liveGrade");
      if (preview) preview.style.display = "flex";
      if (liveScore) liveScore.textContent = `${total} / ${max}`;
      if (liveGrade) {
        liveGrade.textContent = g;
        liveGrade.style.color = g === "F" || g === "D" ? "var(--danger)" :
                                g.startsWith("A") ? "var(--success)" : "var(--primary)";
      }
    };

    const renderRubrics = () => {
      const assignment = assignments.find((a) => a._id === assignmentSelect.value);
      const wrap = byId("markWrap");
      if (!wrap) return;
      if (!assignment?.rubric?.length) {
        wrap.innerHTML = `<div class="text-muted" style="padding:8px 0;">No rubric found for this assignment.</div>`;
        const preview = byId("scorePreview");
        if (preview) preview.style.display = "none";
        return;
      }
      wrap.innerHTML = assignment.rubric.map((r) =>
        `<div class="mark-row">
          <span class="criteria-label">${r.criteria}</span>
          <span class="max-label">max: ${r.maxMarks}</span>
          <input class="awarded" data-criteria="${r.criteria}" data-max="${r.maxMarks}"
            type="number" min="0" max="${r.maxMarks}" value="0" required />
        </div>`
      ).join("");
      // Attach live score listeners
      wrap.querySelectorAll(".awarded").forEach(inp => {
        inp.addEventListener("input", () => {
          const max = Number(inp.dataset.max);
          if (Number(inp.value) > max) inp.value = max;
          if (Number(inp.value) < 0) inp.value = 0;
          updateLiveScore();
        });
      });
      updateLiveScore();
    };

    assignmentSelect.addEventListener("change", renderRubrics);
    renderRubrics();

    byId("evaluationForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        const rows = Array.from(document.querySelectorAll(".awarded"));
        if (!rows.length) {
          toast("Select an assignment with rubric criteria first.", "warn");
          btn.disabled = false;
          btn.textContent = "💾 Save Evaluation";
          return;
        }
        const marks = rows.map((row) => ({
          criteria:     row.dataset.criteria || "",
          awardedMarks: Number(row.value || 0),
          maxMarks:     Number(row.dataset.max || 1)
        }));
        const total = marks.reduce((s, m) => s + m.awardedMarks, 0);
        const max   = marks.reduce((s, m) => s + m.maxMarks, 0);
        const selectedAssignment = assignments.find((a) => a._id === assignmentSelect.value);

        const payload = {
          studentId:    studentSelect.value,
          assignmentId: assignmentSelect.value,
          subject:      selectedAssignment?.subject || "",
          marks,
          totalMarks:   total,
          grade:        grade(total, max),
          feedback:     byId("feedback")?.value || ""
        };

        await api("/evaluations", { method: "POST", body: JSON.stringify(payload) });
        toast(`Evaluation saved! Grade: ${payload.grade} (${total}/${max})`, "success");
        byId("evaluationForm").reset();
        renderRubrics();
      } catch (error) {
        toast(error instanceof Error ? error.message : "Failed to save evaluation.", "error");
      } finally {
        btn.disabled = false;
        btn.textContent = "💾 Save Evaluation";
      }
    });
  } catch (error) {
    console.error("setupEvaluation error:", error);
    toast("Failed to load evaluation data. Check your connection.", "error");
  }
};

// ── Analytics / Dashboard ────────────────────────────────────────────────────
const setupAnalytics = async () => {
  try {
    const data = await api("/evaluations/analytics/summary");
    const avgEl      = byId("avgMarks");
    const riskEl     = byId("atRisk");
    const totalEl    = byId("totalEvals");
    const topEl      = byId("topCount");
    const insightsEl = byId("insights");

    if (avgEl)   avgEl.textContent  = Number(data.average || 0).toFixed(1);
    if (riskEl)  riskEl.textContent = String(data.atRiskCount || 0);

    // Count total and A-grade from distribution
    const dist = data.distribution || {};
    const total = Object.values(dist).reduce((s, v) => s + v, 0);
    const top   = (dist["A+"] || 0) + (dist["A"] || 0);
    if (totalEl) totalEl.textContent = String(total);
    if (topEl)   topEl.textContent   = String(top);

    if (insightsEl) {
      const items = [];
      if ((data.atRiskCount || 0) > 0) {
        items.push(`<div style="display:flex;gap:10px;padding:12px;background:var(--danger-s);border:1px solid rgba(239,68,68,.2);border-radius:var(--radius-sm);margin-bottom:8px;">
          <span style="font-size:18px;">⚠️</span>
          <div>
            <div style="font-weight:700;font-size:13px;color:var(--danger);">At-Risk Alert</div>
            <div style="font-size:13px;color:var(--text2);margin-top:2px;">${data.atRiskCount} student(s) with grade D or F need intervention.</div>
          </div>
        </div>`);
      } else {
        items.push(`<div style="display:flex;gap:10px;padding:12px;background:var(--success-s);border:1px solid rgba(16,185,129,.2);border-radius:var(--radius-sm);margin-bottom:8px;">
          <span style="font-size:18px;">✅</span>
          <div>
            <div style="font-weight:700;font-size:13px;color:var(--success);">All Clear</div>
            <div style="font-size:13px;color:var(--text2);margin-top:2px;">No at-risk students currently. Great performance!</div>
          </div>
        </div>`);
      }
      if (top > 0) {
        items.push(`<div style="display:flex;gap:10px;padding:12px;background:var(--primary-s);border:1px solid rgba(67,97,238,.2);border-radius:var(--radius-sm);margin-bottom:8px;">
          <span style="font-size:18px;">🏆</span>
          <div>
            <div style="font-weight:700;font-size:13px;color:var(--primary);">Top Performers</div>
            <div style="font-size:13px;color:var(--text2);margin-top:2px;">${top} student(s) achieved grade A or A+.</div>
          </div>
        </div>`);
      }
      if (!total) {
        items.push(`<div class="text-muted" style="padding:8px 0;">No evaluations recorded yet. Start by evaluating students.</div>`);
      }
      insightsEl.innerHTML = items.join("");
    }

    const canvas = byId("gradeChart");
    if (canvas && window.Chart) {
      if (canvas._chartInstance) canvas._chartInstance.destroy();
      const labels = Object.keys(dist);
      const values = Object.values(dist);
      const colors = {
        "A+": "#22d3a0", "A": "#2ecc9a", "B": "#63b3ed",
        "C":  "#ffb347", "D": "#ff5a1f", "F": "#ff3b3b"
      };
      canvas._chartInstance = new window.Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Students",
            data: values,
            backgroundColor: labels.map(l => colors[l] || "#555250"),
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: "#555250" },
              grid: { color: "rgba(255,255,255,0.05)" }
            },
            x: {
              ticks: { color: "#9a9390" },
              grid: { display: false }
            }
          }
        }
      });
    }
  } catch (error) {
    console.error("setupAnalytics error:", error);
  }
};

// ── Reports page ─────────────────────────────────────────────────────────────
const setupReports = async () => {
  try {
    const reports = await api("/reports/all");
    const body = byId("reportBody");
    if (!body) return;

    if (!reports.length) {
      body.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📄</div><p>No reports yet. Complete some evaluations first.</p></div></td></tr>`;
    } else {
      body.innerHTML = reports.map((r) => `
        <tr>
          <td><strong>${r.studentId?.name || "—"}</strong></td>
          <td>${r.assignmentId?.title || "—"}</td>
          <td style="font-family:var(--mono);font-weight:600;">${r.totalMarks}</td>
          <td>${gradeBadge(r.grade)}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${r.feedback || ''}">${r.feedback || '<span class="text-muted">—</span>'}</td>
        </tr>`).join("");
    }

    byId("printReport")?.addEventListener("click", () => window.print());

    byId("exportCsv")?.addEventListener("click", () => {
      const rows = ["Student,Assignment,Marks,Grade,Feedback"].concat(
        reports.map((r) =>
          `"${r.studentId?.name || ""}","${r.assignmentId?.title || ""}",${r.totalMarks},${r.grade},"${r.feedback || ""}"`
        )
      );
      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "smarteval-reports.csv"; a.click();
      URL.revokeObjectURL(url);
      toast("CSV exported successfully!", "success");
    });
  } catch (error) {
    console.error("setupReports error:", error);
    toast("Failed to load reports.", "error");
  }
};

// ── Init ─────────────────────────────────────────────────────────────────────
const init = async () => {
  initDarkMode();
  initMobileSidebar();
  initLogout();

  const token = getToken();
  if (page !== "login" && page !== "register" && !token) {
    location.href = "/index.html";
    return;
  }

  if (page === "login")       return setupLogin();
  if (page === "register")    return setupRegister();
  if (page === "students")    return setupStudents();
  if (page === "assignments") { setupAssignments(); void renderAssignmentList(); return; }
  if (page === "evaluation")  return setupEvaluation();
  if (page === "analytics" || page === "dashboard") return setupAnalytics();
  if (page === "reports")     return setupReports();
};

void init();
export {};
