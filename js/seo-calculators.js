(function () {
    'use strict';

    const numberFormat = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 2 });

    function calculate(form) {
        const result = form.querySelector('[data-calculator-result]');
        const values = {};
        let invalid = false;

        form.querySelectorAll('input[type="number"][data-value]').forEach(input => {
            const value = input.valueAsNumber;
            if (!Number.isFinite(value) || !input.validity.valid) {
                invalid = true;
            } else {
                values[input.dataset.value] = value;
            }
        });

        if (invalid) {
            result.textContent = 'Kontroller at alle feltene har gyldige verdier innenfor de oppgitte grensene.';
            result.classList.add('seo-calculator-error');
            return;
        }

        const n = value => numberFormat.format(value);
        const type = form.dataset.seoCalculator;
        let message = '';

        if (type === 'cnc') {
            if (!values.diameter || !values.speed || !values.flutes || !values.feed) {
                message = 'Diameter, skjærehastighet, antall skjær og mating må være større enn null.';
            } else {
                const rpm = values.speed * 1000 / (Math.PI * values.diameter);
                const feedRate = rpm * values.feed * values.flutes;
                message = `Beregnet turtall: ${n(rpm)} o/min. Matehastighet: ${n(feedRate)} mm/min.`;
            }
        } else if (type === 'paint') {
            if (!values.area || !values.coats || !values.coverage) {
                message = 'Areal, antall strøk og dekkevne må være større enn null.';
            } else {
                const liters = values.area * values.coats / values.coverage * (1 + values.waste / 100);
                message = `Anslått mengde: ${n(liters)} liter, inkludert ${n(values.waste)} % ekstra.`;
            }
        } else if (type === 'concrete') {
            if (!values.length || !values.width || !values.thickness) {
                message = 'Lengde, bredde og tykkelse må være større enn null.';
            } else {
                const volume = values.length * values.width * values.thickness * (1 + values.waste / 100);
                message = `Anslått volum: ${n(volume)} m³ (${n(volume * 1000)} liter), inkludert ${n(values.waste)} % ekstra.`;
            }
        } else if (type === 'electricity') {
            if (!values.watts || !values.hours || !values.days) {
                message = 'Effekt, timer per dag og dager per måned må være større enn null.';
            } else {
                const energy = values.watts / 1000 * values.hours * values.days;
                const cost = energy * values.price;
                message = `Anslått forbruk: ${n(energy)} kWh per måned. Kostnad: ${n(cost)} kr per måned.`;
            }
        } else if (type === 'ev') {
            if (!values.capacity || !values.power || values.loss >= 100) {
                message = 'Batterimengde og ladeeffekt må være større enn null, og ladetap må være under 100 %.';
            } else {
                const gridEnergy = values.capacity / (1 - values.loss / 100);
                const chargeMinutes = values.capacity / values.power * 60;
                const hours = Math.floor(chargeMinutes / 60);
                const minutes = Math.round(chargeMinutes % 60);
                const time = minutes === 60 ? `${hours + 1} t 0 min` : `${hours} t ${minutes} min`;
                message = `Omtrent ${n(gridEnergy)} kWh fra strømnettet ved ${n(values.loss)} % ladetap. Idealisert ladetid: ${time}.`;
            }
        }

        result.textContent = message;
        result.classList.toggle('seo-calculator-error', message.includes('må være') || message.includes('Kontroller'));
    }

    document.querySelectorAll('form[data-seo-calculator]').forEach(form => {
        form.addEventListener('input', () => calculate(form));
        form.addEventListener('change', () => calculate(form));
        form.addEventListener('submit', event => event.preventDefault());
        calculate(form);
    });
})();
