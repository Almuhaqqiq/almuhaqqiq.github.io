/* المُحَقِّق — سلوك الموقع المشترك
   1) الشريط العلوي والتذييل: يُكتبان هنا مرة واحدة فتظهر في كل الصفحات.
      لتغيير القائمة أو نص التذييل عدّل هذا الملف فقط.
   2) تمييز زر القسم الحالي في الأشرطة الفرعية.
   3) أزرار الطباعة ونسخ الرابط.
   4) البحث والتصفية في صفحات القوائم. */

(function () {
  'use strict';

  var body = document.body;
  var base = body.getAttribute('data-base') || '';
  var active = body.getAttribute('data-active') || '';
  var footerNote = body.getAttribute('data-footer') || 'بابُ التصويبات مفتوح: من وجد خطأً فليدُلّنا عليه';

  /* ---------- 1) الشريط العلوي والتذييل ---------- */
  var links = [
    ['home', '', 'الرئيسية'],
    ['manhaj', 'manhaj/', 'المنهج'],
    ['abhath', 'abhath/', 'الأبحاث'],
    ['ruwat', 'ruwat/', 'الرواة'],
    ['mustalahat', 'mustalahat/', 'المصطلحات'],
    ['about', 'about/', 'عن الموقع']
  ];

  var nav = links.map(function (l) {
    var href = l[1] === '' ? (base === '' ? './' : base) : base + l[1];
    return '<a' + (l[0] === active ? ' class="active" aria-current="page"' : '') + ' href="' + href + '">' + l[2] + '</a>';
  }).join('');

  var header =
    '<header class="site-header">' +
      '<svg class="pattern" aria-hidden="true"><defs><pattern id="pat" width="56" height="56" patternUnits="userSpaceOnUse"><g fill="none" stroke="#c9a84c" stroke-width="1"><rect x="14" y="14" width="28" height="28"/><rect x="14" y="14" width="28" height="28" transform="rotate(45 28 28)"/><circle cx="28" cy="28" r="5"/><path d="M0 0 L14 14 M56 0 L42 14 M0 56 L14 42 M56 56 L42 42"/></g></pattern></defs><rect width="100%" height="100%" fill="url(#pat)"/></svg>' +
      '<div class="container header-inner">' +
        '<a class="brand" href="' + (base === '' ? './' : base) + '">' +
          '<svg aria-hidden="true" width="33" height="54" viewBox="0 0 32 52" fill="none" stroke="#c9a84c" stroke-width="1.8" stroke-linecap="round"><circle cx="16" cy="5" r="3.6" fill="#c9a84c"/><line x1="16" y1="8.6" x2="16" y2="13.4"/><circle cx="16" cy="17" r="3.6"/><line x1="16" y1="20.6" x2="16" y2="25.4"/><circle cx="16" cy="29" r="3.6"/><line x1="16" y1="32.6" x2="16" y2="37"/><path d="M4 39.5 Q10 37.5 16 40 Q22 37.5 28 39.5 L28 49 Q22 47 16 49.5 Q10 47 4 49 Z" fill="#1a2a5e"/><line x1="16" y1="40" x2="16" y2="49.5"/></svg>' +
          '<span class="brand-text"><span class="brand-name">المُحَقِّق</span><span class="brand-sub">تحليل الأسانيد وتحقيق الأحاديث</span></span>' +
        '</a>' +
        '<div class="header-tools">' +
          '<nav class="main-nav" aria-label="القائمة الرئيسية">' + nav + '</nav>' +
          '<div class="tool-soon" title="أداة تحليل الإسناد — قريبًا">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>' +
            '<span>تحليل إسناد</span><span class="tag">قريبًا</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="header-rule"></div>' +
    '</header>';

  var footer =
    '<footer class="site-footer">' +
      '<div class="container footer-inner">' +
        '<span>المُحَقِّق — إعداد فريق المحقق</span>' +
        '<span>' + footerNote + '</span>' +
        '<a href="' + base + 'about/">عن الموقع والتصويبات</a>' +
      '</div>' +
    '</footer>';

  body.insertAdjacentHTML('afterbegin', header);
  body.insertAdjacentHTML('beforeend', footer);

  /* ---------- 2) تمييز القسم الحالي في الشريط الفرعي ---------- */
  var subnav = document.querySelector('.subnav');
  if (subnav && 'IntersectionObserver' in window) {
    var pills = subnav.querySelectorAll('a.pill[href^="#"]');
    var byId = {};
    pills.forEach(function (p) { byId[p.getAttribute('href').slice(1)] = p; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && byId[e.target.id]) {
          pills.forEach(function (p) { p.classList.remove('on'); });
          byId[e.target.id].classList.add('on');
        }
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  }

  /* ---------- 3) الطباعة ونسخ الرابط ---------- */
  document.querySelectorAll('[data-print]').forEach(function (b) {
    b.addEventListener('click', function () { window.print(); });
  });
  document.querySelectorAll('[data-copy-link]').forEach(function (b) {
    b.addEventListener('click', function () {
      var old = b.textContent;
      var done = function () { b.textContent = 'تم النسخ ✓'; setTimeout(function () { b.textContent = old; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(location.href).then(done, done);
      } else {
        var t = document.createElement('input');
        t.value = location.href; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(t); done();
      }
    });
  });

  /* ---------- 3-ب) التبديل بين مرحلتي المشجرة ---------- */
  var treeTabs = document.querySelectorAll('[data-tree-tab]');
  treeTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('data-tree-tab');
      treeTabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      document.querySelectorAll('[data-tree-panel]').forEach(function (p) {
        p.hidden = p.getAttribute('data-tree-panel') !== target;
      });
    });
  });

  /* ---------- 3-ج) نموذج الملاحظات (Formspree) ---------- */
  document.querySelectorAll('form[data-contact-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('[data-form-status]');
      var btn = form.querySelector('button[type=submit]');
      var url = form.getAttribute('action') || '';
      if (url.indexOf('REPLACE_ME') !== -1) return;          // لم يُفعَّل بعد
      var note = form.querySelector('[name=note]');
      if (note && !note.value.trim()) { status.textContent = 'اكتب ملاحظتك أولًا.'; note.focus(); return; }
      btn.disabled = true; status.textContent = 'جارٍ الإرسال…';
      fetch(url, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('send failed');
          form.reset();
          status.textContent = 'وصلتنا ملاحظتك، جزاك الله خيرًا. سننظر فيها، ونُثبت التصويب إن ثبت الخطأ.';
        })
        .catch(function () { status.textContent = 'تعذّر الإرسال. حاول مرة أخرى بعد قليل.'; })
        .then(function () { btn.disabled = false; });
    });
  });

  /* ---------- 4) البحث والتصفية ---------- */
  // تطبيع النص العربي: حذف التشكيل، وتوحيد الألف والياء والتاء المربوطة
  function norm(s) {
    return (s || '')
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[إأآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  document.querySelectorAll('[data-filter-scope]').forEach(function (scope) {
    var draftsOn = body.classList.contains('show-drafts');
    // العناصر المؤقتة (class="placeholder") لا تُحسب ما لم يكن show-drafts مفعّلًا
    var items = Array.prototype.slice.call(scope.querySelectorAll('[data-item]'))
      .filter(function (it) { return draftsOn || !it.classList.contains('placeholder'); });
    var input = scope.querySelector('[data-search]');
    var count = scope.querySelector('[data-count]');
    var empty = scope.querySelector('[data-empty]');
    var soon = scope.querySelector('[data-soon]');   // رسالة «قيد الإعداد» حين لا توجد عناصر حقيقية
    if (soon) soon.hidden = items.length !== 0;
    var state = {};   // group -> value ('' = الكل)

    items.forEach(function (it) { it._text = norm(it.textContent + ' ' + (it.getAttribute('data-keys') || '')); });

    function apply() {
      var q = input ? norm(input.value) : '';
      var shown = 0;
      items.forEach(function (it) {
        var ok = !q || it._text.indexOf(q) !== -1;
        Object.keys(state).forEach(function (g) {
          if (!ok || !state[g]) return;
          var tokens = (it.getAttribute('data-' + g) || '').split(/\s+/);
          if (tokens.indexOf(state[g]) === -1) ok = false;
        });
        it.hidden = !ok;
        if (ok) shown++;
      });
      if (count) count.textContent = shown;
      if (empty) empty.hidden = shown !== 0 || items.length === 0;
    }

    scope.querySelectorAll('[data-filter-group]').forEach(function (grp) {
      var g = grp.getAttribute('data-filter-group');
      state[g] = '';
      grp.querySelectorAll('.chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          var v = chip.getAttribute('data-value') || '';
          var already = chip.classList.contains('on') && v !== '';
          grp.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
          if (already) {           // الضغط مرة ثانية يلغي التصفية
            state[g] = '';
            var all = grp.querySelector('.chip[data-value=""]');
            if (all) { all.classList.add('on'); all.setAttribute('aria-pressed', 'true'); }
          } else {
            state[g] = v;
            chip.classList.add('on'); chip.setAttribute('aria-pressed', 'true');
          }
          apply();
        });
      });
    });

    if (input) input.addEventListener('input', apply);
    var form = scope.querySelector('form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); apply(); });
    apply();
  });
})();
