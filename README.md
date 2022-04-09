#    A Web3 Decentralized Application build on Solana Blockchain 
##                  Solana Pay Dapp. 

## I Have Added Comments for Better Understanding, by the code I have written .
#### ***Besure to Read it !*** .

### What Browser Wallet we have used for this Dapp ? (You also can use any other if you want)
### [Phantom Wallet](https://phantom.app/download.) Supported for __Chrome, Brave, Firefox and Edge__ .

After creating wallet change the network to __Devnet__ .
Get some __Solana__  test tokens from ***[https://solfaucet.com/](https://solfaucet.com/)*** .
Create another wallet (one for shop and one for buyer). 

yarn install 
yarn dev 

But lots of people coming into our cookie shop might not know what the value of a SOL is. It’d be nice if we could charge them in dollars instead

Getting some USDC-Dev

We’re going to use a token faucet: [USDC-Dev-TOKEN-FAUCET](https://spl-token-faucet.com/?token-name=USDC-Dev)

-------
#### SOLANA PAY 

Get a Solana mobile wallet which Supports ***Solana Pay***
[Slope Wallet](https://slope.finance/)

__Import your buyer wallet from phantom wallet__

Get your private key from buyer wallet (By export)
Then import your buyer wallet private key into your Mobile Wallet

For solana Pay:

Create a shop directory in your project.

that will contain code for using Solana Pay using ***/shop*** route path .

### For coupon:

Phantom Wallet doesn't support partially signed transactions just yet.
We’re going to have to use a different browser wallet to test this transaction out for now. The one that I’ve found works really well is [Solflare](https://solflare.com/)

__We have already included Solflare in _app.tsx.__