# Receipt Manager (Replit-ready)

Web app single-page per salvare scontrini/ricevute con UI minimal in stile Apple/Liquid Glass.

## Funzionalità incluse

- Login:
  - Continua con Apple (placeholder UI da integrare con provider OAuth reale)
  - Email + codice (demo locale, senza SMTP)
  - Continua senza account + avviso perdita sincronizzazione + richiesta nome
- Gestione ricevute:
  - Upload scansione (camera/file)
  - Prezzo, negozio da lista dinamica, data/ora, note
  - Home con filtri su negozio, data, prezzo min/max
- Modalità sync:
  - Locale
  - Replit Cloud (placeholder)
  - iCloud (placeholder)

## Nota su scansione iPhone

Su web non è possibile forzare la UI nativa di **Scansione documenti** di Apple dentro il browser.
Il flusso consigliato è usare prima la funzione Apple integrata in Fotocamera/File/Note (ritaglio automatico), poi caricare il file nell'app.

## Avvio su Replit

Puoi usare un server statico qualsiasi. Esempio:

```bash
python3 -m http.server 4173
```

Apri poi il browser su `http://localhost:4173`.
