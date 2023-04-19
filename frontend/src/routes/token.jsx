import {
  Card,
  Badge,
  Timeline,
  Button,
  Alert,
  Tooltip,
  Modal,
  Label,
  Textarea,
} from "flowbite-react";
import {
  ClockIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  CalendarIcon,
} from "@heroicons/react/24/solid";
import { QuestionMarkCircleIcon as QMOutline } from "@heroicons/react/24/outline";
import React, { useState, useEffect, useRef } from "react";
import getToken from "../utils/get-token";
import vote from "../utils/vote";
import challenge from "../utils/challenge";
import isChallenged from "../utils/is-challenged";
import initCase from "../utils/init-case";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";

const Token = () => {
  const [token, setTkn] = useState({});
  const [popup, setPopup] = useState(false);
  const [challengePopup, setCPopup] = useState(false);
  const description = useRef();
  const challengeDescription = useRef();

  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  let location = useLocation();
  const id = location.pathname.split("/")[2];

  useEffect(() => {
    (async () => {
      setTkn(await getToken(id, connection, wallet));
      setCPopup(await isChallenged(id, connection, wallet));
    })();
  }, []);

  const handleVote = async (optionNo) => {
    try {
      await vote(optionNo, id, connection, wallet);

      toast.success("Voting successful.", {
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
      console.log(err)
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

  const handleSubmit = async () => {
    try {
      if (challengeDescription.current.value === "") {
        toast.error("Please provide a description.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        return;
      }

      await challenge(
        id,
        challengeDescription.current.value,
        connection,
        wallet
      );
      setTkn(await getToken(id, connection, wallet));

      toast.success("Challenge successfully submitted.", {
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

  const handleCase = async () => {
    try {
      if (description.current.value === "") {
        toast.error("Please provide a description.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        return;
      }

      await initCase(id, description.current.value, connection, wallet);
      setTkn(await getToken(id, connection, wallet));

      toast.success("Response successfully submitted.", {
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
    <div className="flex text-black justify-center">
      <div className="max-w-xl mr-8">
        <Card horizontal={true} imgSrc={token.image}>
          <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {token.ticker} by {token.name}
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            {token.description}
          </p>
        </Card>

        <div className="flex flex-wrap gap-3 mt-7">
          <div>
            <Button
              href={`https://explorer.solana.com/address/${token.address}`}
              target="_blank"
            >
              View in Explorer
            </Button>
          </div>
          <div>
            <Button color="gray">Add Badge</Button>
          </div>
          <React.Fragment>
            <Button color="gray" onClick={() => setPopup(true)} disabled={token.status !== "Submitted"}>
              Challenge Post
            </Button>
            <Modal
              show={popup}
              size="md"
              popup={true}
              onClose={() => setPopup(false)}
            >
              <Modal.Header />
              <Modal.Body>
                <div className="space-y-3 px-6 pb-4 sm:pb-6 lg:px-8 xl:pb-8">
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                    Challenge submission
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Create a challenge if you believe that this submission
                    should be rejected. Please be specific and provide evidence
                    to support your case. Thanks for your contribution!
                  </p>
                  <div id="textarea">
                    <div className="mb-2 block">
                      <Label htmlFor="comment" value="Description" />
                    </div>
                    <Textarea
                      id="comment"
                      placeholder="Write about your reason for challenging..."
                      required={true}
                      rows={4}
                      ref={challengeDescription}
                    />
                  </div>

                  <h2 className="text-black text-lg font-bold flex justify-between">
                    <span>Deposit Due:</span>
                    <span>2.0 SOL</span>
                  </h2>
                  <Alert color="info">
                    <span>
                      This safety deposit will be reimbursed if the challenge is
                      successful.
                    </span>
                  </Alert>
                  <div className="w-full">
                    <Button onClick={handleSubmit}>Submit challenge</Button>
                  </div>
                </div>
              </Modal.Body>
            </Modal>
          </React.Fragment>
        </div>
        <h2 className="text-xl mt-3 font-semibold flex gap-1">
          Reward Pool
          <Tooltip content="Tokens will be evenly split among majority voters">
            <QMOutline className="w-5 mt-1" />
          </Tooltip>
        </h2>

        <div className="flex gap-3 mt-2">
          <Badge color="success" className="w-fit" size="sm">
            {token.agora_reward} AGORA
          </Badge>
          <Badge color="purple" className="w-fit" size="sm">
            {token.sol_reward} SOL
          </Badge>
        </div>
        {token.status === "Voting" ? (
          <>
            <hr className="my-6 bg-gray-600" />
            <h2 className="text-2xl font-bold">Voting Open</h2>
            <p className="text-gray-600">
              After thoroughly reviewing all evidence, do you believe that this
              submission should be approved?
            </p>
            <h2 className="text-black text-lg font-bold flex justify-between my-3">
              <span>Reputation Risked:</span>
              <span>10 AGORA</span>
            </h2>
            <Alert color="info">
              <span>
                <b>Level 1</b> or higher required to be eligible for voting on
                this submission. Level up by earning $AGORA through voting.
              </span>
            </Alert>
            <div className="flex flex-wrap gap-3 mt-3">
              <Button onClick={() => handleVote(0)}>Approve</Button>
              <Button onClick={() => handleVote(1)} color="gray">
                Deny
              </Button>
            </div>
          </>
        ) : (
          <></>
        )}
      </div>
      <div className="flex flex-col gap-5">
        <div className="mt-5 flex gap-3">
          <Badge icon={QuestionMarkCircleIcon}>{token.status}</Badge>
          <Badge color="pink" icon={ClockIcon}>
            Deadline: {token.end_time}
          </Badge>
          <Badge color="gray" icon={UserIcon}>
            Requester:{" "}
            {token.requester
              ? token.requester.substring(0, 4) +
                "..." +
                token.requester.substring(token.requester.length - 4)
              : ""}
          </Badge>
        </div>
        <h2 className="text-2xl font-semibold mt-2">Submission History</h2>
        <Timeline className="ml-3">
          {token.cases ? (
            token.cases.map((c) => (
              <Timeline.Item>
                <Timeline.Point icon={CalendarIcon} />
                <Timeline.Content>
                  <Timeline.Time>{c.pk}</Timeline.Time>
                  <Timeline.Title>{c.title}</Timeline.Title>
                  <Timeline.Body>{c.evidence}</Timeline.Body>
                </Timeline.Content>
              </Timeline.Item>
            ))
          ) : (
            <></>
          )}
        </Timeline>
      </div>

      <React.Fragment>
        <Modal
          show={challengePopup}
          size="md"
          popup={true}
          onClose={() => setCPopup(false)}
        >
          <Modal.Header />
          <Modal.Body>
            <div className="space-y-3 px-6 pb-4 sm:pb-6 lg:px-8 xl:pb-8">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                Urgent action required
              </h3>
              <p className="text-gray-600 text-sm">
                Someone has initiated a challenge, so a jury will soon vote on
                the validity of your submission. Please provide supporting
                evidence for the voters to deliberate on.
              </p>
              <div id="textarea">
                <div className="mb-2 block">
                  <Label htmlFor="comment" value="Description" />
                </div>
                <Textarea
                  id="comment"
                  placeholder="Respond to the claims made against your submission..."
                  required={true}
                  rows={4}
                  ref={description}
                />
              </div>

              <div className="w-full">
                <Button onClick={handleCase}>Submit case</Button>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      </React.Fragment>
    </div>
  );
};

export default Token;
