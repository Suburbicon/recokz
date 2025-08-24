import axios from "axios";
import { readFile } from "fs/promises";
import dayjs from "dayjs";

console.log(dayjs("sdfasds").toISOString() || dayjs().toISOString())

// const data = JSON.parse(await readFile("./t.json", "utf-8"));

// for (let d of data) {
//     console.log(d.resource)
//     if (d.resource === 'finances_operation' && d.status === 'create') {
//         console.log(d)
//         axios.post("http://localhost:5173/api/webhook/b1281f33-a1e0-45ed-849a-52728bc21c8e", d)
//         .then(response => {
//             console.log("Transaction created:", response.data);
//         })
//         .catch(error => {
//             console.error("Error creating transaction:", error);
//         });
//     }
// }

