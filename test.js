import axios from "axios";
import { readFile } from "fs/promises";
import dayjs from "dayjs";

// const parsedDate = dayjs("sdasdsad");

// const parsedResultDate = parsedDate.isValid()
// ? parsedDate.toISOString()
// : dayjs().toISOString();

// console.log(parsedResultDate)

const data = JSON.parse(await readFile("./crm_transactions-09.json", "utf-8"));

for (let d of data) {
    console.log(d)
    // if (d.resource === 'finances_operation' && d.status === 'create') {
        // console.log(d)
        axios.post("http://localhost:5173/api/webhook/f820217d-4383-4970-bc83-cdb0e0ee9603", d.meta)
        .then(response => {
            console.log("Transaction created:", response.data);
        })
        .catch(error => {
            console.error("Error creating transaction:", error);
        });
    // }
}

