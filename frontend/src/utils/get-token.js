// Return a specific tokens details

export default async function getToken(address) {
  // data must be returned in this EXACT format
  return {
    disputeId: 0,
    image: "https://s2.coinmarketcap.com/static/img/coins/200x200/11165.png",
    name: "Orca Protocol",
    ticker: "ORCA",
    description:
      "Token utilized by Orca for governance, staking rewards, and boosted earnings on the platform.",
    agora_reward: "2000",
    sol_reward: "500",
    rep_required: "0",
    rep_risked: "25",
    status: "Voting", // "Voting"
    end_time: "4 days",
    requester: "FRX2QB33XRWuQfR6Ehb4YWWW6ihurNNDqYhL12XvzeKG",
    cases: [
      {
        timestamp: "Mon, 08 Aug 2022 23:13:34 GMT",
        evidence:
          "$ORCA adheres to the Agora Token's stablecoin standard guidlines and thus should be awarded the stablecoin badge.",
      },
      {
        timestamp: "Sun, 14 Aug 2022 22:53:11 GMT",
        evidence: "$ORCA ain't no stablecoin bruh, ur tripping",
      },
    ],
  };
}
