(function () {
    'use strict';

    const root = document.getElementById('salary');
    if (!root) return;

    // [tekst, forklaring, eksakt treff?]. Treff på starten av ledeteksten, lengste først.
    const TIPS = [
        ['Ordinære timer', 'Timer du får fastlønn for: arbeidsdager minus feriedager, ganget med timer per dag.'],
        ['Vaktimer (utbetales)', 'Tilleggstimer som utbetales på lønn, med tillegg på 50 % eller 100 %.'],
        ['Vaktimer (til timebank)', 'Timer som føres til timebank. Bare tillegget (50 % eller 100 %) utbetales nå, og selve timen tas ut som avspasering senere.'],
        ['Totalt arbeidstimer', 'Ordinære timer pluss utbetalte vakttimer og positiv timebank.'],
        ['Sum tilleggsvakter', 'Brutto lønn for alle vakter registrert i valgt måned, før skatt og fagforeningstrekk.'],
        ['Netto utbetalt fra vakter', 'Vaktlønn etter fagforeningsprosent og skatt på overtid. Veiledende, siden skattetrekket i praksis avhenger av skattekortet ditt.'],
        ['Timebank (timer til gode)', 'Saldo av timer du har lagt til gode. Uttak av avspasering trekkes fra saldoen. Regler for avvikling står i arbeidsavtalen eller tariffavtalen.'],
        ['Fastlønn (brutto full mnd)', 'Arbeidsdager i måneden × timer per dag × timelønn, før trekk for ferie.'],
        ['Formannstillegg', 'Et tillegg på 20 % av grunntimelønnen, regnet kun av ordinære timer. Overtid beregnes av grunntimelønnen uten tillegget.'],
        ['Lønnstrekk ferie', 'Fastlønn for feriedagene du har trukket i dager. Feriepengene utbetales vanligvis i juni.'],
        ['Hverdag 50%', 'Overtid på hverdag med 50 % tillegg: 1,5 × timelønn. Loven krever minst 40 % overtidstillegg, men tariffavtaler gir ofte mer.', true],
        ['Hverdag 100%', 'Overtid på hverdag med 100 % tillegg: 2 × timelønn.', true],
        ['Helg 50%', 'Helgearbeid med 50 % tillegg: 1,5 × timelønn.', true],
        ['Helg 100%', 'Helgearbeid med 100 % tillegg: 2 × timelønn.', true],
        ['Total Brutto', 'Fastlønn og tillegg etter ferietrekk, før skatt og fagforeningstrekk.'],
        ['Fagforeningtrekk', 'Fagforeningskontingenten som trekkes denne måneden. Du kan oppgi trekket i prosent av brutto eller som kronebeløp.'],
        ['Ekstra skattetrekk', 'Et frivillig trekk utover vanlig skatt, som fast beløp eller prosent av brutto. Det kan brukes for å unngå restskatt.'],
        ['Netto Utbetalt', 'Brutto minus fagforeningstrekk og skattetrekk. Veiledende, så sjekk mot lønnsslippen.', true],
        ['Estimerte feriepenger', 'Opptjent feriepengegrunnlag, her regnet som 12 % av brutto. Lovens minimum er 10,2 %, og mange har 12 % gjennom tariffavtale.'],
        ['Årsprognose', 'Grovt anslag for hele året, basert på opplysningene du har lagt inn denne måneden.', true],
        ['Fast årslønn', 'Fastlønnen regnet for 47 uker pluss 12 % feriepenger.'],
        ['Årslønn estimert', 'Fast årslønn pluss tillegg fra vakter, med feriepenger. Det er et overslag og kan avvike fra faktisk årslønn.'],
        ['Kontingent LO', 'Estimert fagforeningskontingent for et år, regnet med prosentsatsen du har lagt inn.'],

        ['Dato for vakt', 'Datoen vakten ble jobbet. Helg eller hverdag settes automatisk ut fra datoen, og vakten føres på den måneden.'],
        ['Timer', 'Hele timer for vakten. Bruk minutter for resten.', true],
        ['Minutter', 'Minutter utover hele timer, fra 0 til 59.', true],
        ['Type tillegg', 'Velg hverdag eller helg og 50 % eller 100 % tillegg. «Uttak avspasering» trekker timer fra timebanken i stedet for å legge til lønn.'],
        ['Send til Timebank', 'Timen lagres som avspasering, og bare tillegget (50 % eller 100 % av timelønnen) utbetales på lønn.'],

        ['Inkluder fastlønn', 'Slå på for å regne med fastlønn for hele måneden. Slå av hvis du bare vil beregne vakter og tillegg.'],
        ['Inkluder Formannstillegg', 'Legger til 20 % av grunntimelønnen for ordinære timer. Gjelder ikke overtid.'],
        ['Timelønn (Kr)', 'Grunntimelønnen din før tillegg. Overtid og formannstillegg regnes ut fra denne.'],
        ['Timer pr. dag', 'Ordinær arbeidstid per dag. 7,5 timer er vanlig med 37,5 timers uke.'],
        ['Trekk i dager', 'Antall arbeidsdager du ikke får fastlønn for, for eksempel ferie eller permisjon.'],
        ['Overstyr arb.dager', 'Bruk dette hvis lønnsslippen har et annet antall dager enn mandag til fredag, for eksempel på grunn av helligdager. La feltet stå tomt for automatisk antall.'],
        ['Fagforening (LO', 'Fagforeningskontingent trekkes av lønnen. Den delen som gir skattefradrag, er begrenset til en maksgrense per år.'],
        ['Trekk i % av brutto', 'Kontingenten regnet som prosent av brutto lønn. Brukes hvis du ikke oppgir kronebeløp.'],
        ['Eller skriv kr trukket', 'Fyll inn kronebeløpet fra lønnsslippen. Prosenten regnes da ut automatisk av månedens brutto.'],
        ['Skattemetode', 'Tabelltrekk følger skattekortet ditt. Prosenttrekk bruker én fast prosent på alt. Tabelltrekk på fastlønn bruker egen prosent på overtid.'],
        ['Halvt skattetrekk', 'Brukes når utbetalingen har halvt trekk, for eksempel juni. Overtid trekkes fortsatt fullt.'],
        ['Skattetabell', 'Tabellnummeret står på skattekortet ditt. Du finner det på skatteetaten.no eller i lønnsslippen.'],
        ['Skatteprosent på overtid', 'Prosenten som trekkes av overtid. Vanligvis marginalskatten din, siden overtid kommer på toppen av fast inntekt.'],
        ['Fast skatteprosent', 'Trekkprosenten din fra skattekortet. Den brukes på hele brutto lønn, med mindre du velger halvt skattetrekk.']
    ].sort((a, b) => b[0].length - a[0].length);

    const stil = document.createElement('style');
    stil.textContent = `
        .lk-tip{display:inline-flex;align-items:center;justify-content:center;width:1.05rem;height:1.05rem;margin-left:.4rem;border-radius:50%;border:1px solid currentColor;font-size:.65rem;font-weight:700;line-height:1;cursor:help;opacity:.6;vertical-align:middle;text-transform:none;letter-spacing:0;user-select:none;flex-shrink:0}
        .lk-tip:hover,.lk-tip:focus{opacity:1;outline:none}
        #lk-tipbox{position:fixed;z-index:10000;max-width:260px;padding:.65rem .8rem;border-radius:.75rem;font-size:.78rem;line-height:1.4;font-weight:500;text-transform:none;letter-spacing:0;pointer-events:none;opacity:0;transition:opacity .12s;background:#111;color:#fff;border:1px solid rgba(255,255,255,.18);box-shadow:0 10px 30px rgba(0,0,0,.35)}
        html:not(.dark) #lk-tipbox{background:#fff;color:#111;border-color:rgba(0,0,0,.15)}
        #lk-tipbox.vis{opacity:1}`;
    document.head.appendChild(stil);

    const tipbox = document.createElement('div');
    tipbox.id = 'lk-tipbox';
    tipbox.setAttribute('role', 'tooltip');
    document.body.appendChild(tipbox);

    const lagTip = tekst => {
        const el = document.createElement('span');
        el.className = 'lk-tip';
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', 'Forklaring');
        el.dataset.tip = tekst;
        el.textContent = '?';
        return el;
    };

    const erEnkel = el => [...el.children].every(c => c.tagName === 'I' || c.tagName.toLowerCase() === 'svg');
    const normaliser = el => el.textContent.trim().replace(/^[^\p{L}]+/u, '');

    function finnTip(tekst) {
        return TIPS.find(([nokkel, , eksakt]) => eksakt ? tekst === nokkel : tekst.startsWith(nokkel));
    }

    root.querySelectorAll('label, span, p, h3, h4, div').forEach(el => {
        if (el.closest('.app-info, #stab-skatt, .lk-tip') || !erEnkel(el)) return;
        const tekst = normaliser(el);
        if (!tekst || tekst.length > 70) return;
        const treff = finnTip(tekst);
        if (treff) el.appendChild(lagTip(treff[1]));
    });

    // Tittelen settes på nytt av beregningen, så tipset må ligge utenfor
    const skattTittel = document.getElementById('skatt-tittel');
    if (skattTittel) {
        const omslag = document.createElement('span');
        omslag.className = 'inline-flex items-center';
        skattTittel.parentNode.insertBefore(omslag, skattTittel);
        omslag.appendChild(skattTittel);
        omslag.appendChild(lagTip('Skatten som trekkes fra lønnen. Metoden velger du under Innstillinger. Totalt skattetrekk inkluderer eventuelt ekstra skattetrekk.'));
    }

    function visTip(el) {
        tipbox.textContent = el.dataset.tip;
        tipbox.classList.add('vis');
        const r = el.getBoundingClientRect();
        const b = tipbox.getBoundingClientRect();
        const x = Math.min(Math.max(8, r.left + r.width / 2 - b.width / 2), window.innerWidth - b.width - 8);
        let y = r.top - b.height - 8;
        if (y < 8) y = r.bottom + 8;
        tipbox.style.left = x + 'px';
        tipbox.style.top = y + 'px';
    }
    const skjulTip = () => tipbox.classList.remove('vis');

    root.addEventListener('mouseover', e => { const t = e.target.closest('.lk-tip'); if (t) visTip(t); });
    root.addEventListener('mouseout', e => { if (e.target.closest('.lk-tip')) skjulTip(); });
    root.addEventListener('focusin', e => { const t = e.target.closest('.lk-tip'); if (t) visTip(t); });
    root.addEventListener('focusout', skjulTip);
    // Stopper at trykk på «?» i en label slår av eller på avkrysningsboksen
    root.addEventListener('click', e => {
        const t = e.target.closest('.lk-tip');
        if (t) { e.preventDefault(); e.stopPropagation(); visTip(t); } else skjulTip();
    }, true);
    document.addEventListener('scroll', skjulTip, true);
})();
