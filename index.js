let express = require('express');
let PORT = process.env.PORT || '5000';

let app = express();
const ohm = {
    price : process.env.OHM_STARTING_DOLLAR,
    index : process.env.OHM_STARTING_INDEX,
    balance: process.env.OHM_STARTING_TOKEN
}

const time = {
    price : process.env.TIME_STARTING_DOLLAR,
    index : process.env.TIME_STARTING_INDEX,
    balance: process.env.TIME_STARTING_TOKEN
} 

const klima = {
    price : process.env.KLIMA_STARTING_DOLLAR,
    index : process.env.KLIMA_STARTING_INDEX,
    balance: process.env.KLIMA_STARTING_TOKEN
}

const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();

async function getLatestFromDB() {
    return client.query('SELECT id, timestamp, ohm_index, ohm_price, ohm_token, time_index, time_price, time_token, klima_price, klima_index, klima_token FROM public.indexes order by id desc limit 1;')
    .then(res => {
        return res.rows[0]
    })
    .catch(e => console.error(e.stack));   
}

app.get('/', async (req, res) => {
    let dbData = await getLatestFromDB()     

    const result = {
        starting_data : {
            timestamp : process.env.TIMESTAMP,
            ohm,
            time,
            klima
        },
        current_data : {
            timestamp: dbData.timestamp,
            ohm: {
                price: dbData.ohm_price,
                index: dbData.ohm_index,
                balance: dbData.ohm_token
            },
            time: {
                price: dbData.time_price,
                index: dbData.time_index,
                balance: dbData.time_token
            },
            klima: {
                price: dbData.klima_price,
                index: dbData.klima_index,
                balance: dbData.klima_token
            }
        }
    }

    console.log(result);

    res.json(result)
})

app.listen(PORT, () => console.log("Server started!"));