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


let skalierungsFrame = null;
let groessenBeobachter = null;


/*
 * ---------------------------------------------------------
 * Automatische Bildschirm-Skalierung
 * ---------------------------------------------------------
 */

function istMobileAnsicht() {
    return window.matchMedia(
        "(max-width: 700px)"
    ).matches;
}


function setzeSkalierungZurueck() {
    const scaleStage =
        document.getElementById("scaleStage");

    const pageContainer =
        document.getElementById("pageContainer");

    document.body.classList.remove(
        "fit-screen-active"
    );

    pageContainer.style.transform =
        "none";

    scaleStage.style.height =
        "auto";
}


function aktualisiereSkalierung() {
    const scaleStage =
        document.getElementById("scaleStage");

    const pageContainer =
        document.getElementById("pageContainer");

    if (!scaleStage || !pageContainer) {
        return;
    }

    /*
     * Auf Handy und kleinen Tablets wird nicht skaliert.
     * Dort bleibt das responsive Layout mit Scrollen aktiv.
     */
    if (istMobileAnsicht()) {
        setzeSkalierungZurueck();
        return;
    }

    document.body.classList.add(
        "fit-screen-active"
    );

    /*
     * Zuerst auf natürliche Größe zurücksetzen,
     * damit korrekt gemessen werden kann.
     */
    pageContainer.style.transform =
        "none";

    scaleStage.style.height =
        "auto";

    const bodyStil =
        window.getComputedStyle(
            document.body
        );

    const paddingOben =
        parseFloat(bodyStil.paddingTop) || 0;

    const paddingUnten =
        parseFloat(bodyStil.paddingBottom) || 0;

    const paddingLinks =
        parseFloat(bodyStil.paddingLeft) || 0;

    const paddingRechts =
        parseFloat(bodyStil.paddingRight) || 0;

    const verfuegbareHoehe =
        document.documentElement.clientHeight -
        paddingOben -
        paddingUnten -
        4;

    const verfuegbareBreite =
        document.documentElement.clientWidth -
        paddingLinks -
        paddingRechts -
        4;

    const natuerlicheBreite =
        pageContainer.offsetWidth;

    const natuerlicheHoehe =
        pageContainer.scrollHeight;

    if (
        natuerlicheBreite <= 0 ||
        natuerlicheHoehe <= 0
    ) {
        return;
    }

    /*
     * Höhe und Breite werden berücksichtigt.
     * Es wird nur verkleinert, niemals vergrößert.
     */
    const skalierungNachHoehe =
        verfuegbareHoehe /
        natuerlicheHoehe;

    const skalierungNachBreite =
        verfuegbareBreite /
        natuerlicheBreite;

    const skalierung =
        Math.min(
            1,
            skalierungNachHoehe,
            skalierungNachBreite
        );

    pageContainer.style.transform =
        `scale(${skalierung})`;

    /*
     * Transform verändert die optische Größe,
     * aber nicht automatisch die Layout-Höhe.
     * Deshalb wird die äußere Ebene angepasst.
     */
    scaleStage.style.height =
        `${Math.ceil(
            natuerlicheHoehe *
            skalierung
        )}px`;
}


function planeSkalierung() {
    if (skalierungsFrame !== null) {
        cancelAnimationFrame(
            skalierungsFrame
        );
    }

    skalierungsFrame =
        requestAnimationFrame(
            function () {
                aktualisiereSkalierung();

                skalierungsFrame = null;
            }
        );
}


function initialisiereAutomatischeSkalierung() {
    window.addEventListener(
        "resize",
        planeSkalierung
    );

    window.addEventListener(
        "orientationchange",
        planeSkalierung
    );

    /*
     * Reagiert auch darauf, wenn eine Statuskarte,
     * Warnung oder Fehlzeit eingeblendet wird.
     */
    if ("ResizeObserver" in window) {
        groessenBeobachter =
            new ResizeObserver(
                planeSkalierung
            );

        groessenBeobachter.observe(
            document.getElementById(
                "pageContainer"
            )
        );
    }

    /*
     * Nach dem vollständigen Laden erneut messen.
     */
    window.addEventListener(
        "load",
        planeSkalierung
    );

    if (document.fonts?.ready) {
        document.fonts.ready.then(
            planeSkalierung
        );
    }

    planeSkalierung();
}


/*
 * ---------------------------------------------------------
 * Zeitberechnung
 * ---------------------------------------------------------
 */

function zeitInMinuten(zeit) {
    const [stunden, minuten] = zeit
        .split(":")
        .map(Number);

    return stunden * 60 + minuten;
}


function formatiereUhrzeit(gesamtMinuten) {
    const minutenProTag =
        24 * 60;

    const minutenAmTag =
        (
            (
                gesamtMinuten %
                minutenProTag
            ) +
            minutenProTag
        ) %
        minutenProTag;

    const stunden =
        Math.floor(
            minutenAmTag / 60
        );

    const minuten =
        minutenAmTag % 60;

    return (
        stunden
            .toString()
            .padStart(2, "0") +
        ":" +
        minuten
            .toString()
            .padStart(2, "0")
    );
}


function formatiereDauer(gesamtMinuten) {
    const absoluteMinuten =
        Math.abs(gesamtMinuten);

    const stunden =
        Math.floor(
            absoluteMinuten / 60
        );

    const minuten =
        absoluteMinuten % 60;

    return (
        stunden +
        ":" +
        minuten
            .toString()
            .padStart(2, "0") +
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
        pauseWirdAbgezogen:
            pauseWirdAbgezogen,

        pause:
            pause,

        nettoArbeitszeit:
            anwesenheit - pause
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
        document.getElementById(
            "statusBox"
        );

    statusBox.style.display =
        "none";

    statusBox.classList.remove(
        "status-minus",
        "status-equal",
        "status-plus",
        "status-warning"
    );
}


function setzeStatusSymbol(typ) {
    const statusSymbol =
        document.getElementById(
            "statusSymbol"
        );

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
        document.getElementById(
            "statusBox"
        );

    const statusWert =
        document.getElementById(
            "statusWert"
        );

    const statusInfo =
        document.getElementById(
            "statusInfo"
        );

    const statusDetail =
        document.getElementById(
            "statusDetail"
        );

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

    statusWert.textContent =
        wert;

    statusInfo.textContent =
        titel;

    statusDetail.textContent =
        detail || "";

    statusBox.style.display =
        "grid";
}


function versteckeHinweis() {
    const hinweisBox =
        document.getElementById(
            "hinweisBox"
        );

    hinweisBox.textContent =
        "";

    hinweisBox.style.display =
        "none";
}


function zeigeHinweis(text) {
    const hinweisBox =
        document.getElementById(
            "hinweisBox"
        );

    hinweisBox.textContent =
        text;

    hinweisBox.style.display =
        "block";
}


function zeigeVoraussichtlicheFehlzeit(
    startMinuten
) {
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

    if (differenzBei17Uhr < 0) {
        const pausenText =
            berechnung.pauseWirdAbgezogen
                ? "Voraussichtliche Fehlzeit bei Ende um 17:00 Uhr · " +
                  "0:30 h Pause abgezogen"
                : "Voraussichtliche Fehlzeit bei Ende um 17:00 Uhr · " +
                  "kein Pausenabzug";

        zeigeStatus(
            "minus",
            formatiereDauer(
                differenzBei17Uhr
            ),
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

    if (!beginn && !ende) {
        setzeAusgabeZurueck();
        return;
    }

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

    const rechnerischesNormalesEnde =
        startMinuten +
        ARBEITSZEIT.NORMALE_ANWESENHEIT_MINUTEN;

    const rechnerischesPausefreiesEnde =
        startMinuten +
        ARBEITSZEIT.PAUSENGRENZE_MINUTEN -
        1;

    const endeNachMaximalerAnwesenheit =
        startMinuten +
        ARBEITSZEIT.MAX_ANWESENHEIT_MINUTEN;

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

    if (
        endeNachMaximalerAnwesenheit >
        ARBEITSZEIT.SPAETESTES_ENDE_MINUTEN
    ) {
        document.getElementById(
            "ueberstundenEndeInfo"
        ).textContent =
            "Spätestes erlaubtes Arbeitsende ist 17:00 Uhr.";
    }

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

    if (
        endMinuten >
        ARBEITSZEIT.SPAETESTES_ENDE_MINUTEN
    ) {
        grenzverletzungen.push(
            "Das Arbeitsende liegt nach 17:00 Uhr"
        );
    }

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
                : formatiereDauer(
                    differenz
                );

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

    if (differenz < 0) {
        zeigeStatus(
            "minus",
            formatiereDauer(
                differenz
            ),
            "✕ Zu wenig gearbeitet",
            pausenText
        );

        return;
    }

    if (differenz === 0) {
        zeigeStatus(
            "equal",
            "0:00 h",
            "Sollzeit erreicht",
            pausenText
        );

        return;
    }

    zeigeStatus(
        "plus",
        formatiereDauer(
            differenz
        ),
        "Mehr gearbeitet",
        pausenText
    );
}


/*
 * ---------------------------------------------------------
 * Dark Mode
 * ---------------------------------------------------------
 */

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

    planeSkalierung();
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


/*
 * ---------------------------------------------------------
 * Initialisierung
 * ---------------------------------------------------------
 */

function initialisiereAutomatischeBerechnung() {
    const beginnFeld =
        document.getElementById(
            "arbeitsbeginn"
        );

    const endeFeld =
        document.getElementById(
            "arbeitsende"
        );

    const berechnenUndSkalieren =
        function () {
            berechneEndzeiten();
            planeSkalierung();
        };

    beginnFeld.addEventListener(
        "input",
        berechnenUndSkalieren
    );

    beginnFeld.addEventListener(
        "change",
        berechnenUndSkalieren
    );

    endeFeld.addEventListener(
        "input",
        berechnenUndSkalieren
    );

    endeFeld.addEventListener(
        "change",
        berechnenUndSkalieren
    );
}


document.addEventListener(
    "DOMContentLoaded",
    function () {
        let gespeicherterDarkMode =
            null;

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

        if (
            gespeicherterDarkMode !==
            null
        ) {
            setzeDarkMode(
                gespeicherterDarkMode ===
                "true"
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
        initialisiereAutomatischeSkalierung();

        /*
         * Zweite Messung nach dem ersten Rendern.
         */
        requestAnimationFrame(
            function () {
                requestAnimationFrame(
                    planeSkalierung
                );
            }
        );
    }
);