# Agora Token Demo
This is a simple demo of a protocol that has implemented [Agora Courts](https://github.com/IlliniBlockchain/agora-courts). The contract behind the frontend can be found in the original repository, under demo_tokens. 
The contract works with a CPI into multiple instructions from the court contract, including `initialize_dispute`, which can be configured by the protocol with a plethora of settings. 
Our demo abstracts all requirements so anyone can use it - tokens are simply minted to the user upon each call to showcase functionality.

The demo contract only allows for one challenger in a dispute, but there is no limit on the number of voters. As this site is for demo purpose only,
disputes only last 15 minutes for challenges and an extra hour for votes.

Note: As of now, the website is still incomplete aside from basic dispute voting and not all tabs show precise information.
## Testing Instructions
1) Under api/ add a .env file with the following variables defined using your Infura account:

    ```
    INFURA_ID=xxxxx
    INFURA_SECRET=xxxx
    ```
    This will allow you to upload images to IPFS, which is necessary to test token uploads.
2) Create three devnet wallets with enough SOL for transaction costs.
3) CD into api/ and run `node index.js`
4) CD into frontend/ and run `npm run dev`
5) Once the website has opened, choose a wallet and click on submit token.
6) Change to the next wallet and challenge the submission.
7) Go back to the first wallet to provide your case.
8) Finally, switch to the third wallet and vote on cases. More wallets may also vote, but only one is necessary for this demo.
