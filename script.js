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