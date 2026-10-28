(function () {
    'use strict';

    const PDFJS_VERSION = '3.11.174';
    const PDFJS_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
    const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    const MAX_PAGES = 5;
    const MONTH_NAMES = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];
    const FIELD_IDS = ['gross', 'tax', 'overtime', 'overtime-50-hours', 'overtime-100-hours', 'ytd-gross', 'ytd-tax', 'net-wage', 'union-fee', 'payout'];
    const fileInput = document.getElementById('salary-slip-file');
    const status = document.getElementById('salary-slip-status');
    const period = document.getElementById('salary-slip-period');
    const result = document.getElementById('salary-slip-result');

    if (!fileInput || !status || !result) return;

    function setStatus(message, isError) {
        status.textContent = message;
        status.classList.toggle('text-rose-600', Boolean(isError));
        status.classList.toggle('dark:text-rose-400', Boolean(isError));
        status.classList.toggle('text-slate-500', !isError);
        status.classList.toggle('dark:text-slate-400', !isError);
    }

    function clearComparison() {
        result.replaceChildren();
    }

    function clearFields() {
        FIELD_IDS.forEach((id) => {
            const input = document.getElementById(`slip-${id}`);
            if (input) input.value = '';
        });
        period.textContent = '';
        clearComparison();
    }

    function parseAmount(value) {
        const cleaned = String(value || '')
            .replace(/[\s\u00a0\u202f]/g, '')
            .replace(/[^\d,.-]/g, '');
        if (!cleaned || !/\d/.test(cleaned)) return null;

        let normalized = cleaned;
        if (normalized.includes(',')) {
            normalized = normalized.replace(/\./g, '').replace(',', '.');
        } else if ((normalized.match(/\./g) || []).length > 1) {
            normalized = normalized.replace(/\./g, '');
        }

        const amount = Number(normalized);
        return Number.isFinite(amount) ? amount : null;
    }

    function formatKr(amount) {
        return new Intl.NumberFormat('nb-NO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' kr';
    }

    function formatHours(amount) {
        return new Intl.NumberFormat('nb-NO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' t';
    }

    function rowsFromTextItems(items) {
        const positionedItems = items
            .filter((item) => item.str && item.str.trim())
            .map((item) => ({
                text: item.str.trim(),
                x: item.transform[4],
                y: item.transform[5]
            }))
            .sort((a, b) => b.y - a.y || a.x - b.x);

        const rows = [];
        positionedItems.forEach((item) => {
            let row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 2.5);
            if (!row) {
                row = { y: item.y, items: [] };
                rows.push(row);
            }
            row.items.push(item);
        });

        return rows
            .map((row) => ({
                y: row.y,
                text: row.items
                    .sort((a, b) => a.x - b.x)
                    .map((item) => item.text)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim()
            }))
            .sort((a, b) => b.y - a.y);
    }

    function amountsIn(text) {
        const matches = text.match(/[−-]?\s*\d{1,3}(?:[ .\u00a0\u202f]\d{3})*,\d{2}/g) || [];
        return matches.map((match) => parseAmount(match));
    }

    function amountFromRow(rows, pattern) {
        const row = rows.find((entry) => pattern.test(entry.text));
        if (!row) return null;
        const amounts = amountsIn(row.text);
        return amounts.length ? Math.abs(amounts[0]) : null;
    }

    function amountBelowLabel(rows, pattern) {
        const rowIndex = rows.findIndex((entry) => pattern.test(entry.text));
        if (rowIndex < 0 || !rows[rowIndex + 1]) return null;
        const amounts = amountsIn(rows[rowIndex + 1].text);
        return amounts.length ? Math.abs(amounts[0]) : null;
    }

    function overtimeFromRows(rows) {
        const amounts = rows
            .filter((row) => /\bOvertid\b/i.test(row.text))
            .map((row) => amountsIn(row.text))
            .filter((rowAmounts) => rowAmounts.length >= 3)
            .map((rowAmounts) => Math.abs(rowAmounts[2]));
        return amounts.length ? amounts.reduce((total, amount) => total + amount, 0) : null;
    }

    function overtimeHoursFromRows(rows, rate) {
        const hours = rows
            .filter((row) => /\bOvertid\b/i.test(row.text) && new RegExp(`\\b${rate}\\s*%`).test(row.text))
            .map((row) => amountsIn(row.text))
            .filter((rowAmounts) => rowAmounts.length >= 3)
            .map((rowAmounts) => rowAmounts[0]);
        return hours.length ? hours.reduce((total, amount) => total + amount, 0) : null;
    }

    function yearToDateGrossFromRows(rows) {
        const row = rows.find((entry) => /^\s*Bruttolønn\b/i.test(entry.text) && amountsIn(entry.text).length >= 2);
        if (!row) return null;
        return amountsIn(row.text)[1];
    }

    function yearToDateTaxFromRows(rows) {
        const row = rows.find((entry) => /^\s*Forskuddstrekk\b/i.test(entry.text) && amountsIn(entry.text).length >= 2);
        if (!row) return null;
        return Math.abs(amountsIn(row.text)[1]);
    }

    function unionFeeFromRows(rows) {
        const detailRow = rows.find((row) => /\bTrukket\s+fagforeningskontingent\b/i.test(row.text));
        const summaryRow = rows.find((row) => /^\s*Fagforeningstrekk\b/i.test(row.text));
        const row = detailRow || summaryRow;
        if (!row) return null;
        const amounts = amountsIn(row.text);
        return amounts.length ? Math.abs(amounts[0]) : null;
    }

    function extractPayslipData(rows) {
        const data = {
            gross: amountFromRow(rows, /^\s*Bruttolønn\b/i),
            tax: amountFromRow(rows, /\b(?:Prosenttrekk|Forskuddstrekk)\b/i),
            overtime: overtimeFromRows(rows),
            overtime50Hours: overtimeHoursFromRows(rows, 50),
            overtime100Hours: overtimeHoursFromRows(rows, 100),
            yearToDateGross: yearToDateGrossFromRows(rows),
            yearToDateTax: yearToDateTaxFromRows(rows),
            unionFee: unionFeeFromRows(rows),
            netWage: amountFromRow(rows, /^\s*Nettolønn\b/i),
            payout: amountBelowLabel(rows, /\bNetto til utbetaling\b/i),
            month: null,
            year: null
        };

        const periodRow = rows.find((row) => /\bLønnskjøring\b/i.test(row.text));
        const periodMatch = periodRow && periodRow.text.match(/\b(20\d{2})-(0[1-9]|1[0-2])\b/);
        if (periodMatch) {
            data.year = Number(periodMatch[1]);
            data.month = Number(periodMatch[2]);
        }

        return data;
    }

    function displayExtractedData(data) {
        const fieldMap = {
            gross: data.gross,
            tax: data.tax,
            overtime: data.overtime,
            'overtime-50-hours': data.overtime50Hours,
            'overtime-100-hours': data.overtime100Hours,
            'ytd-gross': data.yearToDateGross,
            'ytd-tax': data.yearToDateTax,
            'net-wage': data.netWage,
            'union-fee': data.unionFee,
            payout: data.payout
        };
        Object.entries(fieldMap).forEach(([id, value]) => {
            const input = document.getElementById(`slip-${id}`);
            if (input && value !== null && value !== undefined) {
                input.value = new Intl.NumberFormat('nb-NO', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(value);
            }
        });

        if (data.year && data.month) {
            const monthName = new Intl.DateTimeFormat('nb-NO', { month: 'long' })
                .format(new Date(data.year, data.month - 1, 1));
            period.textContent = `Periode i PDF: ${monthName} ${data.year}`;
        }
    }

    function loadPdfJs() {
        if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
        if (window.salaryComparisonPdfLoader) return window.salaryComparisonPdfLoader;

        window.salaryComparisonPdfLoader = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = PDFJS_URL;
            script.async = true;
            script.onload = () => {
                if (!window.pdfjsLib) {
                    reject(new Error('PDF-leseren ble lastet, men kunne ikke startes.'));
                    return;
                }
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
                resolve(window.pdfjsLib);
            };
            script.onerror = () => reject(new Error('Kunne ikke laste PDF-leseren. Kontroller internettforbindelsen, eller fyll inn beløpene manuelt.'));
            document.head.appendChild(script);
        });
        return window.salaryComparisonPdfLoader;
    }

    async function readPdf(file) {
        const pdfjs = await loadPdfJs();
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
        if (pdf.numPages > MAX_PAGES) {
            throw new Error(`PDF-en har ${pdf.numPages} sider. Av sikkerhets- og ytelseshensyn støttes maks ${MAX_PAGES} sider.`);
        }

        const rows = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const textContent = await page.getTextContent();
            rows.push(...rowsFromTextItems(textContent.items));
        }
        return extractPayslipData(rows);
    }

    function readCalculatorAmount(id) {
        const element = document.getElementById(id);
        return element ? parseAmount(element.textContent) : null;
    }

    function buildComparisonRow(label, slipValue, calculatorValue, unit) {
        const row = document.createElement('tr');
        row.className = 'border-b border-slate-200 dark:border-slate-700/60';
        const format = unit === 'hours' ? formatHours : formatKr;
        const values = [
            label,
            slipValue === null ? '—' : format(slipValue),
            calculatorValue === null ? '—' : format(calculatorValue),
            slipValue === null || calculatorValue === null
                ? '—'
                : `${calculatorValue - slipValue >= 0 ? '+' : '−'} ${format(Math.abs(calculatorValue - slipValue))}`
        ];
        values.forEach((value, index) => {
            const cell = document.createElement(index === 0 ? 'th' : 'td');
            cell.textContent = value;
            cell.className = index === 0
                ? 'py-3 pr-3 text-left font-semibold text-slate-700 dark:text-slate-300'
                : 'py-3 px-2 text-right font-mono text-slate-700 dark:text-slate-300';
            if (index === 0) cell.scope = 'row';
            row.appendChild(cell);
        });
        return row;
    }

    function compare() {
        clearComparison();
        const values = {};
        FIELD_IDS.forEach((id) => {
            const input = document.getElementById(`slip-${id}`);
            values[id] = input && input.value.trim() ? parseAmount(input.value) : null;
        });

        const invalidField = FIELD_IDS.find((id) => {
            const input = document.getElementById(`slip-${id}`);
            return input && input.value.trim() && values[id] === null;
        });
        if (invalidField) {
            const input = document.getElementById(`slip-${invalidField}`);
            input.focus();
            const message = document.createElement('p');
            message.className = 'text-sm font-semibold text-rose-600 dark:text-rose-400';
            message.textContent = 'Sjekk beløpet i feltet. Bruk tall, eventuelt med komma som desimalskilletegn.';
            result.appendChild(message);
            return;
        }

        if (values.gross === null && values.tax === null && values.payout === null) {
            const message = document.createElement('p');
            message.className = 'text-sm text-slate-600 dark:text-slate-400';
            message.textContent = 'Legg inn minst bruttolønn, forskuddstrekk eller netto til utbetaling før du sammenligner.';
            result.appendChild(message);
            return;
        }

        const calculatorGross = readCalculatorAmount('vis-brutto');
        const calculatorTax = readCalculatorAmount('vis-skattetrekk');
        const calculatorUnion = readCalculatorAmount('vis-fagforening-mnd');
        const calculatorOvertime = readCalculatorAmount('vis-sumvakt-brutto');
        const calculatorNet = readCalculatorAmount('vis-netto');
        const calculatorOvertime50Hours = ['vis-timer-hverdag50', 'vis-timer-helg50']
            .map(readCalculatorAmount)
            .reduce((total, hours) => total + (hours || 0), 0);
        const calculatorOvertime100Hours = ['vis-timer-hverdag100', 'vis-timer-helg100']
            .map(readCalculatorAmount)
            .reduce((total, hours) => total + (hours || 0), 0);
        const calculatorNetWage = calculatorGross !== null && calculatorTax !== null
            ? calculatorGross - Math.abs(calculatorTax)
            : null;

        const table = document.createElement('table');
        table.className = 'w-full text-xs sm:text-sm border-collapse';
        const head = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Lønnspost', 'Lønnsslipp', 'Kalkulator', 'Differanse'].forEach((label) => {
            const cell = document.createElement('th');
            cell.textContent = label;
            cell.className = 'py-2 px-2 text-right first:text-left font-bold text-slate-500 dark:text-slate-400 border-b border-slate-300 dark:border-slate-700';
            headerRow.appendChild(cell);
        });
        head.appendChild(headerRow);
        table.appendChild(head);

        const body = document.createElement('tbody');
        [
            ['Bruttolønn', values.gross, calculatorGross],
            ['Forskuddstrekk', values.tax, calculatorTax === null ? null : Math.abs(calculatorTax)],
            ['Overtid 50 % (timer)', values['overtime-50-hours'], calculatorOvertime50Hours, 'hours'],
            ['Overtid 100 % (timer)', values['overtime-100-hours'], calculatorOvertime100Hours, 'hours'],
            ['Overtid / tilleggsvakter', values.overtime, calculatorOvertime],
            ['Nettolønn før andre trekk', values['net-wage'], calculatorNetWage],
            ['Fagforeningskontingent', values['union-fee'], calculatorUnion === null ? null : Math.abs(calculatorUnion)],
            ['Netto til utbetaling', values.payout, calculatorNet === null ? null : Math.abs(calculatorNet)]
        ].forEach((row) => body.appendChild(buildComparisonRow(...row)));
        table.appendChild(body);

        const wrapper = document.createElement('div');
        wrapper.className = 'overflow-x-auto';
        wrapper.appendChild(table);
        result.appendChild(wrapper);

        const annualHeading = document.createElement('h4');
        annualHeading.className = 'mt-6 mb-2 font-bold text-slate-800 dark:text-slate-200';
        annualHeading.textContent = 'Årsoppsummering';
        result.appendChild(annualHeading);

        const yearToDateSummary = document.createElement('div');
        yearToDateSummary.className = 'flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3';
        const yearToDateLabel = document.createElement('span');
        yearToDateLabel.className = 'font-semibold text-slate-700 dark:text-slate-300';
        yearToDateLabel.textContent = 'Faktisk bruttolønn hittil i år (lønnsslipp)';
        const yearToDateAmount = document.createElement('span');
        yearToDateAmount.className = 'font-mono font-bold text-slate-900 dark:text-white text-right';
        yearToDateAmount.textContent = values['ytd-gross'] === null ? 'Ikke funnet' : formatKr(values['ytd-gross']);
        yearToDateSummary.append(yearToDateLabel, yearToDateAmount);
        result.appendChild(yearToDateSummary);

        const yearToDateTaxSummary = document.createElement('div');
        yearToDateTaxSummary.className = 'mt-2 flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3';
        const yearToDateTaxLabel = document.createElement('span');
        yearToDateTaxLabel.className = 'font-semibold text-slate-700 dark:text-slate-300';
        yearToDateTaxLabel.textContent = 'Forskuddstrekk betalt hittil i år (lønnsslipp)';
        const yearToDateTaxAmount = document.createElement('span');
        yearToDateTaxAmount.className = 'font-mono font-bold text-slate-900 dark:text-white text-right';
        yearToDateTaxAmount.textContent = values['ytd-tax'] === null ? 'Ikke funnet' : formatKr(values['ytd-tax']);
        yearToDateTaxSummary.append(yearToDateTaxLabel, yearToDateTaxAmount);
        result.appendChild(yearToDateTaxSummary);

        const note = document.createElement('p');
        note.className = 'mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400';
        note.textContent = 'Differansen i sammenligningstabellen er kalkulatorens tall minus lønnsslippens tall. Bruttolønn og forskuddstrekk hittil i år vises som lønnsslippens faktiske akkumulerte beløp; de sammenlignes ikke med kalkulatorens årsprognose. Fagforeningskontingenten sammenlignes med fagforeningstrekket i kalkulatoren. Andre trekk på lønnsslippen er ikke med.';
        result.appendChild(note);

        const year = document.getElementById('year');
        const month = document.getElementById('month');
        if (period.textContent && year && month) {
            const matches = period.textContent.match(/(\w+)\s+(\d{4})$/);
            const periodMonth = matches ? MONTH_NAMES.indexOf(matches[1].toLocaleLowerCase('nb-NO')) : -1;
            if (matches && (Number(year.value) !== Number(matches[2]) || Number(month.value) !== periodMonth)) {
                const warning = document.createElement('p');
                warning.className = 'mt-3 text-sm font-semibold text-amber-700 dark:text-amber-400';
                warning.textContent = `Merk: Lønnsslippen gjelder ${matches[1]} ${matches[2]}, mens kalkulatoren står på en annen periode.`;
                result.appendChild(warning);
            }
        }
    }

    fileInput.addEventListener('change', async () => {
        clearFields();
        const file = fileInput.files && fileInput.files[0];
        if (!file) {
            setStatus('PDF-en leses i nettleseren din. Den lagres ikke eller sendes til en server. Skannede PDF-er støttes ikke ennå; da kan du fylle inn beløpene manuelt.', false);
            return;
        }
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setStatus('Velg en PDF-fil. Andre filtyper støttes ikke.', true);
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setStatus('PDF-filen er større enn 15 MB. Velg en mindre fil eller fyll inn beløpene manuelt.', true);
            return;
        }

        setStatus('Leser PDF lokalt i nettleseren …', false);
        try {
            const data = await readPdf(file);
            displayExtractedData(data);
            const foundCount = [data.gross, data.tax, data.overtime, data.overtime50Hours, data.overtime100Hours, data.yearToDateGross, data.yearToDateTax, data.unionFee, data.netWage, data.payout].filter((value) => value !== null).length;
            if (foundCount) {
                setStatus(`${foundCount} lønnstall ble gjenkjent. Kontroller feltene før du sammenligner. Fagforeningskontingent fylles bare ut hvis den er funnet som egen lønnslinje.`, false);
            } else {
                setStatus('Fant ikke lesbare lønnstall i PDF-en. Den kan være skannet eller ha et annet oppsett; fyll inn beløpene manuelt.', true);
            }
        } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Kunne ikke lese PDF-en. Fyll inn beløpene manuelt.', true);
        }
    });

    document.getElementById('salary-slip-compare').addEventListener('click', compare);
    document.getElementById('salary-slip-clear').addEventListener('click', () => {
        fileInput.value = '';
        clearFields();
        setStatus('Feltene er tømt. PDF-en og lønnstallene er fjernet fra skjermen.', false);
    });

    FIELD_IDS.forEach((id) => {
        document.getElementById(`slip-${id}`).addEventListener('input', clearComparison);
    });
})();
