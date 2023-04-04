import { PlusSmallIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { Button, Card, Badge } from "flowbite-react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import getClaims from "../utils/get-claims";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import claimAll from "../utils/claim-all";
import { toast } from "react-toastify";

const Claim = () => {
  const [claims, setClaims] = useState([]);

  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  useEffect(() => {
    (async () => {
      setClaims(await getClaims(connection, wallet));
    })();
  }, [wallet]);

  const handleClaim = async () => {
    try {
      await claimAll(claims, connection, wallet);
      setClaims([]);

      toast.success("Claims successful.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } catch (err) {
      toast.error(err.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  return (
    <div id="error-page" className="text-black flex mt-28 gap-10 flex-col">
      <div className="flex gap-10 justify-between">
        <div className="w-1/2">
          <h1 className="font-semibold mb-3">Claim Rewards</h1>
          <p>
            Rewards from disputes you participated in that have been finalized
            will show up here to be claimed.
          </p>
        </div>

        <div className="shadow-lg rounded-lg w-fit p-5 flex gap-5 items-center">
          <div>
            <span className="flex gap-1 mb-1">
              <PlusSmallIcon className="w-4 text-blue-500" />
              <p className="text-gray-500">Rewards</p>
            </span>
            <span className="text-xl">
              {claims
                .map((item) => item.repChange)
                .reduce((prev, next) => prev + next, 0)
                .toFixed(2)}
            </span>
            <span className="text-blue-500 text-xl"> AGORA</span>

            <div>
              <span className="text-xl">
                {claims
                  .map((item) => item.payChange)
                  .reduce((prev, next) => prev + next, 0)
                  .toFixed(2)}
              </span>
              <span className="text-purple-500 text-xl"> SOL</span>
            </div>
          </div>
          <Button
            className="w-20 h-12"
            onClick={handleClaim}
            disabled={claims.length === 0 || claims[0].status === 'In Progress'}
          >
            Claim
          </Button>
        </div>
      </div>

      <div className="flex gap-5">
        {claims.map((claim) => {
          let color = "";
          switch (claim.status) {
            case "Voted Majority":
              color = "success";
              break;
            case "Winning Party":
              color = "success";
              break;
            case "Voted Minority":
              color = "failure";
              break;
            case "Losing Party":
              color = "failure";
              break;
          }

          return (
            <Link
              to={`/token/${claim.disputeId}`}
              className="max-w-xs cursor-pointer"
              key={claim.disputeId}
            >
              <Card className="w-80">
                <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {claim.name}
                </h5>
                <p className="font-normal text-gray-700 dark:text-gray-400">
                  Balance Changes
                </p>
                <div>
                  <span className="text-xl text-blue-500">
                    {claim.repChange.toFixed(2)}
                  </span>
                  <span className="text-gray-500 text-xl"> AGORA</span>
                  <div className="mt-1">
                    <span className="text-xl text-blue-500">
                      {claim.payChange.toFixed(2)}
                    </span>
                    <span className="text-gray-500 text-xl"> SOL</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge size="sm" color={color}>
                    {claim.status}
                  </Badge>
                  <ArrowRightIcon className="w-7 text-blue-700" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Claim;
