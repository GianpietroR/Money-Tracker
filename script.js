let spese = JSON.parse(localStorage.getItem("spese") || "[]");

// Registra il plugin datalabels
Chart.register(ChartDataLabels);

function aggiornaTabella() {
    const tbody = document.querySelector("#tabella-spese tbody");
    tbody.innerHTML = "";
    const meseFiltro = document.getElementById("filtro-mese").value;
    const catFiltro = document.getElementById("filtro-categoria").value;
    const saldoIniziale = parseFloat(document.getElementById("saldo-iniziale").value || "0");

    let saldoCorrenteCalcolato = saldoIniziale; // Saldo basato solo sulle righe filtrate
    let saldoMeseCalcolato = 0;
    let saldoTotaleCalcolato = saldoIniziale; // Saldo su tutte le transazioni + saldo iniziale

    const mesiSet = new Set();
    const categorieSet = new Set();
    const catTotaliUsciteFiltrate = {};

    // Popola i set di mesi e categorie da tutte le spese per i filtri
    spese.forEach(riga => {
        const dataTransazione = new Date(riga.data);
        const meseTransazione = dataTransazione.toLocaleString('default', { month: 'long' });
        mesiSet.add(meseTransazione);
        categorieSet.add(riga.categoria);
    });

    // Aggiorna le opzioni dei filtri
    const meseSel = document.getElementById("filtro-mese");
    const catSel = document.getElementById("filtro-categoria");
    [meseSel, catSel].forEach(sel => {
        while (sel.options.length > 1) sel.remove(1); // Mantiene l'opzione "Tutti"
    });

    Array.from(mesiSet).sort().forEach(m => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m;
        meseSel.appendChild(opt);
    });
    Array.from(categorieSet).sort().forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        catSel.appendChild(opt);
    });

    // Ordina le spese per data (dalla meno recente alla più recente)
    const speseOrdinate = [...spese].sort((a, b) => new Date(a.data) - new Date(b.data));


    // Filtra e visualizza le spese, calcola i saldi
    speseOrdinate.forEach((riga, index) => { // Usa speseOrdinate qui
        const entrata = parseFloat(riga.entrate || 0);
        const uscita = parseFloat(riga.uscite || 0);
        const dataTransazione = new Date(riga.data);
        const meseTransazione = dataTransazione.toLocaleString('default', { month: 'long' });

        const meseMatch = !meseFiltro || meseTransazione === meseFiltro;
        const catMatch = !catFiltro || riga.categoria === catFiltro;

        saldoTotaleCalcolato += entrata - uscita; // Questo calcola il saldo totale considerando tutte le transazioni

        if (meseMatch && catMatch) {
            const tr = document.createElement("tr");
            // Nota l'inversione di "uscite" ed "entrate" qui
            ["data", "mese", "categoria", "descrizione", "uscite", "entrate"].forEach(k => {
                const td = document.createElement("td");
                td.textContent = riga[k];
                tr.appendChild(td);
            });

            // Aggiunta pulsanti modifica/elimina
            const tdAzioni = document.createElement("td");
            const btnMod = document.createElement("button");
            btnMod.textContent = "✏️";
            btnMod.onclick = () => modificaRiga(index);
            const btnDel = document.createElement("button");
            btnDel.textContent = "🗑️";
            btnDel.onclick = () => eliminaRiga(index);
            tdAzioni.appendChild(btnMod);
Azioni.appendChild(btnDel);
            tr.appendChild(tdAzioni);

            tbody.appendChild(tr);

            saldoCorrenteCalcolato += entrata - uscita; // Aggiorna il saldo corrente solo per le righe filtrate
            saldoMeseCalcolato += entrata - uscita;

            // Aggiorna totali per grafico a torta (solo uscite filtrate)
            if (!catTotaliUsciteFiltrate[riga.categoria]) {
                catTotaliUsciteFiltrate[riga.categoria] = 0;
            }
            catTotaliUsciteFiltrate[riga.categoria] += uscita;
        }
    });

    document.getElementById("saldo-corrente").textContent = "Saldo corrente: €" + (saldoCorrenteCalcolato - saldoIniziale).toFixed(2);
    document.getElementById("saldo-mese").textContent = "Saldo del mese: €" + saldoMeseCalcolato.toFixed(2);
    // Il saldo totale è saldo iniziale + tutte le transazioni
    document.getElementById("saldo-totale").textContent = "Saldo totale: €" + saldoTotaleCalcolato.toFixed(2);

    aggiornaGrafico(catTotaliUsciteFiltrate);
}

document.getElementById("expense-form").addEventListener("submit", e => {
    e.preventDefault();
    const data = document.getElementById("data").value;
    const descrizione = document.getElementById("descrizione").value;
    const categoria = document.getElementById("categoria").value;
    const entrate = document.getElementById("entrate").value || "0";
    const uscite = document.getElementById("uscite").value || "0";
    const mese = data ? new Date(data).toLocaleString('default', { month: 'long' }) : "";

    spese.push({ data, mese, categoria, descrizione, entrate, uscite });
    localStorage.setItem("spese", JSON.stringify(spese));
    e.target.reset();
    aggiornaTabella();
});

document.getElementById("filtro-mese").addEventListener("change", aggiornaTabella);
document.getElementById("filtro-categoria").addEventListener("change", aggiornaTabella);
document.getElementById("saldo-iniziale").addEventListener("input", aggiornaTabella);

function exportCSV() {
    // Nota l'inversione di "Uscite" ed "Entrate" qui per l'intestazione
    const righe = [["Data", "Mese", "Categoria", "Descrizione", "Uscite", "Entrate"]];
    spese.forEach(r => {
        // E qui per i dati
        righe.push([r.data, r.mese, r.categoria, r.descrizione, r.uscite, r.entrate]);
    });
    const csv = righe.map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "spese.csv");
    link.click();
}

function aggiornaGrafico(catTotali) {
    const labels = Object.keys(catTotali);
    const data = Object.values(catTotali);

    const colori = [
        "#a1887f", "#90a4ae", "#ce93d8", "#b0bec5", "#ffe082",
        "#bcaaa4", "#c5e1a5", "#b2dfdb", "#ffccbc", "#d7ccc8",
        "#f8bbd0", "#cfd8dc", "#dcedc8", "#ffecb3", "#e0f2f1"
    ];

    if (window.grafico) window.grafico.destroy();

    const ctx = document.getElementById("graficoTorta").getContext("2d");
    window.grafico = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colori.slice(0, labels.length),
                borderColor: "#121212",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: "#e0e0e0" }
                },
                datalabels: {
                    color: '#fff',
                    formatter: (value, ctx) => {
                        let sum = 0;
                        let dataArr = ctx.chart.data.datasets[0].data;
                        dataArr.map(data => {
                            sum += data;
                        });
                        let percentage = (value * 100 / sum).toFixed(2) + "%";
                        return percentage;
                    },
                    font: {
                        weight: 'bold'
                    }
                }
            }
        }
    });
}

function eliminaRiga(index) {
    if (confirm("Sei sicuro di voler eliminare questa voce?")) {
        spese.splice(index, 1);
        localStorage.setItem("spese", JSON.stringify(spese));
        aggiornaTabella();
    }
}

function modificaRiga(index) {
    const r = spese[index];
    document.getElementById("data").value = r.data;
    document.getElementById("descrizione").value = r.descrizione;
    document.getElementById("categoria").value = r.categoria;
    document.getElementById("entrate").value = r.entrate;
    document.getElementById("uscite").value = r.uscite;
    // Rimuoviamo la riga dalla lista spese, verrà aggiunta nuovamente al submit del form
    spese.splice(index, 1);
    localStorage.setItem("spese", JSON.stringify(spese));
    // Non chiamo aggiornaTabella qui, perché voglio che l'utente modifichi e poi salvi
    // la riga modificata tramite il submit del form.
    // L'aggiornamento avverrà dopo il submit del form.
}

// Inizializza la tabella al caricamento della pagina
aggiornaTabella();
