const ARBEITSZEIT = Object.freeze({
    SOLL_NETTO_MINUTEN: 450,
    NORMALE_ANWESENHEIT_MINUTEN: 480,

    PAUSENGRENZE_MINUTEN: 360,
    PAUSE_MINUTEN: 30,

    MAX_ANWESENHEIT_MINUTEN: 570,
    SPAETESTES_ENDE_MINUTEN: 17 * 60
});


const STANDARDTEXTE = Object.freeze({
    NORMALES_ENDE:
        "Ende nach 8:00 h Anwesenheit inklusive 0:30 h Pause",

    MAXIMALES_ENDE:
        "Spätestes Ende bei 9:30 h Anwesenheit – " +
        "jedoch nie später als 17:00 Uhr",

    PAUSENFREIES_ENDE:
        "Spätestens zu diesem Zeitpunkt ausstempeln. " +
        "Ab der nächsten Minute werden 0:30 h Pause abgezogen."
});


function zeitInMinuten(zeit) {
    const [stunden, minuten] = zeit
        .split(":")
        .map(Number);

    return stunden * 60 + minuten;
}


function formatiereUhrzeit(gesamtMinuten) {
    const minutenProTag = 24 * 60;

    const minutenAmTag =
        ((gesamtMinuten % minutenProTag) + minutenProTag) %
        minutenProTag;

    const stunden =
        Math.floor(minutenAmTag / 60);

    const minuten =
        minutenAmTag % 60;

    return (
        stunden.toString().padStart(2, "0") +
        ":" +
        minuten.toString().padStart(2, "0")
    );
}


function formatiereDauer(gesamtMinuten) {
    const absoluteMinuten =
        Math.abs(gesamtMinuten);

    const stunden =
        Math.floor(absoluteMinuten / 60);

    const minuten =
        absoluteMinuten % 60;

    return (
        stunden +
        ":" +
        minuten.toString().padStart(2, "0") +
        " h"
    );
}


function berechneNettoArbeitszeit(anwesenheit) {
    const pauseWirdAbgezogen =
        anwesenheit >=
        ARBEITSZEIT.PAUSENGRENZE_MINUTEN;

    const pause =
        pauseWirdAbgezogen
            ? ARBEITSZEIT.PAUSE_MINUTEN
            : 0;

    return {
        pauseWirdAbgezogen: pauseWirdAbgezogen,
        pause: pause,
        nettoArbeitszeit: anwesenheit - pause
    };
}


function setzeStandardtexte() {
    document.getElementById(
        "normalEndeInfo"
    ).textContent =
        STANDARDTEXTE.NORMALES_ENDE;

    document.getElementById(
        "ueberstundenEndeInfo"
    ).textContent =
        STANDARDTEXTE.MAXIMALES_ENDE;

    document.getElementById(
        "pausefreiEndeInfo"
    ).textContent =
        STANDARDTEXTE.PAUSENFREIES_ENDE;
}


function setzeAusgabeZurueck() {
    document.getElementById(
        "normalEnde"
    ).textContent = "--:--";

    document.getElementById(
        "ueberstundenEnde"
    ).textContent = "--:--";

    document.getElementById(
        "pausefreiEnde"
    ).textContent = "--:--";

    setzeStandardtexte();
}


function versteckeStatus() {
    const statusBox =
        document.getElementById("statusBox");

    statusBox.style.display = "none";

    statusBox.classList.remove(
        "status-minus",
        "status-equal",
        "status-plus",
        "status-warning"
    );
}


function setzeStatusSymbol(typ) {
    const statusSymbol =
        document.getElementById("statusSymbol");

    if (typ === "minus") {
        statusSymbol.innerHTML = `
            <path d="M7 7l10 10"></path>
            <path d="M17 7L7 17"></path>
        `;

        return;
    }

    if (typ === "equal") {
        statusSymbol.innerHTML = `
            <path d="M7 12h10"></path>
            <path d="M7 16h10"></path>
        `;

        return;
    }

    if (typ === "plus") {
        statusSymbol.innerHTML = `
            <path d="M12 6v12"></path>
            <path d="M6 12h12"></path>
        `;

        return;
    }

    statusSymbol.innerHTML = `
        <path d="M12 4l9 16H3L12 4z"></path>
        <path d="M12 9v5"></path>
        <path d="M12 17h0"></path>
    `;
}


function zeigeStatus(
    typ,
    wert,
    titel,
    detail
) {
    const statusBox =
        document.getElementById("statusBox");

    const statusWert =
        document.getElementById("statusWert");

    const statusInfo =
        document.getElementById("statusInfo");

    const statusDetail =
        document.getElementById("statusDetail");

    statusBox.classList.remove(
        "status-minus",
        "status-equal",
        "status-plus",
        "status-warning"
    );

    statusBox.classList.add(
        "status-" + typ
    );

    setzeStatusSymbol(typ);

    statusWert.textContent = wert;
    statusInfo.textContent = titel;
    statusDetail.textContent = detail || "";

    statusBox.style.display = "grid";
}


function versteckeHinweis() {
    const hinweisBox =
        document.getElementById("hinweisBox");

    hinweisBox.textContent = "";
    hinweisBox.style.display = "none";
}


function zeigeHinweis(text) {
    const hinweisBox =
        document.getElementById("hinweisBox");

    hinweisBox.textContent = text;
    hinweisBox.style.display = "block";
}


function zeigeVoraussichtlicheFehlzeit(startMinuten) {
    /*
     * Berechnet, wie viel Arbeitszeit vom eingegebenen
     * Beginn bis zum spätesten Ende um 17:00 Uhr
     * überhaupt noch möglich ist.
     */
    const anwesenheitBis17Uhr =
        ARBEITSZEIT.SPAETESTES_ENDE_MINUTEN -
        startMinuten;

    const berechnung =
        berechneNettoArbeitszeit(
            anwesenheitBis17Uhr
        );

    const differenzBei17Uhr =
        berechnung.nettoArbeitszeit -
        ARBEITSZEIT.SOLL_NETTO_MINUTEN;

    /*
     * Diese Funktion wird nur verwendet, wenn die
     * Sollzeit bis 17:00 Uhr nicht mehr erreichbar ist.
     */
    if (differenzBei17Uhr < 0) {
        const pausenText =
            berechnung.pauseWirdAbgezogen
                ? "Voraussichtliche Fehlzeit bei Ende um 17:00 Uhr · " +
                  "0:30 h Pause abgezogen"
                : "Voraussichtliche Fehlzeit bei Ende um 17:00 Uhr · " +
                  "kein Pausenabzug";

        zeigeStatus(
            "minus",
            formatiereDauer(differenzBei17Uhr),
            "✕ Sollzeit nicht erreichbar",
            pausenText
        );
    }
}


function berechneEndzeiten() {
    const beginn =
        document.getElementById(
            "arbeitsbeginn"
        ).value;

    const ende =
        document.getElementById(
            "arbeitsende"
        ).value;

    versteckeStatus();
    versteckeHinweis();
    setzeStandardtexte();

    /*
     * Beide Eingabefelder sind leer.
     */
    if (!beginn && !ende) {
        setzeAusgabeZurueck();
        return;
    }

    /*
     * Ende ist vorhanden, aber Beginn fehlt.
     */
    if (!beginn) {
        setzeAusgabeZurueck();

        zeigeStatus(
            "warning",
            "Fehlt",
            "Arbeitsbeginn fehlt",
            "Bitte zuerst einen Arbeitsbeginn eingeben."
        );

        return;
    }

    const startMinuten =
        zeitInMinuten(beginn);

    /*
     * Arbeitsbeginn muss vor 17:00 Uhr liegen.
     */
    if (
        startMinuten >=
        ARBEITSZEIT.SPAETESTES_ENDE_MINUTEN
    ) {
        setzeAusgabeZurueck();

        zeigeStatus(
            "warning",
            "Ungültig",
            "Ungültiger Arbeitsbeginn",
            "Der Arbeitsbeginn muss vor 17:00 Uhr liegen."
        );

        return;
    }

    let endMinuten = null;

    /*
     * Ein eingetragenes Arbeitsende wird geprüft,
     * bevor Endzeiten angezeigt werden.
     */
    if (ende) {
        endMinuten =
            zeitInMinuten(ende);

        if (endMinuten < startMinuten) {
            setzeAusgabeZurueck();

            zeigeStatus(
                "warning",
                "Ungültig",
                "Ungültiges Arbeitsende",
                "Das Arbeitsende darf nicht vor dem Arbeitsbeginn liegen."
            );

            return;
        }
    }

    /*
     * Rechnerisches normales Arbeitsende:
     * Beginn plus 8:00 Stunden Anwesenheit.
     */
    const rechnerischesNormalesEnde =
        startMinuten +
        ARBEITSZEIT.NORMALE_ANWESENHEIT_MINUTEN;

    /*
     * Rechnerischer letzter Zeitpunkt
     * ohne Pausenabzug.
     */
    const rechnerischesPausefreiesEnde =
        startMinuten +
        ARBEITSZEIT.PAUSENGRENZE_MINUTEN -
        1;

    /*
     * Rechnerisches maximales Ende nach
     * 9:30 Stunden Anwesenheit.
     */
    const endeNachMaximalerAnwesenheit =
        startMinuten +
        ARBEITSZEIT.MAX_ANWESENHEIT_MINUTEN;

    /*
     * Keine angezeigte Uhrzeit darf später
     * als 17:00 Uhr sein.
     */
    const angezeigtesNormalesEnde =
        Math.min(
            rechnerischesNormalesEnde,
            ARBEITSZEIT.SPAETESTES_ENDE_MINUTEN
        );

    const angezeigtesMaximalesEnde =
        Math.min(
            endeNachMaximalerAnwesenheit,
            ARBEITSZEIT.SPAETESTES_ENDE_MINUTEN
        );

    const angezeigtesPausefreiesEnde =
        Math.min(
            rechnerischesPausefreiesEnde,
            ARBEITSZEIT.SPAETESTES_ENDE_MINUTEN
        );

    document.getElementById(
        "normalEnde"
    ).textContent =
        formatiereUhrzeit(
            angezeigtesNormalesEnde
        );

    document.getElementById(
        "ueberstundenEnde"
    ).textContent =
        formatiereUhrzeit(
            angezeigtesMaximalesEnde
        );

    document.getElementById(
        "pausefreiEnde"
    ).textContent =
        formatiereUhrzeit(
            angezeigtesPausefreiesEnde
        );

    const sollzeitNichtErreichbar =
        rechnerischesNormalesEnde >
        ARBEITSZEIT.SPAETESTES_ENDE_MINUTEN;

    /*
     * Die normale Sollzeit wäre erst nach
     * 17:00 Uhr erreicht.
     */
    if (sollzeitNichtErreichbar) {
        document.getElementById(
            "normalEndeInfo"
        ).textContent =
            "Spätestes erlaubtes Ende ist 17:00 Uhr. " +
            "Die normale Sollzeit kann an diesem Tag nicht " +
            "vollständig erreicht werden.";

        zeigeHinweis(
            "Bei diesem Arbeitsbeginn kann die normale Sollzeit " +
            "bis spätestens 17:00 Uhr nicht erreicht werden."
        );
    }

    /*
     * Das maximale Ende wird durch die
     * feste 17-Uhr-Grenze begrenzt.
     */
    if (
        endeNachMaximalerAnwesenheit >
        ARBEITSZEIT.SPAETESTES_ENDE_MINUTEN
    ) {
        document.getElementById(
            "ueberstundenEndeInfo"
        ).textContent =
            "Spätestes erlaubtes Arbeitsende ist 17:00 Uhr.";
    }

    /*
     * Die 6-Stunden-Grenze wird möglicherweise
     * erst nach 17:00 Uhr erreicht.
     */
    if (
        rechnerischesPausefreiesEnde >
        ARBEITSZEIT.SPAETESTES_ENDE_MINUTEN
    ) {
        document.getElementById(
            "pausefreiEndeInfo"
        ).textContent =
            "Bis zum spätesten Arbeitsende um 17:00 Uhr " +
            "wird die 6-Stunden-Grenze nicht erreicht. " +
            "Es erfolgt daher kein Pausenabzug.";
    }

    /*
     * Noch kein tatsächliches Arbeitsende eingetragen.
     *
     * Wenn die Sollzeit nicht mehr erreichbar ist,
     * wird automatisch die Fehlzeit bei einem Ende
     * um 17:00 Uhr angezeigt.
     */
    if (!ende) {
        if (sollzeitNichtErreichbar) {
            zeigeVoraussichtlicheFehlzeit(
                startMinuten
            );
        }

        return;
    }

    const anwesenheit =
        endMinuten -
        startMinuten;

    const berechnung =
        berechneNettoArbeitszeit(
            anwesenheit
        );

    const differenz =
        berechnung.nettoArbeitszeit -
        ARBEITSZEIT.SOLL_NETTO_MINUTEN;

    const grenzverletzungen = [];

    /*
     * Arbeitsende nach 17:00 Uhr.
     */
    if (
        endMinuten >
        ARBEITSZEIT.SPAETESTES_ENDE_MINUTEN
    ) {
        grenzverletzungen.push(
            "Das Arbeitsende liegt nach 17:00 Uhr"
        );
    }

    /*
     * Anwesenheit länger als 9:30 Stunden.
     */
    if (
        anwesenheit >
        ARBEITSZEIT.MAX_ANWESENHEIT_MINUTEN
    ) {
        grenzverletzungen.push(
            "Die Anwesenheit ist länger als 9:30 h"
        );
    }

    if (grenzverletzungen.length > 0) {
        const wert =
            differenz === 0
                ? "0:00 h"
                : formatiereDauer(differenz);

        zeigeStatus(
            "warning",
            wert,
            "Arbeitszeitgrenze überschritten",
            grenzverletzungen.join(". ") + "."
        );

        return;
    }

    const pausenText =
        berechnung.pauseWirdAbgezogen
            ? "0:30 h Pause abgezogen"
            : "kein Pausenabzug";

    /*
     * Tatsächliche Fehlzeit
     */
    if (differenz < 0) {
        zeigeStatus(
            "minus",
            formatiereDauer(differenz),
            "✕ Zu wenig gearbeitet",
            pausenText
        );

        return;
    }

    /*
     * Sollzeit genau erreicht
     */
    if (differenz === 0) {
        zeigeStatus(
            "equal",
            "0:00 h",
            "Sollzeit erreicht",
            pausenText
        );

        return;
    }

    /*
     * Tatsächliche Pluszeit
     */
    zeigeStatus(
        "plus",
        formatiereDauer(differenz),
        "Mehr gearbeitet",
        pausenText
    );
}


function setzeDarkMode(aktiv) {
    const darkModeToggle =
        document.getElementById(
            "darkModeToggle"
        );

    document.body.classList.toggle(
        "dark-mode",
        aktiv
    );

    darkModeToggle.setAttribute(
        "aria-pressed",
        aktiv.toString()
    );

    darkModeToggle.textContent =
        aktiv
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";
}


function toggleDarkMode() {
    const darkModeIstAktiv =
        document.body.classList.contains(
            "dark-mode"
        );

    const neuerDarkMode =
        !darkModeIstAktiv;

    setzeDarkMode(
        neuerDarkMode
    );

    try {
        localStorage.setItem(
            "zeitrechner-dark-mode",
            neuerDarkMode.toString()
        );
    } catch (fehler) {
        console.warn(
            "Die Dark-Mode-Einstellung konnte nicht gespeichert werden.",
            fehler
        );
    }
}


function initialisiereAutomatischeBerechnung() {
    const beginnFeld =
        document.getElementById(
            "arbeitsbeginn"
        );

    const endeFeld =
        document.getElementById(
            "arbeitsende"
        );

    beginnFeld.addEventListener(
        "input",
        berechneEndzeiten
    );

    beginnFeld.addEventListener(
        "change",
        berechneEndzeiten
    );

    endeFeld.addEventListener(
        "input",
        berechneEndzeiten
    );

    endeFeld.addEventListener(
        "change",
        berechneEndzeiten
    );
}


document.addEventListener(
    "DOMContentLoaded",
    function () {
        let gespeicherterDarkMode = null;

        try {
            gespeicherterDarkMode =
                localStorage.getItem(
                    "zeitrechner-dark-mode"
                );
        } catch (fehler) {
            console.warn(
                "Die Dark-Mode-Einstellung konnte nicht geladen werden.",
                fehler
            );
        }

        if (gespeicherterDarkMode !== null) {
            setzeDarkMode(
                gespeicherterDarkMode === "true"
            );
        } else {
            const systemVerwendetDarkMode =
                window.matchMedia &&
                window.matchMedia(
                    "(prefers-color-scheme: dark)"
                ).matches;

            setzeDarkMode(
                systemVerwendetDarkMode
            );
        }

        document.getElementById(
            "arbeitsbeginn"
        ).value = "";

        document.getElementById(
            "arbeitsende"
        ).value = "";

        setzeAusgabeZurueck();
        versteckeStatus();
        versteckeHinweis();

        initialisiereAutomatischeBerechnung();
    }
);