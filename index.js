/*
=SVERWEIS(F$19; DB_Länder; 5; FALSCH)
    * (1 + WENN('Quick Input'!M$46 = Auswahlfelder!$D$7;
        0;
    // sonst
        WENN('Quick Input'!M$46 = Auswahlfelder!$D$8;
            0, 5 * SVERWEIS(F$19; DB_Länder; 14; FALSCH); 
        sonst
            (SVERWEIS(F$19; DB_Länder; 14; FALSCH) 
            +SVERWEIS(F$19; DB_Länder; 15; FALSCH)
        )
*/

let Parameter = {
    Anteil_Angussgewicht_Proz: 32, // 'Länder-DB'!M19
    Wartungskosten_Proz: 10, // 'Länder-DB'!I29
    Wochenarbeitstage: 5, // Quick-Input $47
    Arbeitswochen_pro_Jahr: 48, // Quick-Input $48
    Maschinen: [
        {
            Name: "DT 8/5000",
            Invest: 1200000, // F$138: SVERWEIS(Refkalkulation!H$52;DB_Maschinen;15;FALSCH)
            InvestWarmhaltOfen: 0, // F$139
            AbschreibungJahre: 10, // F$140
            Leistung_kW: 150,
            Produktionsflaeche: 1800,
            KostenProJahr() {
                // Parametrikber!F$142: (F$138+F$139)/F$140+F$141)
                (this.Invest + this.InvestWarmhaltOfen) /
                    this.AbschreibungJahre;
            },
        },
    ],
    Laender: [
        // Länder
        {
            Name: "Deutschland",
            Flaechenkosten_pro_m2_Monat: 6.5, // Flächenkosten
            Lohn_Einrichter_Eur_Std: 25.59,
        },
    ],
    Schichtmodelle: [
        { Name: "1-Schicht", Korrektur_Proz: 95, Stunden_proTag: 8 },
        { Name: "2-Schicht", Korrektur_Proz: 92, Stunden_proTag: 16 },
        { Name: "3-Schicht", Korrektur_Proz: 88, Stunden_proTag: 24 },
    ],
};

let Material = {
    PreisProKg: 2,
};

let Teil = {
    Produktionsland: Parameter.Laender[0], // Deutschland
    Schichtmodell: Parameter.Schichtmodelle[2], // 3-Schicht
    Rohgewicht: 5,
    Materialkosten_Rohteil() {
        return this.Rohgewicht * Material.PreisProKg;
    },
    Schmelzverlust_Proz: 5.6, // Abbrand
    Wandstaerke_max_mm: 15,
    Wandstaerke_min_mm: 8,
    Korrektur_Modellanzahl_Proz: 2, // F$47
    Kastennutzung_Proz: 1.3, // F$58
    Aufschlag_TeileDicke_Proz() {
        // F$44
        return Math.max(0, (0.025 * (this.Wandstaerke_max_mm - 8)) / 4) * 100;
    },
    Aufschlag_Kastennutzung_Proz() {
        // F$45
        return Math.max(0, 0.2 * (40 - this.Kastennutzung_Proz));
    },
    Anguss_Proz() {
        // F$42
        return (
            Parameter.Anteil_Angussgewicht_Proz +
            this.Aufschlag_TeileDicke_Proz() +
            this.Aufschlag_Kastennutzung_Proz() +
            this.Korrektur_Modellanzahl_Proz
        );
    },
    Schmelzverlust_Kosten() {
        return (
            (this.Materialkosten_Rohteil() *
                (1 + this.Anguss_Proz() / 100) *
                this.Schmelzverlust_Proz) /
            100
        );
    },
    //Formen: {
    Maschine: Parameter.Maschinen[0],
    Energieverbrauch_kW() {
        0.75 * this.Maschine.Leistung_kW;
    }, // =0,75*SVERWEIS(Refkalkulation!H$52;DB_Maschinen;12;FALSCH)
    Bruttostunden_pro_Jahr() {
        this.Schichtmodell.Stunden_proTag *
            Parameter.Wochenarbeitstage *
            Parameter.Arbeitswochen_pro_Jahr;
    }, // 146: =F$143*F$144*F$145
    Mittlere_Maschinennutzung_Proz: 80, // Quick Input'!M$50
    Korrektur_Firmgroesse_Proz: 0, // $28
    Korrektur_OrtRegion: 0, // $29
    //Korrektur_Schichtmodell_Proz() { }, // 30: =WENN('Quick Input'!M$46=Auswahlfelder!$D$7;0,95;WENN('Quick Input'!M$46=Auswahlfelder!$D$8;0,92;0,88))
    Effizienz_Maschinennutzung() {
        // $27: =MIN(100%;('Quick Input'!M$50+F$28+F$29)*F$30)
        ((this.Mittlere_Maschinennutzung_Proz +
            this.Korrektur_Firmgroesse_Proz +
            this.Korrektur_OrtRegion) *
            this.Schichtmodell.Korrektur_Proz) /
            100;
    },
    Nutzungsgrad_Proz() {
        0.9 * this.Effizienz_Maschinennutzung;
    }, // 148: =0,9*F$27
    Nettonutzungsdauer_Std_pro_Jahr() {
        this.Bruttostunden_pro_Jahr * this.Nutzungsgrad_Proz;
    }, // F$149: =F$146*F$148
    Flaechenkosten_pro_Std() {
        (this.Maschine.Produktionsflaeche *
            this.Produktionsland.Flaechenkosten_pro_m2_Monat *
            12) /
            this.Nettonutzungsdauer_Std_pro_Jahr;
    }, // F$155: =F153*F154*12/F149
    Maschinenstundensatz() {
        this.Maschine.KostenProJahr / this.Nettonutzungsdauer_Std_pro_Jahr +
            this.Energieverbrauch_kW +
            this.Flaechenkosten_pro_Std; // Parametrikber!F$137: F$142/F$149+F$152+F$155
    },
    Personalkosten_Einrichter_Eur_Std() {
        // Prüfer (F90=Parametrikber!F$22: )
        //this.Produktionsland.Lohn_Einrichter_Eur_Std //=SVERWEIS(F$19;DB_Länder;5;FALSCH)*(1+WENN('Quick Input'!M$46=Auswahlfelder!$D$7;0;WENN('Quick Input'!M$46=Auswahlfelder!$D$8;0,5*SVERWEIS(F$19;DB_Länder;14;FALSCH);(SVERWEIS(F$19;DB_Länder;14;FALSCH)+SVERWEIS(F$19;DB_Länder;15;FALSCH))
    },
    //}
};

// Kernkosten
/*
let Maschine = 2 // F228
let Land
let ProzesszeitSchuss_min = 1.17 // F229
let Kernvolumen_ltr = 10 // Refkalkulation!H67
let Maschinenstundensatz = Maschine.Invest/Land/'Länder-DB'!$I$27+SVERWEIS(F228;'Maschinen-DB'!$C$46:$N$51;12;FALSCH)*'Länder-DB'!$I$29)/F149 // F230
let Mitarbeiter_pro_Maschine = MAX(1; ABRUNDEN(MIN(2; F228 / 2); 0)) // F232
let Maschienebediener_Eur_proStd =SVERWEIS(F$19;DB_Länder;4;FALSCH)*(1+WENN('Quick Input'!M$46=Auswahlfelder!$D$7;0;WENN('Quick Input'!M$46=Auswahlfelder!$D$8;0,5*SVERWEIS(F$19;DB_Länder;14;FALSCH);(SVERWEIS(F$19;DB_Länder;14;FALSCH)+SVERWEIS(F$19;DB_Länder;15;FALSCH))// F21
let ProzesskostenMaschineUndMa = Maschinenstundensatz + Mitarbeiter_pro_Maschine * Maschienebediener_Eur_proStd // F231
let ProzesskostenKernschiessen_pro_Std = (ProzesszeitSchuss_min/60*ProzesskostenMaschineUndMa*2)/Kernvolumen_ltr // F225
*/

// Ausgabe
let out = "";
for (const [key, value] of Object.entries(Teil)) {
    if (value.toString().includes("()")) {
        out +=
            `${key}: ${eval("Math.round(Teil." + key + "() * 100) / 100")}` +
            "<br>";
    } else {
        out += `${key}: ${value}` + "<br>";
    }
}
document.getElementById("data").innerHTML = out;
