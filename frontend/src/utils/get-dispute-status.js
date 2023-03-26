const getDisputeStatus = (disputeState) => {
  let challengeEndTime = disputeState.config.endsAt.toNumber();

  // choose the corrent deadline (three different deadlines for grace, waiting, and voting periods)
  if (disputeState.status.grace) {
    challengeEndTime = disputeState.config.graceEndsAt.toNumber();
  } else if (disputeState.status.waiting) {
    challengeEndTime = disputeState.config.initCasesEndsAt.toNumber();
  }

  let dateNow = Math.floor(Date.now() / 1000);

  if (disputeState.status.waiting) {
    if (disputeState.config.endsAt.toNumber() < dateNow) {
      // if voting deadline expired, we transition from Waiting to Concluded
      return "Concluded";
    } else if (challengeEndTime < dateNow) {
      return "Voting"; // otherwise we go straight into Voting
    } else {
      return "Challenged";
    }
  } else if (challengeEndTime < dateNow) {
    return "Concluded";
  } else if (disputeState.status.grace) {
    return "Submitted";
  } else if (disputeState.status.voting) {
    return "Voting";
  }

  return ""
};

export default getDisputeStatus