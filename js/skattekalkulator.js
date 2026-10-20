(function () {
    'use strict';

    const root = document.getElementById('stab-skatt');
    if (!root) return;

    const STORAGE_KEY = 'lonn_skattekalkulator_v1';

    // Satser for inntektsåret 2026 (kilde: skatteetaten.no/satser). Alle kan overstyres i panelet «Satser».
    const SATSER = {
        aar: 2026,
        alminnelig: 22,
        personfradrag: 114540,
        minstePct: 46,
        minsteMaks: 95700,
        trygdePct: 7.6,
        trygdeGrense: 99650,
        trinn: [
            { fra: 226100, pct: 1.7 },
            { fra: 318300, pct: 4.0 },
            { fra: 725050, pct: 13.7 },
            { fra: 980100, pct: 16.8 },
            { fra: 1467200, pct: 17.8 }
        ]
    };

    const nf = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });
    const kr = n => (n < 0 ? '− ' : '') + nf.format(Math.abs(Math.round(n))) + ' kr';
    const pct = n => (Number.isFinite(n) ? n : 0).toFixed(1).replace('.', ',') + ' %';
    const $ = id => document.getElementById(id);
    const num = id => {
        const el = $(id);
        const v = el ? parseFloat(String(el.value).replace(',', '.')) : NaN;
        return Number.isFinite(v) ? v : 0;
    };

    const card = 'bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm';
    const label = 'block text-xs font-semibold text-slate-500 mb-1.5';
    const input = 'glass-input glass-input-brand';
    const subBtn = 'sk-sub-btn px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800';
    const actBtn = 'px-4 py-2.5 rounded-xl text-sm font-bold bg-brand-500 hover:bg-brand-600 text-white transition-colors';

    const field = (id, text, value, step = 'any', placeholder = '') =>
        `<div><label for="${id}" class="${label}">${text}</label><input id="${id}" data-sk type="number" step="${step}" value="${value}" placeholder="${placeholder}" class="${input}"></div>`;

    const trinnFelt = SATSER.trinn.map((t, i) => `
        <div class="grid grid-cols-2 gap-3">
            ${field('sk-t' + i + '-fra', 'Trinn ' + (i + 1) + ' fra (kr)', t.fra, '50')}
            ${field('sk-t' + i + '-pct', 'Sats (%)', t.pct, '0.1')}
        </div>`).join('');

    root.innerHTML = `
        <div class="space-y-6">
            <div class="${card}">
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center">🧾 Skattekalkulator ${SATSER.aar}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-5">Veiledende beregning for lønnsinntekt i skatteklasse 1. Bruk skattekortet og skattemeldingen som fasit.</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    ${field('sk-inntekt', 'Brutto lønn', '600000', '1000')}
                    <div>
                        <label for="sk-periode" class="${label}">Beløpet gjelder per</label>
                        <select id="sk-periode" data-sk class="${input}">
                            <option value="aar" selected>År</option>
                            <option value="mnd">Måned (× 12)</option>
                        </select>
                    </div>
                    ${field('sk-fradrag', 'Ekstra fradrag per år (kr)', '0', '500', 'f.eks. reise, fagforening')}
                    <button type="button" data-sk-act="hent" class="${actBtn}">Hent fra lønnskalkulator</button>
                </div>
            </div>

            <div class="flex space-x-2 overflow-x-auto pb-1 scrollbar-thin">
                <button type="button" data-sk-sub="netto" class="${subBtn}">💰 Brutto til netto</button>
                <button type="button" data-sk-sub="trekk" class="${subBtn}">📐 Trekkprosent</button>
                <button type="button" data-sk-sub="hvaom" class="${subBtn}">🔮 Hva om</button>
            </div>

            <div id="sk-p-netto" data-sk-panel="netto" class="${card}"></div>

            <div id="sk-p-trekk" data-sk-panel="trekk" class="${card}" hidden>
                <div id="sk-trekk-out"></div>
            </div>

            <div id="sk-p-hvaom" data-sk-panel="hvaom" class="${card}" hidden>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    ${field('sk-wi-inntekt', 'Ekstra inntekt per år (kr)', '10000', '1000', 'f.eks. overtid')}
                    ${field('sk-wi-fradrag', 'Ekstra fradrag per år (kr)', '10000', '1000')}
                    ${field('sk-wi-okning', 'Lønnsøkning per måned (kr)', '2000', '100')}
                </div>
                <div id="sk-hvaom-out"></div>
            </div>

            <details class="${card}">
                <summary class="cursor-pointer font-bold text-slate-900 dark:text-white">⚙️ Satser ${SATSER.aar} (kan overstyres)</summary>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-4">Satsene endres hvert år. Personfradraget bør du kontrollere mot Skatteetaten.</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    ${field('sk-s-alm', 'Skatt på alminnelig inntekt (%)', SATSER.alminnelig, '0.1')}
                    ${field('sk-s-person', 'Personfradrag (kr)', SATSER.personfradrag, '10')}
                    ${field('sk-s-minste-pct', 'Minstefradrag (% av lønn)', SATSER.minstePct, '0.1')}
                    ${field('sk-s-minste-maks', 'Minstefradrag øvre grense (kr)', SATSER.minsteMaks, '100')}
                    ${field('sk-s-trygd', 'Trygdeavgift lønn (%)', SATSER.trygdePct, '0.1')}
                    ${field('sk-s-trygd-grense', 'Trygdeavgift nedre grense (kr)', SATSER.trygdeGrense, '50')}
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${trinnFelt}</div>
                <button type="button" data-sk-act="reset-satser" class="mt-4 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">Tilbakestill satser</button>
            </details>
        </div>`;

    const satser = () => ({
        alm: num('sk-s-alm') / 100,
        person: num('sk-s-person'),
        minstePct: num('sk-s-minste-pct') / 100,
        minsteMaks: num('sk-s-minste-maks'),
        trygd: num('sk-s-trygd') / 100,
        trygdeGrense: num('sk-s-trygd-grense'),
        trinn: SATSER.trinn.map((_, i) => ({ fra: num('sk-t' + i + '-fra'), pct: num('sk-t' + i + '-pct') / 100 }))
            .sort((a, b) => a.fra - b.fra)
    });

    function beregn(brutto, ekstraFradrag, s) {
        brutto = Math.max(0, brutto);
        const minste = Math.min(brutto * s.minstePct, s.minsteMaks);
        const person = s.person;
        const alm = Math.max(0, brutto - minste - person - Math.max(0, ekstraFradrag));
        const skattAlm = alm * s.alm;
        const trinn = s.trinn.map((t, i) => {
            const til = i + 1 < s.trinn.length ? s.trinn[i + 1].fra : Infinity;
            const grunnlag = Math.max(0, Math.min(brutto, til) - t.fra);
            return { fra: t.fra, til, pct: t.pct, grunnlag, skatt: grunnlag * t.pct };
        });
        const trinnSum = trinn.reduce((sum, t) => sum + t.skatt, 0);
        const trygd = brutto > s.trygdeGrense
            ? Math.min(brutto * s.trygd, 0.25 * (brutto - s.trygdeGrense))
            : 0;
        const total = skattAlm + trinnSum + trygd;
        return { brutto, minste, person, ekstraFradrag: Math.max(0, ekstraFradrag), alm, skattAlm, trinn, trinnSum, trygd, total, netto: brutto - total };
    }

    const marginal = (brutto, ekstraFradrag, s) =>
        (beregn(brutto + 1000, ekstraFradrag, s).total - beregn(brutto, ekstraFradrag, s).total) / 10;

    const row = (text, value, cls = '') =>
        `<div class="line-row py-1.5 ${cls} ${cls.includes('strong') ? '' : 'text-slate-600 dark:text-slate-400'}"><span>${text}</span><span class="font-mono">${value}</span></div>`;
    const big = (title, value, sub = '') =>
        `<div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4"><p class="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-1">${title}</p><p class="text-2xl font-mono font-extrabold text-slate-900 dark:text-white">${value}</p>${sub ? `<p class="text-xs text-slate-500 mt-1">${sub}</p>` : ''}</div>`;

    function grunnlag() {
        const maanedlig = $('sk-periode')?.value === 'mnd';
        const brutto = num('sk-inntekt') * (maanedlig ? 12 : 1);
        return { brutto, fradrag: num('sk-fradrag'), s: satser() };
    }

    function visNetto(g) {
        const r = beregn(g.brutto, g.fradrag, g.s);
        const trinnRader = r.trinn.filter(t => t.grunnlag > 0)
            .map(t => row(`Trinn ${r.trinn.indexOf(t) + 1}: ${pct(t.pct * 100)} av ${kr(t.grunnlag)}`, kr(t.skatt), 'pl-4 text-xs')).join('');
        const marg = marginal(g.brutto, g.fradrag, g.s);
        $('sk-p-netto').innerHTML = `
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                ${big('Netto per år', kr(r.netto))}
                ${big('Netto per måned', kr(r.netto / 12), 'snitt over 12 måneder')}
                ${big('Skatt totalt', kr(r.total), `${pct(r.brutto ? r.total / r.brutto * 100 : 0)} av brutto`)}
                ${big('Marginalskatt', pct(marg), 'av neste krone du tjener')}
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
                <div>
                    <p class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Alminnelig inntekt</p>
                    ${row('Brutto lønn', kr(r.brutto))}
                    ${row('Minstefradrag', '− ' + kr(r.minste))}
                    ${row('Personfradrag', '− ' + kr(Math.min(r.person, Math.max(0, r.brutto - r.minste - r.ekstraFradrag))))}
                    ${r.ekstraFradrag ? row('Ekstra fradrag', '− ' + kr(r.ekstraFradrag)) : ''}
                    ${row('Alminnelig inntekt', kr(r.alm), 'strong border-t border-slate-200 dark:border-slate-800 mt-1 pt-2')}
                </div>
                <div>
                    <p class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 mt-6 lg:mt-0">Skatt</p>
                    ${row(`Skatt på alminnelig inntekt (${pct(g.s.alm * 100)})`, kr(r.skattAlm))}
                    ${row('Trinnskatt', kr(r.trinnSum))}
                    ${trinnRader}
                    ${row(`Trygdeavgift (${pct(g.s.trygd * 100)})`, kr(r.trygd))}
                    ${row('Total skatt', kr(r.total), 'strong border-t border-slate-200 dark:border-slate-800 mt-1 pt-2')}
                </div>
            </div>
            <p class="text-xs text-slate-500 mt-4">Skattetrekket tas normalt i 10,5 måneder (ikke juni halvt og desember). Det gir ca. ${kr(r.total / 10.5)} i trekk per vanlig måned.</p>`;
    }

    function visTrekk(g) {
        const r = beregn(g.brutto, g.fradrag, g.s);
        const marg = marginal(g.brutto, g.fradrag, g.s);
        const maaneder = parseFloat($('sk-fordeling')?.value) || 10.5;
        const grunnlagTrekk = g.brutto * maaneder / 12;
        const anbefalt = grunnlagTrekk > 0 ? r.total / grunnlagTrekk * 100 : 0;
        const aaretsSnitt = g.brutto > 0 ? r.total / g.brutto * 100 : 0;
        const naa = parseFloat($('skatt')?.value) || 0;
        const naaType = $('skatt-type')?.value;
        const diff = naa - anbefalt;
        const sammenligning = naaType === 'prosent'
            ? `<p class="text-sm mt-4 text-slate-700 dark:text-slate-300">Lønnskalkulatoren bruker nå <strong>${pct(naa)}</strong>. ${Math.abs(diff) < 0.3
                ? 'Det samsvarer godt med anbefalingen.'
                : diff < 0
                    ? `Det er ${pct(-diff)} <strong>for lavt</strong>, og du kan få restskatt.`
                    : `Det er ${pct(diff)} <strong>for høyt</strong>, og du kan få penger igjen.`}</p>`
            : `<p class="text-sm mt-4 text-slate-500">Lønnskalkulatoren bruker tabelltrekk akkurat nå. Bruk knappen under for å bytte til prosenttrekk.</p>`;
        const forrige = $('sk-fordeling')?.value || '10.5';
        $('sk-trekk-out').innerHTML = `
            <div class="max-w-xs mb-5">
                <label for="sk-fordeling" class="${label}">Trekket fordeles på</label>
                <select id="sk-fordeling" data-sk class="${input}">
                    <option value="10.5">10,5 måneder (standard)</option>
                    <option value="12">12 måneder</option>
                </select>
            </div>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                ${big('Anbefalt trekkprosent', pct(anbefalt), 'på lønn i trekkmånedene')}
                ${big('Snitt over hele året', pct(aaretsSnitt))}
                ${big('Trekk per måned', kr(r.total / maaneder))}
                ${big('Trekk på overtid', pct(marg), 'marginalskatt')}
            </div>
            ${sammenligning}
            <div class="flex flex-wrap gap-3 mt-5">
                <button type="button" data-sk-act="bruk-pct" data-val="${anbefalt.toFixed(1)}" class="${actBtn}">Bruk ${pct(anbefalt)} som prosenttrekk</button>
                <button type="button" data-sk-act="bruk-ot" data-val="${marg.toFixed(1)}" class="px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">Bruk ${pct(marg)} som overtidstrekk</button>
            </div>
            <p class="text-xs text-slate-500 mt-4">«Bruk» setter verdien i lønnskalkulatoren. Overtidstrekket brukes når skattemetoden er tabelltrekk på fastlønn + prosent på overtid.</p>`;
        $('sk-fordeling').value = forrige;
    }

    function visHvaOm(g) {
        const basis = beregn(g.brutto, g.fradrag, g.s);
        const ekstra = Math.max(0, num('sk-wi-inntekt'));
        const fradrag = Math.max(0, num('sk-wi-fradrag'));
        const okning = num('sk-wi-okning') * 12;

        const medInntekt = beregn(g.brutto + ekstra, g.fradrag, g.s);
        const skattInntekt = medInntekt.total - basis.total;
        const medFradrag = beregn(g.brutto, g.fradrag + fradrag, g.s);
        const besparelse = basis.total - medFradrag.total;
        const medOkning = beregn(g.brutto + okning, g.fradrag, g.s);
        const nettoOkning = medOkning.netto - basis.netto;

        $('sk-hvaom-out').innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                    <p class="font-bold text-slate-900 dark:text-white mb-2">Ekstra inntekt ${kr(ekstra)}</p>
                    ${row('Ekstra skatt', kr(skattInntekt))}
                    ${row('Du beholder', kr(ekstra - skattInntekt), 'strong')}
                    ${row('Skatt av tillegget', pct(ekstra ? skattInntekt / ekstra * 100 : 0))}
                </div>
                <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                    <p class="font-bold text-slate-900 dark:text-white mb-2">Ekstra fradrag ${kr(fradrag)}</p>
                    ${row('Lavere skatt', kr(besparelse), 'strong')}
                    ${row('Verdi av fradraget', pct(fradrag ? besparelse / fradrag * 100 : 0))}
                    ${row('Nytt netto per år', kr(medFradrag.netto))}
                </div>
                <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                    <p class="font-bold text-slate-900 dark:text-white mb-2">Lønnsøkning ${kr(okning / 12)} / mnd</p>
                    ${row('Netto økning per måned', kr(nettoOkning / 12), 'strong')}
                    ${row('Netto økning per år', kr(nettoOkning))}
                    ${row('Beholder av økningen', pct(okning ? nettoOkning / okning * 100 : 0))}
                </div>
            </div>`;
    }

    function oppdater() {
        const g = grunnlag();
        visNetto(g);
        visTrekk(g);
        visHvaOm(g);
    }

    function lagre() {
        try {
            const verdier = {};
            root.querySelectorAll('[data-sk]').forEach(el => { if (el.id) verdier[el.id] = el.value; });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(verdier));
        } catch (e) {}
    }

    function last() {
        try {
            const lagret = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            Object.keys(lagret).forEach(id => { const el = $(id); if (el) el.value = lagret[id]; });
        } catch (e) {}
    }

    function visDel(del) {
        root.querySelectorAll('[data-sk-panel]').forEach(p => { p.hidden = p.dataset.skPanel !== del; });
        root.querySelectorAll('[data-sk-sub]').forEach(b => {
            const aktiv = b.dataset.skSub === del;
            b.classList.toggle('bg-brand-500', aktiv);
            b.classList.toggle('text-white', aktiv);
            b.classList.toggle('text-slate-500', !aktiv);
        });
        try { localStorage.setItem(STORAGE_KEY + '_del', del); } catch (e) {}
    }

    root.addEventListener('input', event => {
        if (!event.target.matches('[data-sk]')) return;
        lagre();
        oppdater();
    });
    root.addEventListener('change', event => {
        if (!event.target.matches('[data-sk]')) return;
        lagre();
        oppdater();
    });

    root.addEventListener('click', event => {
        const sub = event.target.closest('[data-sk-sub]');
        if (sub) return visDel(sub.dataset.skSub);

        const knapp = event.target.closest('[data-sk-act]');
        if (!knapp) return;
        const handling = knapp.dataset.skAct;

        if (handling === 'hent') {
            const brutto = window.sisteBrutto || 0;
            if (brutto <= 0) return visToast('Ingen brutto i lønnskalkulatoren ennå', 'rose');
            $('sk-periode').value = 'mnd';
            $('sk-inntekt').value = Math.round(brutto);
            lagre();
            oppdater();
            visToast('Hentet månedlig brutto fra lønnskalkulatoren');
        } else if (handling === 'reset-satser') {
            const standard = {
                'sk-s-alm': SATSER.alminnelig, 'sk-s-person': SATSER.personfradrag, 'sk-s-minste-pct': SATSER.minstePct,
                'sk-s-minste-maks': SATSER.minsteMaks, 'sk-s-trygd': SATSER.trygdePct, 'sk-s-trygd-grense': SATSER.trygdeGrense
            };
            SATSER.trinn.forEach((t, i) => { standard['sk-t' + i + '-fra'] = t.fra; standard['sk-t' + i + '-pct'] = t.pct; });
            Object.keys(standard).forEach(id => { $(id).value = standard[id]; });
            lagre();
            oppdater();
        } else if (handling === 'bruk-pct') {
            const typeEl = $('skatt-type');
            const pctEl = $('skatt');
            if (!typeEl || !pctEl) return;
            typeEl.value = 'prosent';
            pctEl.value = knapp.dataset.val;
            byttSkattType(); beregnAlt(); lagreInnstillinger();
            oppdater();
            visToast(`Prosenttrekk satt til ${pct(parseFloat(knapp.dataset.val))}`);
        } else if (handling === 'bruk-ot') {
            const otEl = $('skatt-overtid');
            if (!otEl) return;
            otEl.value = knapp.dataset.val;
            beregnAlt(); lagreInnstillinger();
            visToast(`Overtidstrekk satt til ${pct(parseFloat(knapp.dataset.val))}`);
        }
    });

    $('btn-sal-skatt')?.addEventListener('click', oppdater);

    last();
    oppdater();
    $('sk-fordeling') && last();
    let del = 'netto';
    try { del = localStorage.getItem(STORAGE_KEY + '_del') || 'netto'; } catch (e) {}
    visDel(del);
})();
