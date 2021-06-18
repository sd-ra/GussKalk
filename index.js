let Parameter = {
    Schmelzverlust_Proz: 5.5    // Abbrand - warum nicht im Material?
}

let material = {
    costPerKg: 2        // Preis/kg
}

let product = {
    grossWeight: 5,
    MaterialkostenRohteil() {    // Materialkosten Rohteil
        return this.grossWeight * material.costPerKg
    },
    Schmelzverlust_Proz: 5.6,    // Abbrand - warum nochmal?
    Wandstaerke_max_mm: 15,
    Wandstaerke_min_mm: 8,
    AufschlagTeileDicke_Proz() {
        let result = 2.5 / 100 * (this.Wandstaerke_max_mm - 8) / 4
        if (result < 0) {
            result = 0
        }
        return result
    },
    combustionCost() {
        return this.MaterialkostenRohteil() * (1 + Parameter.Schmelzverlust_Proz / 100) * this.Schmelzverlust_Proz / 100
    }
}

alert(product.AufschlagTeileDicke_Proz());