# Adventskalender mit Glücksrädern

24 Türen, hinter jeder ein Glücksrad mit Namen. Pro Tür kann nur einmal gedreht werden, der gezogene Name bleibt in der offenen Tür stehen. Tür 24 liefert immer den im Admin festgelegten Namen. Das Rad zeigt alle Namen gleich groß, die Gewichte sind nur im Admin sichtbar.

## Einrichtung (einmalig)

1. [Firebase Console](https://console.firebase.google.com) → **Projekt hinzufügen** (Analytics nicht nötig).
2. **Build → Firestore Database → Datenbank erstellen** (Produktionsmodus, Region `eur3`/`europe-west`).
3. **Build → Authentication → Anmeldemethode → E-Mail/Passwort** aktivieren, dann unter **Users** deinen Admin-Nutzer anlegen.
4. **Projekteinstellungen → Allgemein → Deine Apps → Web (`</>`)** → App registrieren, die `firebaseConfig` in `public/firebase-config.js` einfügen.
5. In `firestore.rules` die Admin-E-Mail eintragen (`jannik.huenniger@gmail.com`).
6. Deployen:
   ```
   npm i -g firebase-tools
   firebase login
   firebase use --add        # dein Projekt wählen
   firebase deploy           # Hosting + Firestore-Regeln
   ```
7. `https://<projekt>.web.app/admin.html` öffnen, anmelden, Namen/Gewichte/Tür-24-Name setzen und speichern. Zum Ausprobieren den **Testmodus** aktivieren und danach Türen zurücksetzen.

Der Kalender selbst liegt unter `https://<projekt>.web.app/`.

## Regeln & Grenzen
- „Einmal pro Tür" und das Datum (ab dem n. Dezember, Jahr einstellbar) werden in den Firestore-Regeln erzwungen; Tür 24 muss den festgelegten Namen enthalten.
- Die Ziehung läuft im Browser. Wer die Dev-Tools nutzt, kann Gewichte lesen und für Türen 1–23 ein beliebiges Ergebnis schreiben. Für Spaß im privaten Kreis okay; für echte Manipulationssicherheit wäre eine Cloud Function nötig.
