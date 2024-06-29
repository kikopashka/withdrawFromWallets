import { jumperBridge, transfer, getBalanceAmount } from "./functions.js"
import fs from "fs"
import { general }from "./settings.js"
import _ from "lodash" 
import { logger, delayTx } from "./helpers.js"

const privates = fs.readFileSync("private.txt").toString().replace(/\r\n/g,'\n').split('\n');
const addressesOKX = fs.readFileSync("okxwallets.txt").toString().replace(/\r\n/g,'\n').split('\n');
const pairs = privates.map((privateKey, index) => ({ privateKey, address: addressesOKX[index] }));

let pairs2
if(general.shuffle){
    pairs2 = _,shuffle(pairs)
}else{
    pairs2 = pairs
}

for(let i = 0; i < pairs2.length; i++){
    logger.info(`Starting with wallet ${i+1}/${pairs2.length}`)
    if(general.jumper){
        await jumperBridge(pairs2[i].privateKey, general.fromToken, general.toToken, general.fromNetwork, general.toNetwork, general.percent)
    }

    if(general.transfer){
        await transfer(pairs2[i].privateKey, general.network, general.token, pairs2[i].address)
    }

    if(general.checkBalance){
        await getBalanceAmount(pairs2[i].privateKey, general.balanceNetwork, general.tokenBalance)
    }


}

