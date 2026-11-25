/* Heritage tree: branches → sub-branches → thinkers.
   mode "teaser": compact overview for the landing page (branches → sub-branches, names as a one-line list).
   mode "page":   full tree, one column per branch, filters and a fixed info card.
   Styling lives in site.css under "heritage tree"; this file only builds the SVG and wires interaction. */
(function () {
  'use strict';
  var host = document.getElementById('treeTeaser') || document.getElementById('tree');
  if (!host) return;
  var script = document.currentScript || document.querySelector('script[src*="heritage.js"]');
  var mode = (script && script.getAttribute('data-mode')) || 'page';
  var compact = mode === 'teaser';
  var siteData = JSON.parse(document.getElementById('site-data').textContent);
  var D = siteData.heritage;
  if (!D || !D.branches || !D.clusters || !D.thinkers) return;
  var rootEl = document.querySelector('script[data-root]');
  var root = rootEl ? rootEl.getAttribute('data-root') : '';
  var NS = 'http://www.w3.org/2000/svg';

  var BRANCH_ORDER = ['The Danger Zone', 'The Chemical Wedding', 'The Pluriversity', 'The Broken Tower'];
  var BRANCH_COLORS = { 'The Danger Zone': 'rust', 'The Chemical Wedding': 'sky', 'The Pluriversity': 'sun', 'The Broken Tower': 'leaf' };
  var colorOf = function (branch) { return 'var(--' + (BRANCH_COLORS[branch] || 'mute') + ')'; };

  function slugify(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function esc(s) {
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return map[c]; });
  }
  function el(name, attrs, parent, text) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function wrap2(s, max) {
    if (s.length <= max) return [s];
    var mid = s.length / 2, best = -1, i;
    for (i = 0; i < s.length; i++) if (s[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    return best < 0 ? [s] : [s.slice(0, best), s.slice(best + 1)];
  }
  function lastName(full) {
    var p = full.replace(/\s+\(.*\)$/, '').split(' '), n = p.length;
    return n > 2 && /^(le|la|de|del|della|van|von|mc)$/i.test(p[n - 2]) ? p[n - 2] + ' ' + p[n - 1] : p[n - 1];
  }

  // ---- data indexes ----
  var thinkersById = {}, clustersById = {}, byCluster = {}, clustersByBranch = {};
  D.thinkers.forEach(function (t) {
    thinkersById[t.id] = t;
    (t.branches || []).forEach(function (b, i) {
      var cid = slugify(b.sub_branch);
      (byCluster[cid] = byCluster[cid] || []).push({ t: t, primary: i === 0 });
    });
  });
  D.clusters.forEach(function (c) {
    clustersById[c.id] = c;
    (clustersByBranch[c.branch] = clustersByBranch[c.branch] || []).push(c);
  });

  var BRANCH_H = 48;
  var svg, gl, gn;
  var branchNodes = {}, clusterNodes = {}, thinkerNodes = {}, edges = [];
  var pos = { branch: {}, cluster: {} };

  function curve(x1, y1, x2, y2) {
    var mx = (x1 + x2) / 2;
    return 'M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2;
  }

  var heritageUrl = root + 'heritage/index.html';
  var noteHref = function (url) { return root + String(url).replace(/^\//, '').replace(/\/$/, '/index.html'); };
  function noteLink(text, url) { return url ? '<a href="' + noteHref(url) + '">' + esc(text) + '</a>' : esc(text); }
  var branchUrl = {};
  for (var bi = 0; bi < D.branches.length; bi++) branchUrl[D.branches[bi].title] = D.branches[bi].url;

  // ---- teaser layout (landing page): branches stacked, clusters to their right ----
  if (compact) {
    var L = { W: 880, bx: 0, bw: 190, cx: 270, cw: 610, rowH: 52, groupGap: 22, branchGap: 36, pad: 4 };
    var CLUSTER_H = 44;
    var cursor = L.pad;
    BRANCH_ORDER.forEach(function (bn) {
      var cls = clustersByBranch[bn] || [];
      var top = cursor, y = cursor;
      cls.forEach(function (c, i) {
        pos.cluster[c.id] = { y: y + L.rowH / 2, top: y };
        y += L.rowH + (i < cls.length - 1 ? L.groupGap : 0);
      });
      pos.branch[bn] = (top + y) / 2;
      cursor = y + L.branchGap;
    });
    var Hc = cursor - L.branchGap + L.pad;

    host.innerHTML = '';
    host.classList.add('tree-host', 'is-compact');
    svg = el('svg', {
      viewBox: '0 0 ' + L.W + ' ' + Hc, role: 'group', class: 'htree',
      'aria-label': 'Heritage overview: branches and sub-branches'
    }, host);
    gl = el('g', { class: 'links' }, svg);
    gn = el('g', { class: 'nodes' }, svg);

    BRANCH_ORDER.forEach(function (bn) {
      if (pos.branch[bn] === undefined) return;
      var c = colorOf(bn), y = pos.branch[bn];
      var g = el('g', { class: 'hnode branch', transform: 'translate(' + L.bx + ' ' + (y - BRANCH_H / 2) + ')', style: '--c:' + c }, gn);
      var inner = el('a', { href: heritageUrl, 'aria-label': bn }, g);
      el('rect', { class: 'box', width: L.bw, height: BRANCH_H, rx: 12 }, inner);
      el('text', { class: 'lbl', x: L.bw / 2, y: BRANCH_H / 2, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, inner, bn);
    });

    D.clusters.forEach(function (cl) {
      var p = pos.cluster[cl.id]; if (!p) return;
      var c = colorOf(cl.branch);
      var g = el('g', { class: 'hnode cluster', transform: 'translate(' + L.cx + ' ' + (p.y - CLUSTER_H / 2) + ')', style: '--c:' + c }, gn);
      var inner = el('a', { href: heritageUrl + '#' + cl.id, 'aria-label': cl.title }, g);
      el('rect', { class: 'box', width: L.cw, height: CLUSTER_H, rx: 10 }, inner);
      var people = (byCluster[cl.id] || []).map(function (r) { return r.t; });
      el('text', { class: 'lbl', x: 16, y: 18 }, inner, cl.title);
      var names = '', shown = 0;
      for (var i = 0; i < people.length; i++) {
        var nm = lastName(people[i].title), next = names ? names + ' · ' + nm : nm;
        if (next.length > 74) break;
        names = next; shown++;
      }
      if (shown < people.length) names += '  +' + (people.length - shown);
      el('text', { class: 'sub', x: 16, y: 34 }, inner, names);
      el('text', { class: 'count', x: L.cw - 16, y: 18, 'text-anchor': 'end' }, inner, people.length + ' thinkers');

      var x1 = L.bx + L.bw, y1 = pos.branch[cl.branch], x2 = L.cx, y2 = p.y;
      el('path', { d: curve(x1, y1, x2, y2), class: 'edge e1', style: '--c:' + c }, gl);
    });
    return;
  }

  // ---- full layout (heritage page): one column per branch, side by side ----
  var W = 1120;
  var GAP = 24;
  var COLW = (W - GAP * (BRANCH_ORDER.length - 1)) / BRANCH_ORDER.length;
  var TOP = 2, BRANCH_GAP = 10, CLUSTER_H = 34, HEAD_GAP = 2, ROW_H = 21, ROW_GAP = 0, CLUSTER_GAP = 6;
  var colX = {}, colTop = {}, maxH = TOP;
  var prevCluster = {};

  BRANCH_ORDER.forEach(function (bn, ci) {
    var x = ci * (COLW + GAP);
    colX[bn] = x;
    colTop[bn] = TOP;
    pos.branch[bn] = TOP + BRANCH_H / 2;
    var y = TOP + BRANCH_H + BRANCH_GAP;
    (clustersByBranch[bn] || []).forEach(function (c) {
      var rows = byCluster[c.id] || [];
      var rowTop = y + CLUSTER_H + HEAD_GAP;
      var rowsH = rows.length ? rows.length * ROW_H + (rows.length - 1) * ROW_GAP : 0;
      var lastRowY = rows.length ? rowTop + (rows.length - 1) * (ROW_H + ROW_GAP) + ROW_H / 2 : rowTop;
      pos.cluster[c.id] = { x: x, top: y, rowTop: rowTop, bottom: lastRowY, y: y + CLUSTER_H / 2 };
      y = rowTop + rowsH + CLUSTER_GAP;
    });
    if (y > maxH) maxH = y;
  });
  var H = maxH + TOP;

  host.innerHTML = '';
  host.classList.add('tree-host', 'is-full');
  svg = el('svg', {
    viewBox: '0 0 ' + W + ' ' + H, role: 'group', class: 'htree',
    'aria-label': 'Heritage tree: four branches in columns, each with its sub-branches and thinkers'
  }, host);
  gl = el('g', { class: 'links' }, svg);
  gn = el('g', { class: 'nodes' }, svg);

  // branch headers, one per column
  BRANCH_ORDER.forEach(function (bn) {
    if (colX[bn] === undefined) return;
    var c = colorOf(bn);
    var g = el('g', { class: 'hnode branch', transform: 'translate(' + colX[bn] + ' ' + colTop[bn] + ')', style: '--c:' + c }, gn);
    g.setAttribute('tabindex', 0); g.setAttribute('role', 'button'); g.setAttribute('aria-label', bn + ', branch');
    el('rect', { class: 'box', width: COLW, height: BRANCH_H, rx: 12 }, g);
    el('text', { class: 'lbl', x: COLW / 2, y: BRANCH_H / 2, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, g, bn);
    branchNodes[bn] = g;
    g.addEventListener('click', function () { toggleBranch(bn); });
    g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggleBranch(bn); } });
  });

  // sub-branches and their thinkers, down each column
  D.clusters.forEach(function (cl) {
    var p = pos.cluster[cl.id]; if (!p) return;
    var c = colorOf(cl.branch);
    var g = el('g', { class: 'hnode cluster', transform: 'translate(' + p.x + ' ' + p.top + ')', style: '--c:' + c }, gn);
    g.setAttribute('tabindex', 0); g.setAttribute('role', 'button'); g.setAttribute('aria-label', cl.title + ', sub-branch of ' + cl.branch);
    el('rect', { class: 'box', width: COLW, height: CLUSTER_H, rx: 10 }, g);
    var lines = wrap2(cl.title, 30);
    lines.forEach(function (ln, i) {
      el('text', { class: 'lbl', x: COLW / 2, y: CLUSTER_H / 2 + (i - (lines.length - 1) / 2) * 16, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, g, ln);
    });
    clusterNodes[cl.id] = g;
    g.addEventListener('click', function () { toggleCluster(cl.id); });
    g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggleCluster(cl.id); } });

    // connector: branch header feeds the first cluster; later clusters chain from the one above
    var spineX = p.x + 14;
    var prev = prevCluster[cl.branch];
    var fromY = prev ? prev.bottom : (colTop[cl.branch] + BRANCH_H);
    var fromX = prev ? spineX : (p.x + COLW / 2);
    var e1 = el('path', { d: 'M' + fromX + ' ' + fromY + ' V' + p.top, class: 'edge e1', style: '--c:' + c }, gl);
    edges.push({ el: e1, branch: cl.branch, cluster: cl.id, thinker: null });
    prevCluster[cl.branch] = p;

    var rows = byCluster[cl.id] || [];
    // one spine down the dot column (x + 14), clear of the labels that start at x + 28
    var lastY = rows.length ? p.rowTop + (rows.length - 1) * (ROW_H + ROW_GAP) + ROW_H / 2 : p.bottom;
    var e2 = el('path', { d: 'M' + spineX + ' ' + p.rowTop + ' V' + lastY, class: 'edge e2', style: '--c:' + c }, gl);
    edges.push({ el: e2, branch: cl.branch, cluster: cl.id, thinker: null });

    rows.forEach(function (r, i) {
      var t = r.t, ty = p.rowTop + i * (ROW_H + ROW_GAP) + ROW_H / 2;
      var tg = el('g', { class: 'hnode thinker' + (r.primary ? '' : ' secondary'), transform: 'translate(' + p.x + ' ' + (ty - ROW_H / 2) + ')', style: '--c:' + c, tabindex: 0, role: 'button' }, gn);
      var also = (t.branches || []).filter(function (b) { return slugify(b.sub_branch) !== cl.id; }).map(function (b) { return b.sub_branch; });
      tg.setAttribute('aria-label', t.title + ', ' + t.profession + (also.length ? ' (also in ' + also.join(', ') + ')' : ''));
      el('rect', { class: 'box', width: COLW, height: ROW_H, rx: 6 }, tg);
      el('circle', { class: 'dot', cx: 14, cy: ROW_H / 2, r: 4 }, tg);
      el('text', { class: 'lbl', x: 28, y: ROW_H / 2, 'dominant-baseline': 'central' }, tg, t.title);
      if (also.length) el('title', {}, tg, t.title + ' also appears in ' + also.join(', '));
      (thinkerNodes[t.id] = thinkerNodes[t.id] || []).push(tg);

      tg.addEventListener('click', function () { selectThinker(t); });
      tg.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectThinker(t); } });
      tg.addEventListener('mouseenter', function () { highlight(t.id); });
      tg.addEventListener('mouseleave', unhighlight);
      tg.addEventListener('focus', function () { highlight(t.id); });
      tg.addEventListener('blur', unhighlight);
    });
  });

  // ---- interaction (full mode) ----
  var state = { branch: '', cluster: '', discipline: '', q: '', sel: null };

  function highlight(id) {
    svg.classList.add('focusing');
    edges.forEach(function (e) { if (e.thinker === id) e.el.classList.add('hl'); });
    var t = thinkersById[id];
    (t.branches || []).forEach(function (b) {
      var cn = clusterNodes[slugify(b.sub_branch)]; if (cn) cn.classList.add('hl');
      var bn = branchNodes[b.branch]; if (bn) bn.classList.add('hl');
      edges.forEach(function (e) { if (e.thinker === null && e.cluster === slugify(b.sub_branch)) e.el.classList.add('hl'); });
    });
    (thinkerNodes[id] || []).forEach(function (n) { n.classList.add('hl'); });
  }
  function unhighlight() {
    svg.classList.remove('focusing');
    svg.querySelectorAll('.hl').forEach(function (n) { n.classList.remove('hl'); });
  }

  function selectThinker(t) {
    state.sel = t.id;
    Object.keys(thinkerNodes).forEach(function (k) {
      thinkerNodes[k].forEach(function (n) { n.classList.toggle('sel', k === t.id); });
    });
    showInfo(t);
  }

  function infoText(t) {
    var html = '';
    if (t.why) html += '<p class="hwhy">' + esc(t.why) + '</p>';
    if (t.summary) html += '<p class="hhook">' + esc(t.summary) + '</p>';
    return html;
  }

  // The card is fixed to the viewport, so it stays beside the reader wherever they click.
  function setInfo(html) {
    var box = document.getElementById('treeInfo');
    if (!box) return;
    box.innerHTML = '<div class="hinfo">' + html + '<button type="button" class="hiclose" aria-label="Close">×</button></div>';
    box.hidden = false;
    box.querySelector('.hiclose').onclick = resetInfo;
  }

  function showInfo(t) {
    var box = document.getElementById('treeInfo');
    if (!box) { if (t.url) location.href = noteHref(t.url); return; }
    // Thinkers: profession, status, badges (sub-branches)
    if (t.profession) {
      var badges = (t.branches || []).map(function (b) {
        return '<span class="hbadge" style="--c:' + colorOf(b.branch) + '">' + esc(b.sub_branch) + '<small>' + esc(b.branch) + '</small></span>';
      }).join('');
      setInfo('<p class="hmeta">' + esc(t.profession) + (t.status ? ' · ' + esc(t.status) : '') + '</p>' +
        '<h2>' + esc(t.title) + '</h2>' + infoText(t) +
        '<div class="hbadges">' + badges + '</div>');
    } else if (t.type === 'cluster') {
      // Clusters: sub-branch name with branch badge
      var badges = '<span class="hbadge" style="--c:' + colorOf(t.branch) + '">' + esc(t.branch) + '</span>';
      setInfo('<h2>' + esc(t.title) + '</h2>' + infoText(t) +
        '<div class="hbadges">' + badges + '</div>');
    } else if (t.type === 'branch') {
      // Branches: list of sub-branches
      var sub = (t.sub_branches || []).map(function (s) {
        return '<span class="hbadge" style="--c:' + colorOf(t.branch) + '">' + esc(s) + '</span>';
      }).join('');
      setInfo('<h2>' + esc(t.title) + '</h2>' + infoText(t) +
        '<div class="hbadges">' + sub + '</div>');
    }
  }

  function resetInfo() {
    var box = document.getElementById('treeInfo');
    if (!box) return;
    box.innerHTML = '';
    box.hidden = true;
  }
  function toggleBranch(bn) {
    state.branch = state.branch === bn ? '' : bn;
    state.cluster = '';
    apply();
    if (!state.branch) { resetInfo(); return; }
    var bRaw = null;
    for (var i = 0; i < D.branches.length; i++) { if (D.branches[i].title === bn) { bRaw = D.branches[i]; break; } }
    showInfo({ type: 'branch', title: bn, branch: bn, url: bRaw ? bRaw.url : null,
      why: bRaw ? bRaw.why : '', summary: bRaw ? bRaw.summary : '',
      sub_branches: (clustersByBranch[bn] || []).map(function (c) { return c.title; }) });
  }
  function toggleCluster(cid) {
    state.cluster = state.cluster === cid ? '' : cid;
    state.branch = '';
    apply();
    var c = state.cluster ? clustersById[cid] : null;
    if (c) showInfo({ type: 'cluster', title: c.title, branch: c.branch, url: c.url, why: c.why, summary: c.summary });
    else resetInfo();
  }

  function apply() {
    var q = state.q.trim().toLowerCase(), fd = state.discipline.toLowerCase();
    var any = !!(state.branch || state.cluster || q || fd);
    D.thinkers.forEach(function (t) {
      (thinkerNodes[t.id] || []).forEach(function (n, i) {
        var inScope = true;
        if (state.branch) inScope = (t.branches || []).some(function (b) { return b.branch === state.branch; });
        if (state.cluster) inScope = (t.branches || []).some(function (b) { return slugify(b.sub_branch) === state.cluster; });
        if (fd) inScope = inScope && t.profession.toLowerCase().indexOf(fd) >= 0;
        if (q) inScope = inScope && (t.title.toLowerCase().indexOf(q) >= 0 || ((t.why || '') + ' ' + (t.summary || '')).toLowerCase().indexOf(q) >= 0 || t.profession.toLowerCase().indexOf(q) >= 0);
        n.classList.toggle('dim', !inScope);
      });
    });
    D.clusters.forEach(function (c) {
      var n = clusterNodes[c.id]; if (!n) return;
      var ok = true;
      if (state.branch) ok = c.branch === state.branch;
      if (state.cluster) ok = c.id === state.cluster;
      n.classList.toggle('dim', !ok);
      n.classList.toggle('on', state.cluster === c.id);
    });
    BRANCH_ORDER.forEach(function (b) {
      var n = branchNodes[b]; if (!n) return;
      var ok = true;
      if (state.branch) ok = b === state.branch;
      if (state.cluster) ok = clustersById[state.cluster] && clustersById[state.cluster].branch === b;
      n.classList.toggle('dim', !ok);
      n.classList.toggle('on', state.branch === b);
    });
    edges.forEach(function (e) {
      var ok = true;
      if (state.branch) ok = e.branch === state.branch;
      if (state.cluster) ok = e.cluster === state.cluster;
      e.el.classList.toggle('dim', !ok);
    });
    svg.classList.toggle('filtered', any);
    syncChips();
  }

  // ---- filter panel ----
  function buildFilters() {
    var panel = document.createElement('div');
    panel.id = 'heritage-filters';
    panel.className = 'hfilters';
    panel.hidden = true;
    panel.innerHTML =
      '<div class="hf-head"><b>Filters</b><button type="button" id="filter-close" aria-label="Close filters">×</button></div>' +
      '<label class="hf-label" for="tq">Search</label>' +
      '<input type="search" id="tq" placeholder="Search thinkers…" aria-label="Search thinkers">' +
      '<span class="hf-label">Branch</span><div id="filter-branches" class="hf-chips"></div>' +
      '<span class="hf-label">Discipline</span><div id="filter-disciplines" class="hf-chips"></div>';
    document.body.appendChild(panel);

    var bc = panel.querySelector('#filter-branches');
    BRANCH_ORDER.forEach(function (b) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'hchip'; btn.dataset.fb = b; btn.textContent = b;
      btn.style.setProperty('--c', colorOf(b));
      btn.onclick = function () { toggleBranch(b); };
      bc.appendChild(btn);
    });
    var disciplines = {};
    D.thinkers.forEach(function (t) { if (t.profession) disciplines[t.profession] = (disciplines[t.profession] || 0) + 1; });
    var dc = panel.querySelector('#filter-disciplines');
    Object.keys(disciplines).sort(function (a, b) { return disciplines[b] - disciplines[a] || a.localeCompare(b); }).forEach(function (d) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'hchip'; btn.dataset.fd = d; btn.textContent = d;
      btn.onclick = function () { state.discipline = state.discipline === d ? '' : d; apply(); };
      dc.appendChild(btn);
    });
    panel.querySelector('#tq').oninput = function (ev) { state.q = ev.target.value; apply(); };

    var toggle = document.createElement('button');
    toggle.id = 'heritage-filter-toggle'; toggle.type = 'button'; toggle.className = 'hf-toggle';
    toggle.textContent = 'Filters'; toggle.setAttribute('aria-expanded', 'false');
    toggle.onclick = function () { panel.hidden = !panel.hidden; toggle.setAttribute('aria-expanded', String(!panel.hidden)); };
    panel.querySelector('#filter-close').onclick = function () { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); };
    document.body.appendChild(toggle);
  }
  function syncChips() {
    document.querySelectorAll('#filter-branches .hchip').forEach(function (b) { b.classList.toggle('on', state.branch === b.dataset.fb); });
    document.querySelectorAll('#filter-disciplines .hchip').forEach(function (b) { b.classList.toggle('on', state.discipline === b.dataset.fd); });
  }
  buildFilters();

  // deep link from landing: /heritage/#sub-branch-id
  if (location.hash && clustersById[location.hash.slice(1)]) {
    state.cluster = location.hash.slice(1); apply();
    var cn = clusterNodes[state.cluster];
    if (cn) {
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(function () { cn.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); }, 50);
    }
  }

  // small-screen fallback list
  var fall = document.getElementById('treeFall');
  if (fall) {
    fall.innerHTML = BRANCH_ORDER.map(function (bn) {
      return '<details class="nest"><summary>' + noteLink(bn, branchUrl[bn]) + '</summary><ul>' + (clustersByBranch[bn] || []).map(function (cl) {
        return '<li>' + noteLink(cl.title, cl.url) + '<ul>' + (byCluster[cl.id] || []).map(function (r) {
          return '<li>' + noteLink(r.t.title, r.t.url) + ' — ' + esc(r.t.profession) + '</li>';
        }).join('') + '</ul></li>';
      }).join('') + '</ul></details>';
    }).join('');
  }
})();
