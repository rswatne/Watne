(function() {
    function initAlleTilleggOgFiks() {
        // -------------------------------------------------------------------------
        // 1. OPPDATER PRODUKSJON-MENY & LEGG TIL 3D-PRINT OG SVEISING
        // -------------------------------------------------------------------------
        const navCnc = document.querySelector('#nav-cnc span');
        if (navCnc) {
            navCnc.innerHTML = `<i data-lucide="factory" class="w-5 h-5 mr-3 text-slate-400"></i> Produksjon`;
        }
        const mnavCnc = document.querySelector('#mnav-cnc span');
        if (mnavCnc) mnavCnc.innerText = 'Produksjon';

        const cncHeaderTitle = document.querySelector('#cnc header h2');
        const cncHeaderSub = document.querySelector('#cnc header p');
        if (cncHeaderTitle) cncHeaderTitle.innerText = 'Produksjon & Maskinering';
        if (cncHeaderSub) cncHeaderSub.innerText = 'CNC Skjæredata, Dreiing, 3D-Print & Sveising';

        document.querySelectorAll('[onclick*="switchTab(\'cnc\')"] h3').forEach(el => {
            if (el.innerText.includes('Maskinering')) el.innerText = 'Produksjon (CNC, 3D & Sveis)';
        });

        const subBar = document.getElementById('cnc-subtab-bar');
        if (subBar && !document.getElementById('btn-cnc-print3d')) {
            subBar.insertAdjacentHTML('beforeend', `
                <button onclick="switchCncTab('print3d')" id="btn-cnc-print3d" class="cnc-tab-btn px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 snap-start">🖨️ 3D-Print & Prototype</button>
                <button onclick="switchCncTab('welding')" id="btn-cnc-welding" class="cnc-tab-btn px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 snap-start">🔥 Sveising & Plate</button>
            `);
        }

        const cncSection = document.getElementById('cnc');
        if (cncSection && !document.getElementById('ctab-print3d')) {
            const productionCalculatorMarkup = `
            <!-- CNC TAB 4: 3D-PRINT & PROTOTYPE -->
            <div id="ctab-print3d" class="cnc-tab-content">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    <div id="card-cnc-p3dcost" class="pers-input bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-sm relative overflow-hidden transition-colors border-l-4 border-l-emerald-500">
                        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center"><i data-lucide="layers" class="w-6 h-6 mr-3 text-emerald-500"></i> 3D-Print Kostnad & Delekalkulator</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 font-medium">Beregn selvkost ut fra filamentvekt, spolepris og printtid (Bambu Lab P2S).</p>
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div><label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Vekt inkl. support (g)</label><input type="number" step="1" id="p3d-weight" value="85" oninput="beregn3DPrint()" class="glass-input glass-input-emerald"></div>
                            <div><label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Spolepris (kr/kg)</label><input type="number" step="10" id="p3d-spool" value="249" oninput="beregn3DPrint()" class="glass-input glass-input-emerald"></div>
                            <div><label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Printtid (Timer)</label><input type="number" step="0.25" id="p3d-hours" value="3.5" oninput="beregn3DPrint()" class="glass-input glass-input-emerald"></div>
                            <div><label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Snitt effekt (Watt)</label><input type="number" step="10" id="p3d-watt" value="140" oninput="beregn3DPrint()" class="glass-input glass-input-emerald"></div>
                        </div>
                        <div class="bg-emerald-50/80 dark:bg-emerald-900/30 p-5 rounded-2xl border-l-4 border-emerald-500 space-y-2.5 font-medium shadow-inner">
                            <div class="flex justify-between items-center"><span class="text-emerald-800 dark:text-emerald-300 font-bold text-sm">Filament / Strøm:</span><span class="font-mono text-base font-bold text-emerald-700 dark:text-emerald-400" id="p3d-res-split">21.17 kr / 0.64 kr</span></div>
                            <div class="flex justify-between items-center border-t border-emerald-200 dark:border-emerald-800/50 pt-2.5"><span class="text-emerald-900 dark:text-emerald-200 font-bold text-base">Total Selvkost:</span><span class="font-mono text-xl font-extrabold text-emerald-600 dark:text-emerald-400 copy-val" id="p3d-res-total" onclick="kopierTekst(this.innerText.trim(), '3D-Print Kostnad')">21.80 kr</span></div>
                        </div>
                    </div>

                    <div id="card-cnc-p3ddry" class="pers-input bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-sm relative overflow-hidden transition-colors border-l-4 border-l-amber-500">
                        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center"><i data-lucide="thermometer-sun" class="w-6 h-6 mr-3 text-amber-500"></i> Dyse- & Filamenttørking (AMS Pro 2)</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 font-medium">Anbefalte laghøyder, linjebredde og tørketid for ulike filamenter.</p>
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Dysestørrelse (mm)</label>
                                <select id="p3d-nozzle" onchange="beregn3DPrint()" class="glass-input glass-input-amber">
                                    <option value="0.2">0.20 mm (Fin detalj)</option>
                                    <option value="0.4" selected>0.40 mm (Standard)</option>
                                    <option value="0.6">0.60 mm (Sterk / CF-fiber)</option>
                                    <option value="0.8">0.80 mm (Hurtig prototype)</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Filamenttype</label>
                                <select id="p3d-mat" onchange="beregn3DPrint()" class="glass-input glass-input-amber">
                                    <option value="PLA" selected>PLA / PLA+ / Matte</option>
                                    <option value="PETG">PETG / PETG-HF</option>
                                    <option value="ASA">ABS / ASA</option>
                                    <option value="TPU">TPU 95A (Flex)</option>
                                    <option value="PA">PA-CF / PET-CF / Nylon</option>
                                </select>
                            </div>
                        </div>
                        <div class="bg-amber-50/80 dark:bg-amber-900/30 p-5 rounded-2xl border-l-4 border-amber-500 space-y-2.5 font-medium shadow-inner">
                            <div class="flex justify-between items-center"><span class="text-amber-800 dark:text-amber-300 font-bold text-sm">Laghøyde (Min–Maks):</span><span class="font-mono text-base font-bold text-amber-700 dark:text-amber-400" id="p3d-res-layer">0.08 – 0.28 mm (Std: 0.20)</span></div>
                            <div class="flex justify-between items-center border-t border-amber-200 dark:border-amber-800/50 pt-2.5"><span class="text-amber-900 dark:text-amber-200 font-bold text-sm">Tørking (Kammer / AMS):</span><span class="font-mono text-lg font-extrabold text-amber-600 dark:text-amber-400 copy-val" id="p3d-res-dry" onclick="kopierTekst(this.innerText.trim(), 'Tørking')">55 °C i 8 timer</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CNC TAB 5: SVEISING & PLATEARBEID -->
            <div id="ctab-welding" class="cnc-tab-content">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    <div id="card-cnc-weld" class="pers-input bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-sm relative overflow-hidden transition-colors border-l-4 border-l-rose-500">
                        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center"><i data-lucide="flame" class="w-6 h-6 mr-3 text-rose-500"></i> Sveiseparametere (Rørtråd, MIG/MAG & TIG)</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 font-medium">Veiledende strømstyrke (A), spenning (V), trådmating og dekkgass.</p>
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Sveiseprosess</label>
                                <select id="weld-proc" onchange="beregnSveising()" class="glass-input glass-input-rose">
                                    <option value="fcaw" selected>Rørtråd / Flux-Cored (1.2 mm)</option>
                                    <option value="mig10">MIG/MAG Solidtråd (1.0 mm)</option>
                                    <option value="mig08">MIG/MAG Tynnplate (0.8 mm)</option>
                                    <option value="tig">TIG Stål / Rustfritt</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Godstykkelse (mm)</label>
                                <input type="number" step="0.5" min="1" max="30" id="weld-thick" value="6" oninput="beregnSveising()" class="glass-input glass-input-rose">
                            </div>
                        </div>
                        <div class="bg-rose-50/80 dark:bg-rose-900/30 p-5 rounded-2xl border-l-4 border-rose-500 space-y-2.5 font-medium shadow-inner">
                            <div class="flex justify-between items-center"><span class="text-rose-800 dark:text-rose-300 font-bold text-sm">Strøm / Spenning:</span><span class="font-mono text-xl font-extrabold text-rose-600 dark:text-rose-400 copy-val" id="weld-res-amp" onclick="kopierTekst(this.innerText.trim(), 'Sveiseparameter')">210 A / 24.4 V</span></div>
                            <div class="flex justify-between items-center border-t border-rose-200 dark:border-rose-800/50 pt-2.5"><span class="text-rose-900 dark:text-rose-200 font-bold text-sm">Trådmating & Dekkgass:</span><span class="font-mono text-base font-bold text-rose-700 dark:text-rose-300" id="weld-res-gas">~7.8 m/min · 15–18 L/min</span></div>
                        </div>
                    </div>

                    <div id="card-cnc-bend" class="pers-input bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-sm relative overflow-hidden transition-colors border-l-4 border-l-indigo-500">
                        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center"><i data-lucide="fold-vertical" class="w-6 h-6 mr-3 text-indigo-500"></i> Plateknekking (Utbredning & V-dyse)</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 font-medium">Finn utbredt kappelengde for 90° knekk og anbefalt V-åpning i kantpresse.</p>
                        <div class="grid grid-cols-3 gap-4 mb-6">
                            <div><label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tykkelse t (mm)</label><input type="number" step="0.5" id="bend-t" value="4" oninput="beregnPlateknekk()" class="glass-input glass-input-indigo"></div>
                            <div><label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Flens A (mm)</label><input type="number" step="1" id="bend-a" value="100" oninput="beregnPlateknekk()" class="glass-input glass-input-indigo"></div>
                            <div><label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Flens B (mm)</label><input type="number" step="1" id="bend-b" value="100" oninput="beregnPlateknekk()" class="glass-input glass-input-indigo"></div>
                        </div>
                        <div class="bg-indigo-50/80 dark:bg-indigo-900/30 p-5 rounded-2xl border-l-4 border-indigo-500 space-y-2.5 font-medium shadow-inner">
                            <div class="flex justify-between items-center"><span class="text-indigo-800 dark:text-indigo-300 font-bold text-sm">Anbefalt V-dyse (8×t):</span><span class="font-mono text-base font-bold text-indigo-700 dark:text-indigo-300" id="bend-res-vdie">V32 mm (Knekk-fradrag: −6.8 mm)</span></div>
                            <div class="flex justify-between items-center border-t border-indigo-200 dark:border-indigo-800/50 pt-2.5"><span class="text-indigo-900 dark:text-indigo-200 font-bold text-base">Utbredt Kappelengde:</span><span class="font-mono text-xl font-extrabold text-indigo-600 dark:text-indigo-400 copy-val" id="bend-res-flat" onclick="kopierTekst(this.innerText.trim(), 'Kappelengde')">193.2 mm</span></div>
                        </div>
                    </div>
                </div>
            </div>
            `;
            const appInfo = cncSection.querySelector('.app-info');
            if (appInfo) {
                appInfo.insertAdjacentHTML('beforebegin', productionCalculatorMarkup);
            } else {
                cncSection.insertAdjacentHTML('beforeend', productionCalculatorMarkup);
            }
        }

        // -------------------------------------------------------------------------
        // 2. FLYTT C-AKSE GRADERING INN I GRID-CONTAINEREN PÅ FRESING-FANEN
        // -------------------------------------------------------------------------
        const caxisCard = document.getElementById('card-cnc-caxis');
        const millingGrid = document.querySelector('#ctab-milling > .grid');
        if (caxisCard && millingGrid) {
            millingGrid.appendChild(caxisCard);
        }

        // -------------------------------------------------------------------------
        // 3. LEGG TIL VISUELL SVG-SKISSE FOR RETTVINKLET TREKANT & BOLTSIRKEL (PCD)
        // -------------------------------------------------------------------------
        document.querySelectorAll('#tools h3').forEach(h3 => {
            if (h3.innerText.includes('Rettvinklet Trekant')) {
                const card = h3.closest('.pers-input');
                if (card && !document.getElementById('trekant-illustrasjon-svg')) {
                    const p = card.querySelector('p');
                    const illustrasjonHtml = `
                    <div id="trekant-illustrasjon-svg" class="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col items-center justify-center">
                        <svg viewBox="0 0 240 160" class="w-full max-w-[220px] h-auto drop-sm">
                            <polygon points="35,130 205,130 35,25" class="fill-emerald-500/10 dark:fill-emerald-500/15 stroke-emerald-500" stroke-width="3" stroke-linejoin="round" />
                            <rect x="35" y="112" width="18" height="18" fill="none" class="stroke-slate-400 dark:stroke-slate-500" stroke-width="1.5" />
                            <text x="15" y="80" class="text-[11px] font-mono font-bold fill-slate-700 dark:fill-slate-300" text-anchor="middle">a</text>
                            <text x="120" y="148" class="text-[11px] font-mono font-bold fill-slate-700 dark:fill-slate-300" text-anchor="middle">b</text>
                            <text x="128" y="70" class="text-[11px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400" transform="rotate(-32, 120, 75)" text-anchor="middle">c (Hypotenus)</text>
                            <text x="45" y="123" class="text-[10px] font-mono fill-slate-400">90°</text>
                        </svg>
                        <span class="text-[10px] font-mono text-slate-400 mt-2">Visuell skisse (Katet a, Katet b, Hypotenus c)</span>
                    </div>`;
                    if (p) p.insertAdjacentHTML('afterend', illustrasjonHtml);
                }
            }

            if (h3.innerText.includes('Boltsirkel')) {
                const card = h3.closest('.pers-input');
                if (card && !document.getElementById('pcd-illustrasjon-svg')) {
                    const p = card.querySelector('p');
                    const pcdSvgHtml = `
                    <div id="pcd-illustrasjon-svg" class="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col items-center justify-center">
                        <div id="pcd-svg-wrapper" class="w-full max-w-[200px] aspect-square flex items-center justify-center"></div>
                        <span class="text-[10px] font-mono text-slate-400 mt-2">Dynamisk boltsirkel med nummererte hull</span>
                    </div>`;
                    if (p) p.insertAdjacentHTML('afterend', pcdSvgHtml);
                }
                if (card && !document.getElementById('pcd-koordinater-boks')) {
                    const boksHtml = `
                    <div id="pcd-koordinater-boks" class="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">📍 Beregnede X- og Y-koordinater (Senter = 0,0)</h4>
                        <div id="pcd-koordinater-liste" class="max-h-44 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs"></div>
                    </div>`;
                    card.insertAdjacentHTML('beforeend', boksHtml);
                    card.querySelectorAll('input').forEach(inp => inp.addEventListener('input', oppdaterPcdAlt));
                    oppdaterPcdAlt();
                }
            }
        });

        // -------------------------------------------------------------------------
        // 4. LEGG TIL FORKLARINGSKORT FOR TABELLTREKK UNDER LØNNSINNSTILLINGER
        // -------------------------------------------------------------------------
        const stabInnstillinger = document.getElementById('stab-innstillinger');
        if (stabInnstillinger && !document.getElementById('forklaring-tabelltrekk-kort')) {
            const koloner = stabInnstillinger.querySelector('.grid');
            if (koloner) {
                const forklaringsBoksHtml = `
                <div id="forklaring-tabelltrekk-kort" class="pers-input bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-sm border-l-4 border-l-brand-500 lg:col-span-2 mt-6">
                    <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center">
                        <i data-lucide="info" class="w-6 h-6 mr-3 text-brand-500"></i> Hvordan beregnes tabelltrekket?
                    </h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mb-5 border-b border-slate-200 dark:border-slate-800 pb-4 font-medium">
                        Prinsippet bak skattetrekk tabell (7100- og 8000-serien) i kalkulatoren:
                    </p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                            <p class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span class="w-5 h-5 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-mono">1</span>
                                Årsgrunnlag & Omregning
                            </p>
                            <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
                                Månedlig bruttolønn avrundes ned til nærmeste hundre og ganges opp med 12 for å finne <strong>estimert samlet årsinntekt</strong>.
                            </p>
                        </div>
                        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                            <p class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span class="w-5 h-5 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-mono">2</span>
                                Fradrag & Skattegrunnlag
                            </p>
                            <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
                                Standard minstefradrag, personfradrag og det spesifikke tabellfradraget (f.eks. 0 kr for 8000-serien eller 4 000 kr pr. trinn for 7100-serien) trekkes fra for å finne <strong>alminnelig inntekt</strong>.
                            </p>
                        </div>
                        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                            <p class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span class="w-5 h-5 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-mono">3</span>
                                Skatter & Avgifter
                            </p>
                            <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
                                Kalkulatoren summerer opp <strong>trygdeavgift</strong> (7.6%), <strong>fellesskatt</strong> (22% av alminnelig inntekt) og trinnskatt basert på inntektstrinnene.
                            </p>
                        </div>
                        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                            <p class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span class="w-5 h-5 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-mono">4</span>
                                Månedlig Fordeling (10,5 mnd)
                            </p>
                            <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
                                Summen deles på <strong>10,5 måneder</strong> (siden det er skattefri juni og halv skatt i desember i Norge) for å finne det nøyaktige månedlige tabelltrekket.
                            </p>
                        </div>
                    </div>
                </div>`;
                koloner.insertAdjacentHTML('afterend', forklaringsBoksHtml);
            }
        }

        // -------------------------------------------------------------------------
        // 5. OPPDATER ORDBOK, IKONER & SAMMENLEGGBARE KORT
        // -------------------------------------------------------------------------
        if (typeof noToEnDict !== 'undefined') {
            Object.assign(noToEnDict, {
                "Produksjon": "Production",
                "Produksjon & Maskinering": "Production & Machining",
                "Produksjon (CNC, 3D & Sveis)": "Production (CNC, 3D & Weld)",
                "CNC Skjæredata, Dreiing, 3D-Print & Sveising": "CNC Cutting Data, Turning, 3D Print & Welding",
                "🖨️ 3D-Print & Prototype": "🖨️ 3D Print & Prototype",
                "🔥 Sveising & Plate": "🔥 Welding & Sheet Metal",
                "3D-Print Kostnad & Delekalkulator": "3D Print Cost & Part Calculator",
                "Beregn selvkost ut fra filamentvekt, spolepris og printtid (Bambu Lab P2S).": "Calculate part cost from filament weight, spool price and print time.",
                "Vekt inkl. support (g)": "Weight incl. support (g)",
                "Spolepris (kr/kg)": "Spool Price (NOK/kg)",
                "Printtid (Timer)": "Print Time (Hours)",
                "Snitt effekt (Watt)": "Avg. Power (Watts)",
                "Filament / Strøm:": "Filament / Power:",
                "Total Selvkost:": "Total Self-Cost:",
                "Dyse- & Filamenttørking (AMS Pro 2)": "Nozzle & Filament Drying (AMS Pro 2)",
                "Anbefalte laghøyder, linjebredde og tørketid for ulike filamenter.": "Recommended layer heights, line width and drying time for filaments.",
                "Dysestørrelse (mm)": "Nozzle Size (mm)",
                "Filamenttype": "Filament Type",
                "Laghøyde (Min–Maks):": "Layer Height (Min–Max):",
                "Tørking (Kammer / AMS):": "Drying (Chamber / AMS):",
                "Sveiseparametere (Rørtråd, MIG/MAG & TIG)": "Welding Parameters (FCAW, MIG/MAG & TIG)",
                "Veiledende strømstyrke (A), spenning (V), trådmating og dekkgass.": "Recommended current (A), voltage (V), wire feed speed and shielding gas.",
                "Sveiseprosess": "Welding Process",
                "Godstykkelse (mm)": "Material Thickness (mm)",
                "Strøm / Spenning:": "Current / Voltage:",
                "Trådmating & Dekkgass:": "Wire Speed & Shielding Gas:",
                "Plateknekking (Utbredning & V-dyse)": "Sheet Metal Bending (Flat Length & V-Die)",
                "Finn utbredt kappelengde for 90° knekk og anbefalt V-åpning i kantpresse.": "Find flat blank length for 90° bend and recommended V-die opening.",
                "Tykkelse t (mm)": "Thickness t (mm)",
                "Flens A (mm)": "Flange A (mm)",
                "Flens B (mm)": "Flange B (mm)",
                "Anbefalt V-dyse (8×t):": "Recommended V-Die (8×t):",
                "Utbredt Kappelengde:": "Flat Blank Length:",
                "Hvordan beregnes tabelltrekket?": "How is the tax table deduction calculated?",
                "Sideinngrep (ae)": "Radial stepover (ae)",
                "Sideinngrep (% av D)": "Radial stepover (% of D)"
            });
            if (typeof enToNoDict !== 'undefined') {
                Object.keys(noToEnDict).forEach(k => { enToNoDict[noToEnDict[k]] = k; });
            }
        }

        if (typeof initSammenleggbareKort === 'function') initSammenleggbareKort();
        if (typeof initIcons === 'function') initIcons();
        window.beregnChipThinning();
        beregn3DPrint();
        beregnSveising();
        beregnPlateknekk();

        // -------------------------------------------------------------------------
        // 6. DYNAMISK HURTIGSØK-INDEKS (OPPDATERER SELVE CONST-ARRAYEN DIREKTE)
        // -------------------------------------------------------------------------
        const dynamiskIndeks = [
            { title: 'Lønnskalkulator & Netto oversikt', titleEn: 'Salary Calculator & Net Overview', keys: 'lønn skatt netto brutto feriepenger salary tax net gross holiday pay', tab: 'salary', sub: 'oversikt' },
            { title: 'Registrer Vakt & Timebank', titleEn: 'Register Shift & Timebank', keys: 'overtid vakt timebank avspasering 50% 100% overtime shift time off', tab: 'salary', sub: 'vakter' },
            { title: 'Formannstillegg & Skattetabell', titleEn: 'Foreman Bonus & Tax Table', keys: 'formann 20% timelønn tabelltrekk fagforening lo foreman hourly rate union tax', tab: 'salary', sub: 'innstillinger' },
            { title: 'Skattekalkulator: Brutto til netto', titleEn: 'Tax Calculator: Gross to Net', keys: 'skattekalkulator skatt netto brutto trygdeavgift trinnskatt minstefradrag personfradrag alminnelig inntekt marginalskatt tax calculator gross net', tab: 'salary', sub: 'skatt' },
            { title: 'Skattekalkulator: Rentefradrag & renter', titleEn: 'Tax Calculator: Interest Deduction', keys: 'rentefradrag rentekostnader renter boliglån lån gjeldsrenter fradrag interest deduction mortgage loan', tab: 'salary', sub: 'skatt' },
            { title: 'Skattekalkulator: Aksjer & fond (gevinst og tap)', titleEn: 'Tax Calculator: Stocks & Funds (gain and loss)', keys: 'aksjer fond aksjefond gevinst tap realisert fradrag tapt gevinst oppjusteringsfaktor skjermingsfradrag stocks funds gain loss capital', tab: 'salary', sub: 'skatt' },
            { title: 'Skattekalkulator: Trekkprosent', titleEn: 'Tax Calculator: Withholding Rate', keys: 'trekkprosent skattetrekk prosenttrekk skattekort withholding rate tax card', tab: 'salary', sub: 'skatt' },
            { title: 'Skattekalkulator: Hva om (overtid, ekstra fradrag, lønnsøkning)', titleEn: 'Tax Calculator: What If', keys: 'hva om ekstra inntekt overtid bonus lønnsøkning ekstra fradrag what if raise extra income', tab: 'salary', sub: 'skatt' }
        ];

        document.querySelectorAll('.pers-input').forEach(card => {
            const h3 = card.querySelector('h3');
            if (!h3) return;
            
            const tittelSpan = h3.querySelector('span:first-child') || h3;
            const tittel = tittelSpan.innerText.trim();
            if (!tittel) return;

            const mainSection = card.closest('section.tab-content');
            const toolsSub = card.closest('.tools-tab-content');
            const cncSub = card.closest('.cnc-tab-content');
            const evSub = card.closest('.ev-tab-content');
            const salarySub = card.closest('.salary-tab-content');

            let tab = mainSection ? mainSection.id : 'dashboard';
            let sub = '';

            if (toolsSub) sub = toolsSub.id.replace('ttab-', '');
            else if (cncSub) sub = cncSub.id.replace('ctab-', '');
            else if (evSub) sub = evSub.id.replace('etab-', '');
            else if (salarySub) sub = salarySub.id.replace('stab-', '');

            let cardId = card.id;
            if (!cardId) {
                cardId = 'auto_card_' + tittel.toLowerCase().replace(/[^a-z0-9]/g, '_');
                card.id = cardId;
            }

            const kortTekst = card.textContent.toLowerCase();
            const norskTittel = currentLang === 'en' && typeof enToNoDict !== 'undefined' && enToNoDict[tittel]
                ? enToNoDict[tittel]
                : tittel;
            const engTittel = currentLang === 'en'
                ? tittel
                : (typeof noToEnDict !== 'undefined' && noToEnDict[tittel] ? noToEnDict[tittel] : tittel);
            const norskKortTekst = currentLang === 'en' && typeof enToNoDict !== 'undefined'
                ? Object.entries(enToNoDict).reduce((tekst, [engelsk, norsk]) => tekst.split(engelsk.toLowerCase()).join(norsk.toLowerCase()), kortTekst)
                : kortTekst;
            const engelskKortTekst = currentLang !== 'en' && typeof noToEnDict !== 'undefined'
                ? Object.entries(noToEnDict).reduce((tekst, [norsk, engelsk]) => tekst.split(norsk.toLowerCase()).join(engelsk.toLowerCase()), kortTekst)
                : kortTekst;
            dynamiskIndeks.push({
                title: norskTittel,
                titleEn: engTittel,
                keys: `${norskTittel.toLowerCase()} ${engTittel.toLowerCase()} ${kortTekst} ${norskKortTekst} ${engelskKortTekst}`,
                tab: tab,
                sub: sub,
                card: cardId
            });
        });

        // Viktig: Muter den opprinnelige const-arrayen `verktoySokIndeks` direkte!
        if (typeof verktoySokIndeks !== 'undefined' && Array.isArray(verktoySokIndeks)) {
            verktoySokIndeks.length = 0;
            verktoySokIndeks.push(...dynamiskIndeks);
        }

        if (typeof currentLang !== 'undefined' && currentLang === 'en' && typeof oversettDomTekstNoder === 'function') {
            oversettDomTekstNoder();
        }
    }

    // -------------------------------------------------------------------------
    // KALKULATORFUNKSJONER FOR 3D-PRINT, SVEISING & PCD
    // -------------------------------------------------------------------------
    window.beregn3DPrint = function() {
        const w = parseFloat(document.getElementById('p3d-weight')?.value) || 0;
        const spool = parseFloat(document.getElementById('p3d-spool')?.value) || 0;
        const hrs = parseFloat(document.getElementById('p3d-hours')?.value) || 0;
        const watt = parseFloat(document.getElementById('p3d-watt')?.value) || 0;
        const kwhPrice = parseFloat(document.getElementById('charge-price')?.value) || 1.30;

        const matCost = (w / 1000) * spool;
        const pwrCost = (watt / 1000) * hrs * kwhPrice;
        const total = matCost + pwrCost;

        const splitEl = document.getElementById('p3d-res-split');
        const totEl = document.getElementById('p3d-res-total');
        if (splitEl) splitEl.innerText = `${matCost.toFixed(2)} kr / ${pwrCost.toFixed(2)} kr`;
        if (totEl) totEl.innerText = `${total.toFixed(2)} kr`;

        const noz = parseFloat(document.getElementById('p3d-nozzle')?.value) || 0.4;
        const mat = document.getElementById('p3d-mat')?.value || 'PLA';
        const dryMap = {
            PLA: '55 °C i 8 timer',
            PETG: '65 °C i 8 timer',
            ASA: '80 °C i 8 timer',
            TPU: '70 °C i 8 timer',
            PA: '85 °C i 12 timer'
        };
        const layerEl = document.getElementById('p3d-res-layer');
        const dryEl = document.getElementById('p3d-res-dry');
        if (layerEl) layerEl.innerText = `${(noz * 0.2).toFixed(2)} – ${(noz * 0.7).toFixed(2)} mm (Std: ${(noz * 0.5).toFixed(2)})`;
        if (dryEl) dryEl.innerText = dryMap[mat] || '55 °C i 8 timer';
    };

    window.beregnSveising = function() {
        const proc = document.getElementById('weld-proc')?.value || 'fcaw';
        const t = parseFloat(document.getElementById('weld-thick')?.value) || 6;
        let amp = Math.round(t * 35);
        let volt = (16 + t * 1.4).toFixed(1);
        let gas = `~${(t * 1.3).toFixed(1)} m/min · 15–18 L/min`;

        if (proc === 'mig10') {
            amp = Math.round(t * 33);
            volt = (15.5 + t * 1.2).toFixed(1);
            gas = `~${(t * 1.2).toFixed(1)} m/min · 12–15 L/min Mison 18`;
        } else if (proc === 'mig08') {
            amp = Math.round(t * 30);
            volt = (14.5 + t * 1.1).toFixed(1);
            gas = `~${(t * 1.5).toFixed(1)} m/min · 10–12 L/min Mison 18`;
        } else if (proc === 'tig') {
            amp = Math.round(t * 32);
            volt = '11–14';
            gas = '8–10 L/min Ren Argon (99.99%)';
        }

        const ampEl = document.getElementById('weld-res-amp');
        const gasEl = document.getElementById('weld-res-gas');
        if (ampEl) ampEl.innerText = `${amp} A / ${volt} V`;
        if (gasEl) gasEl.innerText = gas;
    };

    window.beregnPlateknekk = function() {
        const t = parseFloat(document.getElementById('bend-t')?.value) || 4;
        const a = parseFloat(document.getElementById('bend-a')?.value) || 100;
        const b = parseFloat(document.getElementById('bend-b')?.value) || 100;
        const vDie = Math.round(t * 8);
        const bd = 1.7 * t;
        const flat = (a + b) - bd;

        const vEl = document.getElementById('bend-res-vdie');
        const fEl = document.getElementById('bend-res-flat');
        if (vEl) vEl.innerText = `V${vDie} mm (Knekk-fradrag: −${bd.toFixed(1)} mm)`;
        if (fEl) fEl.innerText = `${flat.toFixed(1)} mm`;
    };

    window.oppdaterPcdAlt = function() {
        const diaEl = document.getElementById('pcd-dia');
        const numEl = document.getElementById('pcd-num');
        const listeEl = document.getElementById('pcd-koordinater-liste');
        const svgWrap = document.getElementById('pcd-svg-wrapper');
        if (!diaEl || !numEl || !listeEl || !svgWrap) return;

        const pcd = parseFloat(diaEl.value) || 0;
        const antall = parseInt(numEl.value) || 0;
        const r = pcd / 2;

        if (antall <= 0 || pcd <= 0) {
            listeEl.innerHTML = '<p class="text-slate-400 text-center py-2">Angi gyldig diameter og antall hull.</p>';
            svgWrap.innerHTML = '<span class="text-xs text-slate-400">Ugyldige mål</span>';
            return;
        }

        let svgHtml = `<svg viewBox="0 0 200 200" class="w-full h-full drop-sm">
            <circle cx="100" cy="100" r="82" fill="none" class="stroke-slate-300 dark:stroke-slate-700" stroke-width="1.5" stroke-dasharray="3,3" />
            <circle cx="100" cy="100" r="58" fill="none" class="stroke-indigo-500" stroke-width="1.5" stroke-dasharray="4,4" />
            <line x1="90" y1="100" x2="110" y2="100" class="stroke-slate-400" stroke-width="1" />
            <line x1="100" y1="90" x2="100" y2="110" class="stroke-slate-400" stroke-width="1" />`;

        let htmlListe = '';
        const sRadiusSvg = 58;

        for (let i = 0; i < antall; i++) {
            const vinkelDeg = i * (360 / antall);
            const vinkelRad = vinkelDeg * (Math.PI / 180);
            const xReal = r * Math.cos(vinkelRad);
            const yReal = r * Math.sin(vinkelRad);

            const svgX = 100 + sRadiusSvg * Math.cos(vinkelRad);
            const svgY = 100 + sRadiusSvg * Math.sin(vinkelRad);
            const tX = svgX + (Math.cos(vinkelRad) * 14);
            const tY = svgY + (Math.sin(vinkelRad) * 14) + 3;

            svgHtml += `
            <circle cx="${svgX.toFixed(1)}" cy="${svgY.toFixed(1)}" r="7" class="fill-indigo-600 dark:fill-indigo-500 stroke-white dark:stroke-slate-900" stroke-width="1.5" />
            <text x="${tX.toFixed(1)}" y="${tY.toFixed(1)}" class="text-[9px] font-mono font-bold fill-slate-800 dark:fill-slate-200" text-anchor="middle">${i + 1}</text>`;

            htmlListe += `
            <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <span class="font-bold text-indigo-600 dark:text-indigo-400">Hull ${i + 1} (${vinkelDeg.toFixed(1)}°)</span>
                <span class="text-slate-700 dark:text-slate-200">X = <strong class="text-slate-900 dark:text-white">${xReal.toFixed(3)}</strong></span>
                <span class="text-slate-700 dark:text-slate-200">Y = <strong class="text-slate-900 dark:text-white">${yReal.toFixed(3)}</strong></span>
            </div>`;
        }

        svgHtml += `</svg>`;
        svgWrap.innerHTML = svgHtml;
        listeEl.innerHTML = htmlListe;
    };

    // -------------------------------------------------------------------------
    // OPPDATER URL-HASH & HURTIGSØK-NAVIGASJON FOR ALLE FANER
    // -------------------------------------------------------------------------
    window.lesStateFraUrlHash = function() {
        const hash = (window.location.hash || '').replace(/^#/, '');
        if (!hash) return false;
        const [mainTab, subTab] = hash.split('/');
        const gyldigeMain = ['dashboard', 'salary', 'cnc', 'tools', 'ev'];
        if (gyldigeMain.includes(mainTab)) {
            switchTab(mainTab, false);
            if (mainTab === 'salary' && ['oversikt', 'vakter', 'innstillinger'].includes(subTab)) {
                switchSalaryTab(subTab, false);
            }
            if (mainTab === 'cnc' && ['milling', 'turning', 'print3d', 'welding'].includes(subTab)) {
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
    };

    window.gaaTilSokResultat = function(idx) {
        if (typeof verktoySokIndeks === 'undefined' || !verktoySokIndeks[idx]) return;
        const item = verktoySokIndeks[idx];
        lukkSokModal();

        if (typeof switchTab === 'function') switchTab(item.tab);

        setTimeout(() => {
            if (item.tab === 'tools' && typeof switchToolsTab === 'function' && item.sub) switchToolsTab(item.sub);
            if (item.tab === 'cnc' && typeof switchCncTab === 'function' && item.sub) switchCncTab(item.sub);
            if (item.tab === 'ev' && typeof switchEvTab === 'function' && item.sub) switchEvTab(item.sub);
            if (item.tab === 'salary' && typeof switchSalaryTab === 'function' && item.sub) switchSalaryTab(item.sub);

            setTimeout(() => {
                let cardEl = item.card ? document.getElementById(item.card) : null;
                if (!cardEl) {
                    const matchingH3 = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.toLowerCase().includes(item.title.toLowerCase()));
                    if (matchingH3) cardEl = matchingH3.closest('.pers-input');
                }

                if (cardEl) {
                    cardEl.classList.remove('card-collapsed');
                    const chev = cardEl.querySelector('.collapse-chevron');
                    if (chev) chev.innerText = '−';
                    cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    cardEl.classList.add('card-search-highlight');
                    setTimeout(() => cardEl.classList.remove('card-search-highlight'), 2400);
                }
            }, 80);
        }, 60);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAlleTilleggOgFiks);
    } else {
        initAlleTilleggOgFiks();
    }
})();
