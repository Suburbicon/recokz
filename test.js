import axios from "axios";
import { readFile } from "fs/promises";

const data = JSON.parse(await readFile("./t.json", "utf-8"));

for (let d of data) {
    if (d.meta?.resource === 'finances_operation' && d.meta?.status === 'create') {
        console.log(d)
        axios.post("https://www.reco.kz/api/webhook/7f88931c-3ea7-4d4b-a471-2a18e37c979e", d.meta)
        .then(response => {
            console.log("Transaction created:", response.data);
        })
        .catch(error => {
            console.error("Error creating transaction:", error);
        });
    }
}

