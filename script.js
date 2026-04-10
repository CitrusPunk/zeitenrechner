function berechneEndzeiten() {
    const beginn = document.getElementById("arbeitsbeginn").value;
    const ende = document.getElementById("arbeitsende").value;
    const [startH, startM] = beginn.split(":").map(Number);

    function berechneEnde(stunden) {
        let totalMinuten = startH * 60 + startM + Math.round(stunden * 60);
        let endH = Math.floor(totalMinuten / 60) % 24;
        let endM = totalMinuten % 60;
        return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    }

    document.getElementById("normalEnde").textContent = berechneEnde(8);
    document.getElementById("pausefreiEnde").textContent = berechneEnde(5.9833);
    const maxCalc = berechneEnde(9.5);
    document.getElementById("ueberstundenEnde").textContent = (maxCalc > "17:00") ? "17:00" : maxCalc;

    const fehlBox = document.getElementById("fehlzeitBox");
    const fehlWert = document.getElementById("fehlzeitWert");
    const plusBox = document.getElementById("pluszeitBox");
    const plusWert = document.getElementById("pluszeitWert");
    const plusInfo = document.getElementById("pluszeitInfo");

    fehlBox.style.display = "none";
    plusBox.style.display = "none";
    plusWert.classList.remove("plus-warning");
    plusInfo.classList.remove("warning-text");
    plusInfo.innerHTML = "✅ Mehr gearbeitet";

    if (beginn && ende) {
        const [endH, endM] = ende.split(":").map(Number);
        let startMin = startH * 60 + startM;
        let endMin = endH * 60 + endM;
        let anwesenheit = endMin - startMin;
        if (anwesenheit > 360) anwesenheit -= 0;

        const soll = 480;
        let diff = anwesenheit - soll;

        if (anwesenheit < 360) { // Mitarbeiter weniger als 6 Stunden anwesend
            const h = Math.floor(Math.abs(diff) / 60);
            const m = Math.abs(diff) % 60;
            fehlWert.textContent = `${h}:${m.toString().padStart(2, '0')} h`;
            fehlBox.style.display = "flex";
        } else if (anwesenheit >= 360 && diff < 0){ // Mitarbeiter mehr als 6 Stunden aber weniger als 8 Stunden anwesend
            diff = diff - 30
            const h = Math.floor(Math.abs(diff) / 60);
            const m = Math.abs(diff) % 60;
            fehlWert.textContent = `${h}:${m.toString().padStart(2, '0')} h`;
            fehlBox.style.display = "flex";
        }else if(diff >= 0) { // Mitarbeiter 8 Stunden oder mehr anwesend
            const h = Math.floor(diff / 60);
            const m = diff % 60;
            plusWert.textContent = `${h}:${m.toString().padStart(2, '0')} h`;

            if (diff > 90) {
                plusWert.classList.add("plus-warning");
                plusInfo.innerHTML = '⚠️ Mehr gearbeitet – max. erlaubt: <span class="green-highlight">(1:30h)</span>';
                plusInfo.classList.add("warning-text");
            }

            plusBox.style.display = "flex";
        }
    }
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}

function isDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

if(isDarkMode()){
        document.body.classList.toggle("dark-mode");
}