(function () {
    'use strict';

    const root = document.getElementById('garden-tools-root');
    if (!root) return;

    const STORAGE_KEY = 'watne_garden_v1';
    const cardClass = 'bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm';
    const activeClass = 'border-lime-500 bg-lime-500 text-slate-950 shadow-md shadow-lime-500/20';
    const idleClass = 'border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300';

    const language = () => (localStorage.getItem('verksted_lang') === 'en' ? 'en' : 'no');
    const t = (no, en) => (language() === 'en' ? en : no);
    const locale = () => (language() === 'en' ? 'en-GB' : 'nb-NO');
    const fmt = (value, digits = 1) => new Intl.NumberFormat(locale(), { maximumFractionDigits: digits }).format(value);
    const positive = value => Number.isFinite(value) && value > 0;
    const nonNegative = value => Number.isFinite(value) && value >= 0;

    const tools = [
        {
            id: 'fertilizer',
            icon: '🌱',
            title: ['Gjødsel til plen', 'Lawn fertilizer'],
            description: [
                'Finn hvor mye gjødsel plenen trenger ut fra areal og anbefalt dose på sekken.',
                'Find how much fertilizer your lawn needs from its area and the dose on the bag.'
            ],
            fields: [
                { id: 'area', label: ['Areal (m²)', 'Area (m²)'], value: 200, step: 1 },
                { id: 'dose', label: ['Dose (g per m²)', 'Dose (g per m²)'], value: 35, step: 1 },
                { id: 'bag', label: ['Sekkestørrelse (kg)', 'Bag size (kg)'], value: 10, step: 0.5 }
            ],
            calc: v => {
                if (![v.area, v.dose, v.bag].every(positive)) return null;
                const kg = v.area * v.dose / 1000;
                return {
                    main: `${fmt(kg, 2)} kg`,
                    summary: t('Gjødsel totalt', 'Total fertilizer'),
                    details: [
                        [t('Antall sekker (rundet opp)', 'Bags needed (rounded up)'), fmt(Math.ceil(kg / v.bag - 1e-9), 0)],
                        [t('Hver sekk dekker', 'Each bag covers'), `${fmt(v.bag * 1000 / v.dose, 0)} m²`]
                    ],
                    note: t('Bruk dosen produsenten oppgir. For mye gjødsel kan svi gresset.', 'Use the dose the manufacturer states. Too much fertilizer can burn the grass.')
                };
            }
        },
        {
            id: 'soil',
            icon: '🪨',
            title: ['Jord, bark og grus', 'Soil, bark and gravel'],
            description: [
                'Regn ut volum og antall sekker eller vekt for bed, stier og oppfyllinger.',
                'Calculate volume and number of bags or weight for beds, paths and fill.'
            ],
            fields: [
                { id: 'area', label: ['Areal (m²)', 'Area (m²)'], value: 12, step: 0.5 },
                { id: 'depth', label: ['Tykkelse (cm)', 'Depth (cm)'], value: 10, step: 1 },
                { id: 'extra', label: ['Ekstra for setning og svinn (%)', 'Extra for settling and waste (%)'], value: 10, step: 1 },
                { id: 'bag', label: ['Sekk (liter)', 'Bag (litres)'], value: 50, step: 5 },
                { id: 'density', label: ['Omtrentlig tetthet (kg per m³)', 'Approximate density (kg per m³)'], value: 1400, step: 50 }
            ],
            calc: v => {
                if (![v.area, v.depth, v.bag, v.density].every(positive) || !nonNegative(v.extra)) return null;
                const m3 = v.area * v.depth / 100 * (1 + v.extra / 100);
                return {
                    main: `${fmt(m3, 2)} m³`,
                    summary: t('Volum å bestille', 'Volume to order'),
                    details: [
                        [t('Antall sekker (rundet opp)', 'Bags needed (rounded up)'), fmt(Math.ceil(m3 * 1000 / v.bag - 1e-9), 0)],
                        [t('Omtrentlig vekt', 'Approximate weight'), `${fmt(m3 * v.density / 1000, 2)} t`]
                    ],
                    note: t('Tettheten varierer mye med fuktighet og type. Sjekk produktets oppgitte vekt per m³.', 'Density varies a lot with moisture and type. Check the product’s stated weight per m³.')
                };
            }
        },
        {
            id: 'water',
            icon: '💧',
            title: ['Vanning', 'Watering'],
            description: [
                'Beregn vannbehovet i liter og hvor lenge sprederen bør stå på. 1 mm vann tilsvarer 1 liter per m².',
                'Calculate water needs in litres and how long to run the sprinkler. 1 mm of water equals 1 litre per m².'
            ],
            fields: [
                { id: 'area', label: ['Areal (m²)', 'Area (m²)'], value: 100, step: 1 },
                { id: 'target', label: ['Ønsket vann per uke (mm)', 'Target water per week (mm)'], value: 25, step: 1 },
                { id: 'rain', label: ['Regn denne uken (mm)', 'Rain this week (mm)'], value: 0, step: 1 },
                { id: 'times', label: ['Vanninger per uke', 'Waterings per week'], value: 2, step: 1 },
                { id: 'flow', label: ['Vannmengde fra spreder (liter/min)', 'Sprinkler flow (litres/min)'], value: 10, step: 1 }
            ],
            calc: v => {
                if (![v.area, v.target, v.times, v.flow].every(positive) || !nonNegative(v.rain)) return null;
                const liters = v.area * Math.max(0, v.target - v.rain);
                const perWatering = liters / v.times;
                return {
                    main: `${fmt(liters, 0)} ${t('liter', 'litres')}`,
                    summary: t('Vannbehov resten av uken', 'Water needed this week'),
                    details: [
                        [t('Per vanning', 'Per watering'), `${fmt(perWatering, 0)} ${t('liter', 'litres')}`],
                        [t('Tid per vanning', 'Time per watering'), `${fmt(perWatering / v.flow, 0)} min`]
                    ],
                    note: t('Vann sjeldnere og grundigere, helst morgen eller kveld. Mål sprederens vannmengde med en bøtte.', 'Water less often but thoroughly, preferably morning or evening. Measure sprinkler output with a bucket.')
                };
            }
        },
        {
            id: 'plants',
            icon: '🥕',
            title: ['Planteavstand', 'Plant spacing'],
            description: [
                'Finn hvor mange planter som får plass i et bed, med avstand i og mellom rader.',
                'Find how many plants fit in a bed with spacing within and between rows.'
            ],
            fields: [
                { id: 'length', label: ['Bed – lengde (m)', 'Bed length (m)'], value: 4, step: 0.1 },
                { id: 'width', label: ['Bed – bredde (m)', 'Bed width (m)'], value: 1.2, step: 0.1 },
                { id: 'spacing', label: ['Avstand i raden (cm)', 'Spacing in row (cm)'], value: 30, step: 1 },
                { id: 'rows', label: ['Avstand mellom rader (cm)', 'Row spacing (cm)'], value: 40, step: 1 }
            ],
            calc: v => {
                if (![v.length, v.width, v.spacing, v.rows].every(positive)) return null;
                const perRow = Math.floor(v.length * 100 / v.spacing + 1e-9);
                const rows = Math.floor(v.width * 100 / v.rows + 1e-9);
                return {
                    main: `${fmt(perRow * rows, 0)} ${t('planter', 'plants')}`,
                    summary: t('Antall planter i bedet', 'Plants in the bed'),
                    details: [
                        [t('Antall rader', 'Number of rows'), fmt(rows, 0)],
                        [t('Planter per rad', 'Plants per row'), fmt(perRow, 0)],
                        [t('Areal per plante', 'Area per plant'), `${fmt(v.spacing * v.rows / 10000, 3)} m²`]
                    ],
                    note: t('Anbefalt avstand står på frøposen eller planteetiketten. Kantene regnes som ledig kant, ikke som plass til plante.', 'Recommended spacing is on the seed packet or plant label. The bed edges are kept free of plants.')
                };
            }
        },
        {
            id: 'fence',
            icon: '🪵',
            title: ['Gjerde', 'Fence'],
            description: [
                'Beregn stolper og bord til et bordgjerde ut fra lengde, stolpeavstand og bordbredde.',
                'Calculate posts and boards for a board fence from length, post spacing and board width.'
            ],
            fields: [
                { id: 'length', label: ['Gjerdelengde (m)', 'Fence length (m)'], value: 20, step: 0.5 },
                { id: 'post', label: ['Stolpeavstand (m)', 'Post spacing (m)'], value: 2.4, step: 0.1 },
                { id: 'board', label: ['Bordbredde (mm)', 'Board width (mm)'], value: 95, step: 1 },
                { id: 'gap', label: ['Mellomrom mellom bord (mm)', 'Gap between boards (mm)'], value: 20, step: 1 },
                { id: 'extra', label: ['Ekstra for svinn (%)', 'Extra for waste (%)'], value: 5, step: 1 }
            ],
            calc: v => {
                if (![v.length, v.post, v.board].every(positive) || !nonNegative(v.gap) || !nonNegative(v.extra)) return null;
                const posts = Math.ceil(v.length / v.post - 1e-9) + 1;
                const boards = Math.ceil(v.length * 1000 / (v.board + v.gap) - 1e-9);
                return {
                    main: `${fmt(boards, 0)} ${t('bord', 'boards')}`,
                    summary: t('Bord til gjerdet', 'Boards for the fence'),
                    details: [
                        [t('Stolper', 'Posts'), fmt(posts, 0)],
                        [t('Bord med svinn', 'Boards incl. waste'), fmt(Math.ceil(boards * (1 + v.extra / 100) - 1e-9), 0)]
                    ],
                    note: t('Legg til ekstra stolper for porter og hjørner. Sjekk lokale regler for gjerdehøyde og avstand til nabogrense.', 'Add extra posts for gates and corners. Check local rules for fence height and distance to the property line.')
                };
            }
        }
    ];

    let state = loadState();

    function loadState() {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {};
            return {
                mode: tools.some(tool => tool.id === stored.mode) ? stored.mode : tools[0].id,
                values: stored.values && typeof stored.values === 'object' ? stored.values : {}
            };
        } catch (error) {
            return { mode: tools[0].id, values: {} };
        }
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            /* lagring er valgfritt */
        }
    }

    const activeTool = () => tools.find(tool => tool.id === state.mode) || tools[0];

    function storedValue(tool, field) {
        const stored = state.values[tool.id]?.[field.id];
        return stored === undefined ? field.value : stored;
    }

    function readValues(tool) {
        return Object.fromEntries(tool.fields.map(field => {
            const raw = String(storedValue(tool, field)).replace(',', '.');
            return [field.id, raw.trim() === '' ? NaN : Number(raw)];
        }));
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    }

    function renderResult() {
        const tool = activeTool();
        const out = tool.calc(readValues(tool));
        const box = document.getElementById('garden-result');
        if (!box) return;
        if (!out) {
            box.innerHTML = `<p class="text-xs font-bold uppercase tracking-widest text-lime-700 dark:text-lime-300 mb-2">${t('Resultat', 'Result')}</p>
                <p class="text-sm font-semibold text-rose-600 dark:text-rose-400" role="alert">${t('Fyll inn gyldige tall større enn null.', 'Enter valid numbers greater than zero.')}</p>`;
            return;
        }
        box.innerHTML = `<p class="text-xs font-bold uppercase tracking-widest text-lime-700 dark:text-lime-300 mb-2">${t('Resultat', 'Result')}</p>
            <p class="text-3xl sm:text-4xl font-extrabold font-mono text-lime-800 dark:text-lime-200 break-words">${escapeHtml(out.main)}</p>
            <p class="text-sm font-semibold text-lime-900 dark:text-lime-300 mt-2">${escapeHtml(out.summary)}</p>
            <div class="border-t border-lime-200 dark:border-lime-800/80 mt-5 pt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                ${out.details.map(([label, value]) => `<div class="flex justify-between gap-4"><span>${escapeHtml(label)}</span><strong class="font-mono text-right">${escapeHtml(value)}</strong></div>`).join('')}
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-4">${escapeHtml(out.note)}</p>`;
    }

    function render() {
        const tool = activeTool();
        const idx = language() === 'en' ? 1 : 0;
        root.innerHTML = `
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-5" role="group" aria-label="${t('Velg hage- eller utendørsverktøy', 'Choose a garden or outdoor tool')}">
                ${tools.map(item => `<button type="button" data-garden-mode="${item.id}" aria-pressed="${item.id === tool.id}" class="min-h-14 px-3 py-3 rounded-2xl border text-sm font-bold transition-all ${item.id === tool.id ? activeClass : idleClass}">${item.icon} ${item.title[idx]}</button>`).join('')}
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 items-start">
                <div class="lg:col-span-3 ${cardClass}">
                    <h3 class="text-lg font-extrabold text-slate-900 dark:text-white mb-1">${tool.icon} ${tool.title[idx]}</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mb-5">${tool.description[idx]}</p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        ${tool.fields.map(field => `<label class="block text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">${field.label[idx]}
                            <input class="glass-input glass-input-emerald min-h-12 mt-1.5" type="number" inputmode="decimal" min="0" step="${field.step}" value="${escapeHtml(storedValue(tool, field))}" data-garden-field="${field.id}">
                        </label>`).join('')}
                    </div>
                </div>
                <div id="garden-result" class="lg:col-span-2 bg-lime-50/90 dark:bg-lime-950/40 border border-lime-200 dark:border-lime-800/70 rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm lg:sticky lg:top-6" aria-live="polite"></div>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-4">${t('Resultatene er veiledende anslag. Følg alltid anvisningen på produktet.', 'Results are guideline estimates. Always follow the instructions on the product.')}</p>`;
        renderResult();
    }

    root.addEventListener('click', event => {
        const button = event.target.closest('[data-garden-mode]');
        if (!button) return;
        state.mode = button.dataset.gardenMode;
        saveState();
        render();
    });

    root.addEventListener('input', event => {
        const input = event.target.closest('[data-garden-field]');
        if (!input) return;
        const tool = activeTool();
        state.values[tool.id] = { ...state.values[tool.id], [input.dataset.gardenField]: input.value };
        saveState();
        renderResult();
    });

    window.addEventListener('verksted:language-change', render);
    render();
})();
