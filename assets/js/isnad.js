/* المُحَقِّق — رسم مشجرات الإسناد من بيانات الصفحة
   تقرأ window.ISNAD وترسم ثلاثة مستويات:
     1) مشجرة لكل طريق على حدة           → [data-isnad-paths]
     2) مشجرة كبيرة لكل كتاب (طرق الكتاب) → داخل كل كتاب في [data-isnad-paths]
     3) المشجرة الجامعة لكل الكتب والطرق   → [data-isnad-merged]
   الدمج يتم بين العقد المتطابقة الاسم كما وردت في النص فقط.
   بيانات الرواة (window.ISNAD.narrators): الاسم كما في السند ← {full, v (الحكم), cls, m (الطبقة والوفاة), flags, src}. */
(function () {
  'use strict';
  function run() {
  var D = window.ISNAD;
  if (!D) return;
  var NAR = D.narrators || {};

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function badgeClass(b) {
    if (b.indexOf('لفظه') === 0) return 'wd-b';
    if (b.indexOf('المدار') !== -1) return 'madar-b';
    if (b.indexOf('كوفي') !== -1) return 'kufi-b';
    if (b.indexOf('مدلس') !== -1) return 'mud-b';
    return 'madar-b';
  }
  function node(cls, name, sub, badges) {
    var inner = '';
    if (sub) inner += '<span>' + esc(sub) + '</span>';
    (badges || []).forEach(function (b) { inner += '<span class="badge-in ' + badgeClass(b) + '">' + esc(b) + '</span>'; });
    return '<div class="node ' + cls + '"><div class="n-name">' + esc(name) + '</div>' +
      (inner ? '<div class="n-sub">' + inner + '</div>' : '') + '</div>';
  }
  function edge(label) {
    return '<div class="edge"><i></i><span>▼ ' + esc(label) + ' ▼</span><i></i></div>';
  }

  /* عقدة راوٍ: تُظهر حكمه للعلم إن وُجد، وإلا تكتب أنه لم يُدرج حكمه */
  function narNode(name, extraBadges, extraCls) {
    var d = NAR[name];
    var badges = (extraBadges || []).slice();
    if (!d) return node('exempt' + (extraCls || ''), name, 'لم يُدرج حكمه بعد', badges);
    (d.flags || []).forEach(function (f) { badges.push(f); });
    var sub = d.v + (d.m ? ' — ' + d.m : '');
    return node((d.cls || 'exempt') + (extraCls || ''), d.full || name, sub, badges);
  }
  function topNode(t) {
    if (t.cls === 'prophet' || t.cls === 'sahabi') return node(t.cls, t.n, t.sub || '', []);
    return narNode(t.n, t.madar ? ['المدار ⭐'] : [], t.madar ? ' madar' : '');
  }

  /* ---------- ألفاظ الطرق ---------- */
  var WD = D.wording || [];
  function wordingBox(i) {
    var w = WD[i]; if (!w) return '';
    var h = '<div class="matn-box"><b>لفظ هذا الطريق</b>';
    if (w.mt) h += '<p class="quote">' + esc(w.mt) + '</p>';
    else h += '<p class="small-note">هذا هو لفظ المرجع نفسه (البخاري رقم ١ برواية أبي ذر).</p>';
    if (w.df && w.df.length) {
      h += '<b>الفروق عن لفظ المرجع:</b><ul class="diff-list">';
      w.df.forEach(function (x) { h += '<li>' + esc(x) + '</li>'; });
      h += '</ul>';
    }
    return h + '</div>';
  }
  /* ---------- 1) مشجرة طريق واحد ---------- */
  function pathHtml(p) {
    var h = '';
    D.top.forEach(function (t, i) {
      if (i > 0) h += edge(p.up[i - 1]);
      h += topNode(t);
    });
    p.low.forEach(function (l, i) {
      var last = i === p.low.length - 1;
      h += edge(l[1]);
      h += last ? node('book', l[0], p.ref, (WD[D.paths.indexOf(p)] && WD[D.paths.indexOf(p)].sh) ? ['لفظه: ' + WD[D.paths.indexOf(p)].sh] : []) : narNode(l[0]);
    });
    return '<div class="tree-scroll"><div class="tree">' + h + '</div></div>';
  }

  /* ---------- 2 و3) شجرة جامعة لمجموعة طرق: دمج العقد المتطابقة الاسم بعد المدار ---------- */
  function mergedHtml(paths) {
    var root = { children: [] };
    var ups = [[], [], [], []];
    paths.forEach(function (p) {
      p.up.forEach(function (u, i) { if (ups[i].indexOf(u) === -1) ups[i].push(u); });
      var cur = root;
      p.low.forEach(function (l, i) {
        var last = i === p.low.length - 1, found = null;
        cur.children.forEach(function (c) { if (c.name === l[0]) found = c; });
        if (!found) { found = { name: l[0], labels: [], refs: [], children: [], book: last }; cur.children.push(found); }
        if (found.labels.indexOf(l[1]) === -1) found.labels.push(l[1]);
        if (last && p.ref && found.refs.indexOf(p.ref) === -1) found.refs.push(p.ref);
        cur = found;
      });
    });
    function sub(n) {
      if (!n.children.length) return '';
      var h = '<div class="branches">';
      n.children.forEach(function (c) {
        h += '<div class="branch">' + edge(c.labels.join(' / ')) +
          (c.book ? node('book', c.name, c.refs.join(' — '), []) : narNode(c.name)) +
          sub(c) + '</div>';
      });
      return h + '</div>';
    }
    var h2 = '<div class="tree">';
    D.top.forEach(function (t, i) {
      if (i > 0) h2 += edge(ups[i - 1].join(' / '));
      h2 += topNode(t);
    });
    return h2 + sub(root) + '</div>';
  }

  // المشجرة الجامعة عريضة: تُصغَّر تلقائيًا لتُرى كاملة، وأزرار للتكبير والتصغير (والتمرير يبقى متاحًا)
  function fit(box, pw) {
    var tree = box.querySelector('.tree');
    if (!tree || !box.clientWidth) return;
    tree.style.zoom = 1;
    var need = tree.scrollWidth, s = Math.max(pw ? 0.12 : 0.3, Math.min(1, (pw || (box.clientWidth - 12)) / need));
    tree.style.zoom = s;
    box._zoom = s; box._fit = s;
    var lab = box.parentNode.querySelector('.zoom-lab'); if (lab) lab.textContent = Math.round(s * 100) + '%';
    box.scrollLeft = 0;
  }
  // تنزيل المشجرة صورة (PNG أو JPEG) بحجمها الكامل، عبر مكتبة html2canvas تُحمَّل عند أول ضغطة
  function loadH2C(cb) {
    if (window.html2canvas) return cb();
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = cb;
    s.onerror = function () { alert('تعذّر تحميل أداة التصوير. تأكد من الاتصال بالإنترنت ثم أعد المحاولة.'); };
    document.head.appendChild(s);
  }
  function exportTree(box, kind) {
    var tree = box.querySelector('.tree'), z = tree.style.zoom, btns = box.parentNode.querySelectorAll('.zoom-bar button');
    btns.forEach(function (b) { b.disabled = true; });
    loadH2C(function () {
      var oldW = tree.style.width, oldO = box.style.overflow;
      tree.style.zoom = 1; tree.style.width = 'max-content'; box.style.overflow = 'visible';
      window.html2canvas(tree, { backgroundColor: '#ffffff', scale: 2, useCORS: true, width: tree.scrollWidth, height: tree.scrollHeight, windowWidth: tree.scrollWidth + 40 })
        .then(function (c) {
          var mime = kind === 'jpg' ? 'image/jpeg' : 'image/png';
          c.toBlob(function (blob) {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'mushajjara-almuhaqqiq.' + (kind === 'jpg' ? 'jpg' : 'png');
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
          }, mime, 0.92);
        })
        .catch(function () { alert('تعذّر إنشاء الصورة.'); })
        .then(function () {
          tree.style.zoom = z; tree.style.width = oldW; box.style.overflow = oldO;
          btns.forEach(function (b) { b.disabled = false; });
        });
    });
  }
  function addZoom(box) {
    if (box.parentNode.querySelector('.zoom-bar')) return;
    var bar = document.createElement('div');
    bar.className = 'zoom-bar';
    bar.innerHTML = '<button type="button" data-z="in">＋ تكبير</button><button type="button" data-z="out">－ تصغير</button><button type="button" data-z="fit">ملاءمة العرض</button><button type="button" data-z="full">حجم كامل</button><button type="button" data-z="png">⬇ PNG</button><button type="button" data-z="jpg">⬇ JPEG</button><span class="zoom-lab"></span>';
    box.parentNode.insertBefore(bar, box);
    bar.addEventListener('click', function (e) {
      var z = e.target.getAttribute && e.target.getAttribute('data-z'); if (!z) return;
      var tree = box.querySelector('.tree'), cur = box._zoom || 1;
      if (z === 'in') cur = Math.min(1.5, cur * 1.25);
      else if (z === 'out') cur = Math.max(0.2, cur / 1.25);
      else if (z === 'full') cur = 1;
      else if (z === 'png' || z === 'jpg') { exportTree(box, z); return; }
      else { fit(box); return; }
      box._zoom = cur; tree.style.zoom = cur;
      bar.querySelector('.zoom-lab').textContent = Math.round(cur * 100) + '%';
    });
  }

  /* الطباعة / حفظ PDF: نفتح كل الكتب ونعيد ملاءمة المشجرات لعرض الورقة، ثم نُعيد الحالة */
  var wasOpen = [];
  window.addEventListener('beforeprint', function () {
    wasOpen = [];
    document.querySelectorAll('details').forEach(function (d) { if (!d.open) { wasOpen.push(d); d.open = true; } });
    document.querySelectorAll('.tree-scroll').forEach(function (b) { fit(b, 640); });
  });
  window.addEventListener('afterprint', function () {
    wasOpen.forEach(function (d) { d.open = false; });
    document.querySelectorAll('.tree-scroll').forEach(fit);
  });
  function centreAll(root) {
    var go = function () { root.querySelectorAll('.tree-scroll').forEach(function (b) { addZoom(b); fit(b); }); };
    go();
    window.addEventListener('load', go);
    window.addEventListener('resize', go);
    setTimeout(go, 400);
    root.addEventListener('toggle', function (e) {
      if (e.target && e.target.open) setTimeout(go, 50);
    }, true);
  }

  /* ---------- مشجرات الطرق + جامعة كل كتاب ---------- */
  var pathsEl = document.querySelector('[data-isnad-paths]');
  if (pathsEl) {
    var groups = {}, order = [];
    D.paths.forEach(function (p) {
      if (!groups[p.group]) { groups[p.group] = []; order.push(p.group); }
      groups[p.group].push(p);
    });
    var out = '';
    order.forEach(function (g, gi) {
      var items = groups[g];
      var cnt = items.length + (items.length === 1 ? ' طريق' : items.length === 2 ? ' طريقان' : items.length <= 10 ? ' طرق' : ' طريقًا');
      out += '<details class="bk-group"' + (gi === 0 ? ' open' : '') + '><summary>' + esc(g) + ' <small>(' + cnt + ')</small></summary>';
      if (items.length > 1) {
        out += '<details class="path-one merged-one" open><summary><b>المشجرة الكبيرة لطرق ' + esc(g) + '</b></summary>' +
          '<div class="path-body"><div class="tree-scroll">' + mergedHtml(items) + '</div>' +
          '<div class="small-note">تجمع طرق هذا الكتاب وحده (' + cnt + ')، وتُدمج فيها العقد المتطابقة الاسم كما وردت في النص.</div></div></details>';
      } else {
        out += '<div class="small-note" style="padding:0 4px 10px">لهذا الكتاب طريق واحد، فمشجرته الكبيرة هي نفسها مشجرة الطريق أدناه.</div>';
      }
      items.forEach(function (p) {
        out += '<details class="path-one"' + (items.length === 1 ? ' open' : '') + '><summary>' + esc(p.title) + '</summary>' +
          '<div class="path-body">' + pathHtml(p) + wordingBox(D.paths.indexOf(p)) +
          '<div class="src-line">' + esc(p.src) + '</div>' +
          (p.note ? '<div class="small-note">' + esc(p.note) + '</div>' : '') +
          '</div></details>';
      });
      out += '</details>';
    });
    pathsEl.innerHTML = out;
    centreAll(pathsEl);
  }

  /* ---------- المشجرة الجامعة: كل الكتب وكل الطرق ---------- */
  var mergedEl = document.querySelector('[data-isnad-merged]');
  if (mergedEl) {
    mergedEl.innerHTML = mergedHtml(D.paths);
    var wrap = mergedEl.closest(".tree-scroll"); if (wrap) wrap.classList.add("wide");
    if (wrap) centreAll(wrap.parentNode);
  }

  /* ---------- جدول ألفاظ الطرق ---------- */
  var wdEl = document.querySelector('[data-isnad-wording]');
  if (wdEl) {
    var wr = '';
    D.paths.forEach(function (p, i) {
      var w = WD[i]; if (!w) return;
      wr += '<tr><td class="strong">' + esc(p.title) + '</td><td>' + esc(w.sh) + '</td><td>' + (w.df.length ? '<ul class="diff-list">' + w.df.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '—') + '</td></tr>';
    });
    wdEl.innerHTML = '<div class="table-wrap"><table class="tbl"><thead><tr><th>الطريق</th><th>وسم اللفظ</th><th>الفروق عن لفظ المرجع</th></tr></thead><tbody>' + wr + '</tbody></table></div>';
  }

  /* ---------- جدول الرواة (أحكامهم ومصادرها) ---------- */
  var tableEl = document.querySelector('[data-isnad-narrators]');
  if (tableEl) {
    var seen = {}, rows = '';
    function addRow(name) {
      var d = NAR[name];
      if (!d || seen[name]) return;
      if (seen[d.full]) return; seen[d.full] = true;
      rows += '<tr><td class="strong">' + esc(d.full || name) + '</td><td>' + esc(d.v) + '</td><td>' + esc(d.m || '') + '</td><td>' + esc((d.flags || []).join('، ')) + '</td><td>' + esc(d.src || '') + '</td></tr>';
    }
    D.top.forEach(function (t) { addRow(t.n); });
    D.paths.forEach(function (p) { p.low.forEach(function (l, i) { if (i < p.low.length - 1) addRow(l[0]); }); });
    tableEl.innerHTML = '<div class="table-wrap"><table class="tbl"><thead><tr><th>الراوي</th><th>الحكم (للعلم)</th><th>الطبقة والوفاة</th><th>تنبيهات</th><th>المصدر</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  }
  window.MuhaqqiqTrees = { render: run };
  run();
})();
