// Shared site script: mobile nav, footer year, data loaders.
(function () {
  // Mobile nav toggle
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }

  // Mark active nav link by filename of current page
  function markActive() {
    const links = document.querySelectorAll(".nav-links a");
    if (!links.length) return;
    // Last path segment, e.g. "group.html" or "" for home
    const segs = window.location.pathname.split("/").filter(Boolean);
    const last = segs.length ? segs[segs.length - 1] : "";
    const navHint = document.body.getAttribute("data-nav");
    const here = navHint || ((last === "" || last === "index.html") ? "index.html" : last);
    links.forEach((a) => {
      const href = a.getAttribute("href") || "";
      const hrefLast = href.split("/").pop() || "index.html";
      if (hrefLast === here) a.classList.add("active");
      else a.classList.remove("active");
    });
  }
  markActive();
  // The nav may be injected later by layout.js — re-run on next tick to catch it
  setTimeout(markActive, 0);

  // Footer year
  const y = document.getElementById("yr");
  if (y) y.textContent = new Date().getFullYear();
})();

// --- Helpers ---
const SITE_BASE = (document.body.getAttribute("data-base") || "./").replace(/\/?$/, "/");
function siteUrl(p) {
  if (!p) return p;
  if (/^(https?:|\/|data:|mailto:|tel:|#)/.test(p)) return p;
  return SITE_BASE + p.replace(/^\.\//, "");
}
async function fetchJSON(path) {
  const res = await fetch(siteUrl(path), { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

// --- News ---
async function renderNews(targetId, opts = {}) {
  const el = document.getElementById(targetId);
  if (!el) return;
  try {
    let items = await fetchJSON("data/news.json");
    items = items.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    if (opts.limit) items = items.slice(0, opts.limit);
    if (!items.length) { el.innerHTML = '<p class="muted">No news yet.</p>'; return; }

    if (opts.style === "cards") {
      el.innerHTML = items.map((n) => `
        <article class="card">
          <div class="card-img"><img src="${escapeHTML(siteUrl(n.image || "assets/img/logo.png"))}" alt=""></div>
          <div class="card-body">
            <span class="card-date">${escapeHTML(formatDate(n.date))}</span>
            <h3 class="card-title">${escapeHTML(n.title)}</h3>
            ${n.description ? `<p class="card-text">${escapeHTML(n.description)}</p>` : ""}
            ${n.url ? `<p><a href="${escapeHTML(n.url)}">Read more →</a></p>` : ""}
          </div>
        </article>`).join("");
    } else {
      el.innerHTML = items.map((n) => `
        <article class="news-item">
          <img src="${escapeHTML(siteUrl(n.image || "assets/img/logo.png"))}" alt="">
          <div>
            <div class="news-date">${escapeHTML(formatDate(n.date))}</div>
            <h3>${escapeHTML(n.title)}</h3>
            ${n.description ? `<p>${escapeHTML(n.description)}</p>` : ""}
            ${n.url ? `<p><a href="${escapeHTML(n.url)}">Read more →</a></p>` : ""}
          </div>
        </article>`).join("");
    }
  } catch (e) {
    el.innerHTML = `<p class="muted">Could not load news (${escapeHTML(e.message)}).</p>`;
  }
}

// --- Group ---
async function renderGroup() {
  const el = document.getElementById("group-content");
  if (!el) return;
  try {
    const data = await fetchJSON("data/group.json");
    const sections = [
      { key: "principal_investigator", title: "Faculty" },
      { key: "postdocs", title: "Postdoctoral Researchers" },
      { key: "graduate_students", title: "Graduate Students" },
      { key: "undergraduate_students", title: "Undergraduate Students" },
      { key: "high_school_students", title: "High School Students" },
      { key: "alumni", title: "Alumni" },
    ];
    el.innerHTML = sections.map((s) => {
      const list = data[s.key] || [];
      if (!list.length) return "";
      return `
        <section>
          <h2>${escapeHTML(s.title)}</h2>
          ${list.map((m) => `
            <div class="member">
              <div class="member-photo"><img src="${escapeHTML(siteUrl(m.image || "assets/img/logo.png"))}" alt="${escapeHTML(m.name)}"></div>
              <div>
                <h3>${escapeHTML(m.name)}</h3>
                ${m.role ? `<p class="member-period">${escapeHTML(m.role)}</p>` : ""}
                ${m.period ? `<p class="member-period">${escapeHTML(m.period)}</p>` : ""}
                ${m.bio ? `<p class="member-bio">${escapeHTML(m.bio)}</p>` : ""}
                ${m.links ? `<p>${m.links.map((l) => `<a href="${escapeHTML(siteUrl(l.url))}"${/^(https?:|mailto:)/.test(l.url) ? ' target="_blank" rel="noopener"' : ""}>${escapeHTML(l.text)}</a>`).join(" · ")}</p>` : ""}
              </div>
            </div>`).join("")}
        </section>`;
    }).join("");
  } catch (e) {
    el.innerHTML = `<p class="muted">Could not load group (${escapeHTML(e.message)}).</p>`;
  }
}

// --- Software ---
const githubIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.63 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.31-1.27-1.66-1.27-1.66-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.74 2.67 1.23 3.32.94.1-.74.4-1.24.72-1.52-2.55-.29-5.23-1.27-5.23-5.65 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.3 3.15 1.17a10.92 10.92 0 0 1 5.74 0c2.19-1.47 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.39-2.69 5.36-5.25 5.64.41.35.78 1.04.78 2.1v3.11c0 .31.2.67.8.56A11.5 11.5 0 0 0 12 .5z"/></svg>`;
const doiIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18"/></svg>`;
const linkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>`;

function iconFor(type) {
  if (type === "github") return githubIcon;
  if (type === "doi") return doiIcon;
  return linkIcon;
}

async function renderSoftware() {
  const el = document.getElementById("software-grid");
  if (!el) return;
  try {
    const items = await fetchJSON("data/software.json");
    if (!items.length) { el.innerHTML = '<p class="muted">No software listed yet.</p>'; return; }
    el.innerHTML = items.map((s) => `
      <div class="sw-card">
        <div class="sw-head">
          <h3>${escapeHTML(s.name)}</h3>
          ${s.category ? `<span class="sw-tag">${escapeHTML(s.category)}</span>` : ""}
        </div>
        ${s.description ? `<p class="sw-desc">${escapeHTML(s.description)}</p>` : ""}
        ${s.tags ? `<div class="tag-row">${s.tags.map((t) => `<span class="tag">${escapeHTML(t)}</span>`).join("")}</div>` : ""}
        <div class="sw-links">
          ${(s.links || []).map((l) => `
            <a href="${escapeHTML(l.url)}" target="_blank" rel="noopener">
              ${iconFor(l.type)} ${escapeHTML(l.text)}
            </a>`).join("")}
        </div>
      </div>`).join("");
  } catch (e) {
    el.innerHTML = `<p class="muted">Could not load software (${escapeHTML(e.message)}).</p>`;
  }
}

// --- Research (projects grouped by theme; multi-tag — a project appears under EVERY theme it lists) ---
const RESEARCH_THEMES = [
  {
    slug: "polycrystalline-ensembles",
    title: "Fundamentals of Defects in Polycrystalline Materials",
    description: "Defects, grain boundaries, and triple-junction networks — and how they govern polycrystalline behavior."
  },
  {
    slug: "materials-defect-genome",
    title: "Materials Defect Genome",
    description: "Periodic table maps of defect chemistry, building the genome that links structure-property relationships in crystalline materials"
  },
  {
    slug: "alloy-design",
    title: "Alloy Design",
    description: "System design approach in combination with ML-accelerated materials defect genome for extreme environment materials design"
  },
  {
    slug: "process-modeling-ai-ml",
    title: "Modeling, Simulations and AI/ML of Engineering Processes",
    description: ""
  }
];

async function renderResearch() {
  const root = document.getElementById("research-root");
  if (!root) return;
  try {
    const projects = await fetchJSON("data/projects.json");
    root.innerHTML = RESEARCH_THEMES.map((t) => {
      const list = projects.filter((p) => (p.themes || []).includes(t.slug));
      if (!list.length) return "";
      return `
        <section class="theme-block" id="${escapeHTML(t.slug)}">
          <div class="theme-head">
            <h2>${escapeHTML(t.title)}</h2>
            <p class="muted">${escapeHTML(t.description)}</p>
          </div>
          <div class="research-grid">
            ${list.map((p) => `
              <article class="project-card">
                <div class="project-thumb">
                  ${p.image
                    ? `<img src="${escapeHTML(siteUrl(p.image))}" alt="">`
                    : `<div class="project-thumb-placeholder">graphical<br>abstract</div>`}
                </div>
                <div class="card-body">
                  <h3 class="card-title">${escapeHTML(p.title)}</h3>
                  ${p.tags ? `<div class="tag-row">${p.tags.map((tg) => `<span class="tag">${escapeHTML(tg)}</span>`).join("")}</div>` : ""}
                  ${p.description ? `<p class="card-text">${escapeHTML(p.description)}</p>` : ""}
                  ${p.themes && p.themes.length > 1 ? `<p class="cross-themes muted">Also under: ${
                    p.themes
                      .filter((s) => s !== t.slug)
                      .map((s) => {
                        const meta = RESEARCH_THEMES.find((x) => x.slug === s);
                        return meta ? `<a href="#${s}">${escapeHTML(meta.title)}</a>` : "";
                      })
                      .filter(Boolean)
                      .join(" · ")
                  }</p>` : ""}
                  ${p.links ? `<div class="sw-links">${p.links.map((l) => `<a href="${escapeHTML(l.url)}" target="_blank" rel="noopener">${escapeHTML(l.text)}</a>`).join("")}</div>` : ""}
                </div>
              </article>`).join("")}
          </div>
        </section>`;
    }).join("");
  } catch (e) {
    root.innerHTML = `<p class="muted">Could not load projects (${escapeHTML(e.message)}).</p>`;
  }
}

// --- Courses (Teaching) ---
async function renderCourses() {
  const el = document.getElementById("courses-list");
  if (!el) return;
  try {
    const items = await fetchJSON("data/courses.json");
    if (!items.length) { el.innerHTML = '<p class="muted">No courses listed yet.</p>'; return; }
    el.innerHTML = items.map((c) => `
      <article class="course-card">
        <div class="course-figure">
          <img src="${escapeHTML(siteUrl(c.image || "assets/img/logo.png"))}" alt="${escapeHTML(c.title || "")}">
        </div>
        <div>
          <div class="course-meta">
            ${c.code ? `<span class="course-code">${escapeHTML(c.code)}</span>` : ""}
            ${c.level ? `<span class="course-level">${escapeHTML(c.level)}</span>` : ""}
            ${c.term ? `<span class="course-term">${escapeHTML(c.term)}</span>` : ""}
          </div>
          <h3>${escapeHTML(c.title || "")}</h3>
          ${c.description ? `<p>${escapeHTML(c.description)}</p>` : ""}
          <div class="course-links">
            ${c.syllabus ? `<a class="btn btn-ghost" href="${escapeHTML(siteUrl(c.syllabus))}" target="_blank" rel="noopener">Syllabus (PDF)</a>` : ""}
            ${(c.links || []).map((l) => `<a class="btn btn-ghost" href="${escapeHTML(l.url)}" target="_blank" rel="noopener">${escapeHTML(l.text)}</a>`).join("")}
          </div>
        </div>
      </article>`).join("");
  } catch (e) {
    el.innerHTML = `<p class="muted">Could not load courses (${escapeHTML(e.message)}).</p>`;
  }
}

// --- Reading list (Teaching > Recommended Reading) ---
async function renderReading() {
  const el = document.getElementById("reading-root");
  if (!el) return;
  try {
    const sections = await fetchJSON("data/reading.json");
    if (!sections.length) { el.innerHTML = '<p class="muted">No recommendations yet.</p>'; return; }
    el.innerHTML = sections.map((s) => `
      <section class="reading-section">
        <h2>${escapeHTML(s.category)}</h2>
        <ul class="reading-list">
          ${(s.items || []).map((it) => `
            <li>
              ${it.url ? `<a class="ref-title" href="${escapeHTML(it.url)}" target="_blank" rel="noopener">${escapeHTML(it.title)}</a>` : `<span class="ref-title">${escapeHTML(it.title)}</span>`}
              ${it.note ? `<span class="ref-note">${escapeHTML(it.note)}</span>` : ""}
            </li>`).join("")}
        </ul>
      </section>`).join("");
  } catch (e) {
    el.innerHTML = `<p class="muted">Could not load reading list (${escapeHTML(e.message)}).</p>`;
  }
}

// --- Publications ---
const AUTHOR_MATCH = /tuchinda/i;

function highlightAuthor(authors) {
  if (!authors) return "";
  return authors
    .split(/,\s*|\s+and\s+/)
    .map((a) => AUTHOR_MATCH.test(a) ? `<span class="me">${escapeHTML(a.trim())}</span>` : escapeHTML(a.trim()))
    .join(", ");
}

async function renderPublications() {
  const root = document.getElementById("publications-root");
  if (!root) return;
  try {
    const data = await fetchJSON("data/publications.json");
    const pubs = (data.publications || []).slice().sort((a, b) => (b.year || 0) - (a.year || 0));
    const meta = data.meta || {};

    const searchInput = document.getElementById("pub-search");
    const yearSelect = document.getElementById("pub-year");

    // Build year filter options
    const years = [...new Set(pubs.map((p) => p.year).filter(Boolean))].sort((a, b) => b - a);
    if (yearSelect) {
      yearSelect.innerHTML = `<option value="">All years</option>` + years.map((y) => `<option value="${y}">${y}</option>`).join("");
    }

    function render(filter = "", yearFilter = "") {
      const q = filter.trim().toLowerCase();
      const filtered = pubs.filter((p) => {
        if (yearFilter && String(p.year) !== String(yearFilter)) return false;
        if (!q) return true;
        const hay = [p.title, p.authors, p.venue, (p.tags || []).join(" ")].join(" ").toLowerCase();
        return hay.includes(q);
      });
      if (!filtered.length) { root.innerHTML = '<p class="pub-empty">No publications match your search.</p>'; return; }

      // group by year
      const byYear = {};
      filtered.forEach((p) => { (byYear[p.year || "Other"] ||= []).push(p); });
      const yearKeys = Object.keys(byYear).sort((a, b) => (b - a) || a.localeCompare(b));

      root.innerHTML = yearKeys.map((y) => `
        <h3 class="pub-year">${escapeHTML(y)}</h3>
        <ul class="pub-list">
          ${byYear[y].map((p) => `
            <li class="pub-item">
              <div class="pub-title">${escapeHTML(p.title)}</div>
              <div class="pub-authors">${highlightAuthor(p.authors)}</div>
              <div class="pub-venue">${escapeHTML(p.venue || "")}${p.year ? ` (${p.year})` : ""}</div>
              <div class="pub-links">
                ${p.doi ? `<a href="https://doi.org/${encodeURIComponent(p.doi)}" target="_blank" rel="noopener">DOI</a>` : ""}
                ${p.url ? `<a href="${escapeHTML(p.url)}" target="_blank" rel="noopener">Link</a>` : ""}
                ${p.pdf ? `<a href="${escapeHTML(p.pdf)}" target="_blank" rel="noopener">PDF</a>` : ""}
                ${p.citations ? `<a href="${escapeHTML(p.scholar_url || "#")}" target="_blank" rel="noopener">Cited by ${p.citations}</a>` : ""}
              </div>
            </li>`).join("")}
        </ul>`).join("");
    }

    render();
    if (searchInput) searchInput.addEventListener("input", () => render(searchInput.value, yearSelect ? yearSelect.value : ""));
    if (yearSelect) yearSelect.addEventListener("change", () => render(searchInput ? searchInput.value : "", yearSelect.value));

    const lastUpdated = document.getElementById("pub-updated");
    if (lastUpdated && meta.updated) {
      lastUpdated.textContent = `Last updated: ${formatDate(meta.updated)} · Source: ${meta.source || "manual"}`;
    }
  } catch (e) {
    root.innerHTML = `<p class="pub-empty">Could not load publications (${escapeHTML(e.message)}).</p>`;
  }
}

// --- Talks (Publications page tab) ---
async function renderTalks() {
  const root = document.getElementById("talks-root");
  if (!root) return;
  try {
    const data = await fetchJSON("data/talks.json");
    const talks = (data.talks || []).slice().sort(
      (a, b) => (b.date || "").localeCompare(a.date || "") || (b.year || 0) - (a.year || 0)
    );
    if (!talks.length) { root.innerHTML = '<p class="pub-empty">No talks yet.</p>'; return; }

    const byYear = {};
    talks.forEach((t) => { (byYear[t.year || "Other"] ||= []).push(t); });
    const yearKeys = Object.keys(byYear).sort((a, b) => (b - a) || a.localeCompare(b));

    root.innerHTML = yearKeys.map((y) => `
      <h3 class="pub-year">${escapeHTML(y)}</h3>
      <ul class="pub-list">
        ${byYear[y].map((t) => `
          <li class="pub-item">
            <div class="pub-title">${escapeHTML(t.title)}</div>
            ${t.authors ? `<div class="pub-authors">${highlightAuthor(t.authors)}</div>` : ""}
            <div class="pub-venue">${t.type ? `${escapeHTML(t.type)} · ` : ""}${escapeHTML(t.event || "")}${t.location ? `, ${escapeHTML(t.location)}` : ""}${t.year ? ` (${escapeHTML(String(t.year))})` : ""}</div>
            ${t.url ? `<div class="pub-links"><a href="${escapeHTML(t.url)}" target="_blank" rel="noopener">Link</a></div>` : ""}
          </li>`).join("")}
      </ul>`).join("");
  } catch (e) {
    root.innerHTML = `<p class="pub-empty">Could not load talks (${escapeHTML(e.message)}).</p>`;
  }
}

// --- Theses (Publications page tab) ---
async function renderTheses() {
  const root = document.getElementById("thesis-root");
  if (!root) return;
  try {
    const data = await fetchJSON("data/thesis.json");
    const theses = (data.theses || []).slice().sort((a, b) => (b.year || 0) - (a.year || 0));
    if (!theses.length) { root.innerHTML = '<p class="pub-empty">No theses yet.</p>'; return; }

    root.innerHTML = `<ul class="pub-list">
      ${theses.map((t) => `
        <li class="pub-item">
          <div class="pub-title">${escapeHTML(t.title)}</div>
          <div class="pub-authors">${escapeHTML(t.author || "")}${t.degree ? ` · ${escapeHTML(t.degree)}` : ""}</div>
          <div class="pub-venue">${escapeHTML(t.institution || "")}${t.year ? ` (${escapeHTML(String(t.year))})` : ""}${t.advisor ? ` · Advisor: ${escapeHTML(t.advisor)}` : ""}</div>
          ${t.url ? `<div class="pub-links"><a href="${escapeHTML(t.url)}" target="_blank" rel="noopener">PDF</a></div>` : ""}
        </li>`).join("")}
    </ul>`;
  } catch (e) {
    root.innerHTML = `<p class="pub-empty">Could not load theses (${escapeHTML(e.message)}).</p>`;
  }
}

// --- Tab switching on the Publications page ---
function initPubTabs() {
  const tabs = document.querySelectorAll(".pub-tab");
  if (!tabs.length) return;
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;
      tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
      document.querySelectorAll(".pub-panel").forEach((p) => {
        p.hidden = p.id !== `panel-${name}`;
      });
    });
  });
}
