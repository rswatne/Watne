(function () {
    'use strict';

    const root = document.getElementById('finance-tools-root');
    if (!root) return;

    const STORAGE_KEY = 'watne_personal_finance_v1';
    const cardClass = 'bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm';
    const inputClass = 'glass-input glass-input-brand';
    const buttonClass = 'inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-colors';
    const numberFormat = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });
    const preciseFormat = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 2 });
    const defaults = {
        income: [],
        expenses: [],
        subscriptions: [],
        debts: [],
        loan: { principal: '2500000', rate: '5.5', years: '25', extra: '0' },
        savings: { initial: '0', monthly: '2000', rate: '4', years: '10' },
        buffer: { expenses: '25000', months: '3', current: '0' },
        debtExtra: '0'
    };

    const freshDefaults = () => JSON.parse(JSON.stringify(defaults));
    let state = loadState();

    function language() {
        try {
            return localStorage.getItem('verksted_lang') === 'en' ? 'en' : 'no';
        } catch (error) {
            return 'no';
        }
    }

    function t(no, en) {
        return language() === 'en' ? en : no;
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    }

    function parseNumber(value) {
        const parsed = Number(String(value ?? '').replace(',', '.'));
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function amount(value) {
        return numberFormat.format(Math.round((Number(value) || 0) * 100) / 100) + ' kr';
    }

    function preciseAmount(value) {
        return preciseFormat.format(Math.round((Number(value) || 0) * 100) / 100) + ' kr';
    }

    function loadState() {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (!stored || typeof stored !== 'object') return freshDefaults();
            return {
                ...freshDefaults(),
                ...stored,
                loan: { ...defaults.loan, ...(stored.loan || {}) },
                savings: { ...defaults.savings, ...(stored.savings || {}) },
                buffer: { ...defaults.buffer, ...(stored.buffer || {}) },
                income: Array.isArray(stored.income) ? stored.income : [],
                expenses: Array.isArray(stored.expenses) ? stored.expenses : [],
                subscriptions: Array.isArray(stored.subscriptions) ? stored.subscriptions : [],
                debts: Array.isArray(stored.debts) ? stored.debts : []
            };
        } catch (error) {
            return { ...freshDefaults(), storageError: true };
        }
    }

    function saveState() {
        try {
            const { storageError, ...persisted } = state;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
            const status = document.getElementById('finance-storage-status');
            if (status) status.textContent = t('Tallene lagres bare lokalt i denne nettleseren.', 'Your figures are stored only in this browser.');
        } catch (error) {
            const status = document.getElementById('finance-storage-status');
            if (status) status.textContent = t('Kunne ikke lagre lokalt. Kontroller nettleserens lagringsinnstillinger.', 'Could not save locally. Check your browser storage settings.');
        }
    }

    function field(path, label, value, step = '100', min = '0') {
        return `<label class="block text-xs font-semibold text-slate-600 dark:text-slate-400">${label}
            <input class="${inputClass} mt-1.5" type="number" min="${min}" step="${step}" value="${escapeHtml(value)}" data-finance-field="${path}">
        </label>`;
    }

    function summary(title, value, sub = '') {
        return `<div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <p class="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">${title}</p>
            <p class="text-2xl font-mono font-extrabold text-slate-900 dark:text-white mt-1">${value}</p>
            ${sub ? `<p class="text-xs text-slate-500 mt-1">${sub}</p>` : ''}
        </div>`;
    }

    function sectionTitle(icon, title, description) {
        return `<summary class="mb-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <div class="flex items-center justify-between gap-3">
                <h3 class="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><i data-lucide="${icon}" class="w-5 h-5 text-emerald-500"></i>${title}</h3>
                <span class="shrink-0 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300" data-finance-chevron aria-hidden="true">−</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${description}</p>
        </summary>`;
    }

    function listRows(items, collection, kind) {
        if (!items.length) return `<p class="text-xs text-slate-500 py-2">${t('Ingen poster ennå. Legg til en rad for å komme i gang.', 'No entries yet. Add a row to get started.')}</p>`;
        return items.map((item, index) => {
            if (collection === 'debts') {
                return `<div class="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end border-t border-slate-100 dark:border-slate-800 pt-3">
                    <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400">${t('Lån / kreditor', 'Loan / creditor')}<input class="${inputClass} mt-1" value="${escapeHtml(item.name)}" data-finance-row="${collection}" data-index="${index}" data-property="name"></label>
                    <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400">${t('Saldo (kr)', 'Balance (NOK)')}<input class="${inputClass} mt-1" type="number" min="0" step="1000" value="${escapeHtml(item.balance)}" data-finance-row="${collection}" data-index="${index}" data-property="balance"></label>
                    <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400">${t('Rente (%)', 'Interest (%)')}<input class="${inputClass} mt-1" type="number" min="0" step="0.1" value="${escapeHtml(item.rate)}" data-finance-row="${collection}" data-index="${index}" data-property="rate"></label>
                    <div class="flex gap-2 items-end"><label class="block flex-1 text-xs font-semibold text-slate-600 dark:text-slate-400">${t('Minstebeløp / mnd', 'Minimum / month')}<input class="${inputClass} mt-1" type="number" min="0" step="100" value="${escapeHtml(item.minimum)}" data-finance-row="${collection}" data-index="${index}" data-property="minimum"></label><button type="button" class="px-3 py-2.5 rounded-xl text-xs text-rose-600 bg-rose-500/10" data-finance-remove="${collection}" data-index="${index}" aria-label="${t('Fjern gjeld', 'Remove debt')}">✕</button></div>
                </div>`;
            }
            if (collection === 'subscriptions') {
                return `<div class="grid grid-cols-1 sm:grid-cols-[1fr_9rem_9rem_auto] gap-2 items-end border-t border-slate-100 dark:border-slate-800 pt-3">
                    <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400">${t('Navn', 'Name')}<input class="${inputClass} mt-1" value="${escapeHtml(item.name)}" data-finance-row="${collection}" data-index="${index}" data-property="name"></label>
                    <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400">${t('Beløp (kr)', 'Amount (NOK)')}<input class="${inputClass} mt-1" type="number" min="0" step="10" value="${escapeHtml(item.amount)}" data-finance-row="${collection}" data-index="${index}" data-property="amount"></label>
                    <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400">${t('Frekvens', 'Frequency')}<select class="${inputClass} mt-1" data-finance-row="${collection}" data-index="${index}" data-property="period"><option value="month" ${item.period !== 'year' ? 'selected' : ''}>${t('Månedlig', 'Monthly')}</option><option value="year" ${item.period === 'year' ? 'selected' : ''}>${t('Årlig', 'Yearly')}</option></select></label>
                    <button type="button" class="px-3 py-2.5 rounded-xl text-xs text-rose-600 bg-rose-500/10" data-finance-remove="${collection}" data-index="${index}" aria-label="${t('Fjern abonnement', 'Remove subscription')}">✕</button>
                </div>`;
            }
            return `<div class="grid grid-cols-1 sm:grid-cols-[1fr_10rem_auto] gap-2 items-end border-t border-slate-100 dark:border-slate-800 pt-3">
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400">${t('Post', 'Item')}<input class="${inputClass} mt-1" value="${escapeHtml(item.name)}" data-finance-row="${collection}" data-index="${index}" data-property="name"></label>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400">${t('Beløp per måned (kr)', 'Monthly amount (NOK)')}<input class="${inputClass} mt-1" type="number" min="0" step="100" value="${escapeHtml(item.amount)}" data-finance-row="${collection}" data-index="${index}" data-property="amount"></label>
                <button type="button" class="px-3 py-2.5 rounded-xl text-xs text-rose-600 bg-rose-500/10" data-finance-remove="${collection}" data-index="${index}" aria-label="${kind === 'income' ? t('Fjern inntekt', 'Remove income') : t('Fjern utgift', 'Remove expense')}">✕</button>
            </div>`;
        }).join('');
    }

    function render() {
        const english = language() === 'en';
        const collapsedCards = new Set(
            [...root.querySelectorAll('details[id^="finance-"]:not([open])')].map(card => card.id)
        );
        root.innerHTML = `
            <div class="${cardClass} mb-6 border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-900/10">
                <p class="font-bold text-slate-900 dark:text-white">${t('Enkle verktøy for oversikt og planlegging', 'Simple tools for planning and keeping track')}</p>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">${t('Beregningene er anslag, ikke personlig økonomisk rådgivning. Tallene lagres bare lokalt i denne nettleseren — ikke på en server.', 'These are estimates, not personal financial advice. Figures are stored only in this browser, not on a server.')}</p>
                <p id="finance-storage-status" class="text-xs text-slate-500 mt-2">${state.storageError ? t('Kunne ikke lese tidligere lagrede tall. Nye tall lagres lokalt når mulig.', 'Could not read previously saved figures. New figures will be saved locally if possible.') : t('Tallene lagres bare lokalt i denne nettleseren.', 'Your figures are stored only in this browser.')}</p>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <details id="finance-budget" class="${cardClass}" open>
                    ${sectionTitle('scale', t('Månedsbudsjett', 'Monthly budget'), t('Legg inn inntekter og faste eller variable utgifter for å se hva som blir igjen.', 'Add income and regular or variable expenses to see what remains.'))}
                    <div class="space-y-4">
                        <div><div class="flex items-center justify-between gap-2 mb-2"><h4 class="text-sm font-bold text-slate-800 dark:text-slate-200">${t('Inntekter per måned', 'Monthly income')}</h4><button type="button" class="${buttonClass}" data-finance-add="income">${t('+ Inntekt', '+ Income')}</button></div><div class="space-y-2">${listRows(state.income, 'income', 'income')}</div></div>
                        <div><div class="flex items-center justify-between gap-2 mb-2"><h4 class="text-sm font-bold text-slate-800 dark:text-slate-200">${t('Utgifter per måned', 'Monthly expenses')}</h4><button type="button" class="${buttonClass}" data-finance-add="expenses">${t('+ Utgift', '+ Expense')}</button></div><div class="space-y-2">${listRows(state.expenses, 'expenses', 'expense')}</div></div>
                    </div>
                    <div id="finance-budget-result" class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5"></div>
                </details>

                <details id="finance-loan" class="${cardClass}" open>
                    ${sectionTitle('landmark', t('Lånekalkulator', 'Loan calculator'), t('Se anslått terminbeløp og hva ekstra innbetaling kan bety.', 'Estimate monthly payments and see the effect of extra repayments.'))}
                    <div class="grid grid-cols-2 gap-3">
                        ${field('loan.principal', t('Lånebeløp (kr)', 'Loan amount (NOK)'), state.loan.principal, '10000')}
                        ${field('loan.rate', t('Nominell rente per år (%)', 'Annual interest rate (%)'), state.loan.rate, '0.1')}
                        ${field('loan.years', t('Nedbetalingstid (år)', 'Loan term (years)'), state.loan.years, '1')}
                        ${field('loan.extra', t('Ekstra innbetaling per måned (kr)', 'Extra monthly repayment (NOK)'), state.loan.extra, '100')}
                    </div>
                    <div id="finance-loan-result" class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5"></div>
                    <p class="text-xs text-slate-500 mt-3">${t('Forenklet annuitetsberegning. Gebyrer, renteendringer og bankens vilkår er ikke med.', 'Simplified annuity estimate. Fees, rate changes and lender terms are not included.')}</p>
                </details>

                <details id="finance-savings" class="${cardClass}" open>
                    ${sectionTitle('piggy-bank', t('Sparekalkulator', 'Savings calculator'), t('Beregn hvordan fast månedlig sparing kan vokse over tid.', 'Estimate how regular monthly savings could grow over time.'))}
                    <div class="grid grid-cols-2 gap-3">
                        ${field('savings.initial', t('Startbeløp (kr)', 'Starting amount (NOK)'), state.savings.initial, '1000')}
                        ${field('savings.monthly', t('Sparing per måned (kr)', 'Monthly contribution (NOK)'), state.savings.monthly, '100')}
                        ${field('savings.rate', t('Antatt årlig avkastning (%)', 'Assumed annual return (%)'), state.savings.rate, '0.1', '-99.9')}
                        ${field('savings.years', t('Sparehorisont (år)', 'Saving period (years)'), state.savings.years, '1')}
                    </div>
                    <div id="finance-savings-result" class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5"></div>
                    <p class="text-xs text-slate-500 mt-3">${t('Avkastning er usikker og kan være negativ. Beregningen inkluderer ikke skatt, gebyrer eller inflasjon.', 'Returns are uncertain and may be negative. Taxes, fees and inflation are not included.')}</p>
                </details>

                <details id="finance-debt" class="${cardClass}" open>
                    ${sectionTitle('list-checks', t('Nedbetalingsplan for gjeld', 'Debt repayment planner'), t('Sammenlign høyeste rente først med laveste saldo først.', 'Compare highest-interest-first with lowest-balance-first.'))}
                    <div class="space-y-2">${listRows(state.debts, 'debts')}</div>
                    <button type="button" class="${buttonClass} mt-3" data-finance-add="debts">${t('+ Legg til gjeld', '+ Add debt')}</button>
                    <div class="mt-4 max-w-sm">${field('debtExtra', t('Ekstra å betale per måned (kr)', 'Extra available per month (NOK)'), state.debtExtra, '100')}</div>
                    <div id="finance-debt-result" class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5"></div>
                    <p class="text-xs text-slate-500 mt-3">${t('Planen forutsetter uendrede renter og at minstebeløp betales hver måned. Avtalte vilkår hos långiver gjelder.', 'Assumes unchanged rates and minimum payments every month. Your lender’s terms apply.')}</p>
                </details>

                <details id="finance-subscriptions" class="${cardClass}" open>
                    ${sectionTitle('receipt', t('Abonnementsoversikt', 'Subscription tracker'), t('Få måneds- og årskostnaden for gjentakende betalinger.', 'See monthly and annual costs for recurring payments.'))}
                    <div class="space-y-2">${listRows(state.subscriptions, 'subscriptions')}</div>
                    <button type="button" class="${buttonClass} mt-3" data-finance-add="subscriptions">${t('+ Legg til abonnement', '+ Add subscription')}</button>
                    <div id="finance-subscriptions-result" class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5"></div>
                </details>

                <details id="finance-buffer" class="${cardClass}" open>
                    ${sectionTitle('shield-check', t('Bufferkalkulator', 'Emergency fund calculator'), t('Sett et mål basert på nødvendige månedsutgifter og ønsket antall måneder.', 'Set a target based on essential monthly expenses and a chosen number of months.'))}
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        ${field('buffer.expenses', t('Nødvendige utgifter per måned (kr)', 'Essential monthly expenses (NOK)'), state.buffer.expenses, '1000')}
                        ${field('buffer.months', t('Måneder i buffer', 'Months of expenses'), state.buffer.months, '1')}
                        ${field('buffer.current', t('Buffer du har nå (kr)', 'Current savings (NOK)'), state.buffer.current, '1000')}
                    </div>
                    <div id="finance-buffer-result" class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5"></div>
                </details>
            </div>
            <div class="flex justify-end mt-5">
                <button type="button" class="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 border border-slate-200 dark:border-slate-800" data-finance-action="reset">${t('Nullstill privatøkonomitall', 'Reset personal finance figures')}</button>
            </div>`;
        root.querySelectorAll('details[id^="finance-"]').forEach(card => {
            if (collapsedCards.has(card.id)) card.open = false;
            const updateChevron = () => {
                const chevron = card.querySelector('[data-finance-chevron]');
                if (chevron) chevron.textContent = card.open ? '−' : '+';
            };
            card.addEventListener('toggle', updateChevron);
            updateChevron();
        });
        updateResults();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function monthlyPayment(principal, annualRate, months) {
        const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
        if (monthlyRate === 0) return principal / months;
        return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
    }

    function simulateLoan(principal, annualRate, payment) {
        const monthlyRate = annualRate / 1200;
        let balance = principal;
        let totalInterest = 0;
        let totalPaid = 0;
        let months = 0;
        while (balance > 0.005 && months < 1200) {
            const interest = balance * monthlyRate;
            const amountPaid = Math.min(balance + interest, payment);
            if (amountPaid <= interest && balance > 0) return null;
            totalInterest += interest;
            totalPaid += amountPaid;
            balance = Math.max(0, balance + interest - amountPaid);
            months += 1;
        }
        return balance <= 0.005 ? { months, totalInterest, totalPaid } : null;
    }

    function simulateDebtPlan(debts, extra, snowball) {
        const remaining = debts.map(debt => ({ ...debt, balance: debt.balance }));
        let totalInterest = 0;
        let months = 0;
        while (remaining.some(debt => debt.balance > 0.005) && months < 1200) {
            months += 1;
            remaining.forEach(debt => {
                if (debt.balance <= 0.005) return;
                const interest = debt.balance * debt.rate / 1200;
                debt.balance += interest;
                debt.interestPaid += interest;
                totalInterest += interest;
                const payment = Math.min(debt.balance, debt.minimum);
                debt.balance -= payment;
            });

            let extraLeft = extra;
            const order = remaining.filter(debt => debt.balance > 0.005).sort((a, b) => snowball
                ? a.balance - b.balance || b.rate - a.rate
                : b.rate - a.rate || a.balance - b.balance);
            for (const debt of order) {
                if (extraLeft <= 0) break;
                const payment = Math.min(debt.balance, extraLeft);
                debt.balance -= payment;
                extraLeft -= payment;
            }
        }
        return remaining.every(debt => debt.balance <= 0.005) ? { months, totalInterest } : null;
    }

    function updateResults() {
        const income = state.income.reduce((total, item) => total + Math.max(0, parseNumber(item.amount)), 0);
        const expenses = state.expenses.reduce((total, item) => total + Math.max(0, parseNumber(item.amount)), 0);
        const remainder = income - expenses;
        const budgetResult = document.getElementById('finance-budget-result');
        if (budgetResult) budgetResult.innerHTML = [
            summary(t('Inntekter', 'Income'), amount(income)),
            summary(t('Utgifter', 'Expenses'), amount(expenses)),
            summary(t('Igjen per måned', 'Remaining per month'), amount(remainder), remainder < 0 ? t('Utgiftene er høyere enn inntektene som er lagt inn.', 'Entered expenses exceed entered income.') : '')
        ].join('');

        const principal = Math.max(0, parseNumber(state.loan.principal));
        const rate = Math.max(0, parseNumber(state.loan.rate));
        const months = Math.min(1200, Math.round(Math.max(0, parseNumber(state.loan.years)) * 12));
        const loanResult = document.getElementById('finance-loan-result');
        if (loanResult) {
            if (!principal || !months) {
                loanResult.innerHTML = `<p class="text-sm text-slate-500 sm:col-span-2">${t('Legg inn et lånebeløp og en nedbetalingstid.', 'Enter a loan amount and term.')}</p>`;
            } else {
                const payment = monthlyPayment(principal, rate, months);
                const base = simulateLoan(principal, rate, payment);
                const withExtra = simulateLoan(principal, rate, payment + Math.max(0, parseNumber(state.loan.extra)));
                loanResult.innerHTML = [
                    summary(t('Terminbeløp per måned', 'Monthly payment'), preciseAmount(payment), t('før eventuelle gebyrer', 'before fees')),
                    summary(t('Renter uten ekstra innbetaling', 'Interest without extra payments'), base ? amount(base.totalInterest) : '—'),
                    summary(t('Tid med ekstra innbetaling', 'Time with extra payments'), withExtra ? `${withExtra.months} ${t('mnd', 'mo')}` : t('Over 100 år', 'Over 100 years')),
                    summary(t('Renter spart med ekstra', 'Interest saved with extra'), base && withExtra ? amount(Math.max(0, base.totalInterest - withExtra.totalInterest)) : '—')
                ].join('');
            }
        }

        const savingsResult = document.getElementById('finance-savings-result');
        if (savingsResult) {
            const initial = Math.max(0, parseNumber(state.savings.initial));
            const monthly = Math.max(0, parseNumber(state.savings.monthly));
            const annualRate = parseNumber(state.savings.rate);
            const savingsMonths = Math.min(1200, Math.round(Math.max(0, parseNumber(state.savings.years)) * 12));
            const monthlyRate = annualRate / 1200;
            let futureValue = initial;
            for (let month = 0; month < savingsMonths; month += 1) {
                futureValue = futureValue * (1 + monthlyRate) + monthly;
            }
            const contributed = initial + monthly * savingsMonths;
            savingsResult.innerHTML = [
                summary(t('Anslått saldo', 'Estimated balance'), amount(futureValue)),
                summary(t('Innbetalt totalt', 'Total contributions'), amount(contributed)),
                summary(t('Anslått vekst', 'Estimated growth'), amount(futureValue - contributed))
            ].join('');
        }

        const debtResult = document.getElementById('finance-debt-result');
        if (debtResult) {
            const debts = state.debts.map(item => ({
                name: String(item.name || '').trim(),
                balance: Math.max(0, parseNumber(item.balance)),
                rate: Math.max(0, parseNumber(item.rate)),
                minimum: Math.max(0, parseNumber(item.minimum)),
                interestPaid: 0
            })).filter(debt => debt.balance > 0);
            if (!debts.length) {
                debtResult.innerHTML = `<p class="text-sm text-slate-500 sm:col-span-2">${t('Legg inn minst én gjeld med saldo for å sammenligne planene.', 'Add at least one debt balance to compare the plans.')}</p>`;
            } else {
                const extra = Math.max(0, parseNumber(state.debtExtra));
                const avalanche = simulateDebtPlan(debts, extra, false);
                const snowball = simulateDebtPlan(debts, extra, true);
                debtResult.innerHTML = [
                    summary(t('Høyeste rente først', 'Highest interest first'), avalanche ? `${avalanche.months} ${t('mnd', 'mo')}` : t('Ikke nedbetalt innen 100 år', 'Not paid off within 100 years'), avalanche ? `${t('Renter totalt:', 'Total interest:')} ${amount(avalanche.totalInterest)}` : t('Øk betalingene eller kontroller minstebeløpene.', 'Increase payments or check minimum payments.')),
                    summary(t('Laveste saldo først', 'Lowest balance first'), snowball ? `${snowball.months} ${t('mnd', 'mo')}` : t('Ikke nedbetalt innen 100 år', 'Not paid off within 100 years'), snowball ? `${t('Renter totalt:', 'Total interest:')} ${amount(snowball.totalInterest)}` : t('Øk betalingene eller kontroller minstebeløpene.', 'Increase payments or check minimum payments.')),
                    avalanche && snowball ? summary(t('Forskjell i renter', 'Interest difference'), amount(Math.abs(avalanche.totalInterest - snowball.totalInterest)), avalanche.totalInterest <= snowball.totalInterest ? t('Høyeste rente først koster minst i dette anslaget.', 'Highest-interest-first costs less in this estimate.') : t('Laveste saldo først koster minst i dette anslaget.', 'Lowest-balance-first costs less in this estimate.')) : ''
                ].join('');
            }
        }

        const subscriptionResult = document.getElementById('finance-subscriptions-result');
        if (subscriptionResult) {
            const monthlyCost = state.subscriptions.reduce((sum, item) => {
                const cost = Math.max(0, parseNumber(item.amount));
                return sum + (item.period === 'year' ? cost / 12 : cost);
            }, 0);
            subscriptionResult.innerHTML = [
                summary(t('Per måned (snitt)', 'Per month (average)'), amount(monthlyCost)),
                summary(t('Per år', 'Per year'), amount(monthlyCost * 12))
            ].join('');
        }

        const bufferResult = document.getElementById('finance-buffer-result');
        if (bufferResult) {
            const target = Math.max(0, parseNumber(state.buffer.expenses)) * Math.max(0, parseNumber(state.buffer.months));
            const current = Math.max(0, parseNumber(state.buffer.current));
            const missing = Math.max(0, target - current);
            bufferResult.innerHTML = [
                summary(t('Buffermål', 'Target fund'), amount(target)),
                summary(t('Du har nå', 'Current fund'), amount(current)),
                summary(t('Gjenstår til målet', 'Remaining to target'), amount(missing), target > 0 ? `${preciseFormat.format(Math.min(100, current / target * 100))} % ${t('av målet', 'of target')}` : '')
            ].join('');
        }
    }

    function updateFromInput(input) {
        if (input.dataset.financeField) {
            const path = input.dataset.financeField.split('.');
            if (path.length === 2) state[path[0]][path[1]] = input.value;
            else state[path[0]] = input.value;
        } else if (input.dataset.financeRow) {
            const collection = input.dataset.financeRow;
            const item = state[collection]?.[Number(input.dataset.index)];
            if (item) item[input.dataset.property] = input.value;
        }
        saveState();
        updateResults();
    }

    function addRow(collection) {
        const defaultsByCollection = {
            income: { name: '', amount: '' },
            expenses: { name: '', amount: '' },
            subscriptions: { name: '', amount: '', period: 'month' },
            debts: { name: '', balance: '', rate: '', minimum: '' }
        };
        state[collection].push(defaultsByCollection[collection]);
        saveState();
        render();
        const lastInput = root.querySelector(`[data-finance-row="${collection}"][data-index="${state[collection].length - 1}"]`);
        lastInput?.focus();
    }

    root.addEventListener('input', event => {
        const input = event.target.closest('[data-finance-field], [data-finance-row]');
        if (input) updateFromInput(input);
    });

    root.addEventListener('change', event => {
        const input = event.target.closest('[data-finance-field], [data-finance-row]');
        if (input) updateFromInput(input);
    });

    root.addEventListener('click', event => {
        const addButton = event.target.closest('[data-finance-add]');
        if (addButton) {
            addRow(addButton.dataset.financeAdd);
            return;
        }
        const removeButton = event.target.closest('[data-finance-remove]');
        if (removeButton) {
            state[removeButton.dataset.financeRemove].splice(Number(removeButton.dataset.index), 1);
            saveState();
            render();
            return;
        }
        if (event.target.closest('[data-finance-action="reset"]')) {
            if (!window.confirm(t('Dette nullstiller alle privatøkonomitall som er lagret i denne nettleseren. Fortsette?', 'This resets all personal finance figures saved in this browser. Continue?'))) return;
            state = freshDefaults();
            saveState();
            render();
        }
    });

    window.addEventListener('verksted:language-change', render);
    render();
})();
