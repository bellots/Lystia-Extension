# Note per la pubblicazione

## Chrome Web Store

Testo breve suggerito:

> Salva nella tua wishlist Lystia il prodotto aperto nel browser, con titolo, prezzo, negozio e immagine importati automaticamente.

Permessi da dichiarare nella scheda:

- `activeTab`: legge URL, titolo e favicon della sola scheda sulla quale l’utente apre volontariamente Lystia.
- `storage`: conserva localmente sessione Lystia e ultima wishlist selezionata; i dati non vengono sincronizzati tra browser.
- host del frontend Lystia: invia richieste autenticate esclusivamente agli endpoint Lystia configurati nel build.

Trattamento dati da dichiarare:

- credenziali di autenticazione, inviate a Lystia solo durante il login e non conservate dall’estensione;
- token di sessione, conservati nello storage locale dell’estensione;
- URL del prodotto scelto dall’utente, inviato a Lystia per estrarre i metadati e salvarlo;
- contenuto del desiderio confermato dall’utente.

L’estensione non include analytics o advertising, non esegue script in background sulle pagine e non vende dati. Prima dell’invio, la privacy policy pubblica di Lystia deve descrivere esplicitamente anche l’estensione browser.

Passaggi:

1. eseguire il build con l’origine pubblica definitiva;
2. eseguire `npm run package:chrome`;
3. caricare `dist/lystia-chrome.zip` nella Chrome Web Store Developer Dashboard;
4. aggiungere screenshot del popup, icona, descrizione, privacy policy e motivazioni dei permessi;
5. provare login, refresh sessione, importazione e salvataggio dalla build caricata.

## App Store / Safari

Nome della scheda App Store: `Lystia for Safari`. Il nome `Lystia` resta riservato alla futura app iOS nativa, che avrà un record App Store Connect e un Bundle ID separati. Nell'interfaccia dell'estensione il servizio continua a chiamarsi `Lystia`.

Il progetto universale contiene target macOS e iOS/iPadOS. In Xcode:

1. selezionare il Team Apple Developer per tutti e quattro i target;
2. verificare che gli identificativi `com.bellots.lystia.safari` e `com.bellots.lystia.safari.extension` siano registrati per il Team Apple Developer;
3. impostare versione e build in modo coerente con `manifest.json`;
4. provare entrambe le app contenitore e abilitare l’estensione nelle impostazioni Safari;
5. creare l’archive, caricarlo in App Store Connect e compilare privacy e metadata della scheda.
