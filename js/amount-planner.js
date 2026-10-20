(function() {
    const page = document.getElementById('amounts');
    if (!page) return;

    const numberFormat = () => new Intl.NumberFormat(
        document.documentElement.lang === 'en' ? 'en-GB' : 'nb-NO',
        { maximumFractionDigits: 2 }
    );
    const isEnglish = () => document.documentElement.lang === 'en';
    const format = value => numberFormat().format(value);
    const read = id => Number.parseFloat(document.getElementById(id)?.value);
    const resultMain = document.getElementById('amount-result-main');
    const resultSummary = document.getElementById('amount-result-summary');
    const resultDetails = document.getElementById('amount-result-details');
    const resultError = document.getElementById('amount-result-error');
    const buttons = [...page.querySelectorAll('[data-amount-mode]')];
    const floorType = document.getElementById('amount-floor-type');
    let activeMode = localStorage.getItem('amount_planner_mode') || 'paint';

    function setError(message) {
        resultMain.textContent = '—';
        resultSummary.textContent = '';
        resultDetails.replaceChildren();
        resultError.textContent = message;
        resultError.classList.remove('hidden');
        window.oppdaterLiveKalkulatorResultat?.(`amount-${activeMode}`, '—', message);
    }

    function setResult(main, summary, rows) {
        resultMain.textContent = main;
        resultSummary.textContent = summary;
        resultError.textContent = '';
        resultError.classList.add('hidden');
        resultDetails.replaceChildren();
        rows.forEach(([label, value]) => {
            const row = document.createElement('p');
            row.className = 'flex items-start justify-between gap-3';
            const name = document.createElement('span');
            name.textContent = label;
            const amount = document.createElement('strong');
            amount.className = 'font-mono text-right text-slate-900 dark:text-white';
            amount.textContent = value;
            row.append(name, amount);
            resultDetails.append(row);
        });
        const details = rows
            .map(([label, value]) => `${label} ${value}`)
            .join(' · ');
        window.oppdaterLiveKalkulatorResultat?.(`amount-${activeMode}`, main, summary, details);
    }

    function requirePositive(values, message) {
        if (values.some(value => !Number.isFinite(value) || value <= 0)) {
            setError(`${isEnglish() ? 'Enter values greater than zero:' : 'Trenger tall større enn null:'} ${message}`);
            return false;
        }
        return true;
    }

    function readWaste(id) {
        const waste = read(id);
        if (!Number.isFinite(waste) || waste < 0 || waste > 100) {
            setError(isEnglish()
                ? 'Extra allowance must be between 0 and 100%.'
                : 'Ekstra mengde må være mellom 0 og 100 %.');
            return null;
        }
        return waste;
    }

    function calculate() {
        const f = format;
        const en = isEnglish();

        if (activeMode === 'paint') {
            const width = read('amount-paint-width');
            const height = read('amount-paint-height');
            const coats = read('amount-paint-coats');
            const coverage = read('amount-paint-coverage');
            const canSize = read('amount-paint-can');
            if (!requirePositive([width, height, coats, coverage, canSize], en
                ? 'width, height, coats, coverage and can size.'
                : 'bredde, høyde, strøk, dekkevne og spannstørrelse.')) return;
            if (!Number.isInteger(coats)) {
                setError(en ? 'Number of coats must be a whole number.' : 'Antall strøk må være et helt tall.');
                return;
            }
            const waste = readWaste('amount-paint-waste');
            if (waste === null) return;
            const coatedArea = width * height * coats;
            const liters = coatedArea / coverage * (1 + waste / 100);
            const cans = Math.ceil(liters / canSize);
            setResult(`${f(liters)} L`, en ? 'Paint needed' : 'Maling trengs', [
                [en ? 'Area including coats:' : 'Areal med strøk:', `${f(coatedArea)} m²`],
                [en ? 'Recommended to buy:' : 'Anbefalt å kjøpe:', `${cans} × ${f(canSize)} L`],
                [en ? 'Extra allowance:' : 'Ekstra mengde:', `${f(waste)} %`]
            ]);
            return;
        }

        if (activeMode === 'floor') {
            const length = read('amount-floor-length');
            const width = read('amount-floor-width');
            if (!requirePositive([length, width], en ? 'length and width.' : 'lengde og bredde.')) return;
            const isTile = floorType?.value === 'tile';
            const waste = readWaste(isTile ? 'amount-tile-waste' : 'amount-floor-waste');
            if (waste === null) return;
            const area = length * width;
            const requiredArea = area * (1 + waste / 100);
            if (isTile) {
                const tileLength = read('amount-tile-length');
                const tileWidth = read('amount-tile-width');
                const grout = read('amount-tile-grout');
                const tilesPerBox = read('amount-tile-box');
                if (!requirePositive([tileLength, tileWidth, tilesPerBox], en
                    ? 'tile length, tile width and tiles per box.'
                    : 'flislengde, flisbredde og fliser per eske.')) return;
                if (!Number.isInteger(tilesPerBox)) {
                    setError(en ? 'Tiles per box must be a whole number.' : 'Fliser per eske må være et helt tall.');
                    return;
                }
                if (!Number.isFinite(grout) || grout < 0 || grout >= Math.min(tileLength, tileWidth)) {
                    setError(en
                        ? 'Grout width must be zero or greater and smaller than the tile.'
                        : 'Fugebredden må være null eller større, og mindre enn flismålet.');
                    return;
                }
                const cols = Math.ceil((length * 1000 + grout) / (tileLength + grout));
                const rows = Math.ceil((width * 1000 + grout) / (tileWidth + grout));
                const baseTiles = cols * rows;
                const tiles = Math.ceil(baseTiles * (1 + waste / 100));
                const boxes = Math.ceil(tiles / tilesPerBox);
                const moduleArea = ((tileLength + grout) * (tileWidth + grout)) / 1000000;
                setResult(`${tiles} ${en ? 'tiles' : 'fliser'}`, en ? 'Tiles needed' : 'Fliser trengs', [
                    [en ? 'Room area:' : 'Rommets areal:', `${f(area)} m²`],
                    [en ? 'Tile module area incl. grout:' : 'Flisareal inkl. fuge:', `${f(moduleArea)} m²`],
                    [en ? 'Including cuts/waste:' : 'Med kapp/svinn:', `${f(waste)} %`],
                    [en ? 'Tiles per box:' : 'Fliser per eske:', `${f(tilesPerBox)}`],
                    [en ? 'Recommended to buy:' : 'Anbefalt å kjøpe:', `${boxes} ${en ? 'boxes' : 'esker'}`]
                ]);
            } else {
                const packCoverage = read('amount-floor-pack');
                if (!requirePositive([packCoverage], en ? 'coverage per pack.' : 'dekning per pakke.')) return;
                const packs = Math.ceil(requiredArea / packCoverage);
                setResult(`${packs} ${en ? 'packs' : 'pakker'}`, en ? 'Flooring / tile needed' : 'Gulv / flis trengs', [
                    [en ? 'Calculated area:' : 'Beregningsareal:', `${f(area)} m²`],
                    [en ? 'With extra allowance:' : 'Med ekstra mengde:', `${f(requiredArea)} m²`],
                    [en ? 'Coverage per pack:' : 'Dekning per pakke:', `${f(packCoverage)} m²`]
                ]);
            }
            return;
        }

        if (activeMode === 'concrete') {
            const length = read('amount-concrete-length');
            const width = read('amount-concrete-width');
            const depth = read('amount-concrete-depth');
            const bagYield = read('amount-concrete-yield');
            if (!requirePositive([length, width, depth, bagYield], en
                ? 'length, width, thickness and yield per bag.'
                : 'lengde, bredde, tykkelse og utbytte per sekk.')) return;
            const waste = readWaste('amount-concrete-waste');
            if (waste === null) return;
            const liters = length * width * depth * 10 * (1 + waste / 100);
            const bags = Math.ceil(liters / bagYield);
            setResult(`${bags} ${en ? 'bags' : 'sekker'}`, en ? 'Concrete needed' : 'Betong trengs', [
                [en ? 'Volume including extra:' : 'Volum inkl. ekstra mengde:', `${f(liters)} L (${f(liters / 1000)} m³)`],
                [en ? 'Yield per bag:' : 'Utbytte per sekk:', `${f(bagYield)} L`],
                [en ? 'Extra allowance:' : 'Ekstra mengde:', `${f(waste)} %`]
            ]);
            return;
        }

        if (activeMode === 'mix') {
            const total = read('amount-mix-total');
            const partA = read('amount-mix-part-a');
            const partB = read('amount-mix-part-b');
            if (!requirePositive([total, partA, partB], en
                ? 'total volume and both ratio parts.'
                : 'total mengde og begge delene i forholdet.')) return;
            const parts = partA + partB;
            setResult(`${f(total)} L`, en ? 'Mix split by ratio' : 'Blanding fordelt etter forholdet', [
                [`${en ? 'Part A' : 'Del A'} (${f(partA)}:${f(partB)}):`, `${f(total * partA / parts)} L`],
                [`${en ? 'Part B' : 'Del B'} (${f(partA)}:${f(partB)}):`, `${f(total * partB / parts)} L`]
            ]);
            return;
        }

        const from = read('amount-recipe-from');
        const to = read('amount-recipe-to');
        if (!requirePositive([from, to], en
            ? 'original servings and servings to make.'
            : 'porsjoner i oppskriften og porsjoner du vil lage.')) return;
        const lines = document.getElementById('amount-recipe-ingredients').value
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);
        if (lines.length === 0) {
            setError(en ? 'Add at least one ingredient line.' : 'Legg inn minst én ingredienslinje.');
            return;
        }
        const scaled = [];
        for (let index = 0; index < lines.length; index += 1) {
            const match = lines[index].match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);
            if (!match) {
                setError(`${en ? 'Check ingredient line' : 'Kontroller ingredienslinje'} ${index + 1}. ${en
                    ? 'Use an amount followed by a unit or name, e.g. “200 g flour”.'
                    : 'Gyldig format er mengde etterfulgt av enhet eller navn, for eksempel «200 g mel».'}`);
                return;
            }
            const quantity = Number.parseFloat(match[1].replace(',', '.'));
            scaled.push(`${f(quantity * to / from)} ${match[2]}`);
        }
        setResult(`${f(to / from)}×`, en ? 'Recipe scaled' : 'Oppskrift skalert', [
            [en ? 'Servings:' : 'Porsjoner:', `${f(from)} → ${f(to)}`],
            ...scaled.map((ingredient, index) => [`${index + 1}.`, ingredient])
        ]);
    }

    function chooseMode(mode) {
        activeMode = mode;
        localStorage.setItem('amount_planner_mode', mode);
        buttons.forEach(button => {
            const active = button.dataset.amountMode === mode;
            button.setAttribute('aria-pressed', String(active));
            button.classList.toggle('bg-violet-500', active);
            button.classList.toggle('text-white', active);
            button.classList.toggle('border-violet-500', active);
            button.classList.toggle('shadow-md', active);
            button.classList.toggle('shadow-violet-500/20', active);
            button.classList.toggle('bg-white/80', !active);
            button.classList.toggle('dark:bg-slate-900/70', !active);
            button.classList.toggle('text-slate-600', !active);
            button.classList.toggle('dark:text-slate-300', !active);
            button.classList.toggle('border-slate-200', !active);
            button.classList.toggle('dark:border-slate-700', !active);
        });
        page.querySelectorAll('[data-amount-fields]').forEach(fields => {
            fields.classList.toggle('hidden', fields.dataset.amountFields !== mode);
        });
        const activeButton = buttons.find(button => button.dataset.amountMode === mode);
        document.getElementById('amount-mode-title').textContent = activeButton?.textContent.trim() || '';
        calculate();
    }

    function updateFloorFields() {
        const isTile = floorType?.value === 'tile';
        page.querySelectorAll('[data-flooring-fields]').forEach(field => field.classList.toggle('hidden', isTile));
        page.querySelectorAll('[data-tile-fields]').forEach(field => field.classList.toggle('hidden', !isTile));
        calculate();
    }

    buttons.forEach(button => button.addEventListener('click', () => chooseMode(button.dataset.amountMode)));
    page.addEventListener('input', calculate);
    page.addEventListener('change', calculate);
    floorType?.addEventListener('change', updateFloorFields);
    document.addEventListener('DOMContentLoaded', calculate);
    new MutationObserver(calculate).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['lang']
    });
    updateFloorFields();
    chooseMode(buttons.some(button => button.dataset.amountMode === activeMode) ? activeMode : 'paint');
})();
