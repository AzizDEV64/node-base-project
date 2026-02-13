const xlsx = require("node-xlsx")

class Export {
    constructor() {

    }
    toExcel(titles, columns, data = []) {
        let rows = []
        // console.log(titles,columns,data)
        rows.push(titles)
        for (let i = 0; i < data.length; i++) {
            let item = data[i]
            let cols = []
            for (let j = 0; j < columns.length; j++) {
                let value = item[columns[j]]//ornek item._id item.is_active vs geliyor onlarin degerini colsa push ediyoruz
                if(columns[j] == "created_by"){
                    value = value.toString()
                }
                cols.push(value)
            }
            rows.push(cols)
        }
        return xlsx.build([{ name: "Sheet", data: rows }])
    }
}

module.exports = Export