import axios from "axios";
import { readFile } from "fs/promises";

const data = JSON.parse(await readFile("./t.json", "utf-8"));

for (let d of data) {
    if (d.meta?.resource === 'finances_operation' && d.meta?.status === 'create') {
        console.log(d)
        axios.post("https://www.reco.kz/api/webhook/02a7996e-386f-443a-b93b-5eb791b218ba", d.meta)
        .then(response => {
            console.log("Transaction created:", response.data);
        })
        .catch(error => {
            console.error("Error creating transaction:", error);
        });
    }
}

