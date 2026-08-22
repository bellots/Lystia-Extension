function show(platform, enabled, useSettingsInsteadOfPreferences) {
    document.body.classList.add(`platform-${platform}`);

    if (useSettingsInsteadOfPreferences) {
        document.getElementsByClassName('platform-mac state-on')[0].innerText = "L’estensione Lystia è attiva in Safari.";
        document.getElementsByClassName('platform-mac state-off')[0].innerText = "L’estensione Lystia non è ancora attiva. Puoi abilitarla nella sezione Estensioni delle impostazioni di Safari.";
        document.getElementsByClassName('platform-mac state-unknown')[0].innerText = "Attiva Lystia nella sezione Estensioni delle impostazioni di Safari.";
        document.getElementsByClassName('platform-mac open-preferences')[0].innerText = "Apri le impostazioni di Safari…";
    }

    if (typeof enabled === "boolean") {
        document.body.classList.toggle(`state-on`, enabled);
        document.body.classList.toggle(`state-off`, !enabled);
    } else {
        document.body.classList.remove(`state-on`);
        document.body.classList.remove(`state-off`);
    }
}

function openPreferences() {
    webkit.messageHandlers.controller.postMessage("open-preferences");
}

document.querySelector("button.open-preferences").addEventListener("click", openPreferences);
