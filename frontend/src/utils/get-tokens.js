// Return all tokens to be displayed on the home page

export default async function getTokens() {
  // data must be returned in this EXACT format
  return [
    {
      address: '0xaisudfhgask', // seed to pda in demo contract
      image: "https://s2.coinmarketcap.com/static/img/coins/200x200/11165.png",
      name: "Orca Protocol",
      ticker: "ORCA",
      description:
        "Token utilized by Orca for governance, staking rewards, and boosted earnings on the platform.",
      badges: ["Verified", "Token-2022 Compliant"],
    },
    {
      address: '0xr7iugyrd7h',
      image: "https://s2.coinmarketcap.com/static/img/coins/200x200/3408.png",
      name: "Circle",
      ticker: "USDC",
      description: "Hopefully SVB going bankrupt doesn't make this go to zero lol.",
      badges: ["Verified", "Stablecoin Compliant"],
    },
  ];
}
