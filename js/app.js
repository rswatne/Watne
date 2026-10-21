        // INIT ICONS
        function initIcons() { if (typeof lucide !== 'undefined') lucide.createIcons(); }
        if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initIcons); } else { initIcons(); }

        // LIVE KLOKKE, DATO & UKENUMMER
        function beregnIsoUkeForKlokke(dato) {
            const d = new Date(Date.UTC(dato.getFullYear(), dato.getMonth(), dato.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        }

        function oppdaterLiveKlokke() {
            const na = new Date();
            const timer = String(na.getHours()).padStart(2, '0');
            const minutt = String(na.getMinutes()).padStart(2, '0');
            const sekund = String(na.getSeconds()).padStart(2, '0');
            const tidStr = `${timer}:${minutt}:${sekund}`;

            const dager = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];
            const mnd = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
            const datoStr = `${dager[na.getDay()]} ${na.getDate()}. ${mnd[na.getMonth()]}`;
            const ukeNr = beregnIsoUkeForKlokke(na);

            const elDesk = document.getElementById('live-clock-desktop');
            const elDeskDate = document.getElementById('live-date-desktop');
            const elDeskWeek = document.getElementById('live-week-desktop');
            const elMob = document.getElementById('live-clock-mobile');
            const elTop = document.getElementById('live-clock-top');
            const elTopWeek = document.getElementById('live-week-top');

            if (elTop) elTop.innerText = tidStr;
            if (elTopWeek) elTopWeek.innerText = `Uke ${ukeNr}`;
            if (elDesk) elDesk.innerText = tidStr;
            if (elDeskDate) elDeskDate.innerText = datoStr;
            if (elDeskWeek) elDeskWeek.innerText = `Uke ${ukeNr}`;
            if (elMob) elMob.innerText = `${tidStr.slice(0, 5)} · Uke ${ukeNr}`;
        }
        setInterval(oppdaterLiveKlokke, 1000);
        oppdaterLiveKlokke();

        // PWA INSTALLER LOGIC
        function oppdaterPwaManifest() {
            const svgIcon = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><rect width='512' height='512' rx='115' fill='%23000'/><rect x='20' y='20' width='472' height='472' rx='96' fill='none' stroke='%23fff' stroke-opacity='0.14' stroke-width='4'/><polygon points='256,106 386,181 386,331 256,406 126,331 126,181' fill='none' stroke='%23f5f5f7' stroke-width='20' stroke-linejoin='round'/><circle cx='256' cy='256' r='54' fill='none' stroke='%23f5f5f7' stroke-width='20'/></svg>`;
            const manifestObj = {
                name: "Verkstedsportal HMI",
                short_name: "Verksted",
                start_url: window.location.href,
                display: "standalone",
                background_color: "#000000",
                theme_color: "#000000",
                icons: [{ src: "data:image/svg+xml," + encodeURIComponent(svgIcon), sizes: "512x512", type: "image/svg+xml" }]
            };
            const manifestLink = document.getElementById('pwa-manifest');
            if (manifestLink) {
                manifestLink.href = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(manifestObj));
            }
        }
        oppdaterPwaManifest();

        let deferredPrompt = null;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
        });

        function apnePwaModal() {
            const modal = document.getElementById('pwa-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                dyttHistorikkState();
            }
        }

        function lukkPwaModal(fraPopstate = false) {
            const modal = document.getElementById('pwa-modal');
            if (modal && !modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                if (!fraPopstate) dyttHistorikkState();
            }
        }

        function utlosPwaInstallasjon() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        visToast("App installert!");
                        lukkPwaModal();
                    }
                    deferredPrompt = null;
                });
            } else {
                visToast("Installasjon utløses automatisk av nettleseren. Hvis knappen ikke reagerer, bruk menyen øverst til høyre (⋮) og velg 'Installer app'.", "brand");
            }
        }

        // TOAST SYSTEM
        function visToast(melding, type = 'brand') {
            const container = document.getElementById('toast-container');
            if (!container) return;
            const toast = document.createElement('div');
            const farge = type === 'error' ? 'border-rose-500 bg-rose-950/90 text-rose-200' : 'border-brand-500 bg-slate-900/95 text-white';
            toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl border-l-4 ${farge} shadow-xl backdrop-blur-md text-xs font-mono font-bold transition-all duration-300 animate-fadeIn`;
            toast.innerHTML = `<span>⚡</span><span>${melding}</span>`;
            container.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-8px)';
                setTimeout(() => toast.remove(), 300);
            }, 2400);
        }

        // KOPIER TIL UTKLIPPSTAVLE
        function kopierTekst(tekst, label = 'Verdi') {
            const tempInput = document.createElement('textarea');
            tempInput.value = tekst;
            document.body.appendChild(tempInput);
            tempInput.select();
            try {
                document.execCommand('copy');
                visToast(`${label} kopiert: ${tekst}`);
            } catch (e) {
                visToast('Kunne ikke kopiere', 'error');
            }
            document.body.removeChild(tempInput);
        }

        function aktiverHurtigKopiering() {
            const resultatIder = [
                'vis-netto-hoved', 'gf-res-rpm', 'gf-res-mating',
                'gjin-res-lilledia', 'gjut-res-lilledia', 'res-fvc', 'res-frpm', 'res-fmm',
                'deg-res-gradmin', 'rct-res-vf', 'taper-res-half', 'taper-res-full', 'taper-res-main',
                'mat-res-vc', 'mat-res-rpm', 'mat-res-mating',
                'cool-res-add', 'ra-res-val', 'ra-res-maxfn',
                'tap-res-drill', 'tap-res-form', 'ttol-res-major', 'ttol-res-pitch', 'ttol-res-minor', 'iso-res',
                'iso2768-res-lin', 'key-res-dim', 'key-res-t1', 'key-res-t2', 'torque-res-nm', 'hard-res-summary',
                'w-res-kg', 'pcd-res-chord', 'tri-res-c', 'res-bar', 'res-kg', 'res-c',
                'res-app-hour', 'res-app-day', 'res-app-month'
            ];
            resultatIder.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.classList.add('copy-val');
                    el.title = 'Klikk for å kopiere verdi';
                    el.addEventListener('click', () => kopierTekst(el.innerText.trim(), 'Resultat'));
                }
            });
        }

        function toggleTheme() {
            document.documentElement.classList.toggle('dark');
            localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        }

        // --- KOMPLETT OVERSETTELSESMOTOR (NO <-> EN) ---
        let currentLang = localStorage.getItem('verksted_lang') || 'no';

        const noToEnDict = {
            // Hovednavigasjon & Header
            "Oversikt": "Overview",
            "Lønnskalkulator": "Salary Calculator",
            "Maskinering": "Machining",
            "Verktøytabeller": "Tool Tables",
            "Strøm & Elbil": "Power & EV",
            "Hvor mye trenger jeg?": "How much do I need?",
            "Mengder": "Amounts",
            "Dato & tid": "Date & Time",
            "Mer": "More",
            "Flere sider": "More pages",
            "Lønn": "Salary",
            "Tabeller": "Tables",
            "Strøm": "Power",
            "● Klar": "● Ready",
            "Hurtigsøk verktøy...": "Quick search tools...",
            "Notater & Sjekkliste": "Notes & Checklist",
            "Installer som App": "Install as App",
            "Mørk": "Dark",
            "Lys": "Light",
            "Bytt til Mørk HMI": "Switch to Dark HMI",
            "Bytt til Lys HMI": "Switch to Light HMI",

            // Dashboard & Widgets
            "Sanntidskort (Widgets)": "Live Widgets",
            "Hurtigsøk": "Quick Search",
            "Tilpass oversikt": "Customize",
            "NETTO UTBETALT": "NET PAYOUT",
            "TIMEBANK SALDO": "TIMEBANK BALANCE",
            "UKENUMMER & DAGER": "WEEK & WORKDAYS",
            "SISTE CNC-UTREGNING": "LAST CNC CALC",
            "AKTIV GJENGE": "ACTIVE THREAD",
            "ISO-PASNING (SIKTEMÅL)": "ISO FIT (TARGET)",
            "STRØMSATS & ELBIL": "POWER RATE & EV",
            "OVERTID DENNE MND": "OVERTIME THIS MONTH",
            "KJØLEVÆSKE (BRIX)": "COOLANT (BRIX)",
            "SJEKKLISTE & NOTAT": "CHECKLIST & NOTE",
            "VERKSTED SJEKKLISTE": "WORKSHOP CHECKLIST",
            "MASKINLOGG (FRITEKST)": "MACHINE LOG (NOTES)",
            "Ingen åpne oppgaver": "No open tasks",
            "✅ Alt utført!": "✅ All done!",
            "Tom logg...": "Empty log...",
            "Klikk for å åpne sjekkliste / logg →": "Click to open checklist / log →",
            "Klikk for å skrive Z-nullpunkt / notat →": "Click to write Z-zero / note →",
            "Lønn & Timebank": "Salary & Timebank",
            "Skatt, overtid, vakter": "Tax, overtime, shifts",
            "Maskinering (CNC)": "Machining (CNC)",
            "Mating, konus, Dreiing": "Feed, taper, turning",
            "Gjenger, ISO, kilespor": "Threads, ISO, keyways",
            "Ladetid, besparelse": "Charging time, savings",
            "Lønn, Skift & Timebank": "Salary, Shifts & Timebank",
            "Full kontroll på fastlønn, overtid, avspasering, fagforening og skatt.": "Full control of base salary, overtime, time off, union deduction and tax.",
            "Sentermating ved sirkulærfresing, gjengediameter, Vc/RPM, tynn spon og C-akse.": "Center feed for circular milling, thread diameter, Vc/RPM, chip thinning and C-axis.",
            "Verktøytabeller & Matte": "Tool Tables & Math",
            "Materialdatabank, kjernebor M3–M36, ISO-pasninger, Brix kjølevæske, PCD og trigonometri.": "Material database, tap drills M3–M36, ISO fits, Brix coolant, PCD and trigonometry.",
            "Apparatkostnader, ladetid, drivstoffbesparelse og vintertap.": "Appliance power cost, charging time, fuel savings and winter range loss.",
            "Mengder til prosjekter, blandinger og oppskrifter": "Amounts for projects, mixes and recipes",
            "Velg hva du vil beregne": "Choose what to calculate",
            "🎨 Maling": "🎨 Paint",
            "🪵 Gulv / flis": "🪵 Flooring / tile",
            "🧱 Betong": "🧱 Concrete",
            "🧪 Blandingsforhold": "🧪 Mixing ratio",
            "🍲 Oppskrift": "🍲 Recipe",
            "Fyll inn målene — resultatet oppdateres automatisk.": "Enter the measurements — the result updates automatically.",
            "Bredde (m)": "Width (m)",
            "Høyde (m)": "Height (m)",
            "Antall strøk": "Number of coats",
            "Dekkevne (m²/L)": "Coverage (m²/L)",
            "Ekstra å beregne (%)": "Extra allowance (%)",
            "Størrelse per spann (L)": "Can size (L)",
            "Lengde (m)": "Length (m)",
            "Dekning per pakke (m²)": "Coverage per pack (m²)",
            "Ekstra for kapp/svinn (%)": "Extra for cuts/waste (%)",
            "Materialtype": "Material type",
            "Gulv / laminat (pakkeareal)": "Flooring / laminate (pack coverage)",
            "Flis (størrelse og fuge)": "Tile (size and grout)",
            "Flislengde (mm)": "Tile length (mm)",
            "Flisbredde (mm)": "Tile width (mm)",
            "Fugebredde (mm)": "Grout width (mm)",
            "Fliser per eske": "Tiles per box",
            "Fliser trengs": "Tiles needed",
            "Fliser per eske:": "Tiles per box:",
            "Rommets areal:": "Room area:",
            "Flisareal inkl. fuge:": "Tile module area incl. grout:",
            "Med kapp/svinn:": "Including cuts/waste:",
            "Tidsrom, frister, arbeidsdager og ukenummer": "Durations, deadlines, working days and week numbers",
            "Velg dato- eller tidsverktøy": "Choose a date or time tool",
            "Regn ut arbeidstid mellom to klokkeslett. Slutt før start regnes som neste dag.": "Calculate time between two clock times. An end time before the start is treated as the next day.",
            "Tell kalenderdager, uker og hverdager mellom to datoer.": "Count calendar days, weeks and weekdays between two dates.",
            "Se hvor lang tid det er igjen til en frist eller hendelse.": "See how much time remains until a deadline or event.",
            "Finn klokkeslettet etter et antall timer og minutter.": "Find the time after adding a number of hours and minutes.",
            "Finn ISO-ukenummer og ukedag for en dato.": "Find the ISO week number and weekday for a date.",
            "Timer og minutter mellom to klokkeslett": "Hours and minutes between two times",
            "⏱️ Tidsrom": "⏱️ Time duration",
            "📅 Datoforskjell": "📅 Date difference",
            "⌛ Nedtelling": "⌛ Countdown",
            "➕ Legg til tid": "➕ Add time",
            "🗓️ Ukenummer": "🗓️ Week number",
            "Regn ut arbeidstid mellom to klokkeslett. Slutt før start regnes som neste dag.": "Calculate time between two clock times. An end time before the start is treated as the next day.",
            "Fra klokkeslett": "Start time",
            "Til klokkeslett": "End time",
            "Fra dato": "From date",
            "Til dato": "To date",
            "Hva teller du ned til?": "What are you counting down to?",
            "Dato og klokkeslett": "Date and time",
            "F.eks. ferie eller frist": "E.g. holiday or deadline",
            "Starttid": "Start time",
            "Timer å legge til": "Hours to add",
            "Minutter å legge til": "Minutes to add",
            "Velg dato": "Choose date",
            "Tidsrom": "Time duration",
            "Datoforskjell": "Date difference",
            "Nedtelling": "Countdown",
            "Legg til tid": "Add time",
            "Ukenummer": "Week number",
            "Arbeidstid": "Duration",
            "Arbeidsdager (man–fre, inkl. datoene)": "Working days (Mon–Fri, incl. both dates)",
            "Dager mellom datoene": "Days between dates",
            "Uker": "Weeks",
            "Igjen til": "Until",
            "Overskredet": "Overdue",
            "Klokkeslett etter tillegg": "Time after addition",
            "Dato": "Date",
            "Ukedag": "Weekday",
            "Uke": "Week",
            "Ingen fristnavn": "No deadline name",
            "Datoene må være gyldige, og sluttdatoen må være lik eller etter startdatoen.": "Dates must be valid, and the end date must be the same as or later than the start date.",
            "Oppgi et gyldig klokkeslett.": "Enter a valid time.",
            "Oppgi en gyldig dato og tid.": "Enter a valid date and time.",
            "Velg en gyldig dato.": "Choose a valid date.",
            "Timer må være et helt tall på null eller mer, og minutter må være 0–59.": "Hours must be a whole number of zero or more, and minutes must be 0–59.",
            "Totalt antall minutter:": "Total minutes:",
            "Sluttid:": "End time:",
            "Lagt til:": "Added:",
            "Dagsforskyvning:": "Day offset:",
            "Tykkelse (cm)": "Thickness (cm)",
            "Ferdig masse per sekk (L)": "Mixed yield per bag (L)",
            "Total mengde ferdig blanding (L)": "Total mixed volume (L)",
            "Del A i forholdet": "Part A in ratio",
            "Del B i forholdet": "Part B in ratio",
            "Porsjoner i oppskriften": "Original servings",
            "Porsjoner du vil lage": "Servings to make",
            "Ingredienser — én per linje, f.eks. «200 g mel»": "Ingredients — one per line, e.g. “200 g flour”",
            "Resultat": "Result",
            "Maling som trengs": "Paint needed",
            "Inkludert strøk og ekstra mengde": "Includes coats and extra allowance",
            "Beregningen er et estimat. Kontroller dekkevne, blandingsforhold og utbytte på produktets emballasje.": "This is an estimate. Check coverage, mixing ratio and yield on the product packaging.",
            "Trenger tall større enn null:": "Enter numbers greater than zero:",
            "Ekstra mengde må være mellom 0 og 100 %.": "Extra allowance must be between 0 and 100%.",
            "Kontroller ingredienslinje": "Check ingredient line",
            "Gyldig format er mengde etterfulgt av enhet eller navn, for eksempel «200 g mel».": "Use an amount followed by a unit or name, for example “200 g flour”.",
            "Areal med strøk:": "Area including coats:",
            "Beregningsareal:": "Calculated area:",
            "Anbefalt å kjøpe:": "Recommended to buy:",
            "Volum inkl. ekstra mengde:": "Volume including extra:",
            "Forhold:": "Ratio:",
            "Porsjonsfaktor:": "Serving multiplier:",
            "Porsjoner:": "Servings:",
            "Maling trengs": "Paint needed",
            "Gulv / flis trengs": "Flooring / tile needed",
            "Betong trengs": "Concrete needed",
            "Blanding fordelt etter forholdet": "Mix split by ratio",
            "Oppskrift skalert": "Recipe scaled",

            // Modaler & Notatskuff
            "Verkstednotat & Sjekkliste": "Workshop Notes & Checklist",
            "Lagres automatisk · Snarvei: Alt + N": "Auto-saved · Shortcut: Alt + N",
            "Sjekkliste": "Checklist",
            "Fritekst / Logg": "Free Text / Log",
            "+ Legg til": "+ Add",
            "+ Brix kjølevæske": "+ Brix coolant",
            "+ Bestill skjær": "+ Order inserts",
            "+ Sjekk Z-nullpunkt": "+ Check Z-zero",
            "🧹 Fjern fullførte": "🧹 Clear completed",
            "📋 Kopier liste": "📋 Copy list",
            "Maskinlogg / Z-nullpunkt / Skiftbeskjed": "Machine Log / Z-zero / Shift Handover",
            "🕒 + Tidspunkt": "🕒 + Timestamp",
            "Tøm": "Clear",
            "📋 Kopier": "📋 Copy",
            "+ Notat": "+ Note",
            "Lagre utregning i Notater / Sjekkliste": "Save calculation to Notes / Checklist",
            "Tilpass Oversikt & Layout": "Customize Overview & Layout",
            "Velg live-kort fra kalkulatorene og tilpass rekkefølge og visning": "Choose calculator live widgets and customize their order and appearance",
            "Beregn direkte fra Oversikt": "Calculate directly from Overview",
            "Trykk på plussknappen på et beregningskort for å åpne feltene og regne uten å bytte side.": "Press the plus button on a calculator card to open its fields and calculate without leaving Overview.",
            "Beregn": "Calculate",
            "Ingen redigerbare felt i denne kalkulatoren.": "No editable fields in this calculator.",
            "📑 Vis faner separat": "📑 Show tabs separately",
            "Tilbakestill": "Reset",
            "Ferdig": "Done",
            "Lukk vindu": "Close window",
            "Avbryt": "Cancel",
            "Ja, nullstill": "Yes, reset",
            "Nullstill lønnskalkulator?": "Reset salary calculator?",
            "Er du sikker på at du vil slette alle registrerte vakter og tilbakestille lønnsinnstillingene?": "Are you sure you want to delete all registered shifts and reset salary settings?",

            // Lønnskalkulator
            "Brutto, Netto & Timebank": "Gross, Net & Timebank",
            "Sveip for flere faner": "Swipe for more tabs",
            "📊 Oversikt": "📊 Overview",
            "⏱️ Vakter & Timebank": "⏱️ Shifts & Timebank",
            "⚙️ Innstillinger": "⚙️ Settings",
            "Periode": "Period",
            "År": "Year",
            "Måned": "Month",
            "Timeoversikt": "Hours Summary",
            "Ordinære timer (fastlønn)": "Regular hours (base salary)",
            "Vaktimer (utbetales)": "Overtime hours (paid out)",
            "Vaktimer (til timebank)": "Overtime hours (to timebank)",
            "Totalt arbeidstimer": "Total working hours",
            "Netto Utbetalt": "Net Payout",
            "✨ Sum tilleggsvakter (brutto)": "✨ Total extra shifts (gross)",
            "💰 Netto utbetalt fra vakter": "💰 Net payout from extra shifts",
            "🏦 Timebank (timer til gode)": "🏦 Timebank (hours saved)",
            "Kun 50%/100% tillegget utbetales.": "Only the 50%/100% bonus is paid out.",
            "Fastlønn (brutto full mnd)": "Base salary (gross full month)",
            "Formannstillegg (20% av grunnlønn)": "Foreman bonus (20% of base pay)",
            "Kun ordinære timer (uten overtid)": "Regular hours only (excl. overtime)",
            "Lønnstrekk ferie (brutto)": "Unpaid vacation deduction (gross)",
            "Hverdag 50%": "Weekday 50%",
            "Hverdag 100%": "Weekday 100%",
            "Helg 50%": "Weekend 50%",
            "Helg 100%": "Weekend 100%",
            "Total Brutto": "Total Gross",
            "Fagforeningtrekk": "Union deduction",
            "Estimerte feriepenger (12 % av brutto)": "Estimated holiday pay (12% of gross)",
            "Årsprognose": "Annual Forecast",
            "Fast årslønn (47 uker + 12 %)": "Base annual salary (47 wks + 12%)",
            "Årslønn estimert m/tillegg": "Estimated annual salary incl. overtime",
            "Kontingent LO pr. år": "Union fee per year",
            "Registrer Tilleggsvakt": "Register Extra Shift",
            "Hurtigvalg": "Quick Presets",
            "⚡ 7.5t Hverdag 50%": "⚡ 7.5h Weekday 50%",
            "🏦 1t Timebank (+50% ut)": "🏦 1h Timebank (+50% paid)",
            "⚡ 4t Helg 50%": "⚡ 4h Weekend 50%",
            "🏖️ -7.5t Uttak Timebank": "🏖️ -7.5h Use Timebank",
            "Dato for vakt": "Shift Date",
            "Timer": "Hours",
            "Minutter": "Minutes",
            "Type tillegg": "Overtime Type",
            "Hverdag 50% (T.lønn x 1.5)": "Weekday 50% (Hourly x 1.5)",
            "Hverdag 100% (T.lønn x 2.0)": "Weekday 100% (Hourly x 2.0)",
            "Helg 50% (T.lønn x 1.5)": "Weekend 50% (Hourly x 1.5)",
            "Helg 100% (T.lønn x 2.0)": "Weekend 100% (Hourly x 2.0)",
            "🏖️ Uttak avspasering (Trekker fra Timebank)": "🏖️ Time off (Deducts from Timebank)",
            "🏦 Send til Timebank (Avspasering)": "🏦 Send to Timebank (Time off)",
            "100% av timen lagres som avspasering. Kun tillegget (eks. 50%) utbetales på lønn.": "100% of the hour is saved as time off. Only the overtime bonus (e.g. 50%) is paid out.",
            "Legg til vakt": "Add Shift",
            "Registrerte Vakter": "Registered Shifts",
            "Ingen vakter registrert i denne måneden.": "No shifts registered in this month.",
            "📊 Eksporter til Excel (.CSV)": "📊 Export to Excel (.CSV)",
            "🖨️ Skriv ut": "🖨️ Print",
            "Basisinnstillinger": "Base Settings",
            "Inkluder fastlønn (beregn for hel måned)": "Include base salary (full month)",
            "Inkluder Formannstillegg (+20%)": "Include Foreman Bonus (+20%)",
            "Beregnes kun av grunntimelønn på ordinære timer (ikke overtid).": "Calculated on base hourly rate for regular hours only (excl. overtime).",
            "Timelønn (Kr)": "Hourly Rate (NOK)",
            "Timer pr. dag": "Hours per day",
            "Trekk i dager (ferie/perm)": "Deduct days (unpaid leave)",
            "Overstyr arb.dager (valgfritt)": "Override workdays (optional)",
            "Fagforening (LO / Fellesforbundet)": "Labor Union (LO / Fellesforbundet)",
            "Trekk i % av brutto": "Deduction % of gross",
            "Eller skriv kr trukket (regner om)": "Or enter NOK deducted (auto-converts)",
            "Skatt & Datahåndtering": "Tax & Data Management",
            "Skattemetode": "Tax Method",
            "Tabelltrekk på fastlønn + % på overtid": "Tax table on base pay + % on overtime",
            "Kun Tabelltrekk på alt": "Tax table on everything",
            "Kun Prosenttrekk på alt (Standard)": "Percentage tax on everything (Default)",
            "Halvt skattetrekk på ordinær lønn": "Half tax withholding on regular pay",
            "Huk av når utbetalingen har halvt trekk, for eksempel novemberlønn utbetalt i desember. Overtid beregnes fortsatt med fullt trekk.": "Check when this payout has half withholding, for example November wages paid in December. Overtime is still taxed at the full rate.",
            "Skattetabell (8000 / 7100-serien)": "Tax Table (8000 / 7100 series)",
            "Skatteprosent på overtid (%)": "Overtime tax rate (%)",
            "Fast skatteprosent på alt (%)": "Flat tax percentage on all (%)",
            "💾 Last ned Backup": "💾 Download Backup",
            "🗑️ Nullstill lønnskalkulator": "🗑️ Reset salary calculator",

            // Maskinering (CNC)
            "Maskineringskalkulator": "Machining Calculator",
            "📑 Vis alle på én side": "📑 Show all on one page",
            "📑 Vis alle på én side (Klassisk)": "📑 Show all on one page (Classic)",
            "🗂️ Bruk ryddige underfaner": "🗂️ Use organized subtabs",
            "⚡ Fresing & Skjæredata": "⚡ Milling & Cutting Data",
            "📐 Dreiing, Gjenger & Konus": "📐 Turning, Threads & Taper",
            "Sirkulær Mating": "Circular Interpolation Feed",
            "Regn om bordmating til effektiv sentermating.": "Convert linear feed to effective toolpath center feed.",
            "Bearbeidingstype": "Machining Mode",
            "Innvendig fresing (Hull / Lomme)": "Internal Milling (Hole / Pocket)",
            "Utvendig fresing (Aksling / Tapp)": "External Milling (Boss / Stud)",
            "Skjær (z)": "Flutes (z)",
            "Dia Fres": "Cutter Ø",
            "Dia Hull / Aksling": "Hole / Boss Ø",
            "Spindel (n):": "Spindle (n):",
            "Sirkulær mating (Senter):": "Circular Feed (Center):",
            "Skjæredata Hurtigkalkulator": "Cutting Data Quick Calc",
            "Kryss-kalkuler Vc, RPM og bordmating.": "Cross-calculate Vc, RPM and table feed.",
            "1. Finne Vc ut fra RPM": "1. Find Vc from RPM",
            "2. Finne RPM ut fra Vc": "2. Find RPM from Vc",
            "3. Bordmating (Vf) ut fra fz": "3. Table Feed (Vf) from fz",
            "Vf (Mating):": "Vf (Feed):",
            "Skjæredata": "Cutting Data",
            "Inndata parametre": "Input Parameters",
            "Verktøydiameter (D)": "Tool / Workpiece Diameter (D)",
            "Skjærehastighet (Vc)": "Cutting Speed (Vc / SFM)",
            "Antall skjær / tenner (z)": "Number of Cutting Edges / Teeth (z)",
            "Beregn mating ut fra": "Calculate feed from",
            "Mating per tann (fz)": "Feed per Tooth (fz)",
            "Ønsket spontykkelse (hm)": "Target Chip Thickness (hm)",
            "Aksial skjæredybde (ap)": "Axial Depth of Cut (ap / DOC)",
            "Radial skjærebredde (ae)": "Radial Width of Cut (ae / WOC)",
            "Kompenser for radial spontynning (RCT)?": "Compensate for Radial Chip Thinning (RCT)?",
            "Øker matingen når ae er mindre enn 50 % av verktøydiameteren.": "Increases feed when ae is less than 50% of the tool diameter.",
            "Kalkulerte CNC-verdier": "Calculated CNC Values",
            "Spindelhastighet (n)": "Spindle Speed (n)",
            "Bordmating (Vf / F)": "Table Feed (Vf / F)",
            "Beregnet mating per tann (fz)": "Calculated Feed per Tooth (fz)",
            "Teoretisk spontykkelse (hmax)": "Theoretical Chip Thickness (hmax)",
            "Mating per omdreining (fn)": "Feed per Revolution (fn)",
            "Sponvolum (MRR / Q)": "Material Removal Rate (MRR / Q)",
            "Formel: n = (Vc × 1000) / (π × D)": "Formula: n = (Vc × 1000) / (π × D)",
            "RCT-faktor:": "RCT Factor:",
            "RPM (o/min)": "RPM (rev/min)",
            "stk": "pcs",
            "mm/tann": "mm/tooth",
            "mm/omdr": "mm/rev",
            "Innv/Utv Gjenger (Gibbs)": "Int/Ext Threads (Gibbs)",
            "Beregning av oppgitt diameter for Gibbs.": "Calculate programmed thread diameter for GibbsCAM.",
            "1. Innvendige gjenger": "1. Internal Threads",
            "2. Utvendige gjenger": "2. External Threads",
            "Store dia (mm)": "Major Ø (mm)",
            "Stigning (mm)": "Pitch (mm)",
            "Justeringfaktor": "Adjustment Factor",
            "Gibbs dia:": "Gibbs Ø:",
            "Konus- & Fase-kalkulator": "Taper & Chamfer Calculator",
            "Beregn vinkler, diametre eller lengde ved dreiing og fresing.": "Calculate angles, diameters or length for turning and milling.",
            "Hurtigvalg vinkel / konus": "Quick Angle / Taper Presets",
            "45° Fase": "45° Chamfer",
            "30° Fase": "30° Chamfer",
            "Konus 1:10": "Taper 1:10",
            "Konus 1:20": "Taper 1:20",
            "Hva vil du beregne?": "What do you want to calculate?",
            "Finn Vinkel & Forhold (ut fra D1, D2, L)": "Find Angle & Ratio (from D1, D2, L)",
            "Finn Store Dia D1 (ut fra D2, L, halve vinkel)": "Find Major Ø D1 (from D2, L, half angle)",
            "Finn Lille Dia D2 (ut fra D1, L, halve vinkel)": "Find Minor Ø D2 (from D1, L, half angle)",
            "Finn Lengde Z (ut fra D1, D2, halve vinkel)": "Find Length Z (from D1, D2, half angle)",
            "Store Dia D1 (mm)": "Major Ø D1 (mm)",
            "Lille Dia D2 (mm)": "Minor Ø D2 (mm)",
            "Lengde Z (mm)": "Length Z (mm)",
            "Halv vinkel α/2 (°)": "Half Angle α/2 (°)",
            "Halv vinkel (Dreievinkel α/2):": "Half Angle (Turning angle α/2):",
            "Total konusvinkel (α):": "Included Taper Angle (α):",
            "Beregnet mål / Konus:": "Calculated Dim / Taper:",
            "C-Akse Gradering": "C-Axis Rotary Feed",
            "Omregning fra lineær mating til grader/min.": "Convert linear feed (mm/min) to rotary feed (deg/min).",
            "Mating mm/min (Vf)": "Linear Feed mm/min (Vf)",
            "Emnediameter": "Workpiece Ø",
            "Omkrets:": "Circumference:",
            "1 Grad:": "1 Degree:",
            "Grader/MIN:": "Degrees/MIN:",
            "Omdr/min:": "Rev/min:",

            // Verktøytabeller
            "Materialdata, Gjenger, Pasninger, Vekt & Geometri": "Materials, Threads, Fits, Weight & Geometry",
            "⚡ Skjæredata & Kjøling": "⚡ Cutting Data & Coolant",
            "🔩 Gjenger & Bolter": "🔩 Threads & Bolts",
            "🎯 Pasninger & Kilespor": "🎯 ISO Fits & Keyways",
            "⚖️ Vektkalkulator": "⚖️ Weight Calculator",
            "📐 PCD & Trigonometri": "📐 PCD & Trigonometry",
            "🔄 Konverterer & Hardhet": "🔄 Converter & Hardness",
            "Materialdatabank (HM Verktøy)": "Material Database (Carbide Tools)",
            "Anbefalte startverdier for skjærehastighet (Vc) og mating.": "Recommended starting values for cutting speed (Vc) and feed.",
            "Materiale": "Material",
            "Konstruksjonsstål (S355 / St52)": "Structural Steel (S355 / St52)",
            "Seigherdet / Karbonstål (C45 / 42CrMo4)": "Alloy / Carbon Steel (C45 / 4140)",
            "Rustfritt / Syrefast (AISI 304 / 316L)": "Stainless Steel (AISI 304 / 316L)",
            "Duplex / Super Duplex": "Duplex / Super Duplex",
            "Aluminium (6082 / 7075)": "Aluminum (6082 / 7075)",
            "Messing / Bronse": "Brass / Bronze",
            "Støpejern (GG25 / GGG40)": "Cast Iron (GG25 / GGG40)",
            "Operasjon": "Operation",
            "Fresing – Grov (Roughing)": "Milling – Roughing",
            "Fresing – Slett (Finishing)": "Milling – Finishing",
            "Dreiing – Grov": "Turning – Roughing",
            "Dreiing – Slett": "Turning – Finishing",
            "Verktøy Dia (mm)": "Tool Ø (mm)",
            "Antall skjær (z)": "Number of flutes (z)",
            "Anbefalt Vc:": "Recommended Vc:",
            "Spindelturtall (n):": "Spindle Speed (n):",
            "Bordmating (Vf):": "Table Feed (Vf):",
            "Borespiss-kompensasjon": "Drill Point Compensation",
            "Finn total Z-dybde inkludert borespiss for full sylindrisk dybde.": "Find total Z-depth including drill point cone for full cylindrical depth.",
            "Bor Ø (mm)": "Drill Ø (mm)",
            "Spissvinkel": "Point Angle",
            "Ønsket dybde": "Cylindrical Depth",
            "Spisshøyde (h):": "Point Cone Height (h):",
            "Total Z-dybde:": "Total Z-Depth:",
            "Kjølevæske & Refraktometer (Brix)": "Coolant & Refractometer (Brix)",
            "Beregn faktisk konsentrasjon og hvor mye ren olje som må etterfylles.": "Calculate actual concentration and how much pure oil to top up.",
            "Tankvolum (Liter)": "Sump Volume (Liters)",
            "Refraktometer-faktor": "Refractometer Factor",
            "Avlest Brix (%)": "Measured Brix (%)",
            "Ønsket mål (%)": "Target Concentration (%)",
            "Faktisk konsentrasjon:": "Actual Concentration:",
            "Etterfyll ren olje:": "Add Pure Oil Concentrate:",
            "Teoretisk Overflateruhet (Ra / Rz)": "Theoretical Surface Roughness (Ra)",
            "Beregn oppnådd Ra ved dreiing ut fra neseradius ($r_\\varepsilon$) og mating ($f_n$).": "Calculate theoretical Ra in turning from nose radius (re) and feed (fn).",
            "Neseradius (mm)": "Nose Radius (mm)",
            "Mating fn (mm/o)": "Feed fn (mm/rev)",
            "Krav Ra (µm)": "Target Ra (µm)",
            "Beregnet ruhet:": "Calculated Roughness:",
            "Maks mating for krav:": "Max Feed for Target Ra:",
            "Gjenge- & Kjernebor-tabell": "Thread & Tap Drill Table",
            "Borstørrelse for både skjæretapp og formtapp (rulletapp).": "Pre-drill diameters for both cutting taps and roll form taps.",
            "Velg Gjengedimensjon": "Select Thread Size",
            "Kjernebor (Skjæretapp):": "Tap Drill (Cutting Tap):",
            "Kjernebor (Formtapp / Rulle):": "Tap Drill (Roll Form Tap):",
            "Stigning (P):": "Pitch (P):",
            "Metriske Gjengetoleranser (6H / 6g)": "Metric Thread Tolerances (6H / 6g)",
            "Nominelle mål for ytter-, mellom- og kjernediameter.": "Nominal major, pitch and minor diameters.",
            "M-størrelse": "M-Size",
            "Stigning (P)": "Pitch (P)",
            "Toleranse": "Tolerance",
            "6H (Innvendig)": "6H (Internal)",
            "6g (Utvendig)": "6g (External)",
            "Ytterdiameter (D / d):": "Major Diameter (D / d):",
            "Mellomdiameter (D2 / d2):": "Pitch Diameter (D2 / d2):",
            "Kjernediameter (D1 / d3):": "Minor Diameter (D1 / d3):",
            "Tiltrekkingsmoment & Nøkkelvidde for Bolter (M4–M36)": "Bolt Tightening Torque & Wrench Size (M4–M36)",
            "Anbefalt moment (Nm), forspenningskraft og nøkkelvidde (NV / Unbrako).": "Recommended torque (Nm), hex socket / wrench size and clearance hole.",
            "Boltdimensjon": "Bolt Size",
            "Fasthetsklasse": "Property Class / Grade",
            "8.8 (Standard stålbolt)": "8.8 (Standard Steel)",
            "10.9 (Høyfast bolt)": "10.9 (High Tensile)",
            "12.9 (Unbrako / Maskinbolt)": "12.9 (Alloy Socket Head)",
            "A4-70 / A2-70 (Syrefast/Rustfri)": "A4-70 / A2-70 (Stainless)",
            "A4-80 (Høyfast Syrefast)": "A4-80 (High Strength Stainless)",
            "Friksjon / Smøring": "Friction / Lubrication",
            "µ = 0.14 (Tørr / lett oljet standard)": "µ = 0.14 (Dry / Lightly Oiled)",
            "µ = 0.12 (Smurt / oljet)": "µ = 0.12 (Lubricated / Oiled)",
            "µ = 0.10 (MoS2 / Gjengepasta)": "µ = 0.10 (MoS2 / Thread Paste)",
            "🔧 Tiltrekkingsmoment:": "🔧 Tightening Torque:",
            "Nøkkelvidde (Sekskant / Unbrako):": "Wrench / Hex Key Size:",
            "Klaring- & Forsenkerhull:": "Clearance & Counterbore:",
            "ISO 286 Pasninger – Aksling & Hull (Ø1 – 500 mm)": "ISO 286 Fits – Shaft & Hole (Ø1 – 500 mm)",
            "Beregn over-/undermål i mikrometer (µm), grensemål og ferdig CNC-midtmål.": "Calculate deviations in micrometers (µm), limits and CNC target mean size.",
            "Hurtigvalg pasningsklasse": "Quick Fit Class Presets",
            "Nominell Diameter Ø (1 – 500 mm)": "Nominal Diameter Ø (1 – 500 mm)",
            "Toleranseklasse (Hull / Aksling)": "Tolerance Class (Hole / Shaft)",
            "Min / Maks mål:": "Min / Max Limits:",
            "🎯 Midtmål (CNC siktemål):": "🎯 Mean Size (CNC Target):",
            "Generelle Toleranser (ISO 2768)": "General Tolerances (ISO 2768)",
            "Frie mål for lengder, faser/radier og vinkler på tegning.": "General tolerances for linear dimensions and chamfers/radii.",
            "Nominelt mål (mm)": "Nominal Dimension (mm)",
            "Toleranseklasse": "Tolerance Class",
            "f – Fin (Fine)": "f – Fine",
            "m – Middels (Medium - Standard)": "m – Medium (Standard)",
            "c – Grov (Coarse)": "c – Coarse",
            "v – Meget grov (Very coarse)": "v – Very Coarse",
            "Lineært avvik (Lengdemål):": "Linear Tolerance:",
            "Tillatt min / maks:": "Allowed Min / Max:",
            "Utvendig radie / fase (tilsvarer mål):": "Broken Edges (Radius / Chamfer):",
            "Kilespor-tabell (DIN 6885-1)": "Keyway Dimensions (DIN 6885-1)",
            "Standard kilebredde (b), kilehøyde (h) og spordybde i aksel (t1) og nav (t2).": "Standard key width (b), height (h), shaft depth (t1) and hub depth (t2).",
            "Aksel- / Hulldiameter Ø (6 – 230 mm)": "Shaft / Bore Diameter Ø (6 – 230 mm)",
            "Kiledimensjon (b × h):": "Key Size (b × h):",
            "Spordybde Aksel (t1):": "Shaft Groove Depth (t1):",
            "Spordybde Nav / Hull (t2):": "Hub Groove Depth (t2):",
            "Emne- & Materialvekt": "Stock & Material Weight",
            "Beregn vekt på bolt/aksling, rør eller plate før løft og maskinering.": "Calculate weight of round bar, pipe/tube or plate before lifting and machining.",
            "Geometri": "Shape / Geometry",
            "Rundstang / Aksling": "Round Bar / Shaft",
            "Rør / Emnerør": "Pipe / Hollow Bar",
            "Plate / Firkant": "Plate / Flat Bar",
            "Materialtetthet": "Material Density",
            "Stål (7.85 g/cm³)": "Steel (7.85 g/cm³)",
            "Rustfritt 316 (8.00 g/cm³)": "Stainless 316 (8.00 g/cm³)",
            "Aluminium (2.70 g/cm³)": "Aluminum (2.70 g/cm³)",
            "Messing / Bronse (8.50 g/cm³)": "Brass / Bronze (8.50 g/cm³)",
            "Titan (4.50 g/cm³)": "Titanium (4.50 g/cm³)",
            "POM / Plast (1.41 g/cm³)": "POM / Acetal (1.41 g/cm³)",
            "Diameter Ø (mm)": "Diameter Ø (mm)",
            "Lengde L (mm)": "Length L (mm)",
            "Ytre Ø (mm)": "Outer Ø (mm)",
            "Indre Ø (mm)": "Inner Ø (mm)",
            "Lengde (mm)": "Length (mm)",
            "Bredde (mm)": "Width (mm)",
            "Tykkelse (mm)": "Thickness (mm)",
            "Beregnet Vekt:": "Calculated Weight:",
            "Boltsirkel (PCD) & Kordelengde": "Bolt Circle (PCD) & Chord Length",
            "Finn senteravstand mellom nabohull på en flens.": "Find center-to-center distance between adjacent holes on a flange.",
            "Boltsirkel Ø (PCD)": "Bolt Circle Ø (PCD)",
            "Antall hull": "Number of Holes",
            "Kordelengde (c-c nabohull):": "Chord Length (adjacent c-c):",
            "Rettvinklet Trekant (Pythagoras)": "Right Triangle (Pythagoras)",
            "Beregn hypotenus (c) og vinkler ut fra katet a og b.": "Calculate hypotenuse (c) and angles from sides a and b.",
            "Katet a (Høyde)": "Side a (Height)",
            "Katet b (Lengde)": "Side b (Base)",
            "Hypotenus (c):": "Hypotenuse (c):",
            "Vinkler:": "Angles:",
            "Tommer ↔ Millimeter": "Inches ↔ Millimeters",
            "Konverter mellom brøktommer, desimaltommer og millimeter.": "Convert between fractional inches, decimal inches and millimeters.",
            "Hurtigvalg Brøktomme": "Quick Fractional Inch",
            "Tommer (inch)": "Inches (in)",
            "Trykk, Vekt & Temperatur": "Pressure, Weight & Temperature",
            "PSI til Bar, Pund (lbs) til kg og Fahrenheit til Celsius.": "PSI to Bar, Pounds (lbs) to kg and Fahrenheit to Celsius.",
            "Trykk (PSI)": "Pressure (PSI)",
            "Pund (lbs)": "Pounds (lbs)",
            "Hardhetskonverterer (HRC ↔ HB ↔ HV ↔ Strekkfasthet Rm)": "Hardness Converter (HRC ↔ HB ↔ HV ↔ Tensile Rm)",
            "Konverter mellom Rockwell C (HRC), Brinell (HB), Vickers (HV) og strekkfasthet (MPa / N/mm²) iht. ISO 18265.": "Convert between Rockwell C (HRC), Brinell (HB), Vickers (HV) and Tensile Strength (MPa) per ISO 18265.",
            "Strekkfasthet (MPa)": "Tensile Strength (MPa)",
            "Bearbeidbarhetsvurdering": "Machinability Assessment",

            // Strøm & Elbil
            "Ladetid, Norgespris, Effekttariff, Dekkalkulator & Besparelse": "Charging Time, Grid Tariff, Tire Calculator & Fuel Savings",
            "🔋 Lading & Rekkevidde": "🔋 Charging & Range",
            "⚡ Norgespris, Nettleie & Forbruk": "⚡ Power Tariff & Consumption",
            "🛞 Dekk, Speedometer & Økonomi": "🛞 Tires, Speedometer & Savings",
            "Elbil Ladetid & Kostnad": "EV Charging Time & Cost",
            "Beregn ladetid, pris og ekstra rekkevidde.": "Calculate charging time, cost and added driving range.",
            "Batteri (kWh)": "Battery (kWh)",
            "Ladeeffekt (kW)": "Charging Power (kW)",
            "Start %": "Start %",
            "Mål %": "Target %",
            "Strømpris (kr/kWh)": "Power Price (NOK/kWh)",
            "Forbruk (kWh/100km)": "Consumption (kWh/100km)",
            "Ladetid:": "Charging Time:",
            "Tilført rekkevidde:": "Added Range:",
            "Ladekostnad:": "Charging Cost:",
            "Vinterrekkevidde-kalkulator": "Winter Range Calculator",
            "Estimer reell rekkevidde ved kuldegrader og vinterføre.": "Estimate real-world EV range in cold winter conditions.",
            "WLTP Rekkevidde (km)": "WLTP Range (km)",
            "Temperatur / Føre": "Temperature / Conditions",
            "20°C Sommer (0% tap)": "20°C Summer (0% loss)",
            "5°C Høst / Vår (-10%)": "5°C Autumn / Spring (-10%)",
            "0°C til -5°C Vinter (-20%)": "0°C to -5°C Winter (-20%)",
            "-10°C til -15°C Kaldt (-30%)": "-10°C to -15°C Cold (-30%)",
            "-20°C Sprenkulde (-40%)": "-20°C Extreme Cold (-40%)",
            "Estimerte vinter-km:": "Estimated Winter Range:",
            "Rekkeviddetap:": "Range Loss:",
            "Norgespris / Strømstøtte & Effekttariff": "Power Support & Grid Capacity Tariff",
            "Regn ut reell kWh-pris inkludert nettleie og finn maks ladeeffekt for å unngå dyrere kapasitetstrinn.": "Calculate real kWh price incl. grid fee and find max charging power to stay below costly capacity steps.",
            "Strømordning": "Electricity Scheme",
            "Spotpris m/ 90% Strømstøtte (over 93,75 øre inkl. mva)": "Spot Price w/ 90% Gov Support (>0.9375 NOK)",
            "Norgespris fastpris (50 øre/kWh inkl. mva)": "Norgespris Fixed Rate (0.50 NOK/kWh)",
            "Spotpris uten støtte (Hytte / Næring)": "Spot Price without Support (Cabin / Commercial)",
            "Spotpris inkl. mva (kr/kWh)": "Spot Price incl. VAT (NOK/kWh)",
            "Energiledd nettleie (kr/kWh)": "Grid Energy Fee (NOK/kWh)",
            "Ønsket Kapasitetstrinn (Maks)": "Target Grid Capacity Step (Max)",
            "Husets øvrige trekk (kW)": "House Base Load (kW)",
            "Strømstøtte / Rabatt:": "Power Subsidy / Discount:",
            "Faktisk totalpris (inkl. nettleie):": "Actual Total Price (incl. grid):",
            "⚡ Anbefalt maks lading (under trinn):": "⚡ Recommended Max Charging:",
            "🔄 Bruk denne kWh-prisen i alle elbil- og strømkalkulatorer": "🔄 Apply this kWh price to all EV & power calculators",
            "Strømforbruk Apparat / Maskin": "Appliance / Machine Power Cost",
            "Regn ut hva varmepumpe, kompressor eller varmeovn koster i drift.": "Calculate running cost of heat pump, compressor or heater.",
            "Hurtigvalg apparat": "Quick Appliance Preset",
            "Varmeovn / Vifteovn (2000 W)": "Space Heater / Fan (2000 W)",
            "Varmepumpe snitt (1200 W)": "Heat Pump Average (1200 W)",
            "Verkstedkompressor (3500 W)": "Workshop Compressor (3500 W)",
            "CNC Maskin i drift (15 000 W)": "CNC Machine Running (15 000 W)",
            "Effekt (Watt)": "Power (Watts)",
            "Timer pr. døgn": "Hours per Day",
            "Pris pr. time:": "Cost per Hour:",
            "Pris pr. døgn:": "Cost per Day:",
            "Pris pr. måned (30 d):": "Cost per Month (30 d):",
            "Dekkdimensjon & Speedometer": "Tire Size & Speedometer Calculator",
            "Sammenlign originaldimensjon (f.eks. sommerhjul) mot ny dimensjon (vinterhjul). Krav i Norge er maks ±5 % endring i rulleomkrets.": "Compare stock tire size against new size. Max legal circumference change in Norway is ±5%.",
            "1. Originalt hjul (Vognkort)": "1. Stock Tire Size",
            "2. Nytt hjul (Sammenligning)": "2. New Tire Size (Comparison)",
            "Profil (%)": "Aspect Ratio (%)",
            "Felg (Tommer)": "Rim (Inches)",
            "Endring rulleomkrets:": "Circumference Change:",
            "Diameter (Orig → Ny) / Bakkeklaring:": "Diameter (Stock → New) / Ride Height:",
            "Når speedometeret viser 80 km/t:": "When Speedometer Shows 80 km/h:",
            "Elbil vs Bensin/Diesel": "EV vs Gasoline / Diesel",
            "Sammenlign årlig drivstoffkostnad mot elbillading.": "Compare annual fossil fuel cost against EV charging.",
            "Kjørelengde pr. år (km)": "Annual Mileage (km)",
            "Drivstoffpris (kr/l)": "Fuel Price (NOK/L)",
            "Forbruk (liter/mil)": "Fuel Consumption (L/10km)",
            "Elbil (kWh/mil)": "EV Consumption (kWh/10km)",
            "Spart pr. måned:": "Saved per Month:",
            "Spart pr. år:": "Saved per Year:",
            "Spart over 5 år:": "Saved over 5 Years:"
        };

        // Bygg revers-ordbok (EN -> NO) automatisk
        const enToNoDict = {};
        Object.keys(noToEnDict).forEach(noKey => {
            enToNoDict[noToEnDict[noKey]] = noKey;
        });

        function tr(noStr, enStr) {
            return currentLang === 'en' ? enStr : noStr;
        }

        function oversettDomTekstNoder() {
            const dict = currentLang === 'en' ? noToEnDict : enToNoDict;
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while ((node = walker.nextNode())) {
                const parentTag = node.parentElement?.tagName;
                if (parentTag === 'SCRIPT' || parentTag === 'STYLE') continue;
                const trimmed = node.nodeValue.trim();
                if (trimmed && dict[trimmed]) {
                    node.nodeValue = node.nodeValue.replace(trimmed, dict[trimmed]);
                }
            }

            // Oversett placeholders
            const phMap = [
                { id: 'global-search-input', no: 'Søk etter kalkulator (f.eks. maling, betong, dato, flis, H7, G76)...', en: 'Search calculators (e.g. paint, concrete, date, tile, H7, G76)...' },
                { id: 'notes-todo-input', no: 'Ny oppgave (f.eks. Bytt skjær T04, Mål Ø40 H7)...', en: 'New task (e.g. Change insert T04, Measure Ø40 H7)...' },
                { id: 'notes-text-area', no: 'Skriv inn mål, verktøylengder, G54 Z-nullpunkt, ordrenummer eller beskjed til neste skift...', en: 'Enter dimensions, tool lengths, G54 Z-zero, order number or shift handover notes...' },
                { id: 'overstyr-dager', no: 'Auto (man-fre)', en: 'Auto (Mon-Fri)' },
                { id: 'amount-recipe-ingredients', no: '200 g mel\n3 dl melk\n2 stk egg', en: '200 g flour\n3 dl milk\n2 eggs' }
            ];
            phMap.forEach(item => {
                const el = document.getElementById(item.id);
                if (el) el.placeholder = currentLang === 'en' ? item.en : item.no;
            });

            // Oppdater språk-knappene
            const lblDesk = document.getElementById('lang-label-desktop');
            const lblMob = document.getElementById('lang-label-mobile');
            if (lblDesk) lblDesk.innerText = currentLang === 'en' ? 'NO / Norsk' : 'EN / English';
            if (lblMob) lblMob.innerText = currentLang === 'en' ? 'NO' : 'EN';
            document.documentElement.lang = currentLang === 'en' ? 'en' : 'no';
        }

        function brukSprak() {
            oversettDomTekstNoder();
            oppdaterLiveKlokke();
            brukLayoutPreferanser();
            oppdaterNotatTellereOgWidget();
            oppdaterAarOgMaaned();
            oppdaterSokResultater();
            if (initialiserteBeregninger.has('tools')) {
                beregnIso();
                konverterHardhet('hrc');
            }
            if (initialiserteBeregninger.has('ev')) {
                beregnStromTariff();
                beregnDekkDimensjon();
            }
        }

        function toggleLanguage() {
            currentLang = currentLang === 'no' ? 'en' : 'no';
            localStorage.setItem('verksted_lang', currentLang);
            brukSprak();
            visToast(currentLang === 'en' ? 'Language switched to English 🇬🇧' : 'Språk byttet til Norsk 🇳🇴');
        }

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                apneSokModal();
                return;
            }
            if (e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                veksleNotatSkuff();
                return;
            }
            if (e.key === 'Escape') {
                lukkSokModal();
                lukkNotatSkuff();
                window.hideMobileMoreMenu();
                return;
            }
            if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
            const map = { '1': 'dashboard', '2': 'salary', '3': 'cnc', '4': 'tools', '5': 'ev', '6': 'amounts', '7': 'datetime' };
            if (map[e.key]) switchTab(map[e.key]);
        });

        // --- GLOBAL NOTAT- OG SJEKKLISTESKUFF (KOMBINERT NR. 4 + NR. 2) ---
        let verkstedSjekkliste = [];
        let aktivNotatModus = 'todo'; // 'todo' eller 'text'
        let notatLagringTimer = null;

        function lastInnNotaterOgSjekkliste() {
            try {
                const lagretTodo = localStorage.getItem('verksted_todos_v1');
                if (lagretTodo) {
                    verkstedSjekkliste = JSON.parse(lagretTodo) || [];
                } else {
                    verkstedSjekkliste = [
                        { id: 't1', text: 'Kontroller Z-nullpunkt før oppstart', done: false },
                        { id: 't2', text: 'Sjekk Brix-verdi på kjølevæske', done: false }
                    ];
                }
                aktivNotatModus = localStorage.getItem('verksted_notes_mode') || 'todo';
                const lagretTekst = localStorage.getItem('verksted_freetext_note') || localStorage.getItem('dash-quick-note') || '';
                const txtArea = document.getElementById('notes-text-area');
                if (txtArea) txtArea.value = lagretTekst;
            } catch (e) {
                verkstedSjekkliste = [];
            }
            byttNotatModus(aktivNotatModus, false);
            byggSjekklisteVisning();
            oppdaterNotatTellereOgWidget();
        }

        function lagreNotatData() {
            clearTimeout(notatLagringTimer);
            notatLagringTimer = null;
            try {
                localStorage.setItem('verksted_todos_v1', JSON.stringify(verkstedSjekkliste));
                localStorage.setItem('verksted_notes_mode', aktivNotatModus);
                const txtArea = document.getElementById('notes-text-area');
                if (txtArea) {
                    localStorage.setItem('verksted_freetext_note', txtArea.value);
                }
            } catch (e) {}
            oppdaterNotatTellereOgWidget();
        }

        function planleggLagringNotatData() {
            clearTimeout(notatLagringTimer);
            notatLagringTimer = setTimeout(() => {
                notatLagringTimer = null;
                const txtArea = document.getElementById('notes-text-area');
                if (!txtArea) return;
                try {
                    const verdi = txtArea.value;
                    if (localStorage.getItem('verksted_freetext_note') !== verdi) {
                        localStorage.setItem('verksted_freetext_note', verdi);
                    }
                } catch (e) {}
            }, 300);
        }

        function apneNotatSkuff() {
            const drawer = document.getElementById('notes-drawer');
            const backdrop = document.getElementById('notes-drawer-backdrop');
            if (!drawer || !backdrop) return;
            backdrop.classList.remove('hidden');
            drawer.classList.remove('translate-x-full');
            if (aktivNotatModus === 'todo') {
                setTimeout(() => document.getElementById('notes-todo-input')?.focus(), 120);
            } else {
                setTimeout(() => document.getElementById('notes-text-area')?.focus(), 120);
            }
        }

        function lukkNotatSkuff() {
            const drawer = document.getElementById('notes-drawer');
            const backdrop = document.getElementById('notes-drawer-backdrop');
            if (!drawer || !backdrop) return;
            drawer.classList.add('translate-x-full');
            backdrop.classList.add('hidden');
        }

        function veksleNotatSkuff() {
            const drawer = document.getElementById('notes-drawer');
            if (!drawer) return;
            if (drawer.classList.contains('translate-x-full')) apneNotatSkuff();
            else lukkNotatSkuff();
        }

        function byttNotatModus(modus, lagre = true) {
            aktivNotatModus = modus === 'text' ? 'text' : 'todo';
            const pTodo = document.getElementById('notes-panel-todo');
            const pText = document.getElementById('notes-panel-text');
            const bTodo = document.getElementById('btn-notes-mode-todo');
            const bText = document.getElementById('btn-notes-mode-text');

            if (pTodo && pText && bTodo && bText) {
                if (aktivNotatModus === 'todo') {
                    pTodo.classList.remove('hidden');
                    pTodo.classList.add('flex');
                    pText.classList.add('hidden');
                    pText.classList.remove('flex');

                    bTodo.className = 'py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 bg-brand-500 text-slate-950 shadow-sm';
                    bText.className = 'py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white';
                } else {
                    pText.classList.remove('hidden');
                    pText.classList.add('flex');
                    pTodo.classList.add('hidden');
                    pTodo.classList.remove('flex');

                    bText.className = 'py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 bg-brand-500 text-slate-950 shadow-sm';
                    bTodo.className = 'py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white';
                }
            }
            if (lagre) lagreNotatData();
        }

        function leggTilSjekklistePunkt(e) {
            if (e) e.preventDefault();
            const inp = document.getElementById('notes-todo-input');
            if (!inp) return;
            const tekst = inp.value.trim();
            if (!tekst) return;
            verkstedSjekkliste.unshift({
                id: 'td_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                text: tekst,
                done: false
            });
            inp.value = '';
            byggSjekklisteVisning();
            lagreNotatData();
        }

        function hurtigSjekkliste(tekst) {
            verkstedSjekkliste.unshift({
                id: 'td_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                text: tekst,
                done: false
            });
            byggSjekklisteVisning();
            lagreNotatData();
            visToast(`Lagt til: ${tekst}`);
        }

        function veksleSjekklistePunkt(id) {
            const item = verkstedSjekkliste.find(t => t.id === id);
            if (item) {
                item.done = !item.done;
                // Sorter slik at åpne oppgaver ligger øverst
                verkstedSjekkliste.sort((a, b) => Number(a.done) - Number(b.done));
                byggSjekklisteVisning();
                lagreNotatData();
            }
        }

        function slettSjekklistePunkt(id) {
            verkstedSjekkliste = verkstedSjekkliste.filter(t => t.id !== id);
            byggSjekklisteVisning();
            lagreNotatData();
        }

        function fjernFullforteSjekkliste() {
            const forAntall = verkstedSjekkliste.length;
            verkstedSjekkliste = verkstedSjekkliste.filter(t => !t.done);
            if (verkstedSjekkliste.length < forAntall) {
                byggSjekklisteVisning();
                lagreNotatData();
                visToast('Fullførte oppgaver fjernet');
            } else {
                visToast('Ingen fullførte oppgaver å fjerne');
            }
        }

        function kopierSjekkliste() {
            if (verkstedSjekkliste.length === 0) {
                visToast('Sjekklisten er tom', 'error');
                return;
            }
            const txt = verkstedSjekkliste.map(t => `${t.done ? '[x]' : '[ ]'} ${t.text}`).join('\n');
            kopierTekst(txt, 'Sjekkliste');
        }

        function byggSjekklisteVisning() {
            const container = document.getElementById('notes-todo-list');
            if (!container) return;
            if (verkstedSjekkliste.length === 0) {
                container.innerHTML = `<div class="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">Ingen gjøremål i listen. Skriv inn over eller bruk hurtigknappene!</div>`;
                return;
            }
            container.innerHTML = verkstedSjekkliste.map(item => `
                <div class="flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${item.done ? 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60' : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/70'}">
                    <label class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                        <input type="checkbox" ${item.done ? 'checked' : ''} onchange="veksleSjekklistePunkt('${item.id}')" class="custom-checkbox shrink-0">
                        <span class="text-xs font-semibold truncate ${item.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}">${item.text.replace(/</g, '&lt;')}</span>
                    </label>
                    <button type="button" onclick="slettSjekklistePunkt('${item.id}')" class="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center text-xs shrink-0" title="Slett">✕</button>
                </div>
            `).join('');
        }

        function oppdaterFritekstNotat(verdi) {
            const countEl = document.getElementById('notes-char-count');
            if (countEl) countEl.innerText = `${verdi.length} tegn`;
            oppdaterNotatTellereOgWidget();
            planleggLagringNotatData();
        }

        function settInnTidsstempelNotat() {
            const txtArea = document.getElementById('notes-text-area');
            if (!txtArea) return;
            const naa = new Date();
            const tid = `[${String(naa.getDate()).padStart(2,'0')}.${String(naa.getMonth()+1).padStart(2,'0')} kl.${String(naa.getHours()).padStart(2,'0')}:${String(naa.getMinutes()).padStart(2,'0')}] `;
            txtArea.value = (txtArea.value ? txtArea.value + '\n' : '') + tid;
            oppdaterFritekstNotat(txtArea.value);
            txtArea.focus();
        }

        function tomFritekstNotat() {
            const txtArea = document.getElementById('notes-text-area');
            if (!txtArea) return;
            txtArea.value = '';
            oppdaterFritekstNotat('');
            visToast('Notatlogg tømt');
        }

        function oppdaterNotatTellereOgWidget() {
            const apne = verkstedSjekkliste.filter(t => !t.done);
            const antallApne = apne.length;

            const bDesk = document.getElementById('notes-badge-desktop');
            const bMob = document.getElementById('notes-badge-mobile');
            const pill = document.getElementById('notes-todo-count-pill');

            if (bDesk) bDesk.innerText = antallApne;
            if (pill) pill.innerText = antallApne;
            if (bMob) {
                bMob.innerText = antallApne;
                if (antallApne > 0) {
                    bMob.classList.remove('hidden');
                    bMob.classList.add('flex');
                } else {
                    bMob.classList.add('hidden');
                    bMob.classList.remove('flex');
                }
            }

            // Oppdater Dashboard-widgeten basert på valgt funksjon
            const wTitle = document.getElementById('dash-note-widget-title');
            const wMain = document.getElementById('dash-kpi-note-main');
            const wSub = document.getElementById('dash-kpi-note-sub');
            const txtVal = (document.getElementById('notes-text-area')?.value || '').trim();
            const countEl = document.getElementById('notes-char-count');
            if (countEl) countEl.innerText = `${txtVal.length} tegn`;

            if (!wMain || !wSub) return;

            if (aktivNotatModus === 'text') {
                if (wTitle) wTitle.innerText = 'MASKINLOGG (FRITEKST)';
                if (txtVal.length > 0) {
                    const forsteLinje = txtVal.split('\n')[0];
                    wMain.innerText = forsteLinje;
                    wSub.innerText = `${txtVal.length} tegn lagret · Klikk for å redigere →`;
                } else {
                    wMain.innerText = 'Tom logg...';
                    wSub.innerText = 'Klikk for å skrive Z-nullpunkt / notat →';
                }
            } else {
                if (wTitle) wTitle.innerText = 'VERKSTED SJEKKLISTE';
                if (antallApne > 0) {
                    wMain.innerText = `☑️ ${apne[0].text}`;
                    wSub.innerText = antallApne === 1
                        ? `1 åpen oppgave · Klikk for sjekkliste →`
                        : `${antallApne} åpne oppgaver (+${antallApne - 1} til) →`;
                } else {
                    wMain.innerText = '✅ Alt utført!';
                    wSub.innerText = `${verkstedSjekkliste.length} fullført · Klikk for å legge til →`;
                }
            }
        }

        // --- GLOBALT HURTIGSØK & SAMMENLEGGBARE KORT ---
        const verktoySokIndeks = [
            { title: 'Lønnskalkulator & Netto oversikt', titleEn: 'Salary Calculator & Net Overview', keys: 'lønn skatt netto brutto feriepenger salary tax net gross holiday pay', tab: 'salary', sub: 'oversikt' },
            { title: 'Registrer Vakt & Timebank', titleEn: 'Register Shift & Timebank', keys: 'overtid vakt timebank avspasering 50% 100% overtime shift time off', tab: 'salary', sub: 'vakter' },
            { title: 'Formannstillegg & Skattetabell', titleEn: 'Foreman Bonus & Tax Table', keys: 'formann 20% timelønn tabelltrekk fagforening lo foreman hourly rate union tax', tab: 'salary', sub: 'innstillinger' },
            { title: 'Sirkulær Mating (Innvendig / Utvendig)', titleEn: 'Circular Interpolation Feed (Int / Ext)', keys: 'sirkulær fresing hull lomme sentermating circular milling hole pocket center feed', tab: 'cnc', sub: 'milling', card: 'card-cnc-sirk' },
            { title: 'Skjæredata Hurtigkalkulator (Vc / RPM / Vf)', titleEn: 'Cutting Data Quick Calc (Vc / RPM / Vf)', keys: 'vc rpm bordmating spindel fz cutting speed spindle table feed', tab: 'cnc', sub: 'milling', card: 'card-cnc-hurtig' },
            { title: 'Skjæredata (RCT)', titleEn: 'Cutting Data (RCT)', keys: 'skjæredata cutting data rct rpm bordmating table feed sideinngrep chip thinning stepover', tab: 'cnc', sub: 'milling', card: 'card-cnc-rct' },
            { title: 'Innvendige & Utvendige Gjenger (Gibbs)', titleEn: 'Internal & External Threads (Gibbs)', keys: 'gibbs gjenger dreiing stigning threads turning pitch', tab: 'cnc', sub: 'turning', card: 'card-cnc-gibbs' },
            { title: 'Konus- & Fase-kalkulator', titleEn: 'Taper & Chamfer Calculator', keys: 'konus fase vinkel dreiing 45 grader 1:10 1:20 taper chamfer angle turning', tab: 'cnc', sub: 'turning', card: 'card-cnc-taper' },
            { title: 'C-Akse Gradering (Grader/min)', titleEn: 'C-Axis Rotary Feed (Deg/min)', keys: 'c-akse grader omkrets dreiing c-axis degrees circumference rotary', tab: 'cnc', sub: 'turning', card: 'card-cnc-caxis' },
            { title: 'Materialdatabank (HM Verktøy)', titleEn: 'Material Database (Carbide Tools)', keys: 'materiale s355 rustfritt 316 duplex alu skjærehastighet material stainless aluminum', tab: 'tools', sub: 'data' },
            { title: 'Borespiss-kompensasjon', titleEn: 'Drill Point Compensation', keys: 'bor spissvinkel 140 118 boredybde z-dybde drill point angle depth', tab: 'tools', sub: 'data' },
            { title: 'Kjølevæske & Refraktometer (Brix)', titleEn: 'Coolant & Refractometer (Brix)', keys: 'kjølevæske brix olje emulsjon refraktometer coolant oil concentration', tab: 'tools', sub: 'data' },
            { title: 'Overflateruhet (Ra / Rz)', titleEn: 'Theoretical Surface Roughness (Ra / Rz)', keys: 'ruhet ra rz neseradius slettdreiing surface roughness nose radius finish', tab: 'tools', sub: 'data' },
            { title: 'Gjenge- & Kjernebor-tabell (M3–M36 / BSP)', titleEn: 'Thread & Tap Drill Table (M3–M36 / BSP)', keys: 'gjenger kjernebor m10 m12 formtapp rulletapp bsp rørgjenger tap drill roll form thread', tab: 'tools', sub: 'threads' },
            { title: 'Metriske Gjengetoleranser (6H / 6g)', titleEn: 'Metric Thread Tolerances (6H / 6g)', keys: '6h 6g mellomdiameter gjengetoleranse pitch diameter thread tolerance', tab: 'tools', sub: 'threads' },
            { title: 'Tiltrekkingsmoment & Nøkkelvidde Bolter (M4–M36)', titleEn: 'Bolt Tightening Torque & Wrench Size (M4–M36)', keys: 'moment nm bolt unbrako nøkkelvidde 8.8 10.9 12.9 a4 torque wrench hex socket', tab: 'tools', sub: 'threads', card: 'card-tools-torque' },
            { title: 'ISO 286 Pasninger – Aksling & Hull', titleEn: 'ISO 286 Fits – Shaft & Hole', keys: 'iso 286 pasning h7 g6 k6 m6 p6 midtmål toleranse aksling hull fit shaft hole tolerance target', tab: 'tools', sub: 'fits', card: 'card-tools-iso286' },
            { title: 'Generelle Toleranser (ISO 2768-m/f/c)', titleEn: 'General Tolerances (ISO 2768-m/f/c)', keys: 'iso 2768 frie mål generelle toleranser general tolerances linear', tab: 'tools', sub: 'fits', card: 'card-tools-iso2768' },
            { title: 'Kilespor-tabell (DIN 6885-1)', titleEn: 'Keyway Dimensions (DIN 6885-1)', keys: 'kilespor kile din 6885 aksel nav t1 t2 keyway key groove shaft hub', tab: 'tools', sub: 'fits', card: 'card-tools-keyway' },
            { title: 'Vektkalkulator (Aksling / Rør / Plate)', titleEn: 'Weight Calculator (Bar / Pipe / Plate)', keys: 'vekt kg stål aluminium emne weight steel aluminum bar pipe plate', tab: 'tools', sub: 'weight' },
            { title: 'Boltsirkel (PCD) & Pythagoras Trekant', titleEn: 'Bolt Circle (PCD) & Right Triangle', keys: 'pcd boltsirkel kordelengde trekant pythagoras katet bolt circle chord triangle', tab: 'tools', sub: 'math' },
            { title: 'Tommer ↔ Millimeter & Trykk/Temp', titleEn: 'Inches ↔ Millimeters & Pressure/Temp', keys: 'tommer inch mm psi bar fahrenheit converter', tab: 'tools', sub: 'conv' },
            { title: 'Hardhetskonverterer (HRC ↔ HB ↔ HV ↔ MPa)', titleEn: 'Hardness Converter (HRC ↔ HB ↔ HV ↔ MPa)', keys: 'hardhet hrc brinell hb vickers hv mpa strekkfasthet hardness tensile strength', tab: 'tools', sub: 'conv' },
            { title: 'Elbil Ladetid & Vinterrekkevidde', titleEn: 'EV Charging Time & Winter Range', keys: 'elbil strøm ladetid kwh vinterrekkevidde kulde ev charging winter range cold', tab: 'ev', sub: 'charging', card: 'card-ev-charge' },
            { title: 'Norgespris / Strømstøtte & Effekttariff (Nettleie)', titleEn: 'Power Support & Grid Capacity Tariff', keys: 'norgespris strømstøtte nettleie kapasitetstrinn effekttariff spotpris grid tariff power support', tab: 'ev', sub: 'power', card: 'card-ev-tariff' },
            { title: 'Strømforbruk Apparat / Maskin', titleEn: 'Appliance / Machine Power Cost', keys: 'apparat varmepumpe kompressor watt kwh appliance heat pump compressor power', tab: 'ev', sub: 'power', card: 'card-ev-app' },
            { title: 'Dekkdimensjon & Speedometer-kalkulator', titleEn: 'Tire Size & Speedometer Calculator', keys: 'dekk felg rulleomkrets speedometer vinterhjul sommerhjul 5% tire rim circumference speed', tab: 'ev', sub: 'tires', card: 'card-ev-tires' },
            { title: 'Elbil vs Bensin/Diesel Besparelse', titleEn: 'EV vs Gasoline/Diesel Savings', keys: 'bensin diesel drivstoff besparelse spart fuel gasoline savings', tab: 'ev', sub: 'tires', card: 'card-ev-save' },
            { title: 'Maling – mengde og spann', titleEn: 'Paint Quantity and Cans', keys: 'maling liter spann vegg areal strøk dekkevne paint liters cans wall area coats coverage', tab: 'amounts', mode: 'amount', value: 'paint' },
            { title: 'Gulv og flis – pakker og flisantall', titleEn: 'Flooring and Tile Quantity', keys: 'gulv flis laminat pakker fuge flisstørrelse svinn flooring tile packs grout size waste', tab: 'amounts', mode: 'amount', value: 'floor' },
            { title: 'Betong – volum og sekker', titleEn: 'Concrete Volume and Bags', keys: 'betong volum m3 liter tykkelse sekk concrete volume thickness bags', tab: 'amounts', mode: 'amount', value: 'concrete' },
            { title: 'Blandingsforhold – mengdefordeling', titleEn: 'Mix Ratio Calculator', keys: 'blanding blandingsforhold del a del b liter mix ratio parts volume', tab: 'amounts', mode: 'amount', value: 'mix' },
            { title: 'Oppskrift – skaler porsjoner', titleEn: 'Recipe and Serving Scaler', keys: 'oppskrift porsjoner ingredienser skalere recipe servings ingredients scale', tab: 'amounts', mode: 'amount', value: 'recipe' },
            { title: 'Arbeidstid mellom klokkeslett', titleEn: 'Time Between Clock Times', keys: 'arbeidstid tidsrom timer minutter over natten klokkeslett duration time overnight', tab: 'datetime', mode: 'datetime', value: 'duration' },
            { title: 'Datoforskjell og arbeidsdager', titleEn: 'Date Difference and Working Days', keys: 'dato dager uker arbeidsdager hverdager date difference weekdays working days', tab: 'datetime', mode: 'datetime', value: 'difference' },
            { title: 'Nedtelling til frist eller hendelse', titleEn: 'Countdown to Deadline or Event', keys: 'nedtelling frist hendelse gjenstår overskredet countdown deadline event remaining', tab: 'datetime', mode: 'datetime', value: 'countdown' },
            { title: 'Legg tid til et klokkeslett', titleEn: 'Add Time to a Clock Time', keys: 'legg til tid klokkeslett timer minutter dagsforskyvning add hours minutes time', tab: 'datetime', mode: 'datetime', value: 'add' },
            { title: 'Ukenummer og ukedag', titleEn: 'Week Number and Weekday', keys: 'ukenummer iso uke ukedag dato week number weekday iso week', tab: 'datetime', mode: 'datetime', value: 'week' }
        ];

        function apneSokModal() {
            const modal = document.getElementById('search-modal');
            const input = document.getElementById('global-search-input');
            if (!modal || !input) return;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            input.value = '';
            oppdaterSokResultater();
            setTimeout(() => input.focus(), 50);
        }

        function lukkSokModal() {
            const modal = document.getElementById('search-modal');
            if (modal && !modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }

        function normaliserSoketekst(tekst) {
            return tekst
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/æ/g, 'ae')
                .replace(/[ø]/g, 'o')
                .replace(/[å]/g, 'a')
                .replace(/[^a-z0-9%]+/g, ' ')
                .trim();
        }

        function oppdaterSokResultater() {
            const q = (document.getElementById('global-search-input')?.value || '').trim();
            const container = document.getElementById('global-search-results');
            if (!container) return;
            if (window.ManualSok) window.ManualSok.search(q);
            const sokOrd = normaliserSoketekst(q).split(/\s+/).filter(Boolean);
            const treff = verktoySokIndeks.filter(item => {
                const sokbarTekst = normaliserSoketekst(`${item.title} ${item.titleEn || ''} ${item.keys}`);
                return sokOrd.every(ord => sokbarTekst.includes(ord));
            });
            if (treff.length === 0) {
                const noMatchTxt = currentLang === 'en' ? `No tools matched "${q}"` : `Ingen verktøy matchet "${q}"`;
                const noMatch = document.createElement('p');
                noMatch.className = 'text-center text-xs text-slate-400 py-6';
                noMatch.textContent = noMatchTxt;
                container.replaceChildren(noMatch);
                return;
            }
            const tabNavnMap = {
                salary: currentLang === 'en' ? 'SALARY' : 'LØNN',
                cnc: 'CNC',
                tools: currentLang === 'en' ? 'TABLES' : 'TABELLER',
                ev: currentLang === 'en' ? 'POWER & EV' : 'STRØM & ELBIL',
                amounts: currentLang === 'en' ? 'QUANTITIES' : 'MENGDER',
                datetime: currentLang === 'en' ? 'DATE & TIME' : 'DATO & TID'
            };
            const subNavnMap = {
                oversikt: currentLang === 'en' ? 'overview' : 'oversikt',
                vakter: currentLang === 'en' ? 'shifts' : 'vakter',
                innstillinger: currentLang === 'en' ? 'settings' : 'innstillinger',
                skatt: currentLang === 'en' ? 'tax' : 'skatt',
                milling: currentLang === 'en' ? 'milling' : 'fresing',
                turning: currentLang === 'en' ? 'turning' : 'dreiing',
                data: currentLang === 'en' ? 'cutting data' : 'skjæredata',
                threads: currentLang === 'en' ? 'threads' : 'gjenger',
                fits: currentLang === 'en' ? 'fits & keyways' : 'pasninger',
                weight: currentLang === 'en' ? 'weight' : 'vekt',
                math: currentLang === 'en' ? 'math & pcd' : 'matte',
                conv: currentLang === 'en' ? 'converter' : 'konverterer',
                charging: currentLang === 'en' ? 'charging' : 'lading',
                power: currentLang === 'en' ? 'power & grid' : 'strøm & nettleie',
                tires: currentLang === 'en' ? 'tires & economy' : 'dekk & økonomi'
            };
            const openTxt = currentLang === 'en' ? 'Open →' : 'Åpne →';
            const resultatKnapper = treff.map((item) => {
                const visTittel = currentLang === 'en' ? (item.titleEn || item.title) : item.title;
                const visTab = tabNavnMap[item.tab] || item.tab.toUpperCase();
                const visSub = item.sub ? (subNavnMap[item.sub] || item.sub) : '';
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'w-full text-left px-4 py-3 rounded-2xl bg-slate-50 hover:bg-brand-500/15 dark:bg-slate-800/70 dark:hover:bg-brand-500/20 border border-slate-200/70 dark:border-slate-700/60 hover:border-brand-500 transition-all flex items-center justify-between group';
                button.addEventListener('click', () => gaaTilSokResultat(verktoySokIndeks.indexOf(item)));

                const details = document.createElement('div');
                const title = document.createElement('p');
                title.className = 'text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400';
                title.textContent = visTittel;
                const location = document.createElement('p');
                location.className = 'text-[11px] font-mono text-slate-400 uppercase';
                location.textContent = `${visTab}${visSub ? ` → ${visSub}` : ''}`;
                details.append(title, location);

                const action = document.createElement('span');
                action.className = 'text-xs font-mono font-bold text-brand-500';
                action.textContent = openTxt;
                button.append(details, action);
                return button;
            });
            container.replaceChildren(...resultatKnapper);
        }

        function gaaTilSokResultat(idx) {
            const item = verktoySokIndeks[idx];
            if (!item) return;
            lukkSokModal();
            switchTab(item.tab);
            if (item.tab === 'salary' && item.sub) switchSalaryTab(item.sub);
            if (item.tab === 'cnc' && item.sub) switchCncTab(item.sub);
            if (item.tab === 'tools' && item.sub) switchToolsTab(item.sub);
            if (item.tab === 'ev' && item.sub) switchEvTab(item.sub);
            if (item.mode === 'amount') document.querySelector(`[data-amount-mode="${item.value}"]`)?.click();
            if (item.mode === 'datetime') document.querySelector(`[data-datetime-mode="${item.value}"]`)?.click();
            if (item.card) {
                setTimeout(() => {
                    const cardEl = document.getElementById(item.card);
                    if (cardEl) {
                        cardEl.classList.remove('card-collapsed');
                        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        cardEl.classList.add('card-search-highlight');
                        setTimeout(() => cardEl.classList.remove('card-search-highlight'), 2400);
                    }
                }, 100);
            }
        }

        function initSammenleggbareKort() {
            document.querySelectorAll('.pers-input > h3').forEach((h3) => {
                if (h3.dataset.collapseReady) return;
                h3.dataset.collapseReady = '1';
                h3.classList.add('cursor-pointer', 'select-none', 'justify-between', 'gap-2');
                const titleContent = h3.innerHTML;
                const noteBtnLabel = currentLang === 'en' ? '+ Note' : '+ Notat';
                const noteBtnTitle = currentLang === 'en' ? 'Save calculation to Notes / Checklist' : 'Lagre utregning i Notater / Sjekkliste';
                h3.innerHTML = `
                    <span class="flex items-center min-w-0">${titleContent}</span>
                    <span class="flex items-center gap-1.5 shrink-0">
                        <button type="button" onclick="lagreKortTilNotat(this, event)" class="card-note-btn text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl bg-brand-500/15 hover:bg-brand-500 text-brand-600 dark:text-brand-400 hover:text-slate-950 border border-brand-500/30 transition-all shadow-sm flex items-center gap-1" title="${noteBtnTitle}">
                            <span>📝</span><span class="card-note-btn-text">${noteBtnLabel}</span>
                        </button>
                        <span class="collapse-chevron text-xs font-mono px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-brand-500" title="Klapp sammen / åpne kort">−</span>
                    </span>`;
                h3.addEventListener('click', (e) => {
                    if (['INPUT', 'SELECT', 'BUTTON'].includes(e.target.tagName) || e.target.closest('button')) return;
                    const card = h3.closest('.pers-input');
                    const chev = h3.querySelector('.collapse-chevron');
                    if (card) {
                        card.classList.toggle('card-collapsed');
                        if (chev) chev.innerText = card.classList.contains('card-collapsed') ? '+' : '−';
                    }
                });
            });
        }

        function hentKortSammendrag(card) {
            if (!card) return '';
            const h3Span = card.querySelector('h3 > span:first-child');
            const tittel = h3Span ? h3Span.innerText.trim() : 'Kalkulator';

            // Samle inn viktige input/select-verdier i kortet
            const inputs = [];
            card.querySelectorAll('input:not([type="hidden"]), select').forEach(el => {
                const parentBox = el.closest('div');
                if (parentBox && parentBox.style.display === 'none') return;
                const parentGrid = el.closest('.grid');
                if (parentGrid && parentGrid.style.display === 'none') return;

                let label = '';
                const prevLbl = el.previousElementSibling;
                if (prevLbl && prevLbl.tagName === 'LABEL') {
                    label = prevLbl.innerText.trim().replace(/:$/, '');
                }
                let val = '';
                if (el.tagName === 'SELECT') {
                    val = el.options[el.selectedIndex]?.text?.split(' (')[0]?.trim() || el.value;
                } else if (el.type === 'checkbox') {
                    val = el.checked ? 'Ja' : 'Nei';
                } else {
                    val = el.value;
                }
                if (val !== '') {
                    inputs.push(label ? `${label}: ${val}` : val);
                }
            });

            // Samle inn utregnede resultatverdier fra kortet
            const resultater = [];
            card.querySelectorAll('[id*="-res-"], [id^="res-"], #iso-res, #iso-res-minmax, #iso-res-mid').forEach(resEl => {
                const row = resEl.closest('div');
                if (row && row.style.display === 'none') return;
                const valTxt = resEl.innerText.trim();
                if (!valTxt) return;

                let lblTxt = '';
                if (row) {
                    const firstSpan = row.querySelector('span:first-child');
                    if (firstSpan && firstSpan !== resEl) {
                        lblTxt = firstSpan.innerText.trim().replace(/:$/, '');
                    }
                }
                resultater.push(lblTxt ? `${lblTxt}: ${valTxt}` : valTxt);
            });

            const inputDel = inputs.slice(0, 4).join(', ');
            const resDel = resultater.join(' | ');
            if (resDel && inputDel) return `${tittel} (${inputDel}) ➔ ${resDel}`;
            if (resDel) return `${tittel} ➔ ${resDel}`;
            if (inputDel) return `${tittel}: ${inputDel}`;
            return tittel;
        }

        function leggTilTekstINotatEllerSjekkliste(tekst) {
            if (!tekst) return;
            if (aktivNotatModus === 'text') {
                const txtArea = document.getElementById('notes-text-area');
                if (txtArea) {
                    const naa = new Date();
                    const tid = `[${String(naa.getHours()).padStart(2,'0')}:${String(naa.getMinutes()).padStart(2,'0')}] `;
                    txtArea.value = (txtArea.value ? txtArea.value.trimEnd() + '\n' : '') + tid + tekst;
                    oppdaterFritekstNotat(txtArea.value);
                }
                visToast(currentLang === 'en' ? 'Saved to Machine Log 📝' : 'Lagt til i Fritekst-logg 📝');
            } else {
                verkstedSjekkliste.unshift({
                    id: 'td_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                    text: tekst,
                    done: false
                });
                byggSjekklisteVisning();
                lagreNotatData();
                visToast(currentLang === 'en' ? 'Added to Checklist ☑️' : 'Lagt til i Sjekkliste ☑️');
            }
        }

        function lagreKortTilNotat(btnEl, event) {
            if (event) event.stopPropagation();
            const card = btnEl.closest('.pers-input');
            if (!card) return;
            const sammendrag = hentKortSammendrag(card);
            leggTilTekstINotatEllerSjekkliste(sammendrag);
        }

        // --- KLASSISK FANEVISNING ---
        function veksleKlassiskVisning() {
            const naa = localStorage.getItem('pref_classic_subtabs') === '1';
            const ny = !naa;
            localStorage.setItem('pref_classic_subtabs', ny ? '1' : '0');
            brukLayoutPreferanser();
            visToast(ny
                ? 'Viser alle CNC-, tabell- og strømfaner'
                : 'Tilbake til vanlig fanevisning');
        }

        function brukLayoutPreferanser() {
            const classicSub = localStorage.getItem('pref_classic_subtabs') === '1';

            document.body.classList.toggle('classic-subtabs', classicSub);

            document.querySelectorAll('.classic-toggle-label').forEach(lbl => {
                lbl.innerText = classicSub
                    ? (currentLang === 'en' ? '📑 Show tabs separately' : '📑 Vis faner separat')
                    : (currentLang === 'en' ? '📚 Show all CNC, table & power tabs' : '📚 Vis alle CNC-, tabell- og strømfaner');
            });
        }

        // --- HISTORIKK & TILBAKEKNAPP-NAVIGASJON (HISTORY API) ---
        let ignorerHistorikkPush = false;

        function hentNaavaerendeNavState() {
            const activeTab = localStorage.getItem('active_tab') || 'dashboard';
            const activeTools = localStorage.getItem('active_tools_tab') || 'data';
            const activeSalary = localStorage.getItem('active_salary_tab') || 'oversikt';
            const activeCnc = localStorage.getItem('active_cnc_tab') || 'milling';
            const activeEv = localStorage.getItem('active_ev_tab') || 'charging';
            const pwaOpen = !document.getElementById('pwa-modal')?.classList.contains('hidden');
            const widgetOpen = !document.getElementById('widget-modal')?.classList.contains('hidden');
            const confirmOpen = !document.getElementById('confirm-modal')?.classList.contains('hidden');
            return { tab: activeTab, toolsTab: activeTools, salaryTab: activeSalary, cncTab: activeCnc, evTab: activeEv, pwaOpen, widgetOpen, confirmOpen };
        }

        function byggHashFraState(st) {
            if (st.tab === 'salary') return `#salary/${st.salaryTab}`;
            if (st.tab === 'tools') return `#tools/${st.toolsTab}`;
            if (st.tab === 'cnc') return `#cnc/${st.cncTab}`;
            if (st.tab === 'ev') return `#ev/${st.evTab}`;
            return `#${st.tab}`;
        }

        function dyttHistorikkState(erstatte = false) {
            if (ignorerHistorikkPush) return;
            const nyState = hentNaavaerendeNavState();
            const nyHash = byggHashFraState(nyState);
            const gammelState = history.state;

            if (!erstatte && gammelState &&
                gammelState.tab === nyState.tab &&
                gammelState.toolsTab === nyState.toolsTab &&
                gammelState.salaryTab === nyState.salaryTab &&
                gammelState.cncTab === nyState.cncTab &&
                gammelState.evTab === nyState.evTab &&
                gammelState.pwaOpen === nyState.pwaOpen &&
                gammelState.widgetOpen === nyState.widgetOpen &&
                gammelState.confirmOpen === nyState.confirmOpen) {
                return;
            }

            try {
                if (erstatte) {
                    history.replaceState(nyState, '', nyHash);
                } else {
                    history.pushState(nyState, '', nyHash);
                }
            } catch (e) {}
        }

        window.addEventListener('popstate', (event) => {
            ignorerHistorikkPush = true;

            // Hvis en modal var åpen og brukeren trykker Tilbake, lukk modalen først
            const pwaEl = document.getElementById('pwa-modal');
            const widEl = document.getElementById('widget-modal');
            const confEl = document.getElementById('confirm-modal');

            const st = event.state;
            if (st) {
                if (!st.pwaOpen && pwaEl && !pwaEl.classList.contains('hidden')) lukkPwaModal(true);
                if (!st.widgetOpen && widEl && !widEl.classList.contains('hidden')) lukkWidgetModal(true);
                if (!st.confirmOpen && confEl && !confEl.classList.contains('hidden')) lukkConfirmModal(true);

                if (st.tab) switchTab(st.tab, false);
                if (st.toolsTab) switchToolsTab(st.toolsTab, false);
                if (st.salaryTab) switchSalaryTab(st.salaryTab, false);
                if (st.cncTab) switchCncTab(st.cncTab, false);
                if (st.evTab) switchEvTab(st.evTab, false);
            } else {
                // Fallback: les fra URL-hash dersom state er tom
                lesStateFraUrlHash();
            }

            ignorerHistorikkPush = false;
        });

        function lesStateFraUrlHash() {
            const hash = (window.location.hash || '').replace(/^#/, '');
            if (!hash) return false;
            const [mainTab, subTab] = hash.split('/');
            const gyldigeMain = ['dashboard', 'salary', 'cnc', 'tools', 'ev', 'amounts', 'datetime'];
            if (gyldigeMain.includes(mainTab)) {
                switchTab(mainTab, false);
                if (mainTab === 'salary' && ['oversikt', 'vakter', 'innstillinger'].includes(subTab)) {
                    switchSalaryTab(subTab, false);
                }
                if (mainTab === 'cnc' && ['milling', 'turning'].includes(subTab)) {
                    switchCncTab(subTab, false);
                }
                if (mainTab === 'tools' && ['data', 'threads', 'fits', 'weight', 'math', 'conv'].includes(subTab)) {
                    switchToolsTab(subTab, false);
                }
                if (mainTab === 'ev' && ['charging', 'power', 'tires'].includes(subTab)) {
                    switchEvTab(subTab, false);
                }
                return true;
            }
            return false;
        }

        // --- NAVIGATION LOGIC ---
        window.toggleMobileMoreMenu = function() {
            const menu = document.getElementById('mobile-more-menu');
            const button = document.getElementById('mnav-more');
            if (!menu || !button) return;
            const isOpen = menu.classList.toggle('hidden') === false;
            button.setAttribute('aria-expanded', String(isOpen));
        };

        window.hideMobileMoreMenu = function() {
            document.getElementById('mobile-more-menu')?.classList.add('hidden');
            document.getElementById('mnav-more')?.setAttribute('aria-expanded', 'false');
        };

        const initialiserteBeregninger = new Set();

        function initialiserBeregningerForFane(tabId) {
            if (initialiserteBeregninger.has(tabId)) return;

            if (tabId === 'cnc') {
                beregnSirkulaerMating();
                beregnGjengerInnvendig();
                beregnGjengerUtvendig();
                beregnFinnVc();
                beregnFinnRpm();
                beregnFinnMmMin();
                beregnGraderPrMin();
                window.oppdaterRctInndatamodus();
                window.beregnChipThinning();
                byttKonusModus();
                oppdaterMaterialeData();
            } else if (tabId === 'tools') {
                beregnBoredybde();
                beregnKjolevaeske();
                beregnOverflate('fn');
                oppdaterGjengeTabell();
                beregnGjengeToleranse();
                beregnIso();
                beregnIso2768();
                beregnKilespor();
                beregnBoltMoment();
                byttVektForm();
                beregnPcd();
                beregnTrekant();
                beregnFraTommer();
                beregnTrykkVekt();
                konverterHardhet('hrc');
            } else if (tabId === 'ev') {
                beregnLadetid();
                beregnBesparelse();
                beregnVinter();
                beregnApparat();
                beregnStromTariff();
                beregnDekkDimensjon();
            } else {
                return;
            }

            initialiserteBeregninger.add(tabId);
        }

        function switchTab(tabId, pushHist = true) {
            window.hideMobileMoreMenu();
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            const target = document.getElementById(tabId);
            if(target) target.classList.add('active');
            if (target) {
                initialiserBeregningerForFane(tabId);
                document.dispatchEvent(new CustomEvent('verksted:tab-open', { detail: { tabId } }));
            }

            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('bg-white', 'dark:bg-slate-800', 'border-slate-200', 'dark:border-slate-700', 'text-slate-900', 'dark:text-white', 'shadow-sm');
                btn.classList.add('text-slate-500', 'dark:text-slate-400', 'border-transparent');
                let icon = btn.querySelector('svg') || btn.querySelector('i');
                if (icon) {
                    icon.classList.remove('text-brand-500', 'text-blue-500', 'text-emerald-500', 'text-teal-500', 'text-violet-500', 'text-sky-500');
                    icon.classList.add('text-slate-400');
                }
            });
            
            const activeBtn = document.getElementById('nav-' + tabId);
            if(activeBtn) {
                activeBtn.classList.remove('text-slate-500', 'dark:text-slate-400', 'border-transparent');
                activeBtn.classList.add('bg-white', 'dark:bg-slate-800', 'border-slate-200', 'dark:border-slate-700', 'text-slate-900', 'dark:text-white', 'shadow-sm');
                let icon = activeBtn.querySelector('svg') || activeBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('text-slate-400');
                    if(tabId === 'dashboard' || tabId === 'salary') icon.classList.add('text-brand-500');
                    if(tabId === 'cnc') icon.classList.add('text-blue-500');
                    if(tabId === 'tools') icon.classList.add('text-emerald-500');
                    if(tabId === 'ev') icon.classList.add('text-teal-500');
                    if(tabId === 'amounts') icon.classList.add('text-violet-500');
                    if(tabId === 'datetime') icon.classList.add('text-sky-500');
                }
            }

            document.querySelectorAll('.mnav-btn').forEach(btn => {
                btn.classList.remove('text-brand-500', 'text-blue-500', 'text-emerald-500', 'text-teal-500', 'text-violet-500', 'text-sky-500', 'font-bold');
                btn.classList.add('text-slate-400', 'dark:text-slate-500', 'font-medium');
            });
            const activeMnav = document.getElementById('mnav-' + tabId);
            const moreMnav = document.getElementById('mnav-more');
            if (activeMnav) {
                activeMnav.classList.remove('text-slate-400', 'dark:text-slate-500', 'font-medium');
                activeMnav.classList.add('font-bold');
                if(tabId === 'dashboard' || tabId === 'salary') activeMnav.classList.add('text-brand-500');
                if(tabId === 'cnc') activeMnav.classList.add('text-blue-500');
                if(tabId === 'tools') activeMnav.classList.add('text-emerald-500');
                if(tabId === 'ev') activeMnav.classList.add('text-teal-500');
                if(tabId === 'amounts') activeMnav.classList.add('text-violet-500');
                if(tabId === 'datetime') activeMnav.classList.add('text-sky-500');
            } else if (moreMnav && ['ev', 'amounts', 'datetime'].includes(tabId)) {
                moreMnav.classList.remove('text-slate-400', 'dark:text-slate-500', 'font-medium');
                moreMnav.classList.add('font-bold');
                if(tabId === 'ev') moreMnav.classList.add('text-teal-500');
                if(tabId === 'amounts') moreMnav.classList.add('text-violet-500');
                if(tabId === 'datetime') moreMnav.classList.add('text-sky-500');
            }
            localStorage.setItem('active_tab', tabId);
            if (pushHist) dyttHistorikkState();
        }

        function switchToolsTab(tabId, pushHist = true) {
            document.querySelectorAll('.tools-tab-content').forEach(t => t.classList.remove('active'));
            const target = document.getElementById('ttab-' + tabId);
            if(target) target.classList.add('active');

            document.querySelectorAll('.tools-tab-btn').forEach(btn => {
                btn.classList.remove('bg-emerald-500', 'text-white', 'shadow-md', 'shadow-emerald-500/20');
                btn.classList.add('text-slate-500', 'dark:text-slate-400');
            });
            const activeBtn = document.getElementById('btn-t-' + tabId);
            if(activeBtn) {
                activeBtn.classList.remove('text-slate-500', 'dark:text-slate-400');
                activeBtn.classList.add('bg-emerald-500', 'text-white', 'shadow-md', 'shadow-emerald-500/20');
            }
            localStorage.setItem('active_tools_tab', tabId);
            if (pushHist) dyttHistorikkState();
        }

        function switchCncTab(tabId, pushHist = true) {
            const target = document.getElementById('ctab-' + tabId);
            if (!target) return;

            document.querySelectorAll('.cnc-tab-content').forEach(t => t.classList.remove('active'));
            target.classList.add('active');

            document.querySelectorAll('.cnc-tab-btn').forEach(btn => {
                btn.classList.remove('bg-blue-500', 'text-white', 'shadow-md', 'shadow-blue-500/20');
                btn.classList.add('text-slate-500', 'dark:text-slate-400');
            });
            const activeBtn = document.getElementById('btn-cnc-' + tabId);
            if(activeBtn) {
                activeBtn.classList.remove('text-slate-500', 'dark:text-slate-400');
                activeBtn.classList.add('bg-blue-500', 'text-white', 'shadow-md', 'shadow-blue-500/20');
            }
            localStorage.setItem('active_cnc_tab', tabId);
            if (pushHist) dyttHistorikkState();
        }

        function switchEvTab(tabId, pushHist = true) {
            document.querySelectorAll('.ev-tab-content').forEach(t => t.classList.remove('active'));
            const target = document.getElementById('etab-' + tabId);
            if(target) target.classList.add('active');

            document.querySelectorAll('.ev-tab-btn').forEach(btn => {
                btn.classList.remove('bg-teal-500', 'text-white', 'shadow-md', 'shadow-teal-500/20');
                btn.classList.add('text-slate-500', 'dark:text-slate-400');
            });
            const activeBtn = document.getElementById('btn-ev-' + tabId);
            if(activeBtn) {
                activeBtn.classList.remove('text-slate-500', 'dark:text-slate-400');
                activeBtn.classList.add('bg-teal-500', 'text-white', 'shadow-md', 'shadow-teal-500/20');
            }
            localStorage.setItem('active_ev_tab', tabId);
            if (pushHist) dyttHistorikkState();
        }

        function switchSalaryTab(tabId, pushHist = true) {
            document.querySelectorAll('.salary-tab-content').forEach(t => t.classList.remove('active'));
            const target = document.getElementById('stab-' + tabId);
            if(target) target.classList.add('active');

            document.querySelectorAll('.salary-tab-btn').forEach(btn => {
                btn.classList.remove('bg-brand-500', 'text-white', 'shadow-md', 'shadow-brand-500/20');
                btn.classList.add('text-slate-500', 'dark:text-slate-400');
            });
            const activeBtn = document.getElementById('btn-sal-' + tabId);
            if(activeBtn) {
                activeBtn.classList.remove('text-slate-500', 'dark:text-slate-400');
                activeBtn.classList.add('bg-brand-500', 'text-white', 'shadow-md', 'shadow-brand-500/20');
            }
            localStorage.setItem('active_salary_tab', tabId);
            if (pushHist) dyttHistorikkState();
        }

        // --- SALARY LOGIC ---
        let registrerteVakter = [];
        const ukedager = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];
        const maanedsNavn = ["Januar", "Februar", "Mars", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Desember"];
        window.sisteBrutto = 0;

        function byggAarsOgMaanedsLister() {
            const aarSelect = document.getElementById('year');
            if(aarSelect && aarSelect.children.length === 0) {
                const naaar = new Date().getFullYear();
                for (let y = naaar - 2; y <= naaar + 5; y++) {
                    const opt = document.createElement('option');
                    opt.value = y; opt.text = y;
                    if (y === naaar) opt.selected = true;
                    aarSelect.appendChild(opt);
                }
            }
            const mndSelect = document.getElementById('month');
            if(mndSelect && mndSelect.children.length === 0) {
                const naamnd = new Date().getMonth();
                maanedsNavn.forEach((navn, idx) => {
                    const opt = document.createElement('option');
                    opt.value = idx; opt.text = navn;
                    if (idx === naamnd) opt.selected = true;
                    mndSelect.appendChild(opt);
                });
            }
        }

        function countWeekdays(year, month) {
            let count = 0;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let d = 1; d <= daysInMonth; d++) {
                const dayOfWeek = new Date(year, month, d).getDay();
                if (dayOfWeek >= 1 && dayOfWeek <= 5) count++;
            }
            return count;
        }

        function oppdaterAarOgMaaned() {
            const yearSelect = document.getElementById('year');
            const monthSelect = document.getElementById('month');
            if (!yearSelect || !monthSelect || !yearSelect.value || monthSelect.value === "") return;

            const year = parseInt(yearSelect.value);
            const month = parseInt(monthSelect.value);
            const realDays = countWeekdays(year, month);
            const overstyrt = parseFloat(document.getElementById('overstyr-dager')?.value);
            const bruktDager = (!isNaN(overstyrt) && overstyrt > 0) ? overstyrt : realDays;

            document.getElementById('tekst-arbeidsdager').innerText = `Antall arbeidsdager i måneden: ${realDays} dager`;
            document.getElementById('tekst-gjeldende-dager').innerText = (!isNaN(overstyrt) && overstyrt > 0)
                ? `Gjeldende dager: ${bruktDager} (overstyrt)`
                : `Gjeldende dager: ${realDays} (man-fre)`;

            if (!document.getElementById('vakt-dato').value) {
                let m = month + 1;
                document.getElementById('vakt-dato').value = `${year}-${m < 10 ? '0'+m : m}-01`;
            }
            oppdaterVaktTabell();
            beregnAlt();
            lagreAltState();
        }

        function sjekkDatoUkedag() {
            const datoValgt = document.getElementById('vakt-dato').value;
            if (!datoValgt) return;
            const d = new Date(datoValgt);
            const dag = d.getDay();
            const tilleggType = document.getElementById('tillegg-type');
            if (dag === 0 || dag === 6) {
                if (!tilleggType.value.startsWith('helg')) tilleggType.value = 'helg50';
            } else {
                if (!tilleggType.value.startsWith('hverdag')) tilleggType.value = 'hverdag50';
            }
        }

        function settHurtigVakt(t, m, type, timebank) {
            document.getElementById('vakt-timer').value = t;
            document.getElementById('vakt-minutter').value = m;
            document.getElementById('tillegg-type').value = type;
            document.getElementById('vakt-timebank').checked = !!timebank;
            if (!document.getElementById('vakt-dato').value) {
                const year = document.getElementById('year').value;
                let month = parseInt(document.getElementById('month').value) + 1;
                document.getElementById('vakt-dato').value = `${year}-${month < 10 ? '0'+month : month}-01`;
            }
            sjekkDatoUkedag();
            switchSalaryTab('vakter');
        }

        function byttSkattType() {
            const typeEl = document.getElementById('skatt-type');
            if (!typeEl) return;
            const type = typeEl.value;
            const tabBoks = document.getElementById('skattetabell-boks');
            const otBoks = document.getElementById('overtid-skatt-boks');
            const pctBoks = document.getElementById('skatteprosent-boks');

            if (type === 'prosent') {
                if (tabBoks) tabBoks.style.display = 'none';
                if (otBoks) otBoks.style.display = 'none';
                if (pctBoks) pctBoks.style.display = 'block';
            } else if (type === 'tabell_alt') {
                if (tabBoks) tabBoks.style.display = 'block';
                if (otBoks) otBoks.style.display = 'none';
                if (pctBoks) pctBoks.style.display = 'none';
            } else {
                if (tabBoks) tabBoks.style.display = 'block';
                if (otBoks) otBoks.style.display = 'block';
                if (pctBoks) pctBoks.style.display = 'none';
            }
        }

        function oppdaterEkstraSkattLabel() {
            const typeEl = document.getElementById('ekstra-skatt-type');
            const verdiEl = document.getElementById('ekstra-skatt-verdi');
            const hjelpEl = document.getElementById('ekstra-skatt-hjelp');
            if (!typeEl || !verdiEl || !hjelpEl) return;

            const erProsent = typeEl.value === 'prosent';
            verdiEl.step = erProsent ? '0.5' : '1';
            verdiEl.setAttribute('aria-label', erProsent ? 'Ekstra skattetrekk i prosent av brutto' : 'Ekstra skattetrekk i kroner per måned');
            verdiEl.placeholder = erProsent ? 'f.eks. 2' : 'f.eks. 1000';
            hjelpEl.textContent = erProsent
                ? 'Trekkes i tillegg som prosent av månedens brutto lønn.'
                : 'Trekkes i tillegg som et fast kronebeløp hver måned.';
        }

        function regnUtProsentFraKroner() {
            const betaltKr = parseFloat(document.getElementById('fagforening-kroner-input').value) || 0;
            const brutto = window.sisteBrutto || 0;
            if (betaltKr > 0 && brutto > 0) {
                const pctVal = (betaltKr / brutto) * 100;
                document.getElementById('fagforening-prosent').value = pctVal.toFixed(2);
                beregnAlt(); lagreAltState();
            }
        }

        function leggTilVakt(event) {
            event.preventDefault();
            const datoValgt = document.getElementById('vakt-dato').value;
            if (!datoValgt) { visToast("Velg en dato", "error"); return; }
            const d = new Date(datoValgt);
            const vaktAar = d.getFullYear();
            const vaktMnd = d.getMonth();

            document.getElementById('year').value = vaktAar;
            document.getElementById('month').value = vaktMnd;

            const timer = parseInt(document.getElementById('vakt-timer').value) || 0;
            const minutter = parseInt(document.getElementById('vakt-minutter').value) || 0;
            if (timer === 0 && minutter === 0) { visToast("Oppgi timer", "error"); return; }

            const type = document.getElementById('tillegg-type').value;
            const typeTekst = document.getElementById('tillegg-type').options[document.getElementById('tillegg-type').selectedIndex].text;
            const desimalTimer = timer + (minutter / 60);
            const erTimebank = document.getElementById('vakt-timebank').checked;
            const formatertDato = `${ukedager[d.getDay()]} ${d.getDate()}.${d.getMonth()+1}`;

            registrerteVakter.push({
                id: Math.random().toString(36).substring(2),
                date: datoValgt,
                dateLabel: formatertDato,
                kind: type,
                kindLabel: typeTekst.split(' (')[0],
                hours: timer,
                minutes: minutter,
                desimalTimer,
                year: vaktAar,
                month: vaktMnd,
                isTimebank: erTimebank
            });

            document.getElementById('vakt-timer').value = 0; document.getElementById('vakt-minutter').value = 0; document.getElementById('vakt-timebank').checked = false;
            sorterOgOppdaterVakter();
            visToast(`Vakt lagt til!`);
        }

        function slettVakt(id) {
            registrerteVakter = registrerteVakter.filter(v => v.id !== id);
            sorterOgOppdaterVakter();
        }

        function sorterOgOppdaterVakter() {
            registrerteVakter.sort((a, b) => new Date(a.date) - new Date(b.date));
            oppdaterVaktTabell(); beregnAlt(); lagreAltState();
        }

        function hentAktiveVakter() {
            const year = parseInt(document.getElementById('year').value);
            const month = parseInt(document.getElementById('month').value);
            return registrerteVakter.filter(v => v.year === year && v.month === month);
        }

        function oppdaterVaktTabell() {
            const container = document.getElementById('vakt-tabell-container');
            const aktive = hentAktiveVakter();
            const mndSelect = document.getElementById('month');
            if(!mndSelect) return;
            const monthName = maanedsNavn[parseInt(mndSelect.value)];
            
            document.getElementById('tittel-vaktliste').innerHTML = `<i data-lucide="list" class="w-6 h-6 mr-2 text-brand-500 inline-block align-text-bottom"></i> Vakter i ${monthName.toLowerCase()}`;
            if (typeof lucide !== 'undefined') lucide.createIcons();

            if (aktive.length === 0) {
                container.innerHTML = `<p class="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center text-sm font-medium text-slate-500 dark:text-slate-400">Ingen vakter registrert i denne måneden.</p>`;
                return;
            }

            const timelonn = parseFloat(document.getElementById('timelonn').value) || 324;
            let html = '<ul class="space-y-3">';
            aktive.forEach(v => {
                const erUttak = v.kind === 'uttak_tb';
                const faktor = erUttak ? 0 : (v.isTimebank ? (v.kind.includes('50') ? 0.5 : 1.0) : (v.kind.includes('50') ? 1.5 : 2.0));
                const brutto = v.desimalTimer * (timelonn * faktor);
                const tbBadge = erUttak
                    ? `<span class="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded font-bold ml-2">🏖️ Uttak (-${v.desimalTimer.toFixed(1)}t)</span>`
                    : (v.isTimebank ? `<span class="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded font-bold ml-2">🏦 Timebank (+${v.desimalTimer.toFixed(1)}t)</span>` : '');

                html += `<li class="flex items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl">
                    <div class="flex-1 min-w-0">
                        <p class="font-bold text-sm text-slate-900 dark:text-white m-0 truncate">${v.dateLabel}${tbBadge}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 m-0 truncate mt-1">${v.kindLabel} · ${v.hours}t ${v.minutes}m</p>
                    </div>
                    <p class="font-mono font-bold text-base ${erUttak ? 'text-rose-500' : 'text-brand-600'} m-0 whitespace-nowrap">${erUttak ? '−' + v.desimalTimer.toFixed(1) + ' t' : brutto.toFixed(2).replace('.', ',') + ' kr'}</p>
                    <button type="button" class="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 shrink-0" onclick="slettVakt('${v.id}')">✕</button>
                </li>`;
            });
            html += '</ul>';
            container.innerHTML = html;
        }

        function kopierVaktliste() {
            const aktive = hentAktiveVakter();
            if (aktive.length === 0) { visToast("Ingen vakter", "error"); return; }
            let txt = "Vaktliste:\n";
            aktive.forEach(v => { txt += `- ${v.dateLabel}: ${v.kindLabel} (${v.hours}t ${v.minutes}m)\n`; });
            kopierTekst(txt, "Vaktliste");
        }

        function eksporterVakttilExcel() {
            const aktive = hentAktiveVakter();
            if (aktive.length === 0) return;
            const timelonn = parseFloat(document.getElementById('timelonn').value) || 324;
            let csvContent = "data:text/csv;charset=utf-8,Dato;Type;Timer;Minutter;Timebank;Brutto\n";
            aktive.forEach(v => {
                const faktor = v.isTimebank ? (v.kind.includes('50') ? 0.5 : 1.0) : (v.kind.includes('50') ? 1.5 : 2.0);
                const brutto = v.desimalTimer * (timelonn * faktor);
                csvContent += `${v.date};${v.kindLabel};${v.hours};${v.minutes};${v.isTimebank ? 'Ja' : 'Nei'};${brutto.toFixed(2).replace('.', ',')}\n`;
            });
            const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent));
            link.setAttribute("download", `Vaktliste.csv`);
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        }

        function beregnUniversellTabellskatt(bruttoMnd, tabellNummerStr) {
            if (bruttoMnd <= 0) return 0;
            const grunnlagMnd = Math.floor(bruttoMnd / 100) * 100;
            const aarsLonn = grunnlagMnd * 12;
            let tabellNr = parseInt(tabellNummerStr) || 7101;

            let aarligTabellFradrag = 0;
            if (tabellNr >= 8000 && tabellNr < 9000) aarligTabellFradrag = (tabellNr - 8000) * 1000;
            else if (tabellNr >= 9000 && tabellNr < 9999) aarligTabellFradrag = -((tabellNr - 9000) * 1000);
            else if (tabellNr >= 7100 && tabellNr < 7200) aarligTabellFradrag = (tabellNr - 7100) * 4000;
            else if (tabellNr >= 7200 && tabellNr < 7300) aarligTabellFradrag = -((tabellNr - 7200) * 4000);

            let trygdeavgift = aarsLonn > 99650 ? Math.min(aarsLonn * 0.076, (aarsLonn - 99650) * 0.25) : 0;
            const minsteFradrag = Math.min(aarsLonn * 0.46, 92000);
            const personFradrag = 108550;
            const alminneligInntekt = Math.max(0, aarsLonn - minsteFradrag - personFradrag - aarligTabellFradrag);
            const fellesskatt = alminneligInntekt * 0.22;

            let trinnskatt = 0;
            if (aarsLonn > 217400)  trinnskatt += (Math.min(aarsLonn, 306050) - 217400) * 0.017;
            if (aarsLonn > 306050)  trinnskatt += (Math.min(aarsLonn, 697150) - 306050) * 0.040;
            if (aarsLonn > 697150)  trinnskatt += (Math.min(aarsLonn, 942400) - 697150) * 0.137;
            if (aarsLonn > 942400)  trinnskatt += (Math.min(aarsLonn, 1410750) - 942400) * 0.167;
            if (aarsLonn > 1410750) trinnskatt += (aarsLonn - 1410750) * 0.177;

            const aarsSkatt = trygdeavgift + fellesskatt + trinnskatt;
            return Math.max(0, Math.round(aarsSkatt / 10.5));
        }

        function beregnAlt() {
            const yearSelect = document.getElementById('year');
            const monthSelect = document.getElementById('month');
            if (!yearSelect || !monthSelect || !yearSelect.value) return;

            const year = parseInt(yearSelect.value);
            const month = parseInt(monthSelect.value);
            const realDays = countWeekdays(year, month);
            const overstyrt = parseFloat(document.getElementById('overstyr-dager')?.value);
            let dager = (!isNaN(overstyrt) && overstyrt > 0) ? overstyrt : realDays;

            const harFastlonn = document.getElementById('inkluder-fastlonn').checked;
            const harFormann = document.getElementById('inkluder-formann')?.checked || false;
            const timelonn = parseFloat(document.getElementById('timelonn').value) || 324;
            const timerPrDag = parseFloat(document.getElementById('timer-dag').value) || 7.5;
            const feriedager = parseInt(document.getElementById('feriedager').value) || 0;

            const fastlBrunto = harFastlonn ? (dager * timerPrDag * timelonn) : 0;
            const ferieTrekk = harFastlonn ? (feriedager * timerPrDag * timelonn) : 0;
            const ordinareTimer = harFastlonn ? Math.max(0, (dager - feriedager) * timerPrDag) : 0;

            const formannSatsPrTime = timelonn * 0.20;
            const formannBrutto = (harFastlonn && harFormann) ? (ordinareTimer * formannSatsPrTime) : 0;

            const radFastlonn = document.getElementById('rad-fastlonn');
            if (harFastlonn) {
                document.getElementById('vis-fastlonn').innerText = fastlBrunto.toFixed(2).replace('.', ',') + " kr";
                document.getElementById('vis-fastlonn-sub').innerText = `${dager} d × ${timerPrDag} t × ${timelonn} kr`;
                radFastlonn.style.display = 'flex';
            } else radFastlonn.style.display = 'none';

            const radFormann = document.getElementById('rad-formann');
            if (radFormann) {
                if (harFastlonn && harFormann) {
                    document.getElementById('vis-formann').innerText = "+ " + formannBrutto.toFixed(2).replace('.', ',') + " kr";
                    document.getElementById('vis-formann-sub').innerText = `${ordinareTimer.toFixed(1).replace('.', ',')} t × ${formannSatsPrTime.toFixed(2).replace('.', ',')} kr/t (20% av ${timelonn} kr)`;
                    radFormann.style.display = 'flex';
                } else {
                    radFormann.style.display = 'none';
                }
            }

            const radFerie = document.getElementById('rad-ferietrekk');
            if (harFastlonn && feriedager > 0) {
                document.getElementById('vis-ferietrekk').innerText = "− " + ferieTrekk.toFixed(2).replace('.', ',') + " kr";
                radFerie.style.display = 'flex';
            } else radFerie.style.display = 'none';

            let hverdag50 = 0, hverdag100 = 0, helg50 = 0, helg100 = 0, sumVaktBrutto = 0, sumVaktTimer = 0, sumTimebankTimer = 0;
            const aktive = hentAktiveVakter();
            aktive.forEach(v => {
                if (v.kind === 'uttak_tb') {
                    sumTimebankTimer -= v.desimalTimer;
                    return;
                }
                // Overtid beregnes kun av grunntimelønn (ikke formannstillegg)
                const faktor = v.isTimebank ? (v.kind.includes('50') ? 0.5 : 1.0) : (v.kind.includes('50') ? 1.5 : 2.0);
                const b = v.desimalTimer * (timelonn * faktor);
                sumVaktBrutto += b;
                if (v.isTimebank) sumTimebankTimer += v.desimalTimer;
                else sumVaktTimer += v.desimalTimer;

                if (v.kind === 'hverdag50') hverdag50 += b;
                if (v.kind === 'hverdag100') hverdag100 += b;
                if (v.kind === 'helg50') helg50 += b;
                if (v.kind === 'helg100') helg100 += b;
            });

            document.getElementById('vis-hverdag50').innerText = hverdag50.toFixed(2).replace('.', ',') + " kr";
            document.getElementById('vis-hverdag100').innerText = hverdag100.toFixed(2).replace('.', ',') + " kr";
            document.getElementById('vis-helg50').innerText = helg50.toFixed(2).replace('.', ',') + " kr";
            document.getElementById('vis-helg100').innerText = helg100.toFixed(2).replace('.', ',') + " kr";

            const totalTimer = ordinareTimer + sumVaktTimer + Math.max(0, sumTimebankTimer);
            const fortegnTb = sumTimebankTimer >= 0 ? "+ " : "− ";

            document.getElementById('vis-totaltimer').innerText = totalTimer.toFixed(1).replace('.', ',') + " t";
            document.getElementById('vis-ordinartimer').innerText = ordinareTimer.toFixed(1).replace('.', ',') + " t";
            document.getElementById('vis-vakttimer').innerText = sumVaktTimer.toFixed(1).replace('.', ',') + " t";
            document.getElementById('vis-timebank-vakttimer').innerText = sumTimebankTimer.toFixed(1).replace('.', ',') + " t";
            document.getElementById('vis-timebank-saldo').innerText = fortegnTb + Math.abs(sumTimebankTimer).toFixed(1).replace('.', ',') + " t";

            const fastBruttoEtterFerie = Math.max(0, fastlBrunto - ferieTrekk) + formannBrutto;
            const totalBrutto = fastBruttoEtterFerie + sumVaktBrutto;
            window.sisteBrutto = totalBrutto;
            document.getElementById('vis-brutto').innerText = totalBrutto.toFixed(2).replace('.', ',') + " kr";

            const unionPct = parseFloat(document.getElementById('fagforening-prosent').value) || 1.5;
            const unionBetaltKr = parseFloat(document.getElementById('fagforening-kroner-input')?.value) || 0;
            const unionKr = unionBetaltKr > 0 ? unionBetaltKr : Math.max(0, totalBrutto * (unionPct / 100));
            window.sisteFagforeningMnd = unionKr;
            document.getElementById('vis-fagforening-mnd').innerText = "− " + unionKr.toFixed(2).replace('.', ',') + " kr";

            const skattType = document.getElementById('skatt-type').value;
            const tabellValg = document.getElementById('skatte-tabellnummer').value || "7101";
            const overtidSkattPct = parseFloat(document.getElementById('skatt-overtid')?.value) || 35;
            const pctTax = parseFloat(document.getElementById('skatt').value) || 30;
            const halvtSkattetrekk = document.getElementById('halvt-skattetrekk')?.checked || false;
            const ekstraSkattType = document.getElementById('ekstra-skatt-type')?.value || 'belop';
            const ekstraSkattVerdi = Math.max(0, parseFloat(document.getElementById('ekstra-skatt-verdi')?.value) || 0);

            let skattKr = 0;
            if (skattType === 'tabell') {
                const fastSkattegrunnlag = Math.max(0, fastBruttoEtterFerie - Math.min(unionKr, 667));
                const skattFast = beregnUniversellTabellskatt(fastSkattegrunnlag, tabellValg);
                const skattOvertid = sumVaktBrutto * (overtidSkattPct / 100);
                skattKr = Math.round((halvtSkattetrekk ? skattFast / 2 : skattFast) + skattOvertid);
                document.getElementById('skatt-tittel').innerText = `Skatt (Tabell${halvtSkattetrekk ? ' 50%' : ''} + ${overtidSkattPct}% OT)`;
            } else if (skattType === 'tabell_alt') {
                const samletSkattegrunnlag = Math.max(0, totalBrutto - Math.min(unionKr, 667));
                const samletTabelltrekk = beregnUniversellTabellskatt(samletSkattegrunnlag, tabellValg);
                const fastSkattegrunnlag = Math.max(0, fastBruttoEtterFerie - Math.min(unionKr, 667));
                const fastTabelltrekk = beregnUniversellTabellskatt(fastSkattegrunnlag, tabellValg);
                skattKr = halvtSkattetrekk
                    ? Math.round(Math.max(0, samletTabelltrekk - fastTabelltrekk / 2))
                    : samletTabelltrekk;
                document.getElementById('skatt-tittel').innerText = `Tabelltrekk på alt${halvtSkattetrekk ? ' (halvt på fastlønn)' : ''}`;
            } else {
                const samletSkattegrunnlag = Math.max(0, totalBrutto - Math.min(unionKr, 667));
                const fastSkattegrunnlag = Math.max(0, fastBruttoEtterFerie - Math.min(unionKr, 667));
                const skatteprosentGrunnlag = halvtSkattetrekk
                    ? Math.max(0, samletSkattegrunnlag - fastSkattegrunnlag / 2)
                    : samletSkattegrunnlag;
                skattKr = Math.round(skatteprosentGrunnlag * (pctTax / 100));
                document.getElementById('skatt-tittel').innerText = `Prosenttrekk (${pctTax}%)${halvtSkattetrekk ? ' (halvt på fastlønn)' : ''}`;
            }

            const ekstraSkattKr = ekstraSkattType === 'prosent'
                ? Math.round(totalBrutto * ekstraSkattVerdi / 100)
                : Math.round(ekstraSkattVerdi);
            const totaltSkattetrekk = skattKr + ekstraSkattKr;
            const ekstraSkattRad = document.getElementById('rad-ekstra-skattetrekk');
            if (ekstraSkattRad) {
                ekstraSkattRad.style.display = ekstraSkattKr > 0 ? 'flex' : 'none';
                document.getElementById('vis-ekstra-skattetrekk').innerText = "− " + ekstraSkattKr.toFixed(2).replace('.', ',') + " kr";
            }
            if (ekstraSkattKr > 0) {
                document.getElementById('skatt-tittel').innerText = 'Totalt skattetrekk';
            }
            document.getElementById('vis-skattetrekk').innerText = "− " + totaltSkattetrekk.toFixed(2).replace('.', ',') + " kr";
            const netto = totalBrutto - unionKr - totaltSkattetrekk;
            document.getElementById('vis-netto').innerText = netto.toFixed(2).replace('.', ',') + " kr";
            document.getElementById('vis-netto-hoved').innerText = netto.toFixed(2).replace('.', ',') + " kr";

            const vaktNetto = Math.max(0, sumVaktBrutto - (sumVaktBrutto * (unionPct / 100)) - (sumVaktBrutto * (overtidSkattPct / 100)));
            document.getElementById('vis-sumvakt-brutto').innerText = sumVaktBrutto.toFixed(2).replace('.', ',') + " kr";
            document.getElementById('vis-sumvakt-netto').innerText = vaktNetto.toFixed(2).replace('.', ',') + " kr";

            document.getElementById('vis-periode-tittel').innerText = `${maanedsNavn[month]} ${year}`;
            const overtidAndel = totalBrutto > 0 ? (sumVaktBrutto / totalBrutto) * 100 : 0;
            document.getElementById('vis-tillegg-prosent').innerText = `Tillegg utgjør ${overtidAndel.toFixed(1)}% av brutto`;

            const feriepengerMnd = Math.max(0, totalBrutto * 0.12);
            document.getElementById('vis-feriepenger').innerText = feriepengerMnd.toFixed(2).replace('.', ',') + " kr";

            const fastTimelonnInklFormann = harFormann ? (timelonn * 1.20) : timelonn;
            const fastAarBrutto = harFastlonn ? ((5 * timerPrDag) * fastTimelonnInklFormann * 47 * (dager / realDays)) : 0;
            const totalAarMedFeriepenger = (fastAarBrutto + ((sumVaktBrutto / (dager/5)) * 47)) * 1.12;
            document.getElementById('vis-aarslonn-fast').innerText = (fastAarBrutto * 1.12).toFixed(2).replace('.', ',') + " kr";
            document.getElementById('vis-aarslonn-total').innerText = totalAarMedFeriepenger.toFixed(2).replace('.', ',') + " kr";
            document.getElementById('vis-aarslonn-aar').innerText = (totalAarMedFeriepenger * (unionPct / 100)).toFixed(2).replace('.', ',') + " kr";

            // KPI Dashboard
            const kpiNetto = document.getElementById('dash-kpi-netto');
            const kpiPeriode = document.getElementById('dash-kpi-periode');
            const kpiTb = document.getElementById('dash-kpi-timebank');
            const kpiVakter = document.getElementById('dash-kpi-vakter');
            const kpiOtBrutto = document.getElementById('dash-kpi-ot-brutto');
            const kpiOtHours = document.getElementById('dash-kpi-ot-hours');

            if (kpiNetto) kpiNetto.innerText = netto.toFixed(2).replace('.', ',') + " kr";
            if (kpiPeriode) kpiPeriode.innerText = sumVaktBrutto > 0 ? `Overtid ut: + ${Math.round(vaktNetto).toLocaleString('no-NO')} kr` : `Ingen overtid ennå`;
            if (kpiTb) kpiTb.innerText = fortegnTb + Math.abs(sumTimebankTimer).toFixed(1).replace('.', ',') + " t";
            if (kpiVakter) kpiVakter.innerText = `${aktive.length} vakt${aktive.length === 1 ? '' : 'er'} denne mnd`;
            if (kpiOtBrutto) kpiOtBrutto.innerText = "+ " + Math.round(sumVaktBrutto).toLocaleString('no-NO') + " kr";
            if (kpiOtHours) kpiOtHours.innerText = `${sumVaktTimer.toFixed(1).replace('.', ',')} t utbetalt (Netto: +${Math.round(vaktNetto)} kr)`;

            oppdaterUkeOgArbeidsdagerKpi();
        }

        const standardWidgetListe = [
            { id: 'netto', title: 'Netto utbetalt', desc: 'Ferdig nettolønn inkl. overtid etter skatt', enabled: true },
            { id: 'timebank', title: 'Timebank saldo', desc: 'Timer til gode og antall vakter denne mnd', enabled: true },
            { id: 'week', title: 'Ukenummer & Arbeidsdager', desc: 'ISO-ukenummer og gjenværende arbeidsdager', enabled: true },
            { id: 'cnc', title: 'Siste CNC-utregning', desc: 'Siste beregnede RPM / mating med hurtiglenke', enabled: true },
            { id: 'thread', title: 'Aktiv Gjenge & Kjernebor', desc: 'Valgt gjenge med skjære- og formtappbor', enabled: true },
            { id: 'isofit', title: 'ISO-Pasning & Midtmål', desc: 'Valgt pasningsklasse (Hull/Aksling) med CNC siktemål', enabled: true },
            { id: 'power', title: 'Strømsats & Elbil', desc: 'Strømpris og beregnet ladetid/rekkevidde', enabled: true },
            { id: 'note', title: 'Sjekkliste & Maskinnotat', desc: 'Viser neste gjøremål eller fritekst-logg og åpner sidepanelet', enabled: true },
            { id: 'overtime', title: 'Overtid denne måneden', desc: 'Brutto/netto overtidsbeløp og timer', enabled: false },
            { id: 'coolant', title: 'Kjølevæske (Brix)', desc: 'Faktisk konsentrasjon og liter etterfylling', enabled: false }
        ];

        const liveKalkulatorResultater = new Map();
        const liveKalkulatorMaal = new Map();
        const liveWidgetKontrollSelector = 'input:not([type="hidden"]):not([type="file"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="image"]), select, textarea';

        window.oppdaterLiveKalkulatorResultat = function(id, hovedresultat, sammendrag, detaljer = '') {
            const resultat = { hovedresultat, sammendrag, detaljer };
            liveKalkulatorResultater.set(id, resultat);
            const widget = document.getElementById('widget-' + id);
            if (widget) visLiveKalkulatorResultat(widget, resultat);
        };

        function visLiveKalkulatorResultat(widget, resultat) {
            const hoved = widget.querySelector('[data-live-main]');
            const under = widget.querySelector('[data-live-sub]');
            const detaljer = widget.querySelector('[data-live-extra]');
            if (hoved) hoved.textContent = resultat.hovedresultat || 'Ingen beregning ennå';
            if (under) under.textContent = resultat.sammendrag || 'Resultatet oppdateres når du beregner';
            if (detaljer) {
                detaljer.textContent = resultat.detaljer || '';
                detaljer.classList.toggle('hidden', !resultat.detaljer);
            }
        }

        function oppdaterLiveKontrollSynlighet(widget, target) {
            const controls = target?.controlRoot
                ? [...target.controlRoot.querySelectorAll(liveWidgetKontrollSelector)]
                : [...(target?.card?.querySelectorAll(liveWidgetKontrollSelector) || [])];
            const fields = [...widget.querySelectorAll('[data-live-control-index]')];
            fields.forEach((field, index) => {
                const source = controls[index];
                field.classList.toggle('hidden', !source || Boolean(source.closest('.hidden')) ||
                    Boolean(source.closest('[style*="display: none"]')));
            });
        }

        function visLiveWidgetUtvidetResultat(widget, target) {
            const result = target.resultId
                ? liveKalkulatorResultater.get(target.resultId)
                : null;
            const resultLines = target.card ? hentLiveWidgetResultat(target.card) : [];
            const main = result?.hovedresultat || resultLines[0];
            const summary = result?.sammendrag || resultLines.slice(1, 3).join(' · ');
            const output = widget.querySelector('[data-live-expanded-result]');
            if (!output) return;
            output.classList.toggle('hidden', !main && !summary);
            output.querySelector('[data-live-expanded-main]').textContent = main || '';
            output.querySelector('[data-live-expanded-sub]').textContent = summary || '';
        }

        function hentLiveFeltEtikett(source, root) {
            const associatedLabel = source.labels?.[0];
            if (associatedLabel) return associatedLabel.textContent.trim();

            if (source.id && root) {
                const matchingLabel = [...root.querySelectorAll('label[for]')]
                    .find(label => label.htmlFor === source.id);
                if (matchingLabel) return matchingLabel.textContent.trim();
            }

            let element = source;
            while (element && element !== root) {
                const previousLabel = element.previousElementSibling?.matches('label')
                    ? element.previousElementSibling
                    : null;
                if (previousLabel) return previousLabel.textContent.trim();

                const directLabel = [...(element.parentElement?.children || [])]
                    .find(child => child.matches('label'));
                if (directLabel) return directLabel.textContent.trim();
                element = element.parentElement;
            }
            return '';
        }

        function byggLiveWidgetKontroller(widget, target) {
            const panel = widget.querySelector('[data-live-controls]');
            if (!panel || panel.dataset.ready === '1') return;
            const controls = target?.controlRoot
                ? [...target.controlRoot.querySelectorAll(liveWidgetKontrollSelector)]
                : [...(target?.card?.querySelectorAll(liveWidgetKontrollSelector) || [])];
            if (!controls.length) {
                const item = brukerWidgets.find(entry => entry.id === widget.dataset.widgetId);
                const message = document.createElement('p');
                message.className = 'text-xs leading-relaxed text-slate-600 dark:text-slate-300';
                message.textContent = target && (target.controlRoot || target.card)
                    ? (currentLang === 'en' ? 'This calculator has no editable fields.' : 'Denne kalkulatoren har ingen redigerbare felt.')
                    : (currentLang === 'en'
                        ? `${item?.desc || 'This overview card'} does not have calculator fields. Add a calculator card in Customize overview to calculate here.`
                        : `${item?.desc || 'Dette oversiktskortet'} har ikke egne beregningsfelt. Legg til et kalkulatorkort via Tilpass oversikt for å regne her.`);
                panel.append(message);
                const openButton = document.createElement('button');
                openButton.type = 'button';
                openButton.className = 'mt-3 w-full rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800';
                openButton.textContent = currentLang === 'en' ? 'Open related page' : 'Åpne tilhørende side';
                openButton.addEventListener('click', event => {
                    event.stopPropagation();
                    widget.click();
                });
                panel.append(openButton);
                panel.dataset.ready = '1';
                return;
            }

            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-2';
            controls.forEach((source, index) => {
                const field = document.createElement('label');
                field.dataset.liveControlIndex = String(index);
                field.className = 'block text-[11px] font-semibold text-slate-600 dark:text-slate-300';
                const labelText = hentLiveFeltEtikett(source, target.controlRoot || target.card) ||
                    source.getAttribute('aria-label') ||
                    source.getAttribute('placeholder') ||
                    `Verdi ${index + 1}`;
                const caption = document.createElement('span');
                caption.className = 'block mb-1';
                caption.textContent = labelText.replace(/\s+/g, ' ');

                const input = source.cloneNode(true);
                input.removeAttribute('id');
                input.removeAttribute('name');
                [...input.attributes].forEach(attribute => {
                    if (attribute.name.startsWith('on')) input.removeAttribute(attribute.name);
                });
                input.classList.add(input.type === 'checkbox' ? 'shrink-0' : 'w-full');
                if (input.type === 'checkbox') input.checked = source.checked;
                else input.value = source.value;
                if (input.type === 'checkbox') {
                    field.className = 'flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300';
                    caption.className = '';
                    field.append(input, caption);
                } else {
                    field.append(caption, input);
                }

                input.addEventListener('click', event => event.stopPropagation());
                const updateSource = event => {
                    if (source.type === 'checkbox') source.checked = input.checked;
                    else source.value = input.value;
                    source.dispatchEvent(new Event(event.type, { bubbles: true }));
                    oppdaterLiveKontrollSynlighet(widget, target);
                    visLiveWidgetUtvidetResultat(widget, target);
                };
                input.addEventListener('input', updateSource);
                input.addEventListener('change', updateSource);
                const syncFromSource = () => {
                    if (input.type === 'checkbox') input.checked = source.checked;
                    else input.value = source.value;
                    oppdaterLiveKontrollSynlighet(widget, target);
                    visLiveWidgetUtvidetResultat(widget, target);
                };
                source.addEventListener('input', syncFromSource);
                source.addEventListener('change', syncFromSource);
                grid.append(field);
            });
            panel.append(grid);
            const calculateButton = document.createElement('button');
            calculateButton.type = 'button';
            calculateButton.className = 'mt-3 w-full rounded-xl bg-violet-500 px-3 py-2.5 text-xs font-extrabold text-white hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500';
            calculateButton.textContent = currentLang === 'en' ? 'Calculate' : 'Beregn';
            calculateButton.addEventListener('click', event => {
                event.stopPropagation();
                target.modeButton?.click();
                controls.forEach(source => {
                    if (source.closest('.hidden')) return;
                    source.dispatchEvent(new Event('input', { bubbles: true }));
                    source.dispatchEvent(new Event('change', { bubbles: true }));
                });
                visLiveWidgetUtvidetResultat(widget, target);
            });
            panel.append(calculateButton);
            const result = document.createElement('div');
            result.dataset.liveExpandedResult = '';
            result.className = 'hidden mt-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/70 p-3';
            result.innerHTML = '<p data-live-expanded-main class="text-sm font-extrabold text-slate-900 dark:text-white"></p><p data-live-expanded-sub class="text-xs text-slate-600 dark:text-slate-300 mt-1"></p>';
            panel.append(result);
            panel.dataset.ready = '1';
            oppdaterLiveKontrollSynlighet(widget, target);
            visLiveWidgetUtvidetResultat(widget, target);
        }

        function sikreWidgetStorrelseKnapp(widget) {
            const id = widget.dataset.widgetId;
            const header = widget.firstElementChild;
            if (!id || !header) return;

            let button = widget.querySelector('[data-live-size-toggle]');
            let panel = widget.querySelector('[data-live-controls]');
            if (!button) {
                const icon = header.lastElementChild;
                const controls = document.createElement('span');
                controls.className = 'inline-flex items-center gap-2 shrink-0';
                if (icon?.tagName === 'I') {
                    icon.replaceWith(controls);
                    controls.append(icon);
                } else {
                    header.append(controls);
                }
                button = document.createElement('button');
                button.type = 'button';
                button.dataset.liveSizeToggle = '';
                button.className = 'inline-flex items-center justify-center gap-1.5 min-h-8 px-2.5 rounded-lg bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 focus:outline-none focus:ring-2 focus:ring-violet-500 text-[10px] font-bold whitespace-nowrap';
                controls.append(button);
            }
            if (!panel) {
                panel = document.createElement('div');
                panel.dataset.liveControls = '';
                panel.className = 'hidden border-t border-slate-200 dark:border-slate-700 mt-3 pt-3';
                panel.addEventListener('click', event => event.stopPropagation());
                widget.append(panel);
            }

            button.removeAttribute('onclick');
            if (button.dataset.sizeHandler !== '1') {
                button.addEventListener('click', event => veksleLiveWidgetStorrelse(id, event));
                button.dataset.sizeHandler = '1';
            }
        }

        function brukLiveWidgetStorrelse(id, widget, target, stor) {
            const varStor = widget.classList.contains('widget-large');
            widget.classList.toggle('widget-large', stor);
            sikreWidgetStorrelseKnapp(widget);
            const panel = widget.querySelector('[data-live-controls]');
            const button = widget.querySelector('[data-live-size-toggle]');
            if (panel) panel.classList.toggle('hidden', !stor);
            if (button) {
                button.setAttribute('aria-expanded', String(stor));
                const label = stor
                    ? (currentLang === 'en' ? 'Smaller' : 'Mindre')
                    : (currentLang === 'en' ? 'Enlarge' : 'Større');
                button.setAttribute('aria-label', label);
                button.title = button.getAttribute('aria-label');
                button.textContent = label;
            }
            if (stor) {
                if (!varStor) target?.modeButton?.click();
                byggLiveWidgetKontroller(widget, target);
            }
            const item = brukerWidgets.find(entry => entry.id === id);
            if (item && (item.size === 'large') !== stor) {
                item.size = stor ? 'large' : 'normal';
                lagreWidgetKonfig();
            }
        }

        function veksleLiveWidgetStorrelse(id, event) {
            event?.stopPropagation();
            const target = liveKalkulatorMaal.get(id);
            const widget = document.getElementById('widget-' + id);
            if (!widget) return;
            brukLiveWidgetStorrelse(id, widget, target, !widget.classList.contains('widget-large'));
        }

        function finnLiveWidgetMaalForKort(card) {
            const widgetId = card?.dataset.liveWidgetId;
            return widgetId ? liveKalkulatorMaal.get(widgetId) : null;
        }

        function kobleOversiktskortTilKalkulator(widgetId, card, modeButton = null, controlRoot = null, resultId = null) {
            const target = modeButton
                ? { pageId: modeButton.closest('section.tab-content')?.id, modeButton, controlRoot, card: modeButton.closest('section.tab-content'), resultId }
                : finnLiveWidgetMaalForKort(card);
            kobleOversiktskortTilMaal(widgetId, target);
        }

        function kobleOversiktskortTilMaal(widgetId, target) {
            const widget = document.getElementById(`widget-${widgetId}`);
            if (!target || !widget) return;
            liveKalkulatorMaal.set(widgetId, target);
            widget.removeAttribute('onclick');
            if (widget.dataset.navigationHandler !== '1') {
                widget.addEventListener('click', () => {
                    const currentTarget = liveKalkulatorMaal.get(widgetId);
                    if (currentTarget) navigerTilLiveKalkulator(currentTarget);
                });
                widget.dataset.navigationHandler = '1';
            }
        }

        function hentLiveWidgetResultat(card) {
            const resultater = [];
            card.querySelectorAll('[id*="-res-"], [id^="res-"], #iso-res, #iso-res-minmax, #iso-res-mid').forEach(element => {
                if (!element.innerText.trim() || element.closest('.hidden')) return;
                const rad = element.closest('.flex');
                const etikett = rad?.querySelector('span:first-child');
                const verdi = element.innerText.trim();
                const tekst = etikett && etikett !== element
                    ? `${etikett.innerText.trim().replace(/:$/, '')}: ${verdi}`
                    : verdi;
                if (!resultater.includes(tekst)) resultater.push(tekst);
            });
            return resultater;
        }

        function oppdaterLiveWidgetFraKort(id, card) {
            const widget = document.getElementById('widget-' + id);
            if (!widget) return;
            const resultater = hentLiveWidgetResultat(card);
            visLiveKalkulatorResultat(widget, resultater.length
                ? {
                    hovedresultat: resultater[0],
                    sammendrag: resultater.slice(1, 3).join(' · ') || 'Siste beregning',
                    detaljer: resultater.slice(3, 7).join(' · ')
                }
                : { hovedresultat: 'Ingen beregning ennå', sammendrag: 'Åpne kalkulatoren for å beregne' });
        }

        function navigerTilLiveKalkulator(target) {
            if (!target?.pageId || !document.getElementById(target.pageId)) return;
            switchTab(target.pageId);
            if (target.modeButton) {
                target.modeButton.click();
            } else if (target.subtab) {
                if (target.subtab.classList.contains('cnc-tab-content')) switchCncTab(target.subtab.id.replace('ctab-', ''));
                if (target.subtab.classList.contains('tools-tab-content')) switchToolsTab(target.subtab.id.replace('ttab-', ''));
                if (target.subtab.classList.contains('ev-tab-content')) switchEvTab(target.subtab.id.replace('etab-', ''));
                if (target.subtab.classList.contains('salary-tab-content')) switchSalaryTab(target.subtab.id.replace('stab-', ''));
            }
            requestAnimationFrame(() => (target.card || target.subtab)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        }

        function lagLiveWidget(definisjon, target) {
            if (standardWidgetListe.some(widget => widget.id === definisjon.id)) return;
            const widgetDefinisjon = { ...definisjon, enabled: false };
            standardWidgetListe.push(widgetDefinisjon);
            target.resultId = definisjon.id;
            liveKalkulatorMaal.set(definisjon.id, target);

            const widget = document.createElement('div');
            widget.id = 'widget-' + definisjon.id;
            widget.dataset.widgetId = definisjon.id;
            widget.className = 'dash-widget bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-violet-500 transition-all group';
            widget.innerHTML = `
                <div class="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                    <span></span>
                    <span class="flex items-center gap-2">
                        <i data-lucide="calculator" class="w-4 h-4 text-violet-500 group-hover:scale-110 transition-transform"></i>
                        <button type="button" data-live-size-toggle aria-expanded="false" aria-label="Større" title="Større" onclick="veksleLiveWidgetStorrelse('${definisjon.id}', event)" class="inline-flex items-center justify-center gap-1.5 min-h-8 px-2.5 rounded-lg bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 focus:outline-none focus:ring-2 focus:ring-violet-500 text-[10px] font-bold whitespace-nowrap">Større</button>
                    </span>
                </div>
                <p data-live-main class="text-xl sm:text-2xl font-mono font-extrabold text-violet-700 dark:text-violet-300 truncate">Ingen beregning ennå</p>
                <p data-live-sub class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">Resultatet oppdateres når du beregner</p>
                <p data-live-extra class="hidden text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 mt-2"></p>
                <div data-live-controls class="hidden border-t border-slate-200 dark:border-slate-700 mt-3 pt-3" onclick="event.stopPropagation()"></div>`;
            widget.querySelector('span').textContent = definisjon.title;
            widget.addEventListener('click', () => navigerTilLiveKalkulator(target));
            document.getElementById('dash-widgets-grid')?.appendChild(widget);

            const lagretResultat = liveKalkulatorResultater.get(definisjon.id);
            if (lagretResultat) {
                visLiveKalkulatorResultat(widget, lagretResultat);
            } else if (target.card) {
                oppdaterLiveWidgetFraKort(definisjon.id, target.card);
            }
            const lagretWidget = brukerWidgets.find(item => item.id === definisjon.id);
            if (lagretWidget?.size === 'large') {
                brukLiveWidgetStorrelse(definisjon.id, widget, target, true);
            }
        }

        function registrerKalkulatorLivekort() {
            document.querySelectorAll('.pers-input').forEach((card, index) => {
                if (card.closest('#dashboard')) return;
                const heading = card.querySelector('h3');
                const headingClone = heading?.cloneNode(true);
                headingClone?.querySelectorAll('button, i, .collapse-chevron').forEach(element => element.remove());
                const title = headingClone?.textContent.trim().replace(/\s+/g, ' ') || `Kalkulator ${index + 1}`;
                const page = card.closest('section.tab-content');
                if (!page) return;
                if (!card.id) card.id = `calculation-card-${index + 1}`;
                const subtab = card.closest('.cnc-tab-content, .tools-tab-content, .ev-tab-content, .salary-tab-content');
                const id = `calc-${card.id}`;
                const descriptor = { id, title, desc: `Siste resultat fra ${page.querySelector('h2')?.textContent.trim() || 'kalkulatoren'}` };
                card.dataset.liveWidgetId = id;
                lagLiveWidget(descriptor, { pageId: page.id, subtab, card });
                const eksisterendeSoketreff = verktoySokIndeks.some(item =>
                    (item.card && item.card === card.id) ||
                    normaliserSoketekst(item.title) === normaliserSoketekst(title)
                );
                if (!eksisterendeSoketreff) {
                    const subtabId = subtab?.id.replace(/^(ctab|ttab|etab|stab)-/, '');
                    verktoySokIndeks.push({
                        title,
                        titleEn: title,
                        keys: `${title} ${page.querySelector('h2')?.textContent || ''}`,
                        tab: page.id,
                        sub: subtabId,
                        card: card.id || undefined
                    });
                }
                const update = () => oppdaterLiveWidgetFraKort(id, card);
                new MutationObserver(update).observe(card, { childList: true, characterData: true, subtree: true });
                card.addEventListener('input', update);
                card.addEventListener('change', update);
            });

            document.querySelectorAll('[data-amount-mode]').forEach(button => {
                const mode = button.dataset.amountMode;
                lagLiveWidget(
                    { id: `amount-${mode}`, title: button.textContent.trim(), desc: 'Siste beregning fra Mengder' },
                    {
                        pageId: 'amounts',
                        modeButton: button,
                        card: document.getElementById('amounts'),
                        controlRoot: document.querySelector(`[data-amount-fields="${mode}"]`)
                    }
                );
            });
            document.querySelectorAll('[data-datetime-mode]').forEach(button => {
                const mode = button.dataset.datetimeMode;
                lagLiveWidget(
                    { id: `datetime-${mode}`, title: button.textContent.trim(), desc: 'Siste beregning fra Dato & tid' },
                    {
                        pageId: 'datetime',
                        modeButton: button,
                        card: document.getElementById('datetime'),
                        controlRoot: document.querySelector(`[data-datetime-fields="${mode}"]`)
                    }
                );
            });
            kobleOversiktskortTilMaal('netto', {
                pageId: 'salary',
                subtab: document.getElementById('stab-oversikt')
            });
            kobleOversiktskortTilMaal('timebank', {
                pageId: 'salary',
                subtab: document.getElementById('stab-vakter')
            });
            kobleOversiktskortTilKalkulator(
                'cnc',
                document.getElementById('card-tools-material-data')
            );
            kobleOversiktskortTilMaal('overtime', {
                pageId: 'salary',
                subtab: document.getElementById('stab-vakter')
            });
            kobleOversiktskortTilKalkulator(
                'thread',
                document.querySelector('#ttab-threads .pers-input')
            );
            kobleOversiktskortTilKalkulator(
                'isofit',
                document.getElementById('card-tools-iso286')
            );
            kobleOversiktskortTilKalkulator(
                'power',
                document.getElementById('card-ev-charge')
            );
            const coolantCard = [...document.querySelectorAll('#ttab-data .pers-input')]
                .find(card => card.querySelector('h3')?.textContent.includes('Kjølevæske'));
            kobleOversiktskortTilKalkulator('coolant', coolantCard);
            const weekModeButton = document.querySelector('[data-datetime-mode="week"]');
            kobleOversiktskortTilKalkulator(
                'week',
                null,
                weekModeButton,
                document.querySelector('[data-datetime-fields="week"]'),
                'datetime-week'
            );
            if (window.lucide?.createIcons) window.lucide.createIcons();
        }

        let brukerWidgets = [];

        function hentWidgetKonfig() {
            try {
                const lagret = localStorage.getItem('verksted_widgets_v1');
                if (lagret) {
                    const parsed = JSON.parse(lagret);
                    const eksisterendeIds = new Set(parsed.map(w => w.id));
                    standardWidgetListe.forEach(std => {
                        if (!eksisterendeIds.has(std.id)) parsed.push({ ...std });
                    });
                    parsed.forEach(widget => {
                        if (widget.size !== 'large') widget.size = 'normal';
                    });
                    brukerWidgets = parsed;
                    return;
                }
            } catch (e) {}
            brukerWidgets = JSON.parse(JSON.stringify(standardWidgetListe));
        }

        function lagreWidgetKonfig() {
            try {
                localStorage.setItem('verksted_widgets_v1', JSON.stringify(brukerWidgets));
            } catch (e) {}
        }

        function brukWidgetOppsett() {
            const grid = document.getElementById('dash-widgets-grid');
            if (!grid) return;
            brukerWidgets.forEach(w => {
                const el = document.getElementById('widget-' + w.id);
                if (el) {
                    el.style.display = w.enabled ? '' : 'none';
                    const target = liveKalkulatorMaal.get(w.id);
                    sikreWidgetStorrelseKnapp(el);
                    if (target) {
                        brukLiveWidgetStorrelse(w.id, el, target, w.size === 'large');
                    } else {
                        brukLiveWidgetStorrelse(w.id, el, target, w.size === 'large');
                    }
                    grid.appendChild(el);
                }
            });
        }

        function apneWidgetModal() {
            byggWidgetModalListe();
            const modal = document.getElementById('widget-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                dyttHistorikkState();
            }
        }

        function lukkWidgetModal(fraPopstate = false) {
            const modal = document.getElementById('widget-modal');
            if (modal && !modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                if (!fraPopstate) dyttHistorikkState();
            }
        }

        function byggWidgetModalListe() {
            const container = document.getElementById('widget-config-list');
            if (!container) return;
            let html = '';
            brukerWidgets.forEach((w, idx) => {
                html += `
                <div class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl border ${w.enabled ? 'bg-slate-50 dark:bg-slate-800/80 border-brand-500/40' : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'} transition-all">
                    <label class="flex items-center gap-3 flex-1 cursor-pointer min-w-[70%]">
                        <input type="checkbox" ${w.enabled ? 'checked' : ''} onchange="veksleWidget('${w.id}', this.checked)" class="custom-checkbox text-brand-500 border-slate-400 dark:border-slate-500 shrink-0">
                        <div class="min-w-0">
                            <p class="text-sm font-bold text-slate-900 dark:text-white truncate">${w.title}</p>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">${w.desc}</p>
                        </div>
                    </label>
                    <div class="flex items-center gap-1 shrink-0">
                        <button type="button" onclick="flyttWidget(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} class="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-xs font-bold hover:border-brand-500 disabled:opacity-30">↑</button>
                        <button type="button" onclick="flyttWidget(${idx}, 1)" ${idx === brukerWidgets.length - 1 ? 'disabled' : ''} class="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-xs font-bold hover:border-brand-500 disabled:opacity-30">↓</button>
                    </div>
                </div>`;
            });
            container.innerHTML = html;
        }

        function veksleWidget(id, aktiv) {
            const item = brukerWidgets.find(w => w.id === id);
            if (item) {
                item.enabled = aktiv;
                lagreWidgetKonfig();
                brukWidgetOppsett();
                byggWidgetModalListe();
            }
        }

        function flyttWidget(index, retning) {
            const nyIndex = index + retning;
            if (nyIndex < 0 || nyIndex >= brukerWidgets.length) return;
            const temp = brukerWidgets[index];
            brukerWidgets[index] = brukerWidgets[nyIndex];
            brukerWidgets[nyIndex] = temp;
            lagreWidgetKonfig();
            brukWidgetOppsett();
            byggWidgetModalListe();
        }

        function tilbakestillWidgets() {
            brukerWidgets = JSON.parse(JSON.stringify(standardWidgetListe));
            localStorage.setItem('pref_classic_subtabs', '0');
            lagreWidgetKonfig();
            brukWidgetOppsett();
            brukLayoutPreferanser();
            byggWidgetModalListe();
            visToast("Oversikt tilbakestilt!");
        }

        function hentIsoUkenummer(dato) {
            const d = new Date(Date.UTC(dato.getFullYear(), dato.getMonth(), dato.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        }

        function oppdaterUkeOgArbeidsdagerKpi() {
            const naa = new Date();
            const uke = hentIsoUkenummer(naa);
            const aar = naa.getFullYear();
            const mnd = naa.getMonth();
            const idagDato = naa.getDate();
            const dagerIMnd = new Date(aar, mnd + 1, 0).getDate();

            let dagerIgjen = 0;
            for (let dag = idagDato; dag <= dagerIMnd; dag++) {
                if (new Date(aar, mnd, dag).getDay() >= 1 && new Date(aar, mnd, dag).getDay() <= 5) dagerIgjen++;
            }

            const weekEl = document.getElementById('dash-kpi-week');
            const workdaysEl = document.getElementById('dash-kpi-workdays');
            if (weekEl) weekEl.innerText = `Uke ${uke}`;
            if (workdaysEl) workdaysEl.innerText = `${dagerIgjen} arb.dager igjen i ${maanedsNavn[mnd].toLowerCase()}`;
        }

        window.sisteCncMaal = { tab: 'tools', subTab: 'data' };
        function oppdaterSisteCncKpi(hovedVerdi, underTekst, tab = 'cnc', subTab = null, cardId = null) {
            const valEl = document.getElementById('dash-kpi-cnc-val');
            const subEl = document.getElementById('dash-kpi-cnc-sub');
            if (valEl) valEl.innerText = hovedVerdi;
            if (subEl) subEl.innerText = underTekst;
            window.sisteCncMaal = { tab, subTab, cardId };
            const card = cardId ? document.getElementById(cardId) : null;
            const target = finnLiveWidgetMaalForKort(card);
            if (target) liveKalkulatorMaal.set('cnc', target);
            localStorage.setItem('siste_cnc_val', hovedVerdi);
            localStorage.setItem('siste_cnc_sub', underTekst);
        }

        function apneSisteCnc() {
            const maal = window.sisteCncMaal || { tab: 'cnc', subTab: null };
            const target = maal.cardId
                ? finnLiveWidgetMaalForKort(document.getElementById(maal.cardId))
                : liveKalkulatorMaal.get('cnc');
            if (target) {
                navigerTilLiveKalkulator(target);
                return;
            }
            switchTab(maal.tab);
            if (maal.tab === 'tools' && maal.subTab) switchToolsTab(maal.subTab);
            if (maal.tab === 'cnc' && maal.subTab) switchCncTab(maal.subTab);
        }

        // --- LOCALSTORAGE & AUTO-SAVE (LAGRER ABSOLUTT ALT) ---
        let altStateLagringTimer = null;

        function lagreInnstillinger() {
            planleggLagringAltState();
        }

        function planleggLagringAltState() {
            clearTimeout(altStateLagringTimer);
            altStateLagringTimer = setTimeout(lagreAltState, 300);
        }

        function lagreHvisEndret(nokkel, verdi) {
            if (localStorage.getItem(nokkel) !== verdi) {
                localStorage.setItem(nokkel, verdi);
            }
        }

        function lagreAltState() {
            clearTimeout(altStateLagringTimer);
            altStateLagringTimer = null;
            try {
                lagreHvisEndret('lonn_year', document.getElementById('year')?.value || '');
                lagreHvisEndret('lonn_month', document.getElementById('month')?.value || '');
                lagreHvisEndret('lonn_inkl_fastlonn', document.getElementById('inkluder-fastlonn')?.checked ? '1' : '0');
                lagreHvisEndret('lonn_inkl_formann', document.getElementById('inkluder-formann')?.checked ? '1' : '0');
                lagreHvisEndret('lonn_timelonn', document.getElementById('timelonn')?.value || '');
                lagreHvisEndret('lonn_timer', document.getElementById('timer-dag')?.value || '');
                lagreHvisEndret('lonn_ferier', document.getElementById('feriedager')?.value || '');
                lagreHvisEndret('lonn_skatt_type', document.getElementById('skatt-type')?.value || '');
                lagreHvisEndret('lonn_tabell', document.getElementById('skatte-tabellnummer')?.value || '');
                lagreHvisEndret('lonn_skatt_overtid', document.getElementById('skatt-overtid')?.value || '');
                lagreHvisEndret('lonn_skatt_pct', document.getElementById('skatt')?.value || '');
                lagreHvisEndret('lonn_union_pct', document.getElementById('fagforening-prosent')?.value || '');
                lagreHvisEndret('lonn_vakter_tabs_v26', JSON.stringify(registrerteVakter));

                const stateObj = {};
                document.querySelectorAll('input, select, textarea').forEach(el => {
                    if (el.id && !['year', 'month', 'vakt-dato', 'vakt-timer', 'vakt-minutter'].includes(el.id)) {
                        stateObj[el.id] = el.type === 'checkbox' ? el.checked : el.value;
                    }
                });
                lagreHvisEndret('verksted_all_inputs', JSON.stringify(stateObj));
            } catch (e) {}
        }

        function lastInnAltState(openDashboard = false) {
            try {
                byggAarsOgMaanedsLister();
                if (localStorage.getItem('lonn_year')) document.getElementById('year').value = localStorage.getItem('lonn_year');
                if (localStorage.getItem('lonn_month')) document.getElementById('month').value = localStorage.getItem('lonn_month');
                if (localStorage.getItem('lonn_inkl_fastlonn') !== null) document.getElementById('inkluder-fastlonn').checked = localStorage.getItem('lonn_inkl_fastlonn') === '1';
                if (localStorage.getItem('lonn_inkl_formann') !== null && document.getElementById('inkluder-formann')) {
                    document.getElementById('inkluder-formann').checked = localStorage.getItem('lonn_inkl_formann') === '1';
                }
                if (localStorage.getItem('lonn_vakter_tabs_v26')) {
                    registrerteVakter = JSON.parse(localStorage.getItem('lonn_vakter_tabs_v26')) || [];
                }

                const savedInputs = localStorage.getItem('verksted_all_inputs');
                if (savedInputs) {
                    const parsed = JSON.parse(savedInputs);
                    if (String(parsed.timelonn) === '316.5') parsed.timelonn = '324';
                    Object.keys(parsed).forEach(id => {
                        const el = document.getElementById(id);
                        if (el && id !== 'ttol-pitch') {
                            if (el.type === 'checkbox') el.checked = parsed[id];
                            else el.value = parsed[id];
                        }
                    });
                    // Bygg stigningsmeny for valgt M-størrelse først, og sett deretter lagret stigning
                    oppdaterToleranseStigninger();
                    if (parsed['ttol-pitch'] && document.getElementById('ttol-pitch')) {
                        document.getElementById('ttol-pitch').value = parsed['ttol-pitch'];
                    }
                } else {
                    oppdaterToleranseStigninger();
                }

                if (localStorage.getItem('siste_cnc_val')) {
                    const valEl = document.getElementById('dash-kpi-cnc-val');
                    const subEl = document.getElementById('dash-kpi-cnc-sub');
                    if (valEl) valEl.innerText = localStorage.getItem('siste_cnc_val');
                    if (subEl) subEl.innerText = localStorage.getItem('siste_cnc_sub');
                }

                if (openDashboard) {
                    switchTab('dashboard', false);
                } else if (!lesStateFraUrlHash()) {
                    const activeTab = localStorage.getItem('active_tab');
                    if (activeTab) switchTab(activeTab, false);
                    const activeTools = localStorage.getItem('active_tools_tab');
                    if (activeTools) switchToolsTab(activeTools, false);
                    const activeCnc = localStorage.getItem('active_cnc_tab');
                    if (activeCnc) switchCncTab(activeCnc, false);
                    const activeEv = localStorage.getItem('active_ev_tab');
                    if (activeEv) switchEvTab(activeEv, false);
                    const activeSalary = localStorage.getItem('active_salary_tab');
                    if (activeSalary) switchSalaryTab(activeSalary, false);
                }
                dyttHistorikkState(true);

            } catch (e) {}

            brukLayoutPreferanser();
            initSammenleggbareKort();
            byttSkattType();
            oppdaterEkstraSkattLabel();
            oppdaterAarOgMaaned();
            oppdaterVaktTabell();
            beregnAlt();
        }

        document.addEventListener('input', planleggLagringAltState);
        document.addEventListener('change', lagreAltState);
        window.addEventListener('pagehide', () => {
            if (altStateLagringTimer !== null) lagreAltState();
            if (notatLagringTimer !== null) lagreNotatData();
        });

        function eksporterBackupJson() {
            const data = {};
            Object.keys(localStorage).forEach(k => { data[k] = localStorage.getItem(k); });
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url;
            a.download = `verkstedsportal-backup-${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
            visToast("Backup lastet ned!");
        }

        function importerBackupJson(event) {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    Object.keys(data).forEach(k => { localStorage.setItem(k, data[k]); });
                    lastInnAltState();
                    visToast("Backup gjenopprettet!");
                } catch (err) {
                    visToast("Ugyldig fil", "error");
                }
            };
            reader.readAsText(file);
        }

        function nullstillAlt() {
            const modal = document.getElementById('confirm-modal');
            const yesBtn = document.getElementById('confirm-modal-yes');
            if (!modal || !yesBtn) return;
            modal.classList.remove('hidden'); modal.classList.add('flex');
            dyttHistorikkState();
            yesBtn.onclick = function() {
                Object.keys(localStorage).forEach(k => { if (k.startsWith('lonn_') || k === 'verksted_all_inputs') localStorage.removeItem(k); });
                registrerteVakter = [];
                byggAarsOgMaanedsLister();
                oppdaterAarOgMaaned(); oppdaterVaktTabell(); beregnAlt();
                lukkConfirmModal();
                visToast("Nullstilt");
            };
        }
        function lukkConfirmModal(fraPopstate = false) {
            const modal = document.getElementById('confirm-modal');
            if (modal && !modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                if (!fraPopstate) dyttHistorikkState();
            }
        }

        // --- CNC LOGIC ---
        function beregnSirkulaerMating() {
            const mode = document.getElementById('gf-mode')?.value || 'internal';
            const vc = parseFloat(document.getElementById('gf-vc').value) || 0;
            const fz = parseFloat(document.getElementById('gf-fz').value) || 0;
            const z = parseFloat(document.getElementById('gf-z').value) || 0;
            const dFres = parseFloat(document.getElementById('gf-dfres').value) || 1;
            const dHull = parseFloat(document.getElementById('gf-dhull').value) || 1;
            const rpm = (vc * 1000) / (Math.PI * dFres);
            const vfLin = rpm * z * fz;

            document.getElementById('gf-res-rpm').innerText = Math.round(rpm) + " RPM";
            if (mode === 'internal') {
                const vfSirk = dFres >= dHull ? 0 : ((dHull - dFres) / dHull) * vfLin;
                document.getElementById('gf-res-mating').innerText = Math.round(vfSirk) + " mm/min";
                oppdaterSisteCncKpi(`${Math.round(rpm)} RPM | F${Math.round(vfSirk)}`, `Sirkulær innv: Ø${dFres} i Ø${dHull}`, 'cnc', 'milling', 'card-cnc-sirk');
            } else {
                const vfSirk = ((dHull + dFres) / dHull) * vfLin;
                document.getElementById('gf-res-mating').innerText = Math.round(vfSirk) + " mm/min";
                oppdaterSisteCncKpi(`${Math.round(rpm)} RPM | F${Math.round(vfSirk)}`, `Sirkulær utv: Ø${dFres} på Ø${dHull}`, 'cnc', 'milling', 'card-cnc-sirk');
            }
        }
        function beregnGjengerInnvendig() {
            const st = parseFloat(document.getElementById('gjin-storedia').value) || 0;
            const pi = parseFloat(document.getElementById('gjin-stigning').value) || 0;
            const ju = parseFloat(document.getElementById('gjin-justering').value) || 0;
            const res = ((pi * ju) + st).toFixed(3);
            document.getElementById('gjin-res-lilledia').innerText = res + " mm";
            oppdaterSisteCncKpi(`Gibbs Ø${res}`, `Innv. gjenge M${st}×${pi}`, 'cnc', 'turning', 'card-cnc-gibbs');
        }
        function beregnGjengerUtvendig() {
            const st = parseFloat(document.getElementById('gjut-storedia').value) || 0;
            const pi = parseFloat(document.getElementById('gjut-stigning').value) || 0;
            const ju = parseFloat(document.getElementById('gjut-justering').value) || 0;
            const res = (st - (pi * ju)).toFixed(3);
            document.getElementById('gjut-res-lilledia').innerText = res + " mm";
            oppdaterSisteCncKpi(`Gibbs Ø${res}`, `Utv. gjenge M${st}×${pi}`, 'cnc', 'turning', 'card-cnc-gibbs');
        }
        function beregnFinnVc() {
            const d = parseFloat(document.getElementById('fvc-d').value) || 0;
            const rpm = parseFloat(document.getElementById('fvc-rpm').value) || 0;
            const vc = Math.round((Math.PI * d * rpm) / 1000);
            document.getElementById('res-fvc').innerText = vc + " m/min";
            oppdaterSisteCncKpi(`Vc ${vc} m/min`, `Hurtigkalk: Ø${d} ved ${rpm} RPM`, 'cnc', 'milling', 'card-cnc-hurtig');
        }
        function beregnFinnRpm() {
            const d = parseFloat(document.getElementById('frpm-d').value) || 0;
            const vc = parseFloat(document.getElementById('frpm-vc').value) || 0;
            const rpm = Math.round((vc * 1000) / (Math.PI * d));
            document.getElementById('res-frpm').innerText = rpm + " RPM";
            oppdaterSisteCncKpi(`${rpm} RPM`, `Hurtigkalk: Ø${d} ved Vc ${vc}`, 'cnc', 'milling', 'card-cnc-hurtig');
        }
        function beregnFinnMmMin() {
            const z = parseFloat(document.getElementById('fmm-z').value) || 0;
            const rpm = parseFloat(document.getElementById('fmm-rpm').value) || 0;
            const fz = parseFloat(document.getElementById('fmm-fz').value) || 0;
            const vf = Math.round(rpm * fz * z);
            document.getElementById('res-fmm').innerText = vf + " mm/min";
            oppdaterSisteCncKpi(`${rpm} RPM | F${vf}`, `Bordmating: z=${z}, fz=${fz}`, 'cnc', 'milling', 'card-cnc-hurtig');
        }
        function beregnGraderPrMin() {
            const mmmin = parseFloat(document.getElementById('deg-mmmin').value) || 0;
            const dia = parseFloat(document.getElementById('deg-dia').value) || 0;
            const omkrets = Math.PI * dia;
            const gradMin = (omkrets > 0 ? (mmmin / (omkrets / 360)) : 0).toFixed(1);
            document.getElementById('deg-res-omkrets').innerText = omkrets.toFixed(2) + " mm";
            document.getElementById('deg-res-onegrad').innerText = (omkrets > 0 ? (omkrets / 360) : 0).toFixed(4) + " mm/°";
            document.getElementById('deg-res-gradmin').innerText = gradMin + " °/min";
            document.getElementById('deg-res-revmin').innerText = (omkrets > 0 ? (mmmin / omkrets) : 0).toFixed(2) + " omdr/min";
            oppdaterSisteCncKpi(`${gradMin} °/min`, `C-Akse: Ø${dia} mm`, 'cnc', 'turning', 'card-cnc-caxis');
        }
        window.oppdaterRctInndatamodus = function() {
            const mode = document.getElementById('rct-mode')?.value || 'fz';
            const fzField = document.getElementById('rct-fz-field');
            const hmField = document.getElementById('rct-hm-field');
            if (fzField) fzField.classList.toggle('hidden', mode !== 'fz');
            if (hmField) hmField.classList.toggle('hidden', mode !== 'hm');
            window.beregnChipThinning();
            if (typeof lagreAltState === 'function') lagreAltState();
        };
        window.beregnChipThinning = function() {
            const d = parseFloat(document.getElementById('rct-d')?.value);
            const vc = parseFloat(document.getElementById('rct-vc')?.value);
            const z = parseFloat(document.getElementById('rct-z')?.value);
            const mode = document.getElementById('rct-mode')?.value || 'fz';
            const inputFz = parseFloat(document.getElementById('rct-fz')?.value);
            const hm = parseFloat(document.getElementById('rct-hm')?.value);
            const targetFeed = mode === 'hm' ? hm : inputFz;
            const ap = parseFloat(document.getElementById('rct-ap')?.value);
            const ae = parseFloat(document.getElementById('rct-ae')?.value);
            const isEnabled = document.getElementById('rct-enabled')?.checked || false;
            const rpmEl = document.getElementById('rct-res-rpm');
            const feedEl = document.getElementById('rct-res-vf');
            const fzEl = document.getElementById('rct-res-fz');
            const hmaxEl = document.getElementById('rct-res-hmax');
            const fnEl = document.getElementById('rct-res-fn');
            const mrrEl = document.getElementById('rct-res-mrr');
            const factorEl = document.getElementById('rct-res-factor');
            const statusEl = document.getElementById('rct-status');
            const erEng = typeof currentLang !== 'undefined' && currentLang === 'en';
            if (!rpmEl || !feedEl || !fzEl || !hmaxEl || !fnEl || !mrrEl || !factorEl || !statusEl) return;

            if (!Number.isFinite(d) || d <= 0 || !Number.isFinite(vc) || vc <= 0 ||
                !Number.isInteger(z) || z <= 0 || !Number.isFinite(targetFeed) || targetFeed < 0 ||
                !Number.isFinite(ap) || ap < 0 || !Number.isFinite(ae) || ae <= 0 || ae > d) {
                rpmEl.innerText = '--';
                feedEl.innerText = '--';
                fzEl.innerText = '--';
                hmaxEl.innerText = '--';
                fnEl.innerText = '--';
                mrrEl.innerText = '--';
                factorEl.innerText = '--';
                statusEl.innerText = erEng
                    ? 'Enter valid values: D, Vc and z must be greater than zero; fz/hm and ap cannot be negative; ae must be greater than zero and no larger than D.'
                    : 'Oppgi gyldige verdier: D, Vc og z må være større enn null, fz/hm og ap kan ikke være negative, og ae må være større enn null og ikke større enn D.';
                return;
            }

            const aeRatio = ae / d;
            const rctFactor = isEnabled && aeRatio < 0.5
                ? 1 / (2 * Math.sqrt(aeRatio * (1 - aeRatio)))
                : 1;
            const rpm = (vc * 1000) / (Math.PI * d);
            const fz = targetFeed * rctFactor;
            const chipThicknessFactor = aeRatio < 0.5
                ? 2 * Math.sqrt(aeRatio * (1 - aeRatio))
                : 1;
            const hmax = fz * chipThicknessFactor;
            const feedPerRev = fz * z;
            const vf = rpm * feedPerRev;
            const mrr = (vf * ap * ae) / 1000;
            rpmEl.innerText = `${Math.round(rpm)}`;
            feedEl.innerText = `${Math.round(vf)} mm/min`;
            fzEl.innerText = fz.toFixed(3);
            hmaxEl.innerText = hmax.toFixed(3);
            fnEl.innerText = feedPerRev.toFixed(3);
            mrrEl.innerText = mrr.toFixed(1);
            factorEl.innerText = rctFactor.toFixed(2);
            statusEl.innerText = '';
            oppdaterSisteCncKpi(`${Math.round(rpm)} RPM | F${Math.round(vf)}`, `${isEnabled ? (erEng ? 'RCT on' : 'RCT på') : (erEng ? 'RCT off' : 'RCT av')}`, 'cnc', 'milling', 'card-cnc-rct');
        };

        // --- TOOLS LOGIC ---
        const materialData = {
            s355: { vcRough: 180, fzRough: 0.12, vcFinish: 240, fzFinish: 0.08 },
            c45: { vcRough: 140, fzRough: 0.10, vcFinish: 180, fzFinish: 0.06 },
            ss316: { vcRough: 90, fzRough: 0.08, vcFinish: 120, fzFinish: 0.05 },
            duplex: { vcRough: 70, fzRough: 0.06, vcFinish: 95, fzFinish: 0.04 },
            alu: { vcRough: 450, fzRough: 0.20, vcFinish: 650, fzFinish: 0.12 },
            brass: { vcRough: 280, fzRough: 0.15, vcFinish: 380, fzFinish: 0.08 },
            cast: { vcRough: 160, fzRough: 0.12, vcFinish: 210, fzFinish: 0.07 }
        };
        function oppdaterMaterialeData() {
            const matSel = document.getElementById('mat-select');
            const opSel = document.getElementById('op-type-select');
            const diaEl = document.getElementById('mat-dia');
            const zEl = document.getElementById('mat-z');
            if (!matSel || !opSel || !diaEl || !zEl) return;

            const data = materialData[matSel.value] || materialData.s355;
            const op = opSel.value;
            const dia = parseFloat(diaEl.value) || 10;
            const z = parseFloat(zEl.value) || 4;
            const vc = op.includes('finish') ? data.vcFinish : data.vcRough;
            const fz = op.includes('finish') ? data.fzFinish : data.fzRough;
            const rpm = (vc * 1000) / (Math.PI * dia);
            const vf = op.startsWith('mill') ? (rpm * fz * z) : (rpm * fz);
            
            const rVc = document.getElementById('mat-res-vc');
            const rRpm = document.getElementById('mat-res-rpm');
            const rMat = document.getElementById('mat-res-mating');
            if (rVc) rVc.innerText = `${vc} m/min`;
            if (rRpm) rRpm.innerText = `${Math.round(rpm)} RPM`;
            if (rMat) rMat.innerText = `${Math.round(vf)} mm/min`;
            oppdaterSisteCncKpi(`${Math.round(rpm)} RPM | F${Math.round(vf)}`, `Skjæredata: Ø${dia} mm`, 'tools', 'data', 'card-tools-material-data');
        }
        function beregnBoredybde() {
            const diaEl = document.getElementById('drill-dia');
            const angleEl = document.getElementById('drill-angle');
            const depthEl = document.getElementById('drill-depth');
            if (!diaEl || !angleEl || !depthEl) return;
            const dia = parseFloat(diaEl.value) || 0;
            const angle = parseFloat(angleEl.value) || 118;
            const depth = parseFloat(depthEl.value) || 0;
            const h = (dia / 2) / Math.tan((angle / 2) * (Math.PI / 180));
            const tipEl = document.getElementById('drill-res-tip');
            const totEl = document.getElementById('drill-res-total');
            if (tipEl) tipEl.innerText = h.toFixed(2) + " mm";
            if (totEl) totEl.innerText = (depth + h).toFixed(2) + " mm";
        }
        function beregnKjolevaeske() {
            const vol = parseFloat(document.getElementById('cool-vol')?.value) || 250;
            const factor = parseFloat(document.getElementById('cool-factor')?.value) || 1.4;
            const brix = parseFloat(document.getElementById('cool-brix')?.value) || 3.5;
            const target = parseFloat(document.getElementById('cool-target')?.value) || 8.0;
            const actual = brix * factor;
            const literAdd = ((Math.max(0, target - actual)) / 100) * vol;
            const addText = literAdd > 0 ? `+ ${literAdd.toFixed(2)} Liter` : `Nivå OK`;
            const actEl = document.getElementById('cool-res-actual');
            const addEl = document.getElementById('cool-res-add');
            if (actEl) actEl.innerText = `${actual.toFixed(1)} %`;
            if (addEl) addEl.innerText = addText;

            const kpiCool = document.getElementById('dash-kpi-coolant');
            const kpiCoolSub = document.getElementById('dash-kpi-coolant-sub');
            if (kpiCool) kpiCool.innerText = `${actual.toFixed(1)} %`;
            if (kpiCoolSub) kpiCoolSub.innerText = literAdd > 0 ? `Etterfyll: ${addText}` : `Konsentrasjon er OK (${target}%)`;
        }
        function beregnOverflate(mode = 'fn') {
            const re = parseFloat(document.getElementById('ra-re')?.value) || 0.8;
            const fnEl = document.getElementById('ra-fn');
            const targetEl = document.getElementById('ra-target');
            if (!fnEl || !targetEl) return;
            if (mode === 'ra') {
                const targetRa = parseFloat(targetEl.value) || 1.6;
                fnEl.value = Math.sqrt((targetRa * 31.2 * re) / 1000).toFixed(2);
            }
            const fn = parseFloat(fnEl.value) || 0.18;
            const ra = ((fn * fn) / (31.2 * re)) * 1000;
            document.getElementById('ra-res-val').innerText = `Ra ${ra.toFixed(2)} µm`;
            document.getElementById('ra-res-maxfn').innerText = `${Math.sqrt((parseFloat(targetEl.value || 1.6) * 31.2 * re) / 1000).toFixed(2)} mm/o`;
        }

        const bspTabell = {
            "G1/8": { drill: 8.80, pitch: 0.907 }, "G1/4": { drill: 11.80, pitch: 1.337 },
            "G3/8": { drill: 15.25, pitch: 1.337 }, "G1/2": { drill: 19.00, pitch: 1.814 },
            "G3/4": { drill: 24.50, pitch: 1.814 }, "G1": { drill: 30.75, pitch: 2.309 }
        };
        const metriskeStigninger = {
            "3": [0.5, 0.35], "6": [1.0, 0.75, 0.5], "8": [1.25, 1.0],
            "10": [1.5, 1.25, 1.0], "12": [1.75, 1.5, 1.25, 1.0], "16": [2.0, 1.5, 1.0],
            "20": [2.5, 2.0, 1.5], "24": [3.0, 2.0, 1.5], "30": [3.5, 3.0, 2.0], "36": [4.0, 3.0, 2.0]
        };
        function oppdaterGjengeTabell() {
            const val = document.getElementById('tap-select').value;
            let drill = 8.5, pitch = 1.5, form = 9.3, showForm = true, navn = val;
            if (val.startsWith("M")) {
                const deler = val.substring(1).split("x");
                const d = parseFloat(deler[0]); pitch = parseFloat(deler[1]);
                drill = d - pitch; form = d - (0.45 * pitch);
            } else if (bspTabell[val]) {
                showForm = false; drill = bspTabell[val].drill; pitch = bspTabell[val].pitch;
            }
            document.getElementById('tap-res-drill').innerText = drill.toFixed(2) + " mm";
            document.getElementById('tap-res-pitch').innerText = pitch.toFixed(3) + " mm";
            document.getElementById('tap-row-form').style.display = showForm ? 'flex' : 'none';
            if (showForm) document.getElementById('tap-res-form').innerText = form.toFixed(2) + " mm";
            
            const dashThread = document.getElementById('dash-kpi-thread');
            const dashThreadSub = document.getElementById('dash-kpi-thread-sub');
            if (dashThread) dashThread.innerText = `${navn} → Ø${drill.toFixed(2)}`;
            if (dashThreadSub) dashThreadSub.innerText = showForm ? `Formtapp: Ø${form.toFixed(2)} mm · P=${pitch}` : `BSP · P=${pitch}`;
        }
        function oppdaterToleranseStigninger() {
            const dStr = document.getElementById('ttol-select').value;
            const pitchSelect = document.getElementById('ttol-pitch');
            if (!pitchSelect) return;
            const forrigeVerdi = pitchSelect.value;
            const stigninger = metriskeStigninger[dStr] || [1.5];
            pitchSelect.innerHTML = "";
            stigninger.forEach((p, idx) => {
                const opt = document.createElement('option');
                opt.value = p; opt.text = `${p} mm`;
                if (String(p) === String(forrigeVerdi) || (idx === 0 && !stigninger.map(String).includes(String(forrigeVerdi)))) {
                    opt.selected = true;
                }
                pitchSelect.appendChild(opt);
            });
            beregnGjengeToleranse();
            lagreAltState();
        }
        function beregnGjengeToleranse() {
            const d = parseFloat(document.getElementById('ttol-select').value) || 10;
            const p = parseFloat(document.getElementById('ttol-pitch')?.value) || 1.5;
            const fit = document.getElementById('ttol-fit').value;
            const basicPitchDia = d - 0.649519 * p;
            const basicMinorDia = d - 1.082532 * p;
            document.getElementById('ttol-res-major').innerText = `Min ${d.toFixed(2)} mm`;
            document.getElementById('ttol-res-pitch').innerText = `${basicPitchDia.toFixed(3)} mm`;
            document.getElementById('ttol-res-minor').innerText = `${basicMinorDia.toFixed(3)} mm`;
        }
        const isoSteps = [3, 6, 10, 18, 30, 50, 80, 120, 180, 250, 315, 400, 500];
        const isoIT = {
            5:  [4, 5, 6, 8, 9, 11, 13, 15, 18, 20, 23, 25, 27],
            6:  [6, 8, 9, 11, 13, 16, 19, 22, 25, 29, 32, 36, 40],
            7:  [10, 12, 15, 18, 21, 25, 30, 35, 40, 46, 52, 57, 63],
            8:  [14, 18, 22, 27, 33, 39, 46, 54, 63, 72, 81, 89, 97],
            9:  [25, 30, 36, 43, 52, 62, 74, 87, 100, 115, 130, 140, 155],
            10: [40, 48, 58, 70, 84, 100, 120, 140, 160, 185, 210, 230, 250],
            11: [60, 75, 90, 110, 130, 160, 190, 220, 250, 290, 320, 360, 400]
        };
        const isoShaftDev = {
            // Øvre avvik (es) for akslinger a-h i µm
            c: { type: 'es', vals: [-60, -70, -80, -95, -110, -125, -145, -170, -200, -230, -260, -290, -320] },
            d: { type: 'es', vals: [-20, -30, -40, -50, -65, -80, -100, -120, -145, -170, -190, -210, -230] },
            e: { type: 'es', vals: [-14, -20, -25, -32, -40, -50, -60, -72, -85, -100, -110, -125, -135] },
            f: { type: 'es', vals: [-6, -10, -13, -16, -20, -25, -30, -36, -43, -50, -56, -62, -68] },
            g: { type: 'es', vals: [-2, -4, -5, -6, -7, -9, -10, -12, -14, -15, -17, -18, -20] },
            h: { type: 'es', vals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
            // Nedre avvik (ei) for akslinger k-s i µm
            k: { type: 'ei', vals: [0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5] },
            m: { type: 'ei', vals: [2, 4, 6, 7, 8, 9, 11, 13, 15, 17, 20, 21, 23] },
            n: { type: 'ei', vals: [4, 8, 10, 12, 15, 17, 20, 23, 27, 31, 34, 37, 40] },
            p: { type: 'ei', vals: [6, 12, 15, 18, 22, 26, 32, 37, 43, 50, 56, 62, 68] },
            r: { type: 'ei', vals: [10, 15, 19, 23, 28, 34, 41, 48, 55, 63, 75, 87, 98] },
            s: { type: 'ei', vals: [14, 19, 23, 28, 35, 43, 53, 71, 92, 122, 150, 180, 210] }
        };

        const isoHoleDev = {
            // Nedre avvik (EI) for hull F-H i µm
            F: { type: 'EI', vals: [6, 10, 13, 16, 20, 25, 30, 36, 43, 50, 56, 62, 68] },
            G: { type: 'EI', vals: [2, 4, 5, 6, 7, 9, 10, 12, 14, 15, 17, 18, 20] },
            H: { type: 'EI', vals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
            // Øvre avvik (ES) for hull K-P i µm (IT7)
            K: { type: 'ES', vals: [0, 3, 5, 6, 6, 7, 9, 10, 12, 13, 16, 17, 18] },
            M: { type: 'ES', vals: [-2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
            N: { type: 'ES', vals: [-4, -4, -4, -5, -7, -8, -9, -10, -12, -14, -14, -16, -17] },
            P: { type: 'ES', vals: [-6, -9, -11, -14, -17, -21, -24, -28, -33, -36, -41, -45, -51] }
        };

        function settIsoHurtig(klasse) {
            const sel = document.getElementById('iso-class');
            if (sel) {
                sel.value = klasse;
                beregnIso();
                lagreAltState();
            }
        }

        function beregnIso() {
            const dRaw = parseFloat(document.getElementById('iso-dia')?.value) || 40;
            const d = Math.max(1, Math.min(500, dRaw));
            const cls = document.getElementById('iso-class')?.value || 'H7';

            let stepIdx = isoSteps.findIndex(limit => d <= limit);
            if (stepIdx === -1) stepIdx = isoSteps.length - 1;

            const match = cls.match(/^([A-Za-z]+)(\d+)$/);
            if (!match) return;
            const letter = match[1];
            const grade = parseInt(match[2]);
            const itVal = (isoIT[grade] || isoIT[7])[stepIdx];

            const isHole = letter === letter.toUpperCase();
            let upperUm = 0, lowerUm = 0;

            if (letter.toUpperCase() === 'JS') {
                upperUm = itVal / 2;
                lowerUm = -itVal / 2;
            } else if (isHole) {
                const hData = isoHoleDev[letter] || isoHoleDev.H;
                const dev = hData.vals[stepIdx];
                if (hData.type === 'EI') {
                    lowerUm = dev;
                    upperUm = dev + itVal;
                } else {
                    upperUm = dev;
                    lowerUm = dev - itVal;
                }
            } else {
                const sData = isoShaftDev[letter] || isoShaftDev.h;
                const dev = sData.vals[stepIdx];
                if (sData.type === 'es') {
                    upperUm = dev;
                    lowerUm = dev - itVal;
                } else {
                    lowerUm = dev;
                    upperUm = dev + itVal;
                }
            }

            const fmtUm = (v) => (v > 0 ? `+${v}` : `${v}`);
            const minMm = d + (lowerUm / 1000);
            const maxMm = d + (upperUm / 1000);
            const midMm = (minMm + maxMm) / 2;

            const lblType = document.getElementById('iso-lbl-type');
            const resEl = document.getElementById('iso-res');
            const minMaxEl = document.getElementById('iso-res-minmax');
            const midEl = document.getElementById('iso-res-mid');
            const badgeEl = document.getElementById('iso-fit-badge');

            if (lblType) lblType.innerText = isHole ? `Hull ${cls} (Avvik):` : `Aksling ${cls} (Avvik):`;
            if (resEl) resEl.innerText = `${fmtUm(upperUm)} / ${fmtUm(lowerUm)} µm (IT=${itVal} µm)`;
            if (minMaxEl) minMaxEl.innerText = `${minMm.toFixed(3)} – ${maxMm.toFixed(3)} mm`;
            if (midEl) midEl.innerText = `${midMm.toFixed(4)} mm`;

            if (badgeEl) {
                const selOpt = document.getElementById('iso-class')?.selectedOptions?.[0]?.text || cls;
                badgeEl.innerText = selOpt;
            }

            const dashIso = document.getElementById('dash-kpi-isofit');
            const dashIsoSub = document.getElementById('dash-kpi-isofit-sub');
            if (dashIso) dashIso.innerText = `Ø${d} ${cls} → ${midMm.toFixed(3)}`;
            if (dashIsoSub) dashIsoSub.innerText = `${minMm.toFixed(3)}–${maxMm.toFixed(3)} mm (${fmtUm(upperUm)}/${fmtUm(lowerUm)} µm)`;
        }
        function byttVektForm() {
            const typeEl = document.getElementById('w-type');
            if (!typeEl) return;
            const type = typeEl.value;
            const pEl = document.getElementById('w-inputs-plate');
            const sEl = document.getElementById('w-inputs-shaft');
            const rEl = document.getElementById('w-inputs-pipe');
            if (pEl) pEl.style.display = type === 'plate' ? 'grid' : 'none';
            if (sEl) sEl.style.display = type === 'shaft' ? 'grid' : 'none';
            if (rEl) rEl.style.display = type === 'pipe' ? 'grid' : 'none';
            beregnVekt();
        }
        function beregnVekt() {
            const typeEl = document.getElementById('w-type');
            const matEl = document.getElementById('w-mat');
            const resEl = document.getElementById('w-res-kg');
            if (!typeEl || !matEl || !resEl) return;
            const type = typeEl.value;
            const density = parseFloat(matEl.value) || 7.85;
            let vol = 0;
            if (type === 'plate') {
                vol = ((parseFloat(document.getElementById('wp-l')?.value)||0)/10) * ((parseFloat(document.getElementById('wp-b')?.value)||0)/10) * ((parseFloat(document.getElementById('wp-t')?.value)||0)/10);
            } else if (type === 'pipe') {
                const rOut = (parseFloat(document.getElementById('wp-od')?.value)||0) / 20;
                const rIn = (parseFloat(document.getElementById('wp-id')?.value)||0) / 20;
                const lenCm = (parseFloat(document.getElementById('wp-pl')?.value)||0) / 10;
                vol = Math.max(0, Math.PI * (rOut*rOut - rIn*rIn) * lenCm);
            } else {
                const r = (parseFloat(document.getElementById('ws-d')?.value)||0) / 20;
                const lenCm = (parseFloat(document.getElementById('ws-l')?.value)||0) / 10;
                vol = Math.PI * r * r * lenCm;
            }
            resEl.innerText = `${((vol * density) / 1000).toFixed(2)} kg`;
        }

        // --- MATH, CONVERTER, KONUS, G-KODER, ISO 2768, KILESPOR, BOLTMOMENT, HARDHET & EV ---
        function beregnPcd() {
            const dia = parseFloat(document.getElementById('pcd-dia')?.value) || 0;
            const num = parseFloat(document.getElementById('pcd-num')?.value) || 1;
            const chord = num > 1 ? dia * Math.sin(Math.PI / num) : 0;
            const el = document.getElementById('pcd-res-chord');
            if (el) el.innerText = `${chord.toFixed(2)} mm`;
        }

        function beregnTrekant() {
            const a = parseFloat(document.getElementById('tri-a')?.value) || 0;
            const b = parseFloat(document.getElementById('tri-b')?.value) || 0;
            const c = Math.sqrt(a * a + b * b);
            const angA = b > 0 ? Math.atan(a / b) * (180 / Math.PI) : 0;
            const angB = 90 - angA;
            const resC = document.getElementById('tri-res-c');
            const resAng = document.getElementById('tri-res-angles');
            if (resC) resC.innerText = `c: ${c.toFixed(2)}`;
            if (resAng) resAng.innerText = `A = ${angA.toFixed(2)}° | B = ${angB.toFixed(2)}°`;
        }

        function byttTommeFraksjon() {
            const val = parseFloat(document.getElementById('conv-frac')?.value) || 0.5;
            const inchEl = document.getElementById('conv-inch');
            if (inchEl) {
                inchEl.value = val;
                beregnFraTommer();
            }
        }
        function beregnFraTommer() {
            const inch = parseFloat(document.getElementById('conv-inch')?.value) || 0;
            const mmEl = document.getElementById('conv-mm');
            if (mmEl) mmEl.value = (inch * 25.4).toFixed(3);
        }
        function beregnFraMm() {
            const mm = parseFloat(document.getElementById('conv-mm')?.value) || 0;
            const inchEl = document.getElementById('conv-inch');
            if (inchEl) inchEl.value = (mm / 25.4).toFixed(4);
        }
        function beregnTrykkVekt() {
            const psi = parseFloat(document.getElementById('conv-psi')?.value) || 0;
            const lbs = parseFloat(document.getElementById('conv-lbs')?.value) || 0;
            const f = parseFloat(document.getElementById('conv-f')?.value) || 0;
            const rBar = document.getElementById('res-bar');
            const rKg = document.getElementById('res-kg');
            const rC = document.getElementById('res-c');
            if (rBar) rBar.innerText = `${(psi * 0.0689476).toFixed(2)} Bar`;
            if (rKg) rKg.innerText = `${(lbs * 0.453592).toFixed(2)} kg`;
            if (rC) rC.innerText = `${((f - 32) * 5 / 9).toFixed(1)} °C`;
        }

        function byttKonusModus() {
            const mode = document.getElementById('taper-mode')?.value || 'find_angle';
            const bD1 = document.getElementById('box-taper-d1');
            const bD2 = document.getElementById('box-taper-d2');
            const bLen = document.getElementById('box-taper-len');
            const bAng = document.getElementById('box-taper-ang');
            if (!bD1 || !bD2 || !bLen || !bAng) return;
            bD1.style.display = mode === 'find_d1' ? 'none' : 'block';
            bD2.style.display = mode === 'find_d2' ? 'none' : 'block';
            bLen.style.display = mode === 'find_len' ? 'none' : 'block';
            bAng.style.display = mode === 'find_angle' ? 'none' : 'block';
            beregnKonus();
        }
        function settKonusHurtig(halvVinkel) {
            const modeEl = document.getElementById('taper-mode');
            const angEl = document.getElementById('taper-ang');
            if (modeEl && modeEl.value === 'find_angle') modeEl.value = 'find_d2';
            if (angEl) angEl.value = halvVinkel;
            byttKonusModus();
            lagreAltState();
        }
        function settKonusForhold(k) {
            const halfRad = Math.atan(1 / (2 * k));
            const halfDeg = halfRad * (180 / Math.PI);
            settKonusHurtig(parseFloat(halfDeg.toFixed(4)));
        }
        function beregnKonus() {
            const mode = document.getElementById('taper-mode')?.value || 'find_angle';
            let d1 = parseFloat(document.getElementById('taper-d1')?.value) || 50;
            let d2 = parseFloat(document.getElementById('taper-d2')?.value) || 46;
            let len = parseFloat(document.getElementById('taper-len')?.value) || 2;
            let halfAng = parseFloat(document.getElementById('taper-ang')?.value) || 45;

            const rHalf = document.getElementById('taper-res-half');
            const rFull = document.getElementById('taper-res-full');
            const rMain = document.getElementById('taper-res-main');
            if (!rHalf || !rFull || !rMain) return;

            if (mode === 'find_angle') {
                const deltaR = Math.abs(d1 - d2) / 2;
                const rad = len > 0 ? Math.atan(deltaR / len) : 0;
                halfAng = rad * (180 / Math.PI);
                const k = Math.abs(d1 - d2) > 0 ? (len / Math.abs(d1 - d2)) : 0;
                rHalf.innerText = `${halfAng.toFixed(3)}°`;
                rFull.innerText = `${(halfAng * 2).toFixed(3)}°`;
                rMain.innerText = `1 : ${k.toFixed(2)} (ΔR = ${deltaR.toFixed(2)} mm)`;
            } else if (mode === 'find_d1') {
                const tanVal = Math.tan(halfAng * (Math.PI / 180));
                d1 = d2 + 2 * len * tanVal;
                rHalf.innerText = `${halfAng.toFixed(3)}°`;
                rFull.innerText = `${(halfAng * 2).toFixed(3)}°`;
                rMain.innerText = `D1 = ${d1.toFixed(3)} mm`;
            } else if (mode === 'find_d2') {
                const tanVal = Math.tan(halfAng * (Math.PI / 180));
                d2 = d1 - 2 * len * tanVal;
                rHalf.innerText = `${halfAng.toFixed(3)}°`;
                rFull.innerText = `${(halfAng * 2).toFixed(3)}°`;
                rMain.innerText = `D2 = ${d2.toFixed(3)} mm`;
            } else if (mode === 'find_len') {
                const tanVal = Math.tan(halfAng * (Math.PI / 180));
                len = tanVal > 0 ? Math.abs(d1 - d2) / (2 * tanVal) : 0;
                rHalf.innerText = `${halfAng.toFixed(3)}°`;
                rFull.innerText = `${(halfAng * 2).toFixed(3)}°`;
                rMain.innerText = `Z = ${len.toFixed(3)} mm`;
            }
        }

        function beregnIso2768() {
            const dim = parseFloat(document.getElementById('iso2768-dim')?.value) || 85;
            const cls = document.getElementById('iso2768-class')?.value || 'm';
            const steps = [3, 6, 30, 120, 400, 1000, 2000, 4000];
            const table = {
                f: [0.05, 0.05, 0.10, 0.15, 0.20, 0.30, 0.50, 0.50],
                m: [0.10, 0.10, 0.20, 0.30, 0.50, 0.80, 1.20, 2.00],
                c: [0.20, 0.30, 0.50, 0.80, 1.20, 2.00, 3.00, 4.00],
                v: [0.50, 0.50, 1.00, 1.50, 2.50, 4.00, 6.00, 8.00]
            };
            let idx = steps.findIndex(s => dim <= s);
            if (idx === -1) idx = steps.length - 1;
            const tol = (table[cls] || table.m)[idx];
            const chamTol = dim <= 3 ? 0.2 : (dim <= 6 ? (cls === 'c' || cls === 'v' ? 1.0 : 0.5) : (cls === 'c' || cls === 'v' ? 2.0 : 1.0));

            const linEl = document.getElementById('iso2768-res-lin');
            const mmEl = document.getElementById('iso2768-res-minmax');
            const chEl = document.getElementById('iso2768-res-chamfer');
            if (linEl) linEl.innerText = `± ${tol.toFixed(2)} mm`;
            if (mmEl) mmEl.innerText = `${(dim - tol).toFixed(2)} – ${(dim + tol).toFixed(2)} mm`;
            if (chEl) chEl.innerText = `± ${chamTol.toFixed(1)} mm`;
        }

        function beregnKilespor() {
            const d = parseFloat(document.getElementById('key-dia')?.value) || 40;
            const table = [
                { max: 8, b: 2, h: 2, t1: 1.2, t2: 1.0, tol: '+0.1 / 0' },
                { max: 10, b: 3, h: 3, t1: 1.8, t2: 1.4, tol: '+0.1 / 0' },
                { max: 12, b: 4, h: 4, t1: 2.5, t2: 1.8, tol: '+0.1 / 0' },
                { max: 17, b: 5, h: 5, t1: 3.0, t2: 2.3, tol: '+0.1 / 0' },
                { max: 22, b: 6, h: 6, t1: 3.5, t2: 2.8, tol: '+0.1 / 0' },
                { max: 30, b: 8, h: 7, t1: 4.0, t2: 3.3, tol: '+0.2 / 0' },
                { max: 38, b: 10, h: 8, t1: 5.0, t2: 3.3, tol: '+0.2 / 0' },
                { max: 44, b: 12, h: 8, t1: 5.0, t2: 3.3, tol: '+0.2 / 0' },
                { max: 50, b: 14, h: 9, t1: 5.5, t2: 3.8, tol: '+0.2 / 0' },
                { max: 58, b: 16, h: 10, t1: 6.0, t2: 4.3, tol: '+0.2 / 0' },
                { max: 65, b: 18, h: 11, t1: 7.0, t2: 4.4, tol: '+0.2 / 0' },
                { max: 75, b: 20, h: 12, t1: 7.5, t2: 4.9, tol: '+0.2 / 0' },
                { max: 85, b: 22, h: 14, t1: 9.0, t2: 5.4, tol: '+0.2 / 0' },
                { max: 95, b: 25, h: 14, t1: 9.0, t2: 5.4, tol: '+0.2 / 0' },
                { max: 110, b: 28, h: 16, t1: 10.0, t2: 6.4, tol: '+0.2 / 0' },
                { max: 130, b: 32, h: 18, t1: 11.0, t2: 7.4, tol: '+0.2 / 0' },
                { max: 150, b: 36, h: 20, t1: 12.0, t2: 8.4, tol: '+0.3 / 0' },
                { max: 170, b: 40, h: 22, t1: 13.0, t2: 9.4, tol: '+0.3 / 0' },
                { max: 200, b: 45, h: 25, t1: 15.0, t2: 10.4, tol: '+0.3 / 0' },
                { max: 230, b: 50, h: 28, t1: 17.0, t2: 11.4, tol: '+0.3 / 0' }
            ];
            const row = table.find(r => d <= r.max) || table[table.length - 1];
            const dimEl = document.getElementById('key-res-dim');
            const t1El = document.getElementById('key-res-t1');
            const t2El = document.getElementById('key-res-t2');
            if (dimEl) dimEl.innerText = `${row.b} × ${row.h} mm`;
            if (t1El) t1El.innerText = `${row.t1.toFixed(1)} mm (${row.tol})`;
            if (t2El) t2El.innerText = `${row.t2.toFixed(1)} mm (D+t2 = ${(d + row.t2).toFixed(1)} mm)`;
        }

        function beregnBoltMoment() {
            const size = document.getElementById('torque-size')?.value || 'M12';
            const grade = document.getElementById('torque-grade')?.value || '8.8';
            const fric = parseFloat(document.getElementById('torque-fric')?.value) || 0.14;
            const bolts = {
                M4:  { nm88: 3.0,  nv: '7 mm', hex: '3 mm', hole: 4.5, cb: 8.0 },
                M5:  { nm88: 5.9,  nv: '8 mm', hex: '4 mm', hole: 5.5, cb: 10.0 },
                M6:  { nm88: 10.0, nv: '10 mm', hex: '5 mm', hole: 6.6, cb: 11.0 },
                M8:  { nm88: 25.0, nv: '13 mm', hex: '6 mm', hole: 9.0, cb: 15.0 },
                M10: { nm88: 49.0, nv: '16 (17) mm', hex: '8 mm', hole: 11.0, cb: 18.0 },
                M12: { nm88: 86.0, nv: '18 (19) mm', hex: '10 mm', hole: 13.5, cb: 20.0 },
                M14: { nm88: 135,  nv: '21 (22) mm', hex: '12 mm', hole: 15.5, cb: 24.0 },
                M16: { nm88: 210,  nv: '24 mm', hex: '14 mm', hole: 17.5, cb: 26.0 },
                M20: { nm88: 410,  nv: '30 mm', hex: '17 mm', hole: 22.0, cb: 33.0 },
                M24: { nm88: 710,  nv: '36 mm', hex: '19 mm', hole: 26.0, cb: 40.0 },
                M30: { nm88: 1450, nv: '46 mm', hex: '22 mm', hole: 33.0, cb: 50.0 },
                M36: { nm88: 2520, nv: '55 mm', hex: '27 mm', hole: 39.0, cb: 60.0 }
            };
            const gradeMult = { '8.8': 1.0, '10.9': 1.41, '12.9': 1.69, 'A4-70': 0.70, 'A4-80': 0.93 };
            const fricMult = fric / 0.14;
            const b = bolts[size] || bolts.M12;
            const nm = b.nm88 * (gradeMult[grade] || 1.0) * fricMult;

            const nmEl = document.getElementById('torque-res-nm');
            const toolEl = document.getElementById('torque-res-tool');
            const holeEl = document.getElementById('torque-res-hole');
            if (nmEl) nmEl.innerText = nm < 15 ? `${nm.toFixed(1)} Nm` : `${Math.round(nm)} Nm`;
            if (toolEl) toolEl.innerText = `NV ${b.nv} | Unbrako ${b.hex}`;
            if (holeEl) holeEl.innerText = `Hull Ø${b.hole} mm | Forsenk Ø${b.cb} mm`;
        }

        function konverterHardhet(source) {
            const hrcEl = document.getElementById('hard-hrc');
            const hbEl = document.getElementById('hard-hb');
            const hvEl = document.getElementById('hard-hv');
            const mpaEl = document.getElementById('hard-mpa');
            if (!hrcEl || !hbEl || !hvEl || !mpaEl) return;

            let hv = 318;
            if (source === 'hrc') {
                const hrc = parseFloat(hrcEl.value) || 0;
                hv = Math.max(80, Math.round(145 + (hrc * 3.8) + (0.085 * hrc * hrc)));
            } else if (source === 'hb') {
                const hb = parseFloat(hbEl.value) || 0;
                hv = Math.round(hb * 1.05);
            } else if (source === 'hv') {
                hv = parseFloat(hvEl.value) || 0;
            } else if (source === 'mpa') {
                const mpa = parseFloat(mpaEl.value) || 0;
                hv = Math.round(mpa / 3.24);
            }

            const hb = Math.round(hv * 0.95);
            const mpa = Math.round(hv * 3.24);
            const hrc = hv < 220 ? Math.max(0, (hv - 140) / 4.2) : Math.sqrt(Math.max(0, (hv - 145) / 0.085 + 498)) - 22.35;

            if (source !== 'hrc') hrcEl.value = Math.max(0, hrc).toFixed(1);
            if (source !== 'hb') hbEl.value = hb;
            if (source !== 'hv') hvEl.value = Math.round(hv);
            if (source !== 'mpa') mpaEl.value = mpa;

            const descEl = document.getElementById('hard-res-desc');
            const sumEl = document.getElementById('hard-res-summary');
            if (descEl) {
                if (hrc < 24) descEl.innerText = 'Uherdet / glødet stål – Normal Vc (100%)';
                else if (hrc < 38) descEl.innerText = 'Seigherdet stål (eks. 42CrMo4) – Reduser Vc med ~25%';
                else if (hrc < 50) descEl.innerText = 'Herdet stål – Bruk slitesterk HM-kvalitet, reduser Vc ~50%';
                else descEl.innerText = 'Høyherdet stål (>50 HRC) – Krever hardfresing / CBN-skjær';
            }
            if (sumEl) sumEl.innerText = `${Math.max(0, hrc).toFixed(1)} HRC ≈ ${hb} HB ≈ ${mpa} MPa`;
        }

        function settElbilProfil(bat, cons, wltp) {
            const bEl = document.getElementById('charge-battery');
            const cEl = document.getElementById('charge-consumption');
            const wEl = document.getElementById('winter-wltp');
            if (bEl) bEl.value = bat;
            if (cEl) cEl.value = cons;
            if (wEl) wEl.value = wltp;
            beregnLadetid();
            beregnVinter();
            lagreAltState();
        }

        function syncStrømPris(source) {
            const idMap = { charge: 'charge-price', save: 'save-elek-price', app: 'app-price' };
            const srcEl = document.getElementById(idMap[source]);
            if (!srcEl) return;
            const val = srcEl.value;
            Object.keys(idMap).forEach(k => {
                if (k !== source) {
                    const targetEl = document.getElementById(idMap[k]);
                    if (targetEl) targetEl.value = val;
                }
            });
            beregnLadetid();
            beregnBesparelse();
            beregnApparat();
            lagreAltState();
        }

        function beregnLadetid() {
            const bat = parseFloat(document.getElementById('charge-battery')?.value) || 77;
            const kw = parseFloat(document.getElementById('charge-type')?.value) || 7.4;
            const start = parseFloat(document.getElementById('charge-start')?.value) || 10;
            const target = parseFloat(document.getElementById('charge-target')?.value) || 80;
            const price = parseFloat(document.getElementById('charge-price')?.value) || 1.30;
            const cons = parseFloat(document.getElementById('charge-consumption')?.value) || 18;

            const kwhAdded = Math.max(0, bat * ((target - start) / 100));
            const totalHours = kw > 0 ? (kwhAdded / kw) : 0;
            const h = Math.floor(totalHours);
            const m = Math.round((totalHours - h) * 60);
            const rangeAdded = cons > 0 ? Math.round((kwhAdded / cons) * 100) : 0;
            const cost = kwhAdded * price;

            const tEl = document.getElementById('res-charge-time');
            const rEl = document.getElementById('res-charge-range');
            const cEl = document.getElementById('res-charge-cost');
            if (tEl) tEl.innerText = `${h}t ${m}m`;
            if (rEl) rEl.innerText = `+ ${rangeAdded} km`;
            if (cEl) cEl.innerText = `${cost.toFixed(2)} kr`;

            const kpiP = document.getElementById('dash-kpi-power');
            const kpiPSub = document.getElementById('dash-kpi-power-sub');
            if (kpiP) kpiP.innerText = `${price.toFixed(2).replace('.', ',')} kr/kWh`;
            if (kpiPSub) kpiPSub.innerText = `Lading: ${h}t ${m}m (+${rangeAdded} km)`;
        }

        function beregnBesparelse() {
            const km = parseFloat(document.getElementById('save-km')?.value) || 15000;
            const fPrice = parseFloat(document.getElementById('save-fuel-price')?.value) || 21.5;
            const fCons = parseFloat(document.getElementById('save-fuel-cons')?.value) || 0.65;
            const evCons = parseFloat(document.getElementById('save-ev-cons')?.value) || 1.8;
            const ePrice = parseFloat(document.getElementById('save-elek-price')?.value) || 1.30;

            const mil = km / 10;
            const fuelYear = mil * fCons * fPrice;
            const evYear = mil * evCons * ePrice;
            const diffYear = fuelYear - evYear;

            const mEl = document.getElementById('res-save-month');
            const yEl = document.getElementById('res-save-year');
            const fEl = document.getElementById('res-save-5yr');
            if (mEl) mEl.innerText = `${(diffYear / 12).toFixed(2)} kr`;
            if (yEl) yEl.innerText = `${diffYear.toFixed(2)} kr`;
            if (fEl) fEl.innerText = `${(diffYear * 5).toFixed(2)} kr`;
        }

        function beregnVinter() {
            const wltp = parseFloat(document.getElementById('winter-wltp')?.value) || 500;
            const selectedLossPct = parseFloat(document.getElementById('winter-temp')?.value);
            const lossPct = Number.isFinite(selectedLossPct) ? selectedLossPct : 20;
            const lossKm = Math.round(wltp * (lossPct / 100));
            const estKm = wltp - lossKm;

            const rEl = document.getElementById('res-winter-range');
            const lEl = document.getElementById('res-winter-loss');
            if (rEl) rEl.innerText = `${estKm} km`;
            if (lEl) lEl.innerText = `- ${lossKm} km (${lossPct}%)`;
        }

        function byttApparat() {
            const q = document.getElementById('app-quick')?.value;
            const wEl = document.getElementById('app-watt');
            if (q && wEl) {
                wEl.value = q;
                beregnApparat();
            }
        }

        function beregnApparat() {
            const watt = parseFloat(document.getElementById('app-watt')?.value) || 2000;
            const hours = parseFloat(document.getElementById('app-hours')?.value) || 8;
            const price = parseFloat(document.getElementById('app-price')?.value) || 1.30;
            const kw = watt / 1000;
            const perHour = kw * price;
            const perDay = perHour * hours;
            const perMonth = perDay * 30;

            const hEl = document.getElementById('res-app-hour');
            const dEl = document.getElementById('res-app-day');
            const mEl = document.getElementById('res-app-month');
            if (hEl) hEl.innerText = `${perHour.toFixed(2)} kr`;
            if (dEl) dEl.innerText = `${perDay.toFixed(2)} kr`;
            if (mEl) mEl.innerText = `${perMonth.toFixed(2)} kr`;
        }

        window.sistBeregnetTotalStrompris = 1.44;
        function beregnStromTariff() {
            const scheme = document.getElementById('pwr-scheme')?.value || 'spot_support';
            const spot = parseFloat(document.getElementById('pwr-spot')?.value) || 1.45;
            const grid = parseFloat(document.getElementById('pwr-grid')?.value) || 0.45;
            const maxStepKw = parseFloat(document.getElementById('pwr-step')?.value) || 10;
            const houseKw = parseFloat(document.getElementById('pwr-house-kw')?.value) || 2.5;

            let support = 0;
            let kraftPrisEtterStotte = spot;

            if (scheme === 'spot_support') {
                // 90% støtte over 75 øre ekskl. mva (93,75 øre inkl. mva)
                const terskelInklMva = 0.9375;
                if (spot > terskelInklMva) {
                    support = (spot - terskelInklMva) * 0.90;
                }
                kraftPrisEtterStotte = spot - support;
            } else if (scheme === 'norgespris') {
                // Fastpris 40 øre ekskl. mva = 50 øre inkl. mva
                kraftPrisEtterStotte = 0.50;
                support = spot - 0.50;
            }

            const totalKwh = Math.max(0, kraftPrisEtterStotte + grid);
            window.sistBeregnetTotalStrompris = totalKwh;

            const availKw = Math.max(0, maxStepKw - houseKw);
            const amp1Fas = Math.floor((availKw * 1000) / 230);
            const amp3Fas = Math.floor((availKw * 1000) / (400 * 1.732));

            const supEl = document.getElementById('res-pwr-support');
            const totEl = document.getElementById('res-pwr-total');
            const maxEl = document.getElementById('res-pwr-maxcharge');

            if (supEl) {
                if (scheme === 'norgespris') {
                    supEl.innerText = support >= 0 ? `Norgespris (Sparer ${support.toFixed(2)} kr/kWh)` : `Norgespris (+${Math.abs(support).toFixed(2)} kr over spot)`;
                } else if (scheme === 'spot_support') {
                    supEl.innerText = support > 0 ? `− ${support.toFixed(2)} kr/kWh (90% støtte)` : `0.00 kr (Under 93,75 øre)`;
                } else {
                    supEl.innerText = `Ingen støtte valgt`;
                }
            }
            if (totEl) totEl.innerText = `${totalKwh.toFixed(2)} kr/kWh`;
            if (maxEl) {
                maxEl.innerText = availKw > 0
                    ? `Maks ${availKw.toFixed(1)} kW (${amp1Fas}A 1-fas / ${amp3Fas}A 3-fas)`
                    : `0 kW (Husbruk overstiger trinnet!)`;
            }
        }

        function brukBeregnetStrompris() {
            const pris = (window.sistBeregnetTotalStrompris || 1.30).toFixed(2);
            const cEl = document.getElementById('charge-price');
            if (cEl) {
                cEl.value = pris;
                syncStrømPris('charge');
                visToast(`Strømpris satt til ${pris} kr/kWh i alle kalkulatorer!`);
            }
        }

        function beregnDekkDimensjon() {
            const w1 = parseFloat(document.getElementById('tire1-w')?.value) || 255;
            const p1 = parseFloat(document.getElementById('tire1-p')?.value) || 45;
            const r1 = parseFloat(document.getElementById('tire1-r')?.value) || 19;

            const w2 = parseFloat(document.getElementById('tire2-w')?.value) || 235;
            const p2 = parseFloat(document.getElementById('tire2-p')?.value) || 55;
            const r2 = parseFloat(document.getElementById('tire2-r')?.value) || 18;

            const d1 = (r1 * 25.4) + (2 * w1 * (p1 / 100));
            const d2 = (r2 * 25.4) + (2 * w2 * (p2 / 100));

            const c1 = d1 * Math.PI;
            const c2 = d2 * Math.PI;

            const diffPct = c1 > 0 ? ((c2 - c1) / c1) * 100 : 0;
            const diffCircMm = Math.round(c2 - c1);
            const rideHeightDiff = (d2 - d1) / 2;
            const realSpeedAt80 = 80 * (1 + (diffPct / 100));

            const isLegal = Math.abs(diffPct) <= 5.0;

            const badgeEl = document.getElementById('tire-legal-badge');
            const diffEl = document.getElementById('res-tire-diff');
            const diaEl = document.getElementById('res-tire-dia');
            const spdEl = document.getElementById('res-tire-speed');

            if (badgeEl) {
                if (isLegal) {
                    badgeEl.className = "text-xs font-mono font-extrabold px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30";
                    badgeEl.innerText = currentLang === 'en' ? "✅ LEGAL (±5%)" : "✅ LOVLIG (±5%)";
                } else {
                    badgeEl.className = "text-xs font-mono font-extrabold px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30";
                    badgeEl.innerText = currentLang === 'en' ? "❌ ILLEGAL (>5%)" : "❌ ULOVLIG (>5%)";
                }
            }

            const sign = diffPct >= 0 ? "+" : "";
            if (diffEl) diffEl.innerText = `${sign}${diffPct.toFixed(2)} % (${sign}${diffCircMm} mm)`;
            if (diaEl) diaEl.innerText = `Ø${Math.round(d1)} → Ø${Math.round(d2)} mm (${rideHeightDiff >= 0 ? '+' : ''}${rideHeightDiff.toFixed(1)} mm ${currentLang === 'en' ? 'height' : 'høyde'})`;
            if (spdEl) spdEl.innerText = `${currentLang === 'en' ? 'Actual speed' : 'Reell fart'}: ${realSpeedAt80.toFixed(1)} km/h`;
        }

        // --- OPPSTART ---
        window.addEventListener('DOMContentLoaded', () => {
            registrerKalkulatorLivekort();
            hentWidgetKonfig();
            const navigation = performance.getEntriesByType('navigation')[0];
            lastInnAltState(navigation?.type !== 'reload');
            lastInnNotaterOgSjekkliste();
            brukWidgetOppsett();
            aktiverHurtigKopiering();
            if (currentLang === 'en') brukSprak();
            initIcons();
        });
