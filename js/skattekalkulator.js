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
        fagforeningMaks: 8700,
        oppjustering: 1,
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

    // Forklaringer slås opp på starten av ledeteksten
    const TIPS = {
        'Brutto lønn': 'Lønn før skatt. Her regnes alt som skattepliktig lønn, inkludert tillegg og feriepenger.',
        'Beløpet gjelder per': 'Velg om beløpet du skriver inn er årslønn eller månedslønn. Månedslønn ganges med 12.',
        'Fagforeningskontingent': 'Kontingent du har betalt til fagforening i året. Den delen som ligger under maksgrensen gir fradrag, så du betaler mindre skatt.',
        'Fagforening maks': 'Høyeste beløp du kan trekke fra for fagforeningskontingent per år. Grensen endres fra år til år, så kontroller den mot Skatteetaten.',
        'Andre fradrag': 'Andre fradrag utover minstefradrag og personfradrag, for eksempel reise til jobb over grensen eller gjeldsrenter.',
        'Rentekostnader': 'Renter du har betalt på lån i løpet av året, for eksempel boliglån og forbrukslån. Du finner beløpet i årsoppgaven fra banken. Det trekkes fra alminnelig inntekt og gir lavere skatt.',
        'Realisert gevinst': 'Fortjeneste du har tatt ut ved å selge aksjer eller fond i løpet av året (salgssum minus kjøpssum). Gevinsten er skattepliktig og øker skatten.',
        'Realisert tap': 'Tap du har tatt ved å selge aksjer eller fond for mindre enn du kjøpte for. Tapet er fradragsberettiget og trekkes fra alminnelig inntekt. Urealisert tap, altså uten salg, gir ikke fradrag.',
        'Oppjusteringsfaktor': 'Gevinst og tap på aksjer og fond ganges med denne faktoren før skatten regnes ut. 1 betyr ingen oppjustering. Satsen endres fra år til år, så kontroller den mot Skatteetaten.',
        'Tap aksjer/fond': 'Netto tap på aksjer og fond (tap minus gevinst, etter oppjustering). Det reduserer alminnelig inntekt.',
        'Gevinst aksjer/fond': 'Netto gevinst på aksjer og fond (gevinst minus tap, etter oppjustering). Det øker alminnelig inntekt.',
        'Ekstra fradrag': 'Fradrag utover minstefradrag og personfradrag, for eksempel reise til jobb over grensen, fagforeningskontingent eller gjeldsrenter. Det reduserer alminnelig inntekt.',
        'Ekstra inntekt': 'Penger du tjener i tillegg, for eksempel overtid eller en bonus. Kalkulatoren viser hvor mye du beholder etter skatt.',
        'Lønnsøkning': 'Hvor mye lønna øker per måned før skatt. Du ser hvor mye av økningen som blir igjen etter skatt.',
        'Skatt på alminnelig inntekt': 'Flat skatt som betales av alminnelig inntekt (brutto minus fradrag). Satsen er den samme for alle.',
        'Personfradrag': 'Et fast fradrag alle får. Du betaler ikke skatt på alminnelig inntekt for dette beløpet.',
        'Minstefradrag (%': 'Et automatisk fradrag for lønnsinntekt, regnet som en prosent av lønna.',
        'Minstefradrag øvre': 'Minstefradraget kan ikke bli høyere enn dette beløpet.',
        'Trygdeavgift lønn': 'Avgift som går til folketrygden (pensjon, sykepenger og andre ytelser). Trekkes som en prosent av lønna.',
        'Trygdeavgift nedre': 'Du betaler ikke trygdeavgift hvis lønna er under denne grensen. Rett over grensen trappes avgiften gradvis opp.',
        'Trinn': 'Trinnskatt er ekstra skatt som betales av den delen av lønna som ligger over hvert trinn. Den delen av lønna som ligger under trinnet, påvirkes ikke.',
        'Sats (%)': 'Prosenten som gjelder for dette trinnet.',
        'Minstefradrag': 'Et automatisk fradrag for lønnsinntekt. Du trenger ikke dokumentere det.',
        'Alminnelig inntekt': 'Brutto lønn minus fradrag. Det er dette beløpet skatten på alminnelig inntekt regnes av.',
        'Skattegrunnlag': 'Kalkulatoren viser to ulike grunnlag: alminnelig inntekt etter fradrag, og brutto personinntekt som brukes til trinnskatt og trygdeavgift.',
        'År til dato': 'Bruk tall fra lønnsslippene og forventet inntekt resten av året for å lage en veiledende årsprognose. Status for skattetrekk sammenlignes med datoen i dag og valgt trekkfordeling.',
        'Lønninger igjen i år': 'Antall lønninger du forventer å få resten av året. Standardverdien teller måneder etter inneværende måned; juster den hvis lønnsslippen for denne måneden ikke er med i tallene hittil.',
        'Ekstra inntekt resten av året': 'Forventet skattepliktig engangsinntekt resten av året, for eksempel bonus eller overtid. Ikke ta med inntekt som allerede er inkludert i bruttoinntekt hittil.',
        'Faktisk bruttoinntekt hittil': 'Samlet bruttolønn hittil i år, slik den står på lønnsslippen eller i siste lønnsoppgave.',
        'Faktisk skatt trukket hittil': 'Samlet skattetrekk hittil i år fra lønnsslippene. Prosenten viser hvor stor del av bruttoinntekten som er trukket i skatt.',
        'Faktisk brutto hittil': 'Bruttoinntekten du har lagt inn for året til nå.',
        'Prognose brutto for året': 'Inntekt hittil pluss forventet lønn for gjenstående lønninger og eventuell ekstra inntekt.',
        'Prognose skatt for året': 'Beregnet skatt for hele året ut fra prognosen. Prosenten viser hvor stor del av denne skatten som er trukket hittil.',
        'Opprinnelig årsestimat': 'Skatt beregnet av årsinntekten og fradragene øverst, uten tall fra lønnsslippene.',
        'Prognose med hittil-tall': 'Skatt beregnet av den justerte årsprognosen.',
        'Estimert skatt som gjenstår': 'Prognose for årets skatt minus skatten som allerede er trukket. Et negativt beløp kan bety at du har betalt for mye.',
        'Anbefalt trekk per gjenstående': 'Skatt som gjenstår, fordelt likt på lønningene du har igjen i år.',
        'Trekkstatus per i dag': 'Sammenligner skatt trukket hittil med hva som bør være trukket til i dag. Trekket tas vanligvis i 10,5 måneder, så desember er skattefri og juni halv.',
        'Brutto personinntekt': 'Grunnlaget for trinnskatt og trygdeavgift. Fradrag trekkes ikke fra før disse beregnes.',
        'Skatt på alminnelig': 'Flat prosent av alminnelig inntekt.',
        'Trinnskatt': 'Ekstra skatt som øker jo mer du tjener. Beregnes av brutto lønn, i trinn.',
        'Trygdeavgift': 'Avgift til folketrygden, en prosent av brutto lønn.',
        'Total skatt': 'Skatt på alminnelig inntekt, trinnskatt og trygdeavgift lagt sammen.',
        'Netto per år': 'Det du sitter igjen med etter skatt i løpet av et år.',
        'Netto per måned': 'Netto per år delt på 12. Faktisk utbetaling varierer fordi skatt trekkes i 10,5 måneder.',
        'Skatt totalt': 'Total skatt, og hvor stor andel av brutto lønn den utgjør (effektiv skatt).',
        'Marginalskatt': 'Skatten på den neste kronen du tjener. Den er høyere enn gjennomsnittet fordi trinnskatten øker, og er viktig for overtid og bonus.',
        'Anbefalt trekkprosent': 'Prosenten som bør trekkes av hver lønnsutbetaling for at skatten går opp ved årets slutt.',
        'Snitt over hele året': 'Total skatt delt på hele årslønna.',
        'Trekk per måned': 'Skatt som trekkes hver vanlige måned.',
        'Trekk på overtid': 'Marginalskatten, som er en passende prosent å trekke av overtid og tillegg.',
        'Trekket fordeles': 'Skattetrekket tas vanligvis i 10,5 måneder. Juni trekkes halvt, og i desember er det skattefritt.',
        'Ekstra skatt': 'Hvor mye mer du betaler i skatt av den ekstra inntekten.',
        'Du beholder': 'Det som blir igjen av den ekstra inntekten etter skatt.',
        'Skatt av tillegget': 'Skatteprosenten på den ekstra inntekten. Den tilsvarer marginalskatten.',
        'Lavere skatt': 'Hvor mye skatten din reduseres av det ekstra fradraget.',
        'Verdi av fradraget': 'Hvor mange prosent av fradraget som kommer tilbake som lavere skatt.',
        'Nytt netto': 'Netto årslønn etter at fradraget er tatt med.',
        'Netto økning': 'Hvor mye mer du får utbetalt etter skatt.',
        'Beholder av økningen': 'Hvor stor andel av lønnsøkningen som blir igjen etter skatt.'
    };
    const tipFor = text => {
        const t = String(text).replace(/^[−\s]+/, '');
        const key = Object.keys(TIPS).filter(k => t.startsWith(k)).sort((a, b) => b.length - a.length)[0];
        return key ? `<span class="sk-tip" tabindex="0" role="button" aria-label="Forklaring" data-tip="${TIPS[key]}">?</span>` : '';
    };

    const field = (id, text, value, step = 'any', placeholder = '', min = '', max = '') =>
        `<div><label for="${id}" class="${label}">${text}${tipFor(text)}</label><input id="${id}" data-sk type="number" step="${step}" value="${value}" placeholder="${placeholder}"${min !== '' ? ` min="${min}"` : ''}${max !== '' ? ` max="${max}"` : ''} class="${input}"></div>`;

    const trinnFelt = SATSER.trinn.map((t, i) => `
        <div class="grid grid-cols-2 gap-3">
            ${field('sk-t' + i + '-fra', 'Trinn ' + (i + 1) + ' fra (kr)', t.fra, '50')}
            ${field('sk-t' + i + '-pct', 'Sats (%)', t.pct, '0.1')}
        </div>`).join('');

    root.innerHTML = `
        <div class="space-y-6">
            <div class="${card}">
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center">🧾 Skattekalkulator ${SATSER.aar}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Veiledende beregning for lønnsinntekt i skatteklasse 1. Bruk skattekortet og skattemeldingen som fasit.</p>
                <div class="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 mb-5 text-xs text-amber-900 dark:text-amber-200">
                    <strong>Usikkert estimat:</strong> Dette er en forenklet beregning, ikke et vedtak eller en garanti for skattetrekk eller skatteoppgjør. Kontroller opplysninger og skattekort hos
                    <a href="https://www.skatteetaten.no/person/skatt/skattekort/" target="_blank" rel="noopener noreferrer" class="underline font-bold">Skatteetaten</a>.
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    ${field('sk-inntekt', 'Brutto lønn', '600000', '1000')}
                    <div>
                        <label for="sk-periode" class="${label}">Beløpet gjelder per</label>
                        <select id="sk-periode" data-sk class="${input}">
                            <option value="aar" selected>År</option>
                            <option value="mnd">Måned (× 12)</option>
                        </select>
                    </div>
                    <div>
                        ${field('sk-fagf', 'Fagforeningskontingent per år (kr)', '0', '100', 'f.eks. 4800')}
                        <button type="button" data-sk-act="hent-fagf" class="mt-1.5 text-xs font-bold underline text-slate-500 dark:text-slate-400">Hent fra lønnskalkulator</button>
                    </div>
                    ${field('sk-fradrag', 'Andre fradrag per år (kr)', '0', '500', 'f.eks. reise')}
                    ${field('sk-rente', 'Rentekostnader per år (kr)', '0', '500', 'f.eks. boliglån')}
                    ${field('sk-gevinst', 'Realisert gevinst aksjer/fond (kr)', '0', '500')}
                    ${field('sk-tap', 'Realisert tap aksjer/fond (kr)', '0', '500')}
                    <p id="sk-invest-info" class="text-xs text-slate-500 dark:text-slate-400 sm:col-span-2 lg:col-span-4"></p>
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
                <div class="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                    <p class="font-bold text-slate-900 dark:text-white mb-1">Sammenlign med lønnsslipp</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">Legg inn tall fra én vanlig lønnsslipp. Estimatet annualiserer bruttolønnen du oppgir og fordeler beregnet skatt over valgt trekkfordeling. Overtid, halvt trekk, feriepenger og andre variasjoner kan gi store avvik.</p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        ${field('sk-ls-brutto', 'Brutto på lønnsslippen (kr)', '0', '100', '', '0')}
                        ${field('sk-ls-skatt', 'Skattetrekk på lønnsslippen (kr)', '0', '100', '', '0')}
                        ${field('sk-ls-andre-trekk', 'Andre trekk (kr)', '0', '100', 'f.eks. pensjon', '0')}
                        ${field('sk-ls-netto', 'Netto utbetalt ifølge lønnsslippen (kr)', '0', '100', '', '0')}
                    </div>
                    <div id="sk-lonnsslipp-out" class="mt-5"></div>
                </div>
                <div class="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                    <p class="font-bold text-slate-900 dark:text-white mb-1">År til dato${tipFor('År til dato')}</p>
                    <p class="text-xs text-slate-500 mb-4">Fyll inn faktiske tall fra lønnsslippene. Prognosen bruker årsinntekten og fradragene over, og kan justeres med lønninger og ekstra inntekt som gjenstår.</p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        ${field('sk-a-i-brutto', 'Faktisk bruttoinntekt hittil i år (kr)', '0', '1000', '', '0')}
                        ${field('sk-a-i-skatt', 'Faktisk skatt trukket hittil i år (kr)', '0', '1000', '', '0')}
                        ${field('sk-a-i-utbetalinger', 'Lønninger igjen i år', Math.max(0, 11 - new Date().getMonth()), '1', '', '0', '12')}
                        ${field('sk-a-i-ekstra', 'Ekstra inntekt resten av året (kr)', '0', '1000', 'f.eks. bonus', '0')}
                    </div>
                    <div id="sk-ar-til-dato-out" class="mt-5"></div>
                </div>
            </div>

            <div id="sk-p-hvaom" data-sk-panel="hvaom" class="${card}" hidden>
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">Sammenlign hvert scenario med grunnlaget over. Scenarioene er separate; de legges ikke oppå hverandre.</p>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    ${field('sk-wi-inntekt', 'Ekstra inntekt per år (kr)', '10000', '1000', 'f.eks. overtid')}
                    ${field('sk-wi-fradrag', 'Ekstra fradrag per år (kr)', '10000', '1000')}
                    ${field('sk-wi-okning', 'Lønnsøkning per måned (kr)', '2000', '100')}
                </div>
                <div id="sk-hvaom-out"></div>
            </div>

            <details class="${card}">
                <summary class="cursor-pointer font-bold text-slate-900 dark:text-white">⚙️ Satser ${SATSER.aar} (kan overstyres)</summary>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-4">Standardverdiene nedenfor er ment for inntektsåret ${SATSER.aar}, kan overstyres og er ikke automatisk oppdatert fra Skatteetaten. Kalkulatoren er en forenklet årsberegning for lønnsinntekt i skatteklasse 1. Kildelenke og merknad sist kontrollert 27. oktober 2026. Kontroller gjeldende satser, fradrag og skattekort hos <a href="https://www.skatteetaten.no/satser/" target="_blank" rel="noopener noreferrer" class="underline font-bold">Skatteetaten</a> før du bruker resultatet.</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    ${field('sk-s-alm', 'Skatt på alminnelig inntekt (%)', SATSER.alminnelig, '0.1')}
                    ${field('sk-s-person', 'Personfradrag (kr)', SATSER.personfradrag, '10')}
                    ${field('sk-s-minste-pct', 'Minstefradrag (% av lønn)', SATSER.minstePct, '0.1')}
                    ${field('sk-s-minste-maks', 'Minstefradrag øvre grense (kr)', SATSER.minsteMaks, '100')}
                    ${field('sk-s-trygd', 'Trygdeavgift lønn (%)', SATSER.trygdePct, '0.1')}
                    ${field('sk-s-trygd-grense', 'Trygdeavgift nedre grense (kr)', SATSER.trygdeGrense, '50')}
                    ${field('sk-s-fagf-maks', 'Fagforening maks fradrag (kr)', SATSER.fagforeningMaks, '100')}
                    ${field('sk-s-opp', 'Oppjusteringsfaktor aksjer/fond (1 = ingen)', SATSER.oppjustering, '0.01')}
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
        fagforeningMaks: num('sk-s-fagf-maks'),
        oppjustering: num('sk-s-opp') || 1,
        trinn: SATSER.trinn.map((_, i) => ({ fra: num('sk-t' + i + '-fra'), pct: num('sk-t' + i + '-pct') / 100 }))
            .sort((a, b) => a.fra - b.fra)
    });

    function beregn(brutto, ekstraFradrag, s) {
        brutto = Math.max(0, brutto);
        const minste = Math.min(brutto * s.minstePct, s.minsteMaks);
        const person = s.person;
        const alm = Math.max(0, brutto - minste - person - ekstraFradrag);
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
        return { brutto, minste, person, ekstraFradrag, alm, skattAlm, trinn, trinnSum, trygd, total, netto: brutto - total };
    }

    const marginal = (brutto, ekstraFradrag, s) =>
        (beregn(brutto + 1000, ekstraFradrag, s).total - beregn(brutto, ekstraFradrag, s).total) / 10;

    const row = (text, value, cls = '') =>
        `<div class="line-row py-1.5 ${cls} ${cls.includes('strong') ? '' : 'text-slate-600 dark:text-slate-400'}"><span>${text}${tipFor(text)}</span><span class="font-mono">${value}</span></div>`;
    const big = (title, value, sub = '') =>
        `<div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4"><p class="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-1">${title}${tipFor(title)}</p><p class="text-2xl font-mono font-extrabold text-slate-900 dark:text-white">${value}</p>${sub ? `<p class="text-xs text-slate-500 mt-1">${sub}</p>` : ''}</div>`;

    function grunnlag() {
        const maanedlig = $('sk-periode')?.value === 'mnd';
        const brutto = num('sk-inntekt') * (maanedlig ? 12 : 1);
        const s = satser();
        const andre = Math.max(0, num('sk-fradrag'));
        const fagforening = Math.min(Math.max(0, num('sk-fagf')), s.fagforeningMaks);
        const rente = Math.max(0, num('sk-rente'));
        const investNetto = (Math.max(0, num('sk-gevinst')) - Math.max(0, num('sk-tap'))) * s.oppjustering;
        const info = $('sk-invest-info');
        if (info) {
            info.textContent = investNetto < 0
                ? `Netto tap på ${kr(-investNetto)} gir ca. ${kr(-investNetto * s.alm)} lavere skatt.`
                : investNetto > 0 ? `Netto gevinst på ${kr(investNetto)} gir ca. ${kr(investNetto * s.alm)} mer i skatt.` : '';
        }
        return { brutto, fradrag: andre + fagforening + rente - investNetto, andre, fagforening, rente, investNetto, s };
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
            <div class="rounded-2xl border border-brand-200 dark:border-brand-800/60 bg-brand-50/60 dark:bg-brand-900/15 p-4 mb-6">
                <p class="text-xs font-bold uppercase tracking-widest text-brand-700 dark:text-brand-300 mb-2">Skattegrunnlag${tipFor('Skattegrunnlag')}</p>
                ${row('Brutto personinntekt (trinnskatt og trygdeavgift)', kr(r.brutto))}
                ${row('Alminnelig inntekt etter fradrag', kr(r.alm), 'strong')}
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
                <div>
                    <p class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Alminnelig inntekt</p>
                    ${row('Brutto lønn', kr(r.brutto))}
                    ${row('Minstefradrag', '− ' + kr(r.minste))}
                    ${row('Personfradrag', '− ' + kr(Math.min(r.person, Math.max(0, r.brutto - r.minste - r.ekstraFradrag))))}
                    ${g.fagforening ? row('Fagforeningskontingent', '− ' + kr(g.fagforening)) : ''}
                    ${g.andre ? row('Andre fradrag', '− ' + kr(g.andre)) : ''}
                    ${g.rente ? row('Rentekostnader', '− ' + kr(g.rente)) : ''}
                    ${g.investNetto ? row(g.investNetto < 0 ? 'Tap aksjer/fond (netto)' : 'Gevinst aksjer/fond (netto)', (g.investNetto < 0 ? '− ' : '+ ') + kr(Math.abs(g.investNetto))) : ''}
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
            <p class="text-xs text-slate-500 mt-4">Skattetrekket tas normalt i 10,5 måneder (ikke juni halvt og desember). Det gir ca. ${kr(r.total / 10.5)} i trekk per vanlig måned. Satsår: ${SATSER.aar}. <a href="https://www.skatteetaten.no/satser/" target="_blank" rel="noopener noreferrer" class="underline">Kontroller satsene hos Skatteetaten</a>.</p>`;
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
        const ekstraType = $('ekstra-skatt-type')?.value || 'belop';
        const ekstraVerdi = Math.max(0, parseFloat($('ekstra-skatt-verdi')?.value) || 0);
        const ekstraAar = ekstraType === 'prosent' ? g.brutto * ekstraVerdi / 100 : ekstraVerdi * 12;
        const naaSamlet = grunnlagTrekk > 0 ? naa + ekstraAar / grunnlagTrekk * 100 : naa;
        const diff = naaSamlet - anbefalt;
        const sammenligning = naaType === 'prosent'
            ? `<p class="text-sm mt-4 text-slate-700 dark:text-slate-300">Lønnskalkulatoren bruker nå omtrent <strong>${pct(naaSamlet)} samlet</strong>${ekstraAar > 0 ? `, inkludert ekstra skattetrekk (${kr(ekstraAar)} estimert per år)` : ''}. ${Math.abs(diff) < 0.3
                ? 'Det samsvarer godt med anbefalingen.'
                : diff < 0
                    ? `Det er ${pct(-diff)} <strong>for lavt</strong>, og du kan få restskatt.`
                    : `Det er ${pct(diff)} <strong>for høyt</strong>, og du kan få penger igjen.`}</p>`
            : `<p class="text-sm mt-4 text-slate-500">Lønnskalkulatoren bruker tabelltrekk akkurat nå. Bruk knappen under for å bytte til prosenttrekk.</p>`;
        const forrige = $('sk-fordeling')?.value || '10.5';
        $('sk-trekk-out').innerHTML = `
            <div class="max-w-xs mb-5">
                <label for="sk-fordeling" class="${label}">Trekket fordeles på${tipFor('Trekket fordeles')}</label>
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

    function trekkandelTilDato(maaneder) {
        const vekter = Math.abs(maaneder - 10.5) < 0.01
            ? [1, 1, 1, 1, 1, 0.5, 1, 1, 1, 1, 1, 0]
            : Array(12).fill(1);
        const now = new Date();
        const maaned = now.getMonth();
        const dagerIMaaned = new Date(now.getFullYear(), maaned + 1, 0).getDate();
        const passert = vekter.slice(0, maaned).reduce((sum, vekt) => sum + vekt, 0)
            + vekter[maaned] * now.getDate() / dagerIMaaned;
        const totalt = vekter.reduce((sum, vekt) => sum + vekt, 0);
        return totalt > 0 ? Math.min(1, passert / totalt) : 0;
    }

    function visAarTilDato(g) {
        const bruttoHittil = Math.max(0, num('sk-a-i-brutto'));
        const skattHittil = Math.max(0, num('sk-a-i-skatt'));
        const utbetalingerIgjen = Math.min(12, Math.floor(Math.max(0, num('sk-a-i-utbetalinger'))));
        const ekstraInntekt = Math.max(0, num('sk-a-i-ekstra'));
        const harBruttoHittil = bruttoHittil > 0;
        const forventetBrutto = harBruttoHittil
            ? bruttoHittil + g.brutto / 12 * utbetalingerIgjen + ekstraInntekt
            : g.brutto + ekstraInntekt;
        const prognose = beregn(forventetBrutto, g.fradrag, g.s);
        const skattGjenstaar = prognose.total - skattHittil;
        const skattPerUtbetaling = utbetalingerIgjen > 0 ? Math.max(0, skattGjenstaar) / utbetalingerIgjen : 0;
        const forventetTrukket = prognose.total * trekkandelTilDato(parseFloat($('sk-fordeling')?.value) || 10.5);
        const avvik = skattHittil - forventetTrukket;
        const avvikPct = forventetTrukket > 0 ? avvik / forventetTrukket : 0;
        const harHittilTall = bruttoHittil > 0 || skattHittil > 0;
        let status;
        if (!harHittilTall) {
            status = '<p class="text-sm text-slate-500">Legg inn faktiske tall fra lønnsslippene for å se om skattetrekket er i rute.</p>';
        } else if (forventetTrukket <= 0) {
            status = '<p class="text-sm text-slate-500">Prognosen tilsier ikke skattetrekk hittil i år, så trekkstatus kan ikke vurderes.</p>';
        } else if (avvikPct < -0.05) {
            status = `<p class="text-sm text-amber-700 dark:text-amber-300"><strong>Lavere enn forventet trekktempo.</strong> Det er trukket ${kr(-avvik)} mindre enn den grove prognosen til dagens dato.</p>`;
        } else if (avvikPct > 0.05) {
            status = `<p class="text-sm text-sky-700 dark:text-sky-300"><strong>Høyere enn forventet trekktempo.</strong> Det er trukket ${kr(avvik)} mer enn den grove prognosen til dagens dato.</p>`;
        } else {
            status = '<p class="text-sm text-emerald-700 dark:text-emerald-300"><strong>Omtrent i rute.</strong> Skattetrekket hittil er innenfor ca. 5 % av prognosen for dagens dato.</p>';
        }
        const anbefaling = skattGjenstaar <= 0
            ? 'Det er ikke beregnet mer skatt å dekke ut fra prognosen.'
            : utbetalingerIgjen > 0
                ? `Fordelt på ${utbetalingerIgjen} gjenstående lønninger.`
                : 'Ingen gjenstående lønninger er oppgitt. Vurder å oppdatere skattekortet eller annet skattetrekk.';

        $('sk-ar-til-dato-out').innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                ${big('Faktisk brutto hittil', kr(bruttoHittil))}
                ${big('Faktisk skatt trukket hittil', kr(skattHittil), bruttoHittil > 0 ? `${pct(skattHittil / bruttoHittil * 100)} av brutto hittil` : '')}
                ${big('Prognose brutto for året', kr(forventetBrutto), harBruttoHittil ? 'hittil + forventet lønn + ekstra inntekt' : 'årsinntekten over + ekstra inntekt')}
                ${big('Prognose skatt for året', kr(prognose.total), prognose.total > 0 ? `${pct(skattHittil / prognose.total * 100)} er trukket hittil` : '')}
            </div>
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-4">
                <p class="font-bold text-slate-900 dark:text-white mb-2">Sammenligning</p>
                ${row('Opprinnelig årsestimat', kr(beregn(g.brutto, g.fradrag, g.s).total))}
                ${row('Prognose med hittil-tall og ekstra inntekt', kr(prognose.total), 'strong')}
                ${row('Estimert skatt som gjenstår etter faktisk trekk', kr(skattGjenstaar), 'strong')}
                ${row('Anbefalt trekk per gjenstående lønning', utbetalingerIgjen > 0 ? kr(skattPerUtbetaling) : '—', 'strong')}
                <p class="text-xs text-slate-500 mt-2">${anbefaling}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <p class="font-bold text-slate-900 dark:text-white mb-2">Trekkstatus per i dag</p>
                ${status}
                <p class="text-xs text-slate-500 mt-2">Grov tempokontroll basert på valgt fordeling (${maanederTekst(parseFloat($('sk-fordeling')?.value) || 10.5)}). Faktisk trekk kan variere mellom lønninger. Et positivt eller negativt avvik garanterer ikke restskatt eller penger tilbake.</p>
            </div>`;
    }

    function visLonnsslipp(g) {
        const brutto = Math.max(0, num('sk-ls-brutto'));
        const skatt = Math.max(0, num('sk-ls-skatt'));
        const andreTrekk = Math.max(0, num('sk-ls-andre-trekk'));
        const netto = Math.max(0, num('sk-ls-netto'));
        if (brutto <= 0 && skatt <= 0 && netto <= 0) {
            $('sk-lonnsslipp-out').innerHTML = '<p class="text-sm text-slate-500">Fyll inn tall fra en lønnsslipp for å se sammenligningen.</p>';
            return;
        }

        const maaneder = parseFloat($('sk-fordeling')?.value) || 10.5;
        const skatteestimat = beregn(brutto * 12, g.fradrag, g.s).total;
        const forventetTrekk = skatteestimat / maaneder;
        const beregnetNetto = brutto - forventetTrekk - andreTrekk;
        const faktiskNetto = netto > 0 ? netto : brutto - skatt - andreTrekk;

        $('sk-lonnsslipp-out').innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                ${big('Skattetrekk på lønnsslippen', kr(skatt), `faktisk skattetrekk: ${kr(skatt)}`)}
                ${big('Beregnet skattetrekk', kr(forventetTrekk), `basert på ${maanederTekst(maaneder)} og annualisert brutto`)}
                ${big('Avvik i skattetrekk', kr(skatt - forventetTrekk), 'pluss betyr høyere faktisk trekk enn estimatet')}
                ${big('Faktisk netto', kr(faktiskNetto), netto > 0 ? 'fra lønnsslippen' : 'beregnet fra brutto minus oppgitte trekk')}
                ${big('Beregnet netto', kr(beregnetNetto), 'etter estimert skatt og oppgitte andre trekk')}
                ${big('Avvik i netto', kr(faktiskNetto - beregnetNetto), 'pluss betyr høyere faktisk utbetaling enn estimatet')}
            </div>
            <p class="text-xs text-slate-500 mt-3">Sammenligningen er veiledende. Den bruker fradragene som er lagt inn i årsberegningen og forutsetter at oppgitt bruttolønn er representativ for en vanlig måned. Faktiske trekk styres av skattekort, lønnsart og arbeidsgiver.</p>`;
    }

    function maanederTekst(maaneder) {
        return maaneder === 12 ? '12 måneder' : '10,5 måneder';
    }

    function visHvaOm(g) {
        const basis = beregn(g.brutto, g.fradrag, g.s);
        const ekstra = Math.max(0, num('sk-wi-inntekt'));
        const fradrag = Math.max(0, num('sk-wi-fradrag'));
        const okning = num('sk-wi-okning') * 12;

        const medInntekt = beregn(g.brutto + ekstra, g.fradrag, g.s);
        const medFradrag = beregn(g.brutto, g.fradrag + fradrag, g.s);
        const besparelse = basis.total - medFradrag.total;
        const medOkning = beregn(g.brutto + okning, g.fradrag, g.s);
        const nettoOkning = medOkning.netto - basis.netto;
        const scenarioer = [
            { navn: 'Grunnlag', beregning: basis, utgift: 0 },
            { navn: `Ekstra inntekt (${kr(ekstra)})`, beregning: medInntekt, utgift: 0 },
            { navn: `Lønnsøkning (${kr(okning / 12)} / mnd)`, beregning: medOkning, utgift: 0 },
            { navn: `Ekstra fradrag (${kr(fradrag)})`, beregning: medFradrag, utgift: fradrag }
        ];
        const scenarioRader = [
            { navn: 'Brutto per år', verdi: s => s.beregning.brutto },
            { navn: 'Beregnet skatt', verdi: s => s.beregning.total },
            { navn: 'Netto per år', verdi: s => s.beregning.netto - s.utgift, sterk: true },
            { navn: 'Netto per måned (snitt)', verdi: s => (s.beregning.netto - s.utgift) / 12 },
            { navn: 'Endring i skatt fra grunnlag', verdi: s => s.beregning.total - basis.total }
        ];

        $('sk-hvaom-out').innerHTML = `
            <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table class="w-full min-w-[760px] text-sm">
                    <thead><tr class="bg-slate-50 dark:bg-slate-800/60">
                        <th class="p-3 text-left font-bold text-slate-600 dark:text-slate-300">Årlig estimat</th>
                        ${scenarioer.map(s => `<th class="p-3 text-right font-bold text-slate-900 dark:text-white">${s.navn}</th>`).join('')}
                    </tr></thead>
                    <tbody>${scenarioRader.map(r => `<tr class="border-t border-slate-200 dark:border-slate-800">
                        <th class="p-3 text-left font-medium text-slate-600 dark:text-slate-400">${r.navn}</th>
                        ${scenarioer.map(s => `<td class="p-3 text-right font-mono ${r.sterk ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}">${kr(r.verdi(s))}</td>`).join('')}
                    </tr>`).join('')}</tbody>
                </table>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                ${big('Skatt på ekstra inntekt', kr(medInntekt.total - basis.total), 'på scenarioet med ekstra inntekt')}
                ${big('Skattebesparelse ved ekstra fradrag', kr(besparelse), `tilsvarer ${pct(fradrag ? besparelse / fradrag * 100 : 0)} av fradraget`)}
                ${big('Netto økning ved lønnsøkning', kr(nettoOkning / 12), 'per måned i snitt etter skatt')}
            </div>
            <p class="text-xs text-slate-500 mt-3">Ekstra fradrag reduserer beregnet skatt, men utgiften er også trukket fra netto i dette scenarioet.</p>`;
    }

    function oppdater() {
        const g = grunnlag();
        visNetto(g);
        visTrekk(g);
        visAarTilDato(g);
        visLonnsslipp(g);
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

    // Faktaboks som vises ved hover, fokus eller trykk på «?»
    const stil = document.createElement('style');
    stil.textContent = `
        .sk-tip{display:inline-flex;align-items:center;justify-content:center;width:1.05rem;height:1.05rem;margin-left:.4rem;border-radius:50%;border:1px solid currentColor;font-size:.65rem;font-weight:700;line-height:1;cursor:help;opacity:.6;vertical-align:middle;text-transform:none;letter-spacing:0;user-select:none}
        .sk-tip:hover,.sk-tip:focus{opacity:1;outline:none}
        #sk-tipbox{position:fixed;z-index:10000;max-width:260px;padding:.65rem .8rem;border-radius:.75rem;font-size:.78rem;line-height:1.4;font-weight:500;text-transform:none;letter-spacing:0;pointer-events:none;opacity:0;transition:opacity .12s;background:#111;color:#fff;border:1px solid rgba(255,255,255,.18);box-shadow:0 10px 30px rgba(0,0,0,.35)}
        html:not(.dark) #sk-tipbox{background:#fff;color:#111;border-color:rgba(0,0,0,.15)}
        #sk-tipbox.vis{opacity:1}`;
    document.head.appendChild(stil);

    const tipbox = document.createElement('div');
    tipbox.id = 'sk-tipbox';
    tipbox.setAttribute('role', 'tooltip');
    document.body.appendChild(tipbox);

    function visTip(el) {
        tipbox.textContent = el.dataset.tip;
        tipbox.classList.add('vis');
        const r = el.getBoundingClientRect();
        const b = tipbox.getBoundingClientRect();
        let x = Math.min(Math.max(8, r.left + r.width / 2 - b.width / 2), window.innerWidth - b.width - 8);
        let y = r.top - b.height - 8;
        if (y < 8) y = r.bottom + 8;
        tipbox.style.left = x + 'px';
        tipbox.style.top = y + 'px';
    }
    const skjulTip = () => tipbox.classList.remove('vis');

    root.addEventListener('mouseover', e => { const t = e.target.closest('.sk-tip'); if (t) visTip(t); });
    root.addEventListener('mouseout', e => { if (e.target.closest('.sk-tip')) skjulTip(); });
    root.addEventListener('focusin', e => { const t = e.target.closest('.sk-tip'); if (t) visTip(t); });
    root.addEventListener('focusout', skjulTip);
    root.addEventListener('click', e => {
        const t = e.target.closest('.sk-tip');
        if (t) { e.preventDefault(); visTip(t); }
    });
    document.addEventListener('scroll', skjulTip, true);

    let utsatt = 0;
    const oppdaterUtsatt = () => {
        clearTimeout(utsatt);
        utsatt = setTimeout(() => { lagre(); oppdater(); }, 150);
    };
    root.addEventListener('input', event => {
        if (!event.target.matches('[data-sk]')) return;
        oppdaterUtsatt();
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
        } else if (handling === 'hent-fagf') {
            const betalt = parseFloat($('fagforening-kroner-input')?.value) || 0;
            const pctSats = parseFloat($('fagforening-prosent')?.value) || 0;
            const aarBrutto = grunnlag().brutto;
            const aar = betalt > 0 ? betalt * 12 : aarBrutto * pctSats / 100;
            if (aar <= 0) return visToast('Fyll inn brutto lønn eller fagforeningstrekk først', 'rose');
            $('sk-fagf').value = Math.round(aar);
            lagre();
            oppdater();
            visToast('Hentet fagforeningskontingent for hele året (' + kr(aar / 12) + ' per måned i snitt)');
        } else if (handling === 'reset-satser') {
            const standard = {
                'sk-s-alm': SATSER.alminnelig, 'sk-s-person': SATSER.personfradrag, 'sk-s-minste-pct': SATSER.minstePct,
                'sk-s-minste-maks': SATSER.minsteMaks, 'sk-s-trygd': SATSER.trygdePct,                 'sk-s-trygd-grense': SATSER.trygdeGrense, 'sk-s-fagf-maks': SATSER.fagforeningMaks, 'sk-s-opp': SATSER.oppjustering };
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
