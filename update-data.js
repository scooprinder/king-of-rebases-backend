const axios = require('axios');
const { ethers } = require("ethers");

const start_ohm = {
    price : process.env.OHM_STARTING_DOLLAR,
    index : process.env.OHM_STARTING_INDEX,
    balance: process.env.OHM_STARTING_TOKEN
}

const start_time = {
    price : process.env.TIME_STARTING_DOLLAR,
    index : process.env.TIME_STARTING_INDEX,
    balance: process.env.TIME_STARTING_TOKEN
} 

const start_klima = {
    price : process.env.KLIMA_STARTING_DOLLAR,
    index : process.env.KLIMA_STARTING_INDEX,
    balance: process.env.KLIMA_STARTING_TOKEN
}

const invested = 10000;

async function getTimeIndex() {
    const payload = {
        method:"eth_call",
        params:[
            {
                to:"0x4456b87af11e87e329ab7d7c7a246ed1ac2168b9",
                data:"0x2986c0e5"
            },
            "latest"
        ],
        id:104,
        jsonrpc:"2.0"
    }
    
    return axios.post("https://api.avax.network/ext/bc/C/rpc", JSON.stringify(payload), {
        headers: {
            'authority' : "api.avax.network",
            'content-type' : 'application/json'
        }
    }).then(res => {
        const result = res.data.result;
        const index = ethers.utils.formatUnits(result,"gwei") / 4.5
        console.log(`Time: ${index} TIME`)
        return index
    }).catch(err => console.log(err));
}

async function getKlimaIndex() {
    const payload = {
        method:"eth_call",
        params:[
            {
                to:"0xb0c22d8d350c67420f06f48936654f567c73e8c8",
                data:"0x70a08231000000000000000000000000693ad12dba5f6e07de86faa21098b691f60a1bea"
            },
            "latest"
        ],
        id:69,
        jsonrpc:"2.0"
    }
    
    return axios.post("https://polygon-rpc.com/", JSON.stringify(payload), {
        headers: {
            'authority' : "polygon-rpc.com",
            'content-type' : 'application/json'
        }
    }).then(res => {
        const result = res.data.result;
        const index = ethers.utils.formatUnits(result,"gwei") 
        console.log(`Klima: ${index} KLIMA`)
        return index
    }).catch(err => console.log(err));
}

async function getOhmIndex() {
    const payload = {
        method:"eth_call",
        params:[
            {
                to:"0xfd31c7d00ca47653c6ce64af53c1571f9c36566a",
                data:"0x2986c0e5"
            },
            "latest"
        ],
        id:69,
        jsonrpc:"2.0"
    }
    
    return axios.post(process.env.MAINNET_INFURA, JSON.stringify(payload), {
        headers: {
            //'authority' : "polygon-rpc.com",
            'content-type' : 'application/json'
        }
    }).then(res => {
        const result = res.data.result;
        const index = ethers.utils.formatUnits(result,"gwei") 
        console.log(`Ohm: ${index} OHM`)
        return index
    }).catch(err => console.log(err));
}

async function getPrice() {
    return axios.get("https://api.coingecko.com/api/v3/simple/price?ids=olympus%2Cklima-dao%2Cwonderland&vs_currencies=usd")
    .then(res => {
        return res.data
    })
}

async function getPrev(client) {
    return client.query('SELECT id, ohm_index, ohm_price, ohm_token, time_index, time_price, time_token, klima_price, klima_index, klima_token FROM public.indexes order by id desc limit 1;')
    .then(res => {
        return res.rows[0]
    })
    .catch(e => console.error(e.stack));   
}

async function insert(time, ohm, klima, prices, client) {
    const prev = await getPrev(client);
    // new_tokens = curr_tokens * ( 1 + (rebase_rate))
    // (newest index /previous index) - 1
    const ohm_rebase = (ohm / prev.ohm_index) - 1
    const ohm_tokens = prev.ohm_token * (1 + ohm_rebase)
    const ohm_value = ohm_tokens * prices.olympus.usd
    const ohm_pnl = ((ohm_value - invested) / invested) * 100

    const time_rebase = (time / prev.time_index) - 1
    const time_tokens = prev.time_token * (1 + time_rebase)
    const time_value = time_tokens * prices.wonderland.usd
    const time_pnl = ((time_value - invested) / invested) * 100

    const klima_rebase = (klima / prev.klima_index) - 1
    const klima_tokens = prev.klima_token * (1 + klima_rebase)
    const klima_value = klima_tokens * prices['klima-dao'].usd
    const klima_pnl = ((klima_value - invested) / invested) * 100   

    const text = 'INSERT INTO public.indexes(timestamp, ohm_index, ohm_price, ohm_token, ohm_value, ohm_pnl, time_index, time_price, time_token, time_value, time_pnl, klima_index, klima_price, klima_token, klima_value, klima_pnl) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);'
    const values = [Date.now(), ohm, prices.olympus.usd, ohm_tokens, ohm_value ,ohm_pnl,
                    time, prices.wonderland.usd, time_tokens, time_value ,time_pnl,
                    klima, prices['klima-dao'].usd, klima_tokens, klima_value, klima_pnl]

   return client
    .query(text, values)
    .then(res => {
        //console.log(res.rows[0])
    })
    .catch(e => console.error(e.stack))
}

async function getAll() {
    const prices = await getPrice();
    const time = await getTimeIndex();
    const klima = await getKlimaIndex();
    const ohm = await getOhmIndex();

    const { Client } = require('pg');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    client.connect();

    await insert(time, ohm, klima, prices, client)

    client.end();
}

getAll();




