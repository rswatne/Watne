(function () {
    const databaseName = 'verkstedportalen-manuals';
    const databaseVersion = 2;
    const maxResults = 15;
    let databasePromise;
    let pagesPromise;
    let searchSequence = 0;

    function currentLanguage() {
        return localStorage.getItem('verksted_lang') || 'no';
    }

    function status(norsk, engelsk, isError = false) {
        const element = document.getElementById('manual-library-status');
        if (!element) return;
        element.textContent = currentLanguage() === 'en' ? engelsk : norsk;
        element.classList.toggle('text-rose-600', isError);
        element.classList.toggle('dark:text-rose-400', isError);
    }

    function openDatabase() {
        if (!('indexedDB' in window)) {
            return Promise.reject(new Error('IndexedDB is not supported in this browser.'));
        }
        if (!databasePromise) {
            databasePromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(databaseName, databaseVersion);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains('documents')) {
                        db.createObjectStore('documents', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('pages')) {
                        const pages = db.createObjectStore('pages', { keyPath: ['documentId', 'pageNumber'] });
                        pages.createIndex('documentId', 'documentId', { unique: false });
                    }
                    if (!db.objectStoreNames.contains('pdfs')) {
                        db.createObjectStore('pdfs', { keyPath: 'id' });
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error || new Error('Could not open the local manual database.'));
            });
        }
        return databasePromise;
    }

    function transactionComplete(transaction) {
        return new Promise((resolve, reject) => {
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error || new Error('Manual database transaction failed.'));
            transaction.onabort = () => reject(transaction.error || new Error('Manual database transaction was aborted.'));
        });
    }

    function readAll(storeName) {
        return openDatabase().then(db => new Promise((resolve, reject) => {
            const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error(`Could not read ${storeName}.`));
        }));
    }

    function normalize(value) {
        return value.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/æ/g, 'ae')
            .replace(/[ø]/g, 'o')
            .replace(/[å]/g, 'a')
            .replace(/[^a-z0-9%]+/g, ' ')
            .trim();
    }

    function snippetFor(text, terms) {
        const normalized = normalize(text);
        const matches = terms.map(term => normalized.indexOf(term)).filter(index => index >= 0);
        const offset = matches.length ? Math.min(...matches) : 0;
        const start = Math.max(0, offset - 90);
        const end = Math.min(text.length, start + 240);
        return `${start > 0 ? '…' : ''}${text.slice(start, end).replace(/\s+/g, ' ').trim()}${end < text.length ? '…' : ''}`;
    }

    function createManualResult(page, documentRecord, terms) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'w-full text-left px-3.5 py-3 rounded-2xl bg-slate-50 hover:bg-brand-500/10 dark:bg-slate-800/70 dark:hover:bg-brand-500/15 border border-slate-200/70 dark:border-slate-700/60 transition-colors';
        button.addEventListener('click', () => openManual(page.documentId, page.pageNumber));

        const heading = document.createElement('div');
        heading.className = 'flex items-start justify-between gap-3';
        const title = document.createElement('span');
        title.className = 'text-xs font-bold text-slate-900 dark:text-white break-all';
        title.textContent = documentRecord.name;
        const pageLabel = document.createElement('span');
        pageLabel.className = 'shrink-0 text-[10px] font-mono font-bold text-brand-700 dark:text-brand-300';
        pageLabel.textContent = currentLanguage() === 'en' ? `PAGE ${page.pageNumber}` : `SIDE ${page.pageNumber}`;
        heading.append(title, pageLabel);

        const excerpt = document.createElement('p');
        excerpt.className = 'mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300';
        excerpt.textContent = snippetFor(page.text, terms);
        button.append(heading, excerpt);
        return button;
    }

    function search(query) {
        const container = document.getElementById('manual-search-results');
        if (!container) return;
        const sequence = ++searchSequence;
        const terms = normalize(query).split(/\s+/).filter(Boolean);
        if (!terms.length) {
            container.replaceChildren();
            return;
        }
        container.replaceChildren();

        if (!pagesPromise) {
            pagesPromise = readAll('pages');
        }
        pagesPromise.then(async pages => {
            if (sequence !== searchSequence) return;
            const documents = await readAll('documents');
            if (sequence !== searchSequence) return;
            const documentMap = new Map(documents.map(document => [document.id, document]));
            const matches = [];

            for (const page of pages) {
                const documentRecord = documentMap.get(page.documentId);
                if (!documentRecord) continue;
                const text = normalize(`${documentRecord.name} ${page.text}`);
                if (!terms.every(term => text.includes(term))) continue;
                const score = terms.reduce((total, term) => {
                    const occurrences = text.split(term).length - 1;
                    return total + Math.min(occurrences, 8);
                }, 0);
                matches.push({ page, documentRecord, score });
            }

            matches.sort((a, b) => b.score - a.score);
            const results = matches.slice(0, maxResults).map(match =>
                createManualResult(match.page, match.documentRecord, terms));
            if (sequence !== searchSequence) return;
            if (results.length) {
                container.replaceChildren(...results);
            } else {
                const empty = document.createElement('p');
                empty.className = 'text-[11px] text-slate-500 dark:text-slate-400 py-2';
                empty.textContent = currentLanguage() === 'en'
                    ? 'No manual matches. Scanned pages may require OCR.'
                    : 'Ingen treff i manualene. Skannede sider kan kreve OCR.';
                container.replaceChildren(empty);
            }
        }).catch(error => {
            if (sequence !== searchSequence) return;
            container.replaceChildren();
            status('Kunne ikke lese det lokale manualbiblioteket.', 'Could not read the local manual library.', true);
            console.error('Manual search failed:', error);
        });
    }

    function renderDocuments(documents) {
        const container = document.getElementById('manual-library-documents');
        if (!container) return;
        container.replaceChildren();
        documents.forEach(documentRecord => {
            const chip = document.createElement('div');
            chip.className = 'flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-2.5 pr-1 py-1';
            const open = document.createElement('button');
            open.type = 'button';
            open.className = 'max-w-[190px] truncate text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400';
            open.textContent = `${documentRecord.name} · ${documentRecord.pageCount} s.`;
            open.title = currentLanguage() === 'en' ? 'Open PDF' : 'Åpne PDF';
            open.addEventListener('click', () => openManual(documentRecord.id, 1));
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'px-1.5 py-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400';
            remove.textContent = '×';
            remove.title = currentLanguage() === 'en' ? 'Remove manual' : 'Fjern manual';
            remove.setAttribute('aria-label', `${remove.title}: ${documentRecord.name}`);
            remove.addEventListener('click', () => deleteManual(documentRecord.id));
            chip.append(open, remove);
            container.append(chip);
        });

        if (documents.length) {
            const count = documents.length;
            status(`${count} manual${count === 1 ? '' : 'er'} lagret lokalt · skannede diagrammer kan åpnes, men krever OCR for tekstsøk.`, `${count} manual${count === 1 ? '' : 's'} stored locally · scanned diagrams can be opened but require OCR for text search.`);
        } else {
            status('Søk i manualene eller legg til PDF-er. Filene lagres bare i denne nettleseren.', 'Search manuals or add PDFs. Files stay in this browser.');
        }
    }

    async function refreshDocuments() {
        const documents = await readAll('documents');
        renderDocuments(documents);
        pagesPromise = null;
    }

    let pdfLoader = null;
    function loadPdfJs() {
        if (window.pdfjsLib) return Promise.resolve();
        if (!pdfLoader) {
            pdfLoader = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                script.onload = resolve;
                script.onerror = () => { pdfLoader = null; reject(new Error('pdf.js failed to load')); };
                document.head.appendChild(script);
            });
        }
        return pdfLoader;
    }

    async function importFiles(fileList) {
        const files = Array.from(fileList || []);
        if (!files.length) return;
        await loadPdfJs().catch(() => {});
        if (!window.pdfjsLib) {
            status('PDF-leseren kunne ikke lastes. Kontroller internettilkoblingen og prøv igjen.', 'The PDF reader could not load. Check your internet connection and try again.', true);
            return;
        }

        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
            const file = files[fileIndex];
            if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                status(`Hoppet over ${file.name}: filen er ikke en PDF.`, `Skipped ${file.name}: this is not a PDF.`, true);
                continue;
            }
            status(`Leser ${file.name} (${fileIndex + 1}/${files.length}) …`, `Reading ${file.name} (${fileIndex + 1}/${files.length}) …`);
            try {
                const data = new Uint8Array(await file.arrayBuffer());
                const pdf = await window.pdfjsLib.getDocument({ data }).promise;
                const pages = [];
                let pagesWithText = 0;
                for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                    const page = await pdf.getPage(pageNumber);
                    const content = await page.getTextContent();
                    const text = content.items
                        .map(item => ('str' in item ? item.str : ''))
                        .join(' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    if (text) pagesWithText++;
                    pages.push({ pageNumber, text });
                    if (pageNumber % 20 === 0) {
                        status(
                            `Indekserer ${file.name}: side ${pageNumber} av ${pdf.numPages} …`,
                            `Indexing ${file.name}: page ${pageNumber} of ${pdf.numPages} …`
                        );
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }

                const db = await openDatabase();
                const documentId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                const transaction = db.transaction(['documents', 'pages', 'pdfs'], 'readwrite');
                transaction.objectStore('documents').put({
                    id: documentId,
                    name: file.name,
                    pageCount: pdf.numPages,
                    pagesWithText,
                    importedAt: new Date().toISOString()
                });
                transaction.objectStore('pdfs').put({ id: documentId, blob: file });
                const pageStore = transaction.objectStore('pages');
                pages.forEach(page => pageStore.put({
                    documentId,
                    pageNumber: page.pageNumber,
                    text: page.text
                }));
                await transactionComplete(transaction);
                pagesPromise = null;
                status(
                    `${file.name} indeksert: ${pagesWithText} av ${pdf.numPages} sider har søkbar tekst.`,
                    `${file.name} indexed: ${pagesWithText} of ${pdf.numPages} pages contain searchable text.`
                );
            } catch (error) {
                console.error(`Could not index PDF ${file.name}:`, error);
                status(`Kunne ikke indeksere ${file.name}: ${error.message || 'ukjent feil'}.`, `Could not index ${file.name}: ${error.message || 'unknown error'}.`, true);
            }
        }
        try {
            await refreshDocuments();
            search(document.getElementById('global-search-input')?.value || '');
        } catch (error) {
            console.error('Could not refresh manual list:', error);
            status('Kunne ikke oppdatere manualbiblioteket.', 'Could not refresh the manual library.', true);
        }
    }

    async function openManual(documentId, pageNumber) {
        const tab = window.open('about:blank', '_blank');
        if (!tab) {
            status('Nettleseren blokkerte PDF-vinduet. Tillat popup-vinduer og prøv igjen.', 'The browser blocked the PDF tab. Allow pop-ups and try again.', true);
            return;
        }
        try {
            const pdfRecord = await openDatabase().then(db => new Promise((resolve, reject) => {
                const request = db.transaction('pdfs', 'readonly').objectStore('pdfs').get(documentId);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error || new Error('Could not open the selected PDF.'));
            }));
            if (!pdfRecord) throw new Error('Manual not found in local storage.');
            const url = URL.createObjectURL(pdfRecord.blob);
            tab.location.href = `${url}#page=${pageNumber}`;
        } catch (error) {
            tab.close();
            console.error('Could not open manual PDF:', error);
            status('Kunne ikke åpne PDF-en fra lokal lagring.', 'Could not open the PDF from local storage.', true);
        }
    }

    async function deleteManual(documentId) {
        try {
            const db = await openDatabase();
            const transaction = db.transaction(['documents', 'pages', 'pdfs'], 'readwrite');
            transaction.objectStore('documents').delete(documentId);
            transaction.objectStore('pdfs').delete(documentId);
            const request = transaction.objectStore('pages').index('documentId').openKeyCursor(IDBKeyRange.only(documentId));
            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    transaction.objectStore('pages').delete(cursor.primaryKey);
                    cursor.continue();
                }
            };
            await transactionComplete(transaction);
            await refreshDocuments();
            search(document.getElementById('global-search-input')?.value || '');
        } catch (error) {
            console.error('Could not remove manual:', error);
            status('Kunne ikke fjerne manualen fra lokal lagring.', 'Could not remove the manual from local storage.', true);
        }
    }

    window.ManualSok = { importFiles, search };
    openDatabase().then(refreshDocuments).catch(error => {
        console.error('Could not initialize manual library:', error);
        status('Lokal lagring er utilgjengelig i denne nettleseren.', 'Local storage is unavailable in this browser.', true);
    });
})();
