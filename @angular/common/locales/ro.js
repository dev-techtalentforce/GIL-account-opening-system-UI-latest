/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
// THIS CODE IS GENERATED - DO NOT MODIFY.
const u = undefined;
function plural(val) {
    const n = val, i = Math.floor(Math.abs(val)), v = val.toString().replace(/^[^.]*\.?/, '').length;
    if (i === 1 && v === 0)
        return 1;
    if (!(v === 0) || (n === 0 || n % 100 === Math.floor(n % 100) && (n % 100 >= 2 && n % 100 <= 19)))
        return 3;
    return 5;
}
export default ["ro", [["a.m.", "p.m."], u, u], u, [["D", "L", "M", "M", "J", "V", "S"], ["dum.", "lun.", "mar.", "mie.", "joi", "vin.", "sâm."], ["duminică", "luni", "marți", "miercuri", "joi", "vineri", "sâmbătă"], ["du.", "lu.", "ma.", "mi.", "joi", "vi.", "sâ."]], u, [["I", "F", "M", "A", "M", "I", "I", "A", "S", "O", "N", "D"], ["ian.", "feb.", "mar.", "apr.", "mai", "iun.", "iul.", "aug.", "sept.", "oct.", "nov.", "dec."], ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"]], u, [["î.Hr.", "d.Hr."], u, ["înainte de Hristos", "după Hristos"]], 1, [6, 0], ["dd.MM.y", "d MMM y", "d MMMM y", "EEEE, d MMMM y"], ["HH:mm", "HH:mm:ss", "HH:mm:ss z", "HH:mm:ss zzzz"], ["{1}, {0}", u, u, u], [",", ".", ";", "%", "+", "-", "E", "×", "‰", "∞", "NaN", ":"], ["#,##0.###", "#,##0 %", "#,##0.00 ¤", "#E0"], "RON", "RON", "leu românesc", { "AUD": [u, "$"], "BRL": [u, "R$"], "BYN": [u, "р."], "CAD": [u, "$"], "CNY": [u, "¥"], "EUR": [u, "€"], "GBP": [u, "£"], "HKD": [u, "$"], "ILS": [u, "₪"], "INR": [u, "₹"], "JPY": [u, "¥"], "KRW": [u, "₩"], "MXN": [u, "$"], "NZD": [u, "$"], "PHP": [u, "₱"], "TWD": [u, "NT$"], "USD": [u, "$"], "VND": [u, "₫"], "XCD": [u, "$"] }, "ltr", plural];
//# sourceMappingURL=ro.js.map