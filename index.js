
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
    Anteil_Angussgewicht_Prozent: 32,   // 'Länder-DB'!M19
    Wartungskosten_Prozent: 10,         // 'Länder-DB'!I29
    Wochenarbeitstage: 5,               // Quick-Input $47
    Arbeitswochen_pro_Jahr: 48,         // Quick-Input $48
    Maschinen: [
        {
            Name: "DT 8/5000",
            Invest: 1200000,            // F$138: SVERWEIS(Refkalkulation!H$52;DB_Maschinen;15;FALSCH)
            InvestWarmhaltOfen: 0,      // F$139
            AbschreibungJahre: 10,      // F$140
            Leistung_kW: 150,
            Produktionsflaeche: 1800,
            KostenProJahr() {           // Parametrikber!F$142: (F$138+F$139)/F$140+F$141)
                (this.Invest + this.InvestWarmhaltOfen) / this.AbschreibungJahre
            }              
        }

    ],
    Laender: [  // Länder
        {
            Name: "Deutschland",
            Flaechenkosten_pro_m2_Monat: 6.5    // Flächenkosten
        }
    ],
    Schichtmodelle: [
        { Name: "1-Schicht", Korrektur_Prozent: 95, Stunden_proTag: 8 },
        { Name: "2-Schicht", Korrektur_Prozent: 92, Stunden_proTag: 16 },
        { Name: "3-Schicht", Korrektur_Prozent: 88, Stunden_proTag: 24 }
    ]
}

let Material = {
    PreisProKg: 2        
}

let Teil = {
    Produktionsland: Parameter.Laender[0], // Deutschland
    Schichtmodell: Parameter.Schichtmodelle[2], // 3-Schicht
    Rohgewicht: 5,
    Materialkosten_Rohteil() {  
        return this.Rohgewicht * Material.PreisProKg
    },
    Schmelzverlust_Prozent: 5.6,        // Abbrand
    Wandstaerke_max_mm: 15,
    Wandstaerke_min_mm: 8,
    Korrektur_Modellanzahl_Prozent: 2,  // F$47
    Kastennutzung_Prozent: 1.3,         // F$58
    Aufschlag_TeileDicke_Prozent() {    // F$44
        return Math.max(0, 0.025 * (this.Wandstaerke_max_mm - 8) / 4) * 100
    },
    Aufschlag_Kastennutzung_Prozent() { // F$45
        return Math.max(0, 0.2 * (40 - this.Kastennutzung_Prozent))
    },
    Anguss_Prozent() {                  // F$42
        return Parameter.Anteil_Angussgewicht_Prozent + this.Aufschlag_TeileDicke_Prozent() + this.Aufschlag_Kastennutzung_Prozent() + this.Korrektur_Modellanzahl_Prozent
    },
    Schmelzverlust_Kosten() {
        return this.Materialkosten_Rohteil() * (1 + this.Anguss_Prozent() / 100) * this.Schmelzverlust_Prozent / 100
    },
    //Formen: {
        Maschine: Parameter.Maschinen[0],
        Energieverbrauch_kW() { 0.75 * this.Maschine.Leistung_kW },      // =0,75*SVERWEIS(Refkalkulation!H$52;DB_Maschinen;12;FALSCH)
        Bruttostunden_pro_Jahr() {  this.Schichtmodell.Stunden_proTag * Parameter.Wochenarbeitstage * Parameter.Arbeitswochen_pro_Jahr  }, // 146: =F$143*F$144*F$145
        Mittlere_Maschinennutzung_Prozent: 80, // Quick Input'!M$50
        Korrektur_Firmgroesse_Prozent: 0,       // $28
        Korrektur_OrtRegion: 0,       // $29
        //Korrektur_Schichtmodell_Prozent() { }, // 30: =WENN('Quick Input'!M$46=Auswahlfelder!$D$7;0,95;WENN('Quick Input'!M$46=Auswahlfelder!$D$8;0,92;0,88))
        Effizienz_Maschinennutzung() { // $27: =MIN(100%;('Quick Input'!M$50+F$28+F$29)*F$30)
            (this.Mittlere_Maschinennutzung_Prozent + this.Korrektur_Firmgroesse_Prozent + this.Korrektur_OrtRegion) * this.Schichtmodell.Korrektur_Prozent / 100
        }, 
        Nutzungsgrad_Prozent() { 0.9 * this.Effizienz_Maschinennutzung }, // 148: =0,9*F$27
        Nettonutzungsdauer_Std_pro_Jahr() { this.Bruttostunden_pro_Jahr * this.Nutzungsgrad_Prozent }, // F$149: =F$146*F$148
        Flaechenkosten_pro_Std() { this.Maschine.Produktionsflaeche * this.Produktionsland.Flaechenkosten_pro_m2_Monat * 12 / this.Nettonutzungsdauer_Std_pro_Jahr }, // F$155: =F153*F154*12/F149
        Maschinenstundensatz() {
            this.Maschine.KostenProJahr / this.Nettonutzungsdauer_Std_pro_Jahr + this.Energieverbrauch_kW + this.Flaechenkosten_pro_Std           // Parametrikber!F$137: F$142/F$149+F$152+F$155
        } 
    //}
}

// Ausgabe
let out = ''
for (const [key, value] of Object.entries(Teil)) {
    if (value.toString().includes("()")) {
        out += `${key}: ${eval("Math.round(Teil." + key + "() * 100) / 100")}` + '<br>'
    } else {
        out += `${key}: ${value}` + '<br>'
    }
}
document.getElementById("data").innerHTML = out

