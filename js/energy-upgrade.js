(function () {
    'use strict';

    const fields = {
        investment: document.getElementById('upgrade-investment'),
        support: document.getElementById('upgrade-support'),
        savings: document.getElementById('upgrade-savings'),
        price: document.getElementById('upgrade-price'),
        maintenance: document.getElementById('upgrade-maintenance'),
        lifetime: document.getElementById('upgrade-lifetime'),
        priceGrowth: document.getElementById('upgrade-price-growth'),
        discount: document.getElementById('upgrade-discount')
    };
    const result = document.getElementById('upgrade-result');
    if (!result || Object.values(fields).some(field => !field)) return;

    const locale = () => document.documentElement.lang === 'en' ? 'en-GB' : 'nb-NO';
    const text = (no, en) => document.documentElement.lang === 'en' ? en : no;
    const currency = value => new Intl.NumberFormat(locale(), {
        style: 'currency',
        currency: 'NOK',
        maximumFractionDigits: 0
    }).format(value);

    function readNumber(field, min, max) {
        const value = Number(String(field.value).replace(',', '.'));
        if (!Number.isFinite(value)) return min;
        return Math.max(min, Math.min(max, value));
    }

    function summary(label, value, detail) {
        return `<div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <p class="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">${label}</p>
            <p class="text-2xl font-mono font-extrabold text-slate-900 dark:text-white mt-1">${value}</p>
            ${detail ? `<p class="text-xs text-slate-500 mt-1">${detail}</p>` : ''}
        </div>`;
    }

    function calculate() {
        const investment = readNumber(fields.investment, 0, 1e9);
        const support = readNumber(fields.support, 0, 1e9);
        const netInvestment = Math.max(0, investment - support);
        const savedEnergy = readNumber(fields.savings, 0, 1e9);
        const price = readNumber(fields.price, 0, 1000);
        const annualMaintenance = readNumber(fields.maintenance, 0, 1e9);
        const lifetime = Math.round(readNumber(fields.lifetime, 1, 50));
        const priceGrowth = readNumber(fields.priceGrowth, -99.9, 100) / 100;
        const discountRate = readNumber(fields.discount, 0, 100) / 100;
        let totalSavings = 0;
        let discountedSavings = 0;
        let paybackYears = netInvestment === 0 ? 0 : null;

        for (let year = 1; year <= lifetime; year += 1) {
            const energySavings = savedEnergy * price * Math.pow(1 + priceGrowth, year - 1);
            const netAnnualSavings = energySavings - annualMaintenance;
            const previousTotal = totalSavings;
            totalSavings += netAnnualSavings;
            discountedSavings += netAnnualSavings / Math.pow(1 + discountRate, year);
            if (paybackYears === null && totalSavings >= netInvestment && netAnnualSavings > 0) {
                paybackYears = year - 1 + (netInvestment - previousTotal) / netAnnualSavings;
            }
        }

        const lifetimeNetSavings = totalSavings - netInvestment;
        const netPresentValue = discountedSavings - netInvestment;
        const payback = paybackYears === null
            ? `>${lifetime} ${text('år', 'years')}`
            : `${new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(paybackYears)} ${text('år', 'years')}`;
        const returnRate = netInvestment > 0
            ? new Intl.NumberFormat(locale(), { style: 'percent', maximumFractionDigits: 1 }).format(lifetimeNetSavings / netInvestment)
            : '—';

        result.innerHTML = [
            summary(text('Årlig netto besparelse, år 1', 'Net annual savings, year 1'), currency(savedEnergy * price - annualMaintenance)),
            summary(text('Anslått tilbakebetalingstid', 'Estimated payback period'), payback, `${text('Innen forventet levetid på', 'Within the expected lifetime of')} ${lifetime} ${text('år', 'years')}`),
            summary(text('Netto gevinst over levetiden', 'Net savings over lifetime'), currency(lifetimeNetSavings), `${text('Avkastning mot netto investering:', 'Return on net investment:')} ${returnRate}`),
            summary(text('Nåverdi av besparelsene', 'Present value of savings'), currency(netPresentValue), `${text('Kalkulasjonsrente:', 'Discount rate:')} ${new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(discountRate * 100)} %`)
        ].join('');
    }

    function useCalculatedPrice() {
        const priceResult = document.getElementById('res-pwr-total');
        const match = priceResult?.textContent.match(/-?\d+(?:[.,]\d+)?/);
        if (!match) {
            result.innerHTML = `<p class="text-sm text-rose-600 dark:text-rose-400" role="alert">${text('Fant ingen beregnet strømpris. Kontroller strømprisfeltet manuelt.', 'No calculated electricity price was found. Check the price field manually.')}</p>`;
            return;
        }
        fields.price.value = match[0].replace(',', '.');
        calculate();
    }

    Object.values(fields).forEach(field => field.addEventListener('input', calculate));
    document.getElementById('upgrade-use-current-price').addEventListener('click', useCalculatedPrice);
    window.addEventListener('verksted:language-change', calculate);
    calculate();
})();
