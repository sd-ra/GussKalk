let Parameter = {
    Anteil_Angussgewicht_Prozent: 32    // 'Länder-DB'!M19
}

let Material = {
    PreisProKg: 2        // Preis/kg
}

let Teil = {
    Rohteilgewicht: 5,
    Materialkosten_Rohteil() {  
        return this.Rohteilgewicht * Material.PreisProKg
    },
    Schmelzverlust_Prozent_fest: 5.6,   // Abbrand
    Wandstaerke_max_mm: 15,
    Wandstaerke_min_mm: 8,
    Korrektur_Modellanzahl_Prozent: 2,  // F$47
    Kastennutzung_Prozent: 1.3,         // F$58
    Aufschlag_TeileDicke_Prozent() {    // F$44
        return Math.max(0, 0.025 * (this.Wandstaerke_max_mm - 8) / 4)
    },
    Aufschlag_Kastennutzung_Prozent() { // F$45
        return Math.max(0, 0.2 * (40 - this.Kastennutzung_Prozent))
    },
    Anguss_Prozent() {                  // F$42
        return Parameter.Anteil_Angussgewicht_Prozent + this.Aufschlag_TeileDicke_Prozent() + this.Aufschlag_Kastennutzung_Prozent() + this.Korrektur_Modellanzahl_Prozent
    },
    Schmelzverlust_Kosten() {
        return this.Materialkosten_Rohteil() * (1 + this.Anguss_Prozent() / 100) * this.Schmelzverlust_Prozent_fest / 100
    }
}

alert(Teil.Aufschlag_Kastennutzung_Prozent())