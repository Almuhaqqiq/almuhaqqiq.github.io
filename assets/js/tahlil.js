/* المُحَقِّق — أداة «تحليل إسناد»
   يُدخل الزائر نص الحديث، فتُطابقه الأداة مع فهرس الأحاديث التي درسناها (assets/data/hadith-index.js).
   إن وُجد: تقرير مختصر + المشجرة الجامعة + رابط البحث الكامل.
   وإن لم يوجد: تقول ذلك بصراحة وتعرض نموذج طلب دراسته. لا تُنتج الأداة حكمًا من عندها أبدًا. */
(function () {
  'use strict';
  var base = document.body.getAttribute('data-base') || '';
  var form = document.getElementById('tahlil-form');
  var input = document.getElementById('tahlil-text');
  var out = document.getElementById('tahlil-out');
  if (!form || !input || !out) return;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // تطبيع: حذف التشكيل والتطويل وعلامات الترقيم والأقواس، وتوحيد الألف والياء والتاء المربوطة
  function norm(s) {
    return (s || '')
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
      .replace(/[^ء-ي0-9\s]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function words(s) { var o = {}; norm(s).split(' ').forEach(function (w) { if (w.length > 1) o[w] = 1; }); return o; }

  // درجة التطابق: أقوى ما ينتج عن (١) عبارات الفهرس الموجودة في نص الزائر، (٢) تشابه الكلمات مع لفظ المرجع
  function score(text, item) {
    var t = norm(text), hits = 0;
    item.keys.forEach(function (k) { if (t.indexOf(norm(k)) !== -1) hits++; });
    var a = words(text), b = words(item.ref), inter = 0, na = 0, nb = 0, w;
    for (w in a) na++;
    for (w in b) { nb++; if (a[w]) inter++; }
    var cover = nb ? inter / nb : 0;               // كم من كلمات المرجع وردت في نص الزائر
    return { hits: hits, cover: cover, ok: hits >= 1 || cover >= 0.6 };
  }

  function search(text) {
    var best = null;
    (window.HADITH_INDEX || []).forEach(function (it) {
      var s = score(text, it);
      if (s.ok && (!best || s.hits + s.cover > best.s.hits + best.s.cover)) best = { it: it, s: s };
    });
    return best;
  }

  function loadData(item, cb) {
    if (window.__loaded === item.id) return cb();
    var sc = document.createElement('script');
    sc.src = base + item.data + '?v=' + Date.now();
    sc.onload = function () { window.__loaded = item.id; cb(); };
    sc.onerror = function () { cb(new Error('data')); };
    document.head.appendChild(sc);
  }

  function found(best, text) {
    var it = best.it;
    out.innerHTML =
      '<section class="tl-card ok">' +
        '<div class="tl-badge">وُجد في أبحاثنا</div>' +
        '<h2>' + esc(it.title) + '</h2>' +
        '<p class="tl-verdict">' + esc(it.verdict) + '</p>' +
        '<div class="tl-stats" data-tl-stats></div>' +
        '<ul class="tl-notes">' + it.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' +
        '<p><a class="btn" href="' + base + it.url + '">افتح البحث الكامل: التخريج والمشجرات والألفاظ والرواة</a></p>' +
      '</section>' +
      '<section class="tl-card"><h2>المشجرة الجامعة (كل الكتب وكل الطرق)</h2>' +
        '<div class="tree-scroll"><div data-isnad-merged></div></div>' +
        '<p class="small-note">وتحت اسم كل راوٍ حكمه في «تقريب التهذيب» للعلم لا للدراسة. اضغط «تصغير» أو «تكبير» أو حمّلها صورة.</p>' +
      '</section>';
    loadData(it, function (err) {
      if (err || !window.ISNAD) { out.insertAdjacentHTML('beforeend', '<p class="soon-msg">تعذّر تحميل بيانات المشجرة. افتح البحث الكامل من الرابط أعلاه.</p>'); return; }
      var D = window.ISNAD, books = {}, nar = 0, extra = 0;
      D.paths.forEach(function (p, i) {
        books[p.group] = 1;
        var w = (D.wording || [])[i];
        if (w && w.df && w.df.some(function (x) { return x.indexOf('زيادة قسم') === 0; })) extra++;
      });
      nar = Object.keys(D.narrators || {}).length;
      var stats = out.querySelector('[data-tl-stats]');
      stats.innerHTML =
        '<div><b>' + D.paths.length + '</b><span>طريقًا</span></div>' +
        '<div><b>' + Object.keys(books).length + '</b><span>كتب</span></div>' +
        '<div><b>' + (D.top ? D.top.length - 2 : 0) + '</b><span>رواة حتى المدار</span></div>' +
        '<div><b>' + extra + '</b><span>طريقًا معروف لفظها فيها زيادة قسم «إلى الله ورسوله»</span></div>';
      if (window.MuhaqqiqTrees) window.MuhaqqiqTrees.render();
    });
  }

  function notFound(text) {
    out.innerHTML =
      '<section class="tl-card no">' +
        '<div class="tl-badge no">لم يُدرس بعد</div>' +
        '<h2>هذا الحديث ليس في أبحاثنا المنشورة</h2>' +
        '<p>لا يُنتج «المحقق» حكمًا من عنده، ولا يحكم على إسناد لم يُدرَس بمنهجه بعد. الأحاديث المدروسة الآن قليلة ونزيدها بحثًا بعد بحث.</p>' +
        '<p>يمكنك طلب دراسته بإرسال النص إلينا:</p>' +
        '<form class="form" data-contact-form action="https://formspree.io/f/mvkglaqv" method="post">' +
          '<input type="text" name="_gotcha" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0" aria-hidden="true">' +
          '<input type="hidden" name="_subject" value="طلب دراسة حديث — أداة تحليل إسناد">' +
          '<input type="hidden" name="place" value="طلب دراسة حديث">' +
          '<div class="f-field"><label for="tl-note">نص الحديث المطلوب</label><textarea id="tl-note" name="note" rows="4">' + esc(text) + '</textarea></div>' +
          '<div class="f-actions"><button class="btn" type="submit">أرسل الطلب</button><span data-form-status role="status"></span></div>' +
        '</form>' +
      '</section>';
    // نموذج أُنشئ بعد تحميل الصفحة: نربط معالجه هنا (نفس سلوك site.js)
    var f = out.querySelector('form[data-contact-form]');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = f.querySelector('[data-form-status]'), btn = f.querySelector('button[type=submit]');
      var note = f.querySelector('[name=note]');
      if (!note.value.trim()) { status.textContent = 'اكتب نص الحديث أولًا.'; return; }
      btn.disabled = true; status.textContent = 'جارٍ الإرسال…';
      fetch(f.getAttribute('action'), { method: 'POST', body: new FormData(f), headers: { 'Accept': 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(); status.textContent = 'وصلنا طلبك، جزاك الله خيرًا. سننظر فيه ونُدرجه في قائمة الدراسة.'; })
        .catch(function () { status.textContent = 'تعذّر الإرسال. حاول بعد قليل.'; })
        .then(function () { btn.disabled = false; });
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (text.length < 8) { out.innerHTML = '<p class="soon-msg">اكتب نص الحديث (كلمات كافية) ثم اضغط «حلّل».</p>'; input.focus(); return; }
    var best = search(text);
    if (best) found(best, text); else notFound(text);
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
