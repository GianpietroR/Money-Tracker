let spese = JSON.parse(localStorage.getItem("spese") || "[]");

function aggiornaTabella() {
    const tbody = document.querySelector("#tabella-spese tbody");
    tbody.innerHTML = "";
    const meseFiltro = document.getElementById("filtro-mese").value;
    const catFiltro = document.getElementById("filtro-categoria").value;

    let saldo = 0;
    let mesiSet = new Set();
    let categorieSet = new Set();

    spese.forEach(riga => {
        mesiSet.add(riga.mese);
        categorieSet.add(riga.categoria);
    });

    const meseSel = document.getElementById("filtro-mese");
    const catSel = document.getElementById("filtro-categoria");
    [meseSel, catSel].forEach(sel => { while (sel.options.length > 1) sel.remove(1); });

    mesiSet.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m; opt.textContent = m;
        meseSel.appendChild(opt);
    });
    categorieSet.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c; opt.textContent = c;
        catSel.appendChild(opt);
    });

    spese.forEach(riga => {
        if ((meseFiltro && riga.mese !== meseFiltro) ||
            (catFiltro && riga.categoria !== catFiltro)) return;

        const tr = document.createElement("tr");
        ["data", "mese", "categoria", "descrizione", "entrate", "uscite"].forEach(k => {
            const td = document.createElement("td");
            td.textContent = riga[k];
            tr.appendChild(td);
        });
        saldo += parseFloat(riga.entrate || 0) - parseFloat(riga.uscite || 0);
        tbody.appendChild(tr);
    });

    document.getElementById("saldo").textContent = "Saldo: €" + saldo.toFixed(2);
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

function exportCSV() {
    const righe = [["Data","Mese","Categoria","Descrizione","Entrate","Uscite"]];
    spese.forEach(r => {
        righe.push([r.data, r.mese, r.categoria, r.descrizione, r.entrate, r.uscite]);
    });
    const csv = righe.map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "spese.csv");
    link.click();
}

aggiornaTabella();

document.getElementById("saldo-iniziale").addEventListener("input", aggiornaTabella);

function aggiornaGrafico() {
    const catTotali = {};
    spese.forEach(r => {
        const cat = r.categoria;
        const valore = parseFloat(r.uscite || "0");
        if (!catTotali[cat]) catTotali[cat] = 0;
        catTotali[cat] += valore;
    });
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
            labels,
            datasets: [{
                data,
                backgroundColor: colori,
                borderColor: "#121212",
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: "#e0e0e0" }
                }
            }
        }
    });
}

const originalAggiornaTabella = aggiornaTabella;
aggiornaTabella = function () {
    originalAggiornaTabella();
    const saldoBase = parseFloat(document.getElementById("saldo-iniziale").value || "0");
    const righe = document.querySelectorAll("#tabella-spese tbody tr");
    let saldoCorrente = saldoBase;
    spese.forEach(riga => {
        if ((document.getElementById("filtro-mese").value && riga.mese !== document.getElementById("filtro-mese").value) ||
            (document.getElementById("filtro-categoria").value && riga.categoria !== document.getElementById("filtro-categoria").value)) return;
        saldoCorrente += parseFloat(riga.entrate || 0) - parseFloat(riga.uscite || 0);
    });
    document.getElementById("saldo").textContent = "Saldo: €" + saldoCorrente.toFixed(2);
    aggiornaGrafico();
};