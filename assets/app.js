/* China Entry Guide - client behaviour: nav, checklist, eligibility tools.
   All data is embedded by the static build; nothing typed here leaves the browser. */
(function () {
  'use strict';

  var html = document.documentElement;
  var ROOT = html.getAttribute('data-root') || '';
  var LAST_VERIFIED = html.getAttribute('data-last-verified') || '';

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------- policy data ---------- */
  var data = { all: [], vf30: [], t240: [], hn30: [] };
  try {
    data = Object.assign(data, JSON.parse(document.getElementById('policy-data').textContent || '{}'));
  } catch (e) { /* keep defaults */ }

  /* ---------- visa eligibility checker ---------- */
  var checkBtn = document.getElementById('check-btn');
  if (checkBtn) {
    var sel = document.getElementById('nationality');
    var out = document.getElementById('visa-result');
    fillSelect(sel, data.all);
    checkBtn.addEventListener('click', function () {
      var c = sel ? sel.value : '';
      if (!c) { out.className = 'result'; out.innerHTML = '<p>Choose your passport country first.</p>'; return; }
      if (c === '__other__') {
        out.className = 'result no';
        out.innerHTML =
          '<p class="big">Not on the current visa-free lists</p>' +
          '<p>You would normally need a tourist visa. See the <a href="' + ROOT + 'visa-free/">visa-free overview</a> and apply through your nearest Chinese embassy or consulate.</p>';
        return;
      }
      var parts = [];
      if (data.vf30.indexOf(c) !== -1) parts.push('single-sided visa-free entry for up to <strong>30 days</strong>');
      if (data.hn30.indexOf(c) !== -1) parts.push('Hainan 30-day visa-free entry (stay within Hainan province)');
      if (data.t240.indexOf(c) !== -1) parts.push('240-hour visa-free transit when connecting through China to a third country/region');
      out.className = 'result ' + (parts.length ? 'ok' : 'no');
      out.innerHTML =
        '<p class="big">' + esc(c) + ': ' + (parts.length ? 'eligible for visa-free entry' : 'not on the current lists') + '</p>' +
        (parts.length
          ? '<ul>' + parts.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>'
          : '<p>A visa is normally required. Confirm with the National Immigration Administration (hotline 12367) before travel.</p>') +
        '<p class="fine">Information only — the border inspector makes the final decision. Last checked ' + esc(LAST_VERIFIED) + '.</p>';
    });
  }

  /* ---------- 240h transit checker ---------- */
  var tBtn = document.getElementById('transit-btn');
  if (tBtn) {
    var tSel = document.getElementById('t-nationality');
    fillSelect(tSel, data.all);
    tBtn.addEventListener('click', function () {
      var c = tSel ? tSel.value : '';
      var from = val('t-from'), exit = val('t-exit'), hours = Number(val('t-hours')) || 0;
      var out = document.getElementById('transit-result');
      if (!c || !from || !exit) { out.className = 'result'; out.innerHTML = '<p>Fill in nationality, origin and final destination.</p>'; return; }
      var reasons = [];
      if (c === '__other__' || data.t240.indexOf(c) === -1) reasons.push('Your nationality is not among the 57 eligible countries.');
      if (from.trim().toLowerCase() === exit.trim().toLowerCase())
        reasons.push('The policy requires onward travel to a <strong>third country or region</strong>: your final destination must differ from your origin.');
      if (!(hours > 0)) reasons.push('Enter how many hours you plan to stay.');
      else if (hours > 240) reasons.push('Your planned stay exceeds 240 hours (10 days).');
      out.className = 'result ' + (reasons.length ? 'no' : 'ok');
      out.innerHTML =
        (reasons.length
          ? '<p class="big">Does not appear to qualify</p><ul>' + reasons.map(function (r) { return '<li>' + r + '</li>'; }).join('') + '</ul>'
          : '<p class="big">Likely eligible for 240-hour visa-free transit</p><p>You still need a confirmed, dated and seated connecting ticket, and must use one of the 65 designated ports.</p>') +
        '<p class="fine">Indication only; the border inspector has final authority. Last checked ' + esc(LAST_VERIFIED) + '.</p>';
    });
  }

  /* ---------- checklist ---------- */
  var list = document.getElementById('checklist');
  if (list) {
    var bar = document.getElementById('progress-bar');
    var count = document.getElementById('progress-count');
    var KEY = 'ceg-checklist-v1';
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }
    var boxes = Array.prototype.slice.call(list.querySelectorAll('input[type=checkbox]'));
    boxes.forEach(function (b) {
      b.checked = !!saved[b.dataset.id];
      paint(b);
      b.addEventListener('change', function () {
        saved[b.dataset.id] = b.checked;
        try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
        update();
        paint(b);
      });
    });
    function paint(b) {
      var item = b.closest('.check-item');
      if (item) item.classList.toggle('done', b.checked);
    }
    function update() {
      var done = boxes.filter(function (b) { return b.checked; }).length;
      var pct = boxes.length ? Math.round((done / boxes.length) * 100) : 0;
      if (bar) bar.style.width = pct + '%';
      if (count) count.textContent = done + '/' + boxes.length + ' (' + pct + '%)';
    }
    update();
  }

  /* ---------- scroll reveal ---------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll('.card, .fact, .stat, .notice, .tool, .check-group, details');
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }

  /* ---------- helpers ---------- */
  function fillSelect(sel, items) {
    if (!sel || !items.length) return;
    items.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c; o.textContent = c;
      sel.appendChild(o);
    });
    var other = document.createElement('option');
    other.value = '__other__'; other.textContent = 'Other / not listed';
    sel.appendChild(other);
  }
  function val(id) { var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }
})();
