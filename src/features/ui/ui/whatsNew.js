/**
 * Checks for application updates and displays a "What's New" modal if needed.
 */
export async function initWhatsNew() {
    const whatsNewModal = document.getElementById('whats-new-modal');
    if (!whatsNewModal) return;

    try {
        const response = await fetch('./changelog.json');
        if (!response.ok) return;

        const changelog = await response.json();
        const latestVersion = changelog.version;
        const lastSeenVersion = localStorage.getItem('gymcrm-version');

        if (latestVersion !== lastSeenVersion) {
            // Populate and show the modal
            document.getElementById('whats-new-version').textContent = `v${latestVersion}`;
            const changesList = document.getElementById('whats-new-changes');
            changesList.innerHTML = '';
            changelog.changes.forEach(change => {
                const li = document.createElement('li');
                li.textContent = change;
                changesList.appendChild(li);
            });

            whatsNewModal.classList.add('active');

            // Use a MutationObserver to robustly detect when the modal is closed
            const observer = new MutationObserver((mutationsList, obs) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class' && !whatsNewModal.classList.contains('active')) {
                        // The 'active' class was removed, so the modal is now hidden
                        localStorage.setItem('gymcrm-version', latestVersion);
                        obs.disconnect(); // Stop observing once the action is done
                        return;
                    }
                }
            });
            observer.observe(whatsNewModal, { attributes: true });
        }
    } catch (error) {
        console.error("Could not fetch or process changelog:", error);
    }
}