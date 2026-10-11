(function() {
    if (document.getElementById('sigrid-widget-container')) return;

    // Inject CSS for Mobile Responsiveness
    const style = document.createElement('style');
    style.innerHTML = `
        #sigrid-widget-modal-box {
            background: var(--card, #ffffff);
            border-radius: 1.25rem;
            border: 1px solid var(--line, #e2e8f0);
            max-width: 32rem;
            width: 100%;
            height: 85vh;
            max-height: 38rem;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            transition: all 0.2s ease;
        }
        @media (max-width: 640px) {
            #sigrid-widget-modal {
                padding: 0 !important;
            }
            #sigrid-widget-modal-box {
                max-width: 100% !important;
                width: 100% !important;
                height: 100% !important;
                max-height: 100vh !important;
                border-radius: 0 !important;
                border: none !important;
            }
        }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'sigrid-widget-container';
    container.innerHTML = `
        <div id="sigrid-float-btn" onclick="toggleSigridWidget()" style="position: fixed; bottom: 4.5rem; right: 1rem; z-index: 99999; background: linear-gradient(135deg, #7c3aed, #0284c7); color: white; border-radius: 9999px; padding: 0.625rem 1.125rem; font-family: 'Inter', sans-serif; font-size: 0.875rem; font-weight: 800; box-shadow: 0 10px 25px rgba(124, 58, 237, 0.4); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; border: 2px solid #ffffff; transition: transform 0.2s ease;">
            <span style="font-size: 1.25rem;">🤖</span>
            <span>Spør Sigrid</span>
        </div>

        <div id="sigrid-widget-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(6px); z-index: 100000; justify-content: center; align-items: center; padding: 0.75rem;">
            <div id="sigrid-widget-modal-box">
                <div style="padding: 0.75rem 1rem; background: var(--bg, #f8fafc); border-bottom: 1px solid var(--line, #e2e8f0); display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.25rem;">🤖</span>
                        <h3 style="margin: 0; font-size: 0.9375rem; font-weight: 800; color: #6d28d9;">Sigrid AI Assistent</h3>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <a href="chat.html" style="font-size: 0.75rem; font-weight: 700; color: #0284c7; text-decoration: none;">Fullskjerm ↗</a>
                        <button type="button" style="background: none; border: none; font-size: 1.25rem; cursor: pointer; color: #64748b; padding: 0 0.25rem;" onclick="toggleSigridWidget()">✕</button>
                    </div>
                </div>
                <iframe src="chat.html" style="width: 100%; height: 100%; border: none;"></iframe>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    window.toggleSigridWidget = function() {
        const modal = document.getElementById('sigrid-widget-modal');
        if (modal) {
            modal.style.display = (modal.style.display === 'none' || !modal.style.display) ? 'flex' : 'none';
        }
    };
})();
