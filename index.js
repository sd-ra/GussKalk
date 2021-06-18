let Parameter = {
    Anteil_Angussgewicht_Prozent: 32    // 'Länder-DB'!M19
}

let Material = {
    PreisProKg: 2        
}

let Teil = {
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
    }
}

var json = JSON.stringify(Teil, function(key, value) {
  if (typeof value === "function") {
    return "/Function(" + value.toString() + ")/"
  }
  return value
})

let out = ''
for (const [key, value] of Object.entries(Teil)) {
    if (value.toString().includes("()")) {
        out += `${key}: ${eval("Math.round(Teil." + key + "() * 100) / 100")}` + '<br>'
    } else {
        out += `${key}: ${value}` + '<br>'
    }
}
// out = eval("Teil.Anguss_Prozent()")
document.getElementById("data").innerHTML = out

