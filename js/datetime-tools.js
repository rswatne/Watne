(function() {
    const page = document.getElementById('datetime');
    if (!page) return;

    const buttons = [...page.querySelectorAll('[data-datetime-mode]')];
    const resultMain = document.getElementById('datetime-result-main');
    const resultSummary = document.getElementById('datetime-result-summary');
    const resultDetails = document.getElementById('datetime-result-details');
    const resultError = document.getElementById('datetime-result-error');
    const description = document.getElementById('datetime-mode-description');
    const dayMs = 24 * 60 * 60 * 1000;
    let activeMode = localStorage.getItem('datetime_tools_mode') || 'duration';
    const descriptions = {
        duration: ['Regn ut arbeidstid mellom to klokkeslett. Slutt før start regnes som neste dag.', 'Calculate time between two clock times. An end time before the start is treated as the next day.'],
        difference: ['Tell kalenderdager, uker og hverdager mellom to datoer.', 'Count calendar days, weeks and weekdays between two dates.'],
        countdown: ['Se hvor lang tid det er igjen til en frist eller hendelse.', 'See how much time remains until a deadline or event.'],
        add: ['Finn klokkeslettet etter et antall timer og minutter.', 'Find the time after adding a number of hours and minutes.'],
        week: ['Finn ISO-ukenummer og ukedag for en dato.', 'Find the ISO week number and weekday for a date.']
    };

    const isEnglish = () => document.documentElement.lang === 'en';
    const formatNumber = value => new Intl.NumberFormat(
        isEnglish() ? 'en-GB' : 'nb-NO',
        { maximumFractionDigits: 2 }
    ).format(value);
    const formatDate = date => new Intl.DateTimeFormat(
        isEnglish() ? 'en-GB' : 'nb-NO',
        { dateStyle: 'long', timeZone: 'UTC' }
    ).format(date);
    const pad = value => String(value).padStart(2, '0');

    function formatLocalDate(date) {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function formatLocalDateTime(date) {
        return `${formatLocalDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function parseDate(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
        if (!match) return null;
        const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
        if (date.getUTCFullYear() !== Number(match[1]) ||
            date.getUTCMonth() !== Number(match[2]) - 1 ||
            date.getUTCDate() !== Number(match[3])) return null;
        return date;
    }

    function dayDifference(start, end) {
        return Math.round((end.getTime() - start.getTime()) / dayMs);
    }

    function countWeekdaysInclusive(start, end) {
        const totalDays = dayDifference(start, end) + 1;
        const completeWeeks = Math.floor(totalDays / 7);
        let weekdays = completeWeeks * 5;
        const remainingDays = totalDays % 7;
        for (let offset = 0; offset < remainingDays; offset += 1) {
            const day = (start.getUTCDay() + offset) % 7;
            if (day !== 0 && day !== 6) weekdays += 1;
        }
        return weekdays;
    }

    function isoWeek(date) {
        const thursday = new Date(date.getTime());
        const day = thursday.getUTCDay() || 7;
        thursday.setUTCDate(thursday.getUTCDate() + 4 - day);
        const firstDay = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
        return Math.ceil(((thursday - firstDay) / dayMs + 1) / 7);
    }

    function setError(message) {
        resultMain.textContent = '—';
        resultSummary.textContent = '';
        resultDetails.replaceChildren();
        resultError.textContent = message;
        resultError.classList.remove('hidden');
    }

    function setResult(main, summary, rows = []) {
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
    }

    function calculate() {
        const en = isEnglish();
        const fmt = formatNumber;

        if (activeMode === 'duration') {
            const start = document.getElementById('dt-duration-start').value;
            const end = document.getElementById('dt-duration-end').value;
            const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
            const startMatch = timePattern.exec(start);
            const endMatch = timePattern.exec(end);
            if (!startMatch || !endMatch) {
                setError(en ? 'Enter a valid time.' : 'Oppgi et gyldig klokkeslett.');
                return;
            }
            const startMinutes = Number(startMatch[1]) * 60 + Number(startMatch[2]);
            let endMinutes = Number(endMatch[1]) * 60 + Number(endMatch[2]);
            const overnight = endMinutes < startMinutes;
            if (overnight) endMinutes += 24 * 60;
            const duration = endMinutes - startMinutes;
            setResult(`${Math.floor(duration / 60)} ${en ? 'h' : 't'} ${duration % 60} ${en ? 'min' : 'min'}`,
                en ? 'Duration' : 'Arbeidstid',
                [[en ? 'Total minutes:' : 'Totalt antall minutter:', `${fmt(duration)} ${en ? 'min' : 'min'}`],
                    ...(overnight ? [[en ? 'End time:' : 'Sluttid:', en ? 'Next day' : 'Neste dag']] : [])]);
            return;
        }

        if (activeMode === 'difference') {
            const start = parseDate(document.getElementById('dt-diff-start').value);
            const end = parseDate(document.getElementById('dt-diff-end').value);
            if (!start || !end || end < start) {
                setError(en
                    ? 'Dates must be valid, and the end date must be the same as or later than the start date.'
                    : 'Datoene må være gyldige, og sluttdatoen må være lik eller etter startdatoen.');
                return;
            }
            const days = dayDifference(start, end);
            const weekdays = countWeekdaysInclusive(start, end);
            setResult(`${fmt(days)} ${en ? 'days' : 'dager'}`, en ? 'Date difference' : 'Datoforskjell', [
                [en ? 'Weeks:' : 'Uker:', fmt(days / 7)],
                [en ? 'Working days (Mon–Fri, incl. both dates):' : 'Arbeidsdager (man–fre, inkl. datoene):', fmt(weekdays)]
            ]);
            return;
        }

        if (activeMode === 'countdown') {
            const targetValue = document.getElementById('dt-countdown-target').value;
            const target = targetValue ? new Date(targetValue) : null;
            if (!target || !Number.isFinite(target.getTime())) {
                setError(en ? 'Enter a valid date and time.' : 'Oppgi en gyldig dato og tid.');
                return;
            }
            const label = document.getElementById('dt-countdown-label').value.trim() ||
                (en ? 'No deadline name' : 'Ingen fristnavn');
            const difference = target.getTime() - Date.now();
            const minutes = Math.floor(Math.abs(difference) / 60000);
            const days = Math.floor(minutes / 1440);
            const hours = Math.floor((minutes % 1440) / 60);
            const remainder = minutes % 60;
            const duration = `${fmt(days)} ${en ? 'd' : 'd'} ${pad(hours)} ${en ? 'h' : 't'} ${pad(remainder)} min`;
            setResult(duration, difference >= 0
                ? `${en ? 'Until' : 'Igjen til'} ${label}`
                : `${en ? 'Overdue' : 'Overskredet'}: ${label}`);
            return;
        }

        if (activeMode === 'add') {
            const time = document.getElementById('dt-add-start').value;
            const hours = Number(document.getElementById('dt-add-hours').value);
            const minutes = Number(document.getElementById('dt-add-minutes').value);
            const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
            if (!match) {
                setError(en ? 'Enter a valid time.' : 'Oppgi et gyldig klokkeslett.');
                return;
            }
            if (!Number.isInteger(hours) || hours < 0 || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
                setError(en
                    ? 'Hours must be a whole number of zero or more, and minutes must be 0–59.'
                    : 'Timer må være et helt tall på null eller mer, og minutter må være 0–59.');
                return;
            }
            const totalMinutes = Number(match[1]) * 60 + Number(match[2]) + hours * 60 + minutes;
            const daysAdded = Math.floor(totalMinutes / (24 * 60));
            const finalMinutes = totalMinutes % (24 * 60);
            const finalTime = `${pad(Math.floor(finalMinutes / 60))}:${pad(finalMinutes % 60)}`;
            setResult(finalTime, en ? 'Time after addition' : 'Klokkeslett etter tillegg', [
                [en ? 'Added:' : 'Lagt til:', `${fmt(hours)} ${en ? 'h' : 't'} ${fmt(minutes)} min`],
                [en ? 'Day offset:' : 'Dagsforskyvning:', `${fmt(daysAdded)} ${en ? 'days' : 'dager'}`]
            ]);
            return;
        }

        const date = parseDate(document.getElementById('dt-week-date').value);
        if (!date) {
            setError(en ? 'Choose a valid date.' : 'Velg en gyldig dato.');
            return;
        }
        const weekday = new Intl.DateTimeFormat(en ? 'en-GB' : 'nb-NO', { weekday: 'long', timeZone: 'UTC' })
            .format(date);
        setResult(`${en ? 'Week' : 'Uke'} ${isoWeek(date)}`, en ? 'Week number' : 'Ukenummer', [
            [en ? 'Date:' : 'Dato:', formatDate(date)],
            [en ? 'Weekday:' : 'Ukedag:', weekday]
        ]);
    }

    function chooseMode(mode) {
        activeMode = mode;
        localStorage.setItem('datetime_tools_mode', mode);
        buttons.forEach(button => {
            const active = button.dataset.datetimeMode === mode;
            button.setAttribute('aria-pressed', String(active));
            button.classList.toggle('bg-sky-500', active);
            button.classList.toggle('text-white', active);
            button.classList.toggle('border-sky-500', active);
            button.classList.toggle('shadow-md', active);
            button.classList.toggle('shadow-sky-500/20', active);
            button.classList.toggle('bg-white/80', !active);
            button.classList.toggle('dark:bg-slate-900/70', !active);
            button.classList.toggle('text-slate-600', !active);
            button.classList.toggle('dark:text-slate-300', !active);
            button.classList.toggle('border-slate-200', !active);
            button.classList.toggle('dark:border-slate-700', !active);
        });
        page.querySelectorAll('[data-datetime-fields]').forEach(fields => {
            fields.classList.toggle('hidden', fields.dataset.datetimeFields !== mode);
        });
        const activeButton = buttons.find(button => button.dataset.datetimeMode === mode);
        document.getElementById('datetime-mode-title').textContent = activeButton?.textContent.trim() || '';
        description.textContent = descriptions[mode][isEnglish() ? 1 : 0];
        calculate();
    }

    const today = new Date();
    const inSevenDays = new Date(today.getTime() + 7 * dayMs);
    document.getElementById('dt-diff-start').value = formatLocalDate(today);
    document.getElementById('dt-diff-end').value = formatLocalDate(inSevenDays);
    document.getElementById('dt-countdown-target').value = formatLocalDateTime(inSevenDays);
    document.getElementById('dt-week-date').value = formatLocalDate(today);

    buttons.forEach(button => button.addEventListener('click', () => chooseMode(button.dataset.datetimeMode)));
    page.addEventListener('input', calculate);
    page.addEventListener('change', calculate);
    document.addEventListener('DOMContentLoaded', calculate);
    new MutationObserver(() => {
        description.textContent = descriptions[activeMode][isEnglish() ? 1 : 0];
        calculate();
    }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['lang']
    });
    chooseMode(buttons.some(button => button.dataset.datetimeMode === activeMode) ? activeMode : 'duration');
    window.setInterval(() => {
        if (activeMode === 'countdown') calculate();
    }, 60000);
})();
