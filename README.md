# Lystia Browser Extension

WebExtension condivisa per Chrome/Chromium e Safari. Dal popup l’utente può:

- accedere con email e password;
- importare il prodotto della scheda attiva tramite il backend Lystia;
- controllare titolo, prezzo, negozio, descrizione e immagine;
- scegliere una wishlist attiva e salvare il desiderio.

L’estensione non inietta script nelle pagine e non richiede accesso permanente alla cronologia. Usa solamente `activeTab`, lo storage locale dell’estensione e l’host del frontend Lystia configurato durante il build.

## Build locale per Chrome

Il build non richiede dipendenze npm esterne; è sufficiente Node.js 20 o successivo.

```bash
cd Lystia-Extension
npm run check
npm run build
```

`npm run build` configura `http://localhost:3000`. Per provarla, avvia anche Lystia Web e Lystia Server come descritto nel README del frontend.

In Chrome apri `chrome://extensions`, abilita **Modalità sviluppatore**, scegli **Carica estensione non pacchettizzata** e seleziona:

```text
Lystia-Extension/dist/chrome
```

Per creare lo ZIP da caricare sul Chrome Web Store:

```bash
npm run package:chrome
```

## Build di produzione

La build di produzione usa l'origine pubblica definitiva del frontend:

```bash
npm run build:production
```

L’estensione chiamerà gli endpoint attraverso
`https://lystia.it/api/backend/*`. Prima di impacchettarla, verificare che il
sito pubblico e il relativo proxy verso Vapor siano raggiungibili.

## Safari

Esegui prima il build con l’origine desiderata, poi:

```bash
npm run package:safari
```

Il progetto Xcode universale è già presente in `Safari/Lystia/Lystia.xcodeproj`. Il comando aggiorna al suo interno le risorse dell’estensione con l’ultima build, senza modificare firma e impostazioni Apple. Se il progetto non esiste più, su Xcode 26 lo rigenera con Safari Web Extension Packager e su Xcode meno recente usa il converter. Configura Team e Bundle Identifier, quindi esegui l’app contenitore per provare l’estensione in Safari.

Per distribuire l’estensione Safari occorrono firma Apple, una scheda App Store Connect e la relativa revisione. Il progetto usa `com.bellots.lystia.safari` per l’app contenitore e `com.bellots.lystia.safari.extension` per l’estensione Safari su macOS e iOS/iPadOS.

## Sicurezza e sessione

La sessione dell’estensione è separata da quella del sito e viene salvata con `storage.local`, mai con `storage.sync`. L’access token dura un’ora e il refresh token viene ruotato usando l’endpoint già presente nel server. Logout rimuove sempre la copia locale anche se il server non è raggiungibile.

Questa prima versione supporta il login email/password. Google Sign-In richiederà un client OAuth dedicato alle origini delle estensioni oppure un flusso di pairing avviato dal sito.
