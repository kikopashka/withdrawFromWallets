import winston from "winston"
import { ethers } from "ethers"
import { general } from "./settings.js"





export async function getChainNameLiFi(network){
  switch(network){
    case "ethereum" : return "eth";
    case "optimism" : return "opt";
    case "zkSync" : return "era";
    case "base" : return "bas";
    case "linea" : return "lna";
    case "optimism" : return "opt";
    case "scroll" : return "scl";
    case "avalanche" : return "ava";
    case "bsc" : return "bsc";
  }
}




export const logger = winston.createLogger({
  format: winston.format.combine(
      winston.format.colorize({
        all: false,
        colors: { error: 'red' } 
      }),
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: "logs.log",
      level: "info"
    })
  ]
});




export function amountConsole(amount){
  let decimals = 18
  let amountWithDecimals = ethers.formatUnits(amount, decimals);
  return amountWithDecimals;
}




export async function delayTx(min, max) {           //тут в секундах
  let number = Math.floor(Math.random() * (max - min + 1) + min) * 1000;
  //logger.info(`Delay ${number / 1000} seconds after transaction is started...`)
  await delay(number)
}


export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export async function getMinDepositAmountDecimal(network){
  let amount
  switch(network){
    case "avax" : amount = general.minimumAVAX
      break
    case "polygon" : amount = general.minimumMATIC
      break
    case "base" : amount = general.minimumETHBASE
      break
    case "eth" : amount = general.minimumETHETH
      break
    case "arbitrum" : amount = general.minimumETHARB
      break
    case "optimism" : amount = general.minimumETHOPTI
      break
    case "zksync" : amount = general.minimumETHZK
      break
    case "linea" : amount = general.minimumLINEA
      break
    case "bsc" : amount = general.minimumBNB
      break

  }
  let minAmount = ethers.parseEther(amount)
  return minAmount    
}
