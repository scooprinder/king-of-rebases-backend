let express = require('express');
let PORT = process.env.PORT || '5000';

let app = express();

function round(num) {
    var m = Number((Math.abs(num) * 100).toPrecision(15));
    return Math.round(m) / 100 * Math.sign(num);
}

const ohm = {
    price : round(process.env.OHM_STARTING_DOLLAR),
    index : round(process.env.OHM_STARTING_INDEX),
    balance: round(process.env.OHM_STARTING_TOKEN)
}

const time = {
    price : round(process.env.TIME_STARTING_DOLLAR),
    index : round(process.env.TIME_STARTING_INDEX),
    balance: round(process.env.TIME_STARTING_TOKEN)
} 

const klima = {
    price : round(process.env.KLIMA_STARTING_DOLLAR),
    index : round(process.env.KLIMA_STARTING_INDEX),
    balance: round(process.env.KLIMA_STARTING_TOKEN)
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
    return client.query('SELECT id, round(ohm_index::numeric,2) as ohm_index, ohm_price, round(time_index::numeric,2) as time_index, time_price, klima_price, round(klima_index::numeric,2) as klima_index, round(ohm_token::numeric,5) as ohm_token, round(time_token::numeric,5) as time_token, round(klima_token::numeric,5) as klima_token, "timestamp", round(ohm_value::numeric,2) as ohm_value, round(time_value::numeric,2) as time_value, round(klima_value::numeric,2) as klima_value, round(ohm_pnl::numeric,2) as ohm_pnl, round(time_pnl::numeric,2) as time_pnl, round(klima_pnl::numeric,2) as klima_pnl FROM public.indexes order by id desc limit 1;')
    .then(res => {
        return res.rows[0]
    })
    .catch(e => console.error(e.stack));   
}

app.get('/', async (req, res) => {
    let dbData = await getLatestFromDB()     

    const result = {
        starting_data : {
            investedAmount: 1000,
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
                balance: dbData.ohm_token,
                currentNW: dbData.ohm_value,
                pnl: dbData.ohm_pnl
            },
            time: {
                price: dbData.time_price,
                index: dbData.time_index,
                balance: dbData.time_token,
                currentNW: dbData.time_value,
                pnl: dbData.time_pnl
            },
            klima: {
                price: dbData.klima_price,
                index: dbData.klima_index,
                balance: dbData.klima_token,
                currentNW: dbData.klima_value,
                pnl: dbData.klima_pnl
            }
        }
    }
    res.json(result)
})

app.listen(PORT, () => console.log("Server started!"));