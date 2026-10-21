(function () {
    const storageKey = 'beta_layout';
    const layouts = { hyper: null };
    const tiltLayouts = ['aurora', 'hyper'];
    const tabTitles = { dashboard: 'Oversikt', salary: 'Lønn', cnc: 'Maskinering', tools: 'Tabeller', ev: 'Strøm', amounts: 'Mengder', datetime: 'Dato & tid' };
    const cardSelector = '.tab-content :is([class*="rounded-2xl"], [class*="rounded-3xl"])[class*="border"]:not(button):not(a)';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let tiltedCard = null;
    let hyperBuilt = false;
    let scrollFrame = 0;

    function resetTilt() {
        if (tiltedCard) tiltedCard.style.transform = '';
        tiltedCard = null;
    }

    function buildHyper() {
        if (hyperBuilt) return;
        hyperBuilt = true;
        const stage = document.createElement('div');
        stage.className = 'hyper-stage';
        stage.setAttribute('aria-hidden', 'true');
        stage.innerHTML = `
            <div class="hy-colors"><i class="hy-blob"></i><i class="hy-blob"></i><i class="hy-blob"></i><i class="hy-blob"></i></div>
            <div class="hy-grid"></div>
            <span class="hy-word">VERKSTED</span>
            <span class="hy-word">PORTAL</span>
            <i class="hy-orb"></i><i class="hy-orb"></i>
            <div class="hy-scene"><div class="hy-cube-pivot">
                <div class="hy-ring"></div><div class="hy-ring hy-ring-2"></div>
                <div class="hy-cube"><i class="hy-face"></i><i class="hy-face"></i><i class="hy-face"></i><i class="hy-face"></i><i class="hy-face"></i><i class="hy-face"></i></div>
            </div></div>`;
        document.body.prepend(stage);

        const hero = document.createElement('div');
        hero.className = 'hyper-hero';
        hero.innerHTML = '<p class="hyper-hero-kicker">VERKSTEDSPORTALEN</p><div class="hyper-hero-title" aria-hidden="true"></div><button type="button" class="hyper-hero-new">Ny visdom ↻</button>';
        hero.querySelector('.hyper-hero-new').addEventListener('click', () => setHeroTitle('dashboard', true));
        const topbar = document.querySelector('main .beta-topbar');
        (topbar || document.querySelector('main')).insertAdjacentElement(topbar ? 'afterend' : 'afterbegin', hero);

        const main = document.querySelector('main');
        main.addEventListener('scroll', () => {
            if (scrollFrame || document.body.dataset.layout !== 'hyper') return;
            scrollFrame = requestAnimationFrame(() => {
                scrollFrame = 0;
                document.body.style.setProperty('--sy', main.scrollTop);
            });
        }, { passive: true });

        document.addEventListener('verksted:tab-open', event => {
            setHeroTitle(event.detail?.tabId);
            main.scrollTo({ top: 0, behavior: 'instant' });
        });

        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        const toTop = () => { main.scrollTop = 0; window.scrollTo(0, 0); document.body.style.setProperty('--sy', 0); };
        toTop();
        window.addEventListener('load', () => { toTop(); setTimeout(toTop, 150); setTimeout(toTop, 600); });
        window.addEventListener('pageshow', toTop);
    }

    const janteOpeners = ['Du skal ikke tro at du er', 'Ikke tro at du er', 'Ingen her tror at du er', 'Det kommer aldri noe godt av å tro at du er'];
    const janteTraits = ['noe spesielt', 'bedre enn oss andre', 'smartere enn manualen', 'viktigere enn kollegaen din', 'en fresemaskin i en verden av hammere', 'ekspert fordi du leste én tabell', 'mer presis enn oss andre', 'verdt en lønnsøkning'];
    const janteSayings = [
        'Den som måler to ganger, tror han er bedre enn oss som kapper på øyemål.',
        'Ingen har blitt husket for å gjøre jobben riktig første gang.',
        'Den som har ryddig arbeidsbenk, har sikkert ikke nok å gjøre.',
        'Stolthet kommer før fall, og før kaffepausen.',
        'Ikke lyst for høyt, vi har en ordentlig lysarmatur for det.',
        'Er du fornøyd med resultatet, har du nok ikke sett det riktig.',
        'Det er ikke verktøyet som er trubbig, det er du som overvurderer deg selv.',
        'Den som kommer først, har sikkert ikke lest tegningen.',
        'Ingen blir klokere av å ha rett, men mange blir upopulære.',
        'Gjør du det bra, så var det nok flaks. Gjør du det dårlig, så var det typisk deg.',
        'Toleransen er ±0,01. Dine ambisjoner bør ligge langt innenfor.',
        'Du er ikke uerstattelig. Det er derfor vi har en vikar.'
    ];

    function janteSaying() {
        const pick = list => list[Math.floor(Math.random() * list.length)];
        if (Math.random() < 0.5) return pick(janteSayings);
        return `${pick(janteOpeners)} ${pick(janteTraits)}.`;
    }

    function renderTitle(title, text) {
        let index = 0;
        title.replaceChildren(...text.split(' ').map(word => {
            const wrap = document.createElement('span');
            wrap.className = 'hy-word-wrap';
            [...word].forEach(char => {
                const letter = document.createElement('span');
                letter.style.setProperty('--i', Math.min(index++, 24));
                letter.textContent = char;
                wrap.append(letter);
            });
            index++;
            return wrap;
        }));
    }

    function setHeroTitle(tabId, force) {
        const id = tabId || document.querySelector('.tab-content.active')?.id;
        const title = document.querySelector('.hyper-hero-title');
        if (!title || !id || (title.dataset.tab === id && !force)) return;
        title.dataset.tab = id;
        const jante = id === 'dashboard';
        title.classList.toggle('is-saying', jante);
        const hero = title.closest('.hyper-hero');
        hero.classList.toggle('is-jante', jante);
        hero.hidden = !jante;
        hero.querySelector('.hyper-hero-kicker').textContent = jante ? '' : 'VERKSTEDSPORTALEN';
        renderTitle(title, jante ? janteSaying() : (tabTitles[id] || id));
    }

    function trackPointer(event) {
        const layout = document.body.dataset.layout;
        if (!tiltLayouts.includes(layout) || frame) return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            document.body.style.setProperty('--gx', event.clientX + 'px');
            document.body.style.setProperty('--gy', event.clientY + 'px');
            if (layout === 'hyper' && !reducedMotion) {
                document.body.style.setProperty('--hy-ry', (event.clientX / innerWidth - 0.5) * 140);
                document.body.style.setProperty('--hy-rx', -18 - (event.clientY / innerHeight - 0.5) * 90);
            }
            const card = event.target.closest?.(cardSelector);
            if (!card) return resetTilt();
            const box = card.getBoundingClientRect();
            const x = event.clientX - box.left;
            const y = event.clientY - box.top;
            card.style.setProperty('--mx', x + 'px');
            card.style.setProperty('--my', y + 'px');
            resetTilt();
        });
    }

    document.addEventListener('pointermove', trackPointer, { passive: true });
    document.addEventListener('pointerleave', resetTilt);

    function labelNavigation() {
        document.querySelectorAll('body > aside:first-of-type > nav > *').forEach(item => {
            const label = item.textContent.replace(/\s+/g, ' ').replace(/\s\d$/, '').trim();
            item.dataset.label = label;
            item.title = label;
        });
    }

    function applyTheme(name) {
        const forced = layouts[name];
        const dark = forced ? forced === 'dark' : localStorage.getItem('theme') === 'dark';
        document.documentElement.classList.toggle('dark', dark);
    }

    function applyLayout(requested) {
        const name = Object.prototype.hasOwnProperty.call(layouts, requested) ? requested : 'hyper';
        document.body.dataset.layout = name;
        localStorage.setItem(storageKey, name);
        applyTheme(name);
        resetTilt();
        if (name === 'hyper') {
            buildHyper();
            setHeroTitle();
            setTimeout(setHeroTitle, 400);
        }
        document.querySelectorAll('[data-layout-choice]').forEach(button => {
            const active = button.dataset.layoutChoice === name;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }

    document.querySelectorAll('[data-layout-choice]').forEach(button => {
        button.addEventListener('click', () => applyLayout(button.dataset.layoutChoice));
    });

    labelNavigation();
    document.body.classList.add('hy-rail-open');
    applyLayout('hyper');
})();
