// Shared header/footer injection for subpages.
// Place <header data-include="header"></header> and <footer data-include="footer"></footer> in the page,
// set <body data-base="../"> (or "./") so asset/data paths resolve.

(function () {
  const base = document.body.getAttribute("data-base") || "./";

  const headerHTML = `
  <div class="container">
    <nav class="nav">
      <a class="brand" href="${base}index.html">
        <img src="${base}assets/img/logo.png" alt="">
        <span class="brand-text">
          <span class="t1">Imperfection Engineering Group</span>
          <span class="t2">NJIT · CME</span>
        </span>
      </a>
      <button class="nav-toggle" aria-label="Toggle navigation"><span></span></button>
      <ul class="nav-links">
        <li><a href="${base}index.html">Home</a></li>
        <li><a href="${base}pages/research.html">Research</a></li>
        <li><a href="${base}pages/group.html">Group</a></li>
        <li><a href="${base}pages/publications.html">Publications</a></li>
        <li><a href="${base}pages/software.html">Software</a></li>
        <li><a href="${base}pages/teaching.html">Teaching</a></li>
        <li><a href="${base}pages/news.html">News</a></li>
        <li><a href="${base}pages/joinus.html">Join Us</a></li>
      </ul>
    </nav>
  </div>`;

  const footerHTML = `
  <div class="container">
    <div class="footer-grid">
      <div>
        <h4>Imperfection Engineering Group</h4>
        <p class="muted"><a href="https://cme.njit.edu/" target="_blank" rel="noopener">Department of Chemical &amp; Materials Engineering</a><br>
        <a href="https://www.njit.edu/" target="_blank" rel="noopener">New Jersey Institute of Technology</a><br>
        Otto H. York Center · 138 Warren St · Newark, NJ</p>
        <p class="muted">Email: <a href="mailto:nt385@njit.edu">nt385@njit.edu</a></p>
      </div>
      <div>
        <h4>Site</h4>
        <ul>
          <li><a href="${base}pages/research.html">Research</a></li>
          <li><a href="${base}pages/group.html">Group</a></li>
          <li><a href="${base}pages/publications.html">Publications</a></li>
          <li><a href="${base}pages/software.html">Software</a></li>
          <li><a href="${base}pages/teaching.html">Teaching</a></li>
        </ul>
      </div>
      <div>
        <h4>Find us</h4>
        <ul>
          <li><a href="https://github.com/Imperfection-Engineering-Group" target="_blank" rel="noopener">GitHub</a></li>
          <li><a href="https://scholar.google.com/citations?user=QiIAZvwAAAAJ&amp;hl=en" target="_blank" rel="noopener">Google Scholar</a></li>
          <li><a href="https://people.njit.edu/profile/nt385" target="_blank" rel="noopener">NJIT Profile</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span id="yr"></span> Imperfection Engineering Group · NJIT</span>
    </div>
  </div>`;

  const h = document.querySelector('header[data-include="header"]');
  if (h) h.innerHTML = headerHTML;
  const f = document.querySelector('footer[data-include="footer"]');
  if (f) f.innerHTML = footerHTML;
})();
