import BigNumber from "bignumber.js";

export async function sendSignedTxAndGetResult(account: any, contract: any, spendAmount: any, contractMethod: any, gasMultiplier: any, web3: any) {
  console.log(account)
  const encodedAbi = contractMethod.encodeABI();

  let currentGasPrice = await web3.eth.getGasPrice();
  let proposedGasPrice = BigNumber(currentGasPrice).multipliedBy(BigNumber(gasMultiplier));

  console.log(`Currrent gas price: ${currentGasPrice}, and proposed price: ${proposedGasPrice}`)

  let tx = {
    from: account['address'],
    to: contract._address,
    gas: 1000000,
    gasPrice: proposedGasPrice.toString(),
    data: encodedAbi,
    value: spendAmount
  } 

  let signedTxn = await account.signTransaction(tx);

  let response = await web3.eth.sendSignedTransaction(signedTxn.rawTransaction)
    .on('transactionHash', function(hash: any) {
      console.log(`New transaction ${hash} submitted`)
    });

  if(response.status) {
    console.log(`Transaction ${response.transactionHash}`);
  } else {
    console.log(`Transaction ${response.transactionHash} FAILED`);
  }
  console.log(response)
  return [response.status, response.transactionHash];
}

export async function privateKeyToAccount(web3: any, privateKey: any) {
  return await web3.eth.accounts.privateKeyToAccount(privateKey);
}
