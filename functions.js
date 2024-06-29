import { ethers } from "ethers"
import { general } from "./settings.js"
import config from "./config.json" assert {type: "json"}
import abi from "./abi.json" assert {type: "json"}
import { getChainNameLiFi, logger, delayTx, amountConsole, getMinDepositAmountDecimal } from "./helpers.js"
import fs from "fs"


export async function jumperBridge(key, fromToken, toToken, fromNetwork, toNetwork, percent){
    try{
        const provider = new ethers.JsonRpcProvider(general[fromNetwork])
        const wallet = new ethers.Wallet(key, provider)
        const nativeAddress = "0x0000000000000000000000000000000000000000"
        let tokenInContract, balance
        if(fromToken == "eth"){
            tokenInContract = {target :"0x0000000000000000000000000000000000000000"}
            balance = await provider.getBalance(wallet.address)
        }else {
            tokenInContract = new ethers.Contract(config.tokens[fromNetwork][fromToken], abi.ERC20, provider)
            balance = await tokenInContract.balanceOf(wallet.address)
        }
        if(balance > 0n){
            const chainFrom = await getChainNameLiFi(fromNetwork)
            const chainTo = await getChainNameLiFi(toNetwork)
            const amount = balance * BigInt(percent) / 100n
            // const response = await fetch('https://li.quest/v1/chains', {
            //     "headers" : {
            //         "accept": "*/*",
            //         "content-type": "application/json",
            //     },
            //     "method" : "GET"
            // })
            // const json = await response.json()
            const quote = await fetch(`https://li.quest/v1/quote?fromChain=${config.jumper.chainId[fromNetwork]}&toChain=${config.jumper.chainId[toNetwork]}&fromToken=${tokenInContract.target}&toToken=${nativeAddress}&fromAddress=${wallet.address}&fromAmount=${amount}&order=RECOMMENDED`, {
                "headers" : {
                    "accept": "*/*",
                    "content-type": "application/json"
                },
                "method" : "GET"
            })
            const quoteJson = await quote.json()
            if(quoteJson?.message === "No available quotes for the requested transfer"){
                logger.warn(`There is no available route via Jumper Bridge.`)
            }else{
                if(fromToken != "eth"){
                    let allowance = await tokenInContract.allowance(wallet.address, quoteJson.transactionRequest.to)
                    if(allowance < balance){
                        const txApprove = await tokenInContract.connect(wallet).approve(
                            quoteJson.transactionRequest.to,
                            balance
                        )
        
                        await txApprove.wait()
                        await delayTx(10, 20)
                    }
                }
                const txEstimate = await provider.estimateGas({
                    from: quoteJson.transactionRequest.from,
                    to: quoteJson.transactionRequest.to,
                    value: quoteJson.transactionRequest.value,
                    data: quoteJson.transactionRequest.data
                })
        
                const tx = await wallet.sendTransaction({
                    from: quoteJson.transactionRequest.from,
                    to: quoteJson.transactionRequest.to,
                    value: quoteJson.transactionRequest.value,
                    data: quoteJson.transactionRequest.data
                })
                await tx.wait()
                // const status = await fetch(`https://li.quest/v1/status?txHash=${tx.hash}`, {
                //     "headers" : {
                //         "accept": "*/*",
                //         "content-type": "application/json"
                //     },
                //     "method" : "GET"
                // })
                // const statusJson = await status.json()
                logger.info(`${amountConsole(amount)} ${fromToken} was swapped via LiFi`)
                await delayTx(general.minDelay, general.maxDelay)
            }
        } else {
            logger.info(`There is no balance for swap`)
        }

    }catch(e){
        logger.error(`Unknown problem with LiFi bridge - ${e}`)
    }
}





export async function transfer(key, network, token, toAddress){
    try{
        if(toAddress == null){
            logger.error(`There is no OKX address!!!`)
            logger.error(`There is no OKX address!!!`)
            logger.error(`There is no OKX address!!!`)

        } else {
            const provider = new ethers.JsonRpcProvider(general[network])
            const wallet = new ethers.Wallet(key, provider)
            const balance = await provider.getBalance(wallet.address)
            const gasPrice = (await provider.getFeeData()).gasPrice
            const minimum = await getMinDepositAmountDecimal(network)
    
    
            const fakeEstimate = await provider.estimateGas({
                from : wallet.address,
                to: toAddress,
                value: 0n,
            })
    
            let amount
            if(network == "zksync"){
                amount = balance - (fakeEstimate * 150n / 100n * gasPrice)
            } else {
                amount = balance - (fakeEstimate * gasPrice * 110n / 100n)
            }
    
            if(amount < minimum){
                logger.error(`Balacne less than minimum deposit - ${wallet.address}`)
            } else {
                const txEstimate = await provider.estimateGas({
                    from : wallet.address,
                    to: toAddress,
                    value: amount,
                    gasPrice: gasPrice
                })
    
                const tx = await wallet.sendTransaction({
                    from : wallet.address,
                    to: toAddress,
                    value: amount,
                    gasLimit: network == "zksync" ? txEstimate * 110n / 100n : txEstimate,
                    gasPrice: gasPrice
                })
            
                await tx.wait()
                logger.info(`${amountConsole(amount)} ${token}-${network} transfered to ${toAddress}`)
                await delayTx(general.minDelay, general.maxDelay)
            }
        }
    }catch(e){
        logger.error(`Unknown problem with transfer - ${e}`)
    }
}

export async function getBalanceAmount(key, network, token){
    const provider = new ethers.JsonRpcProvider(general[network])
    const wallet = new ethers.Wallet(key, provider)
    const tokenContract = new ethers.Contract(config.tokens[network][token], abi.ERC20, provider)
    const balance = await tokenContract.connect(wallet).balanceOf(wallet.address)
    const result = `${ethers.formatUnits((balance).toString(), 18)}\n`
    const fileStream = fs.appendFileSync("balance.txt", result)    
}