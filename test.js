import axios from "axios";
import { readFile } from "fs/promises";
import dayjs from "dayjs";

// const parsedDate = dayjs("sdasdsad");

// const parsedResultDate = parsedDate.isValid()
// ? parsedDate.toISOString()
// : dayjs().toISOString();

// console.log(parsedResultDate)

const data = JSON.parse(await readFile("./t.json", "utf-8"));

for (let d of data) {
    console.log(d.resource)
    if (d.resource === 'finances_operation' && d.status === 'create') {
        console.log(d)
        axios.post("http://localhost:5173/api/webhook/373279aa-d96a-40b8-ac01-115baf1031dc", d)
        .then(response => {
            console.log("Transaction created:", response.data);
        })
        .catch(error => {
            console.error("Error creating transaction:", error);
        });
    }
}

