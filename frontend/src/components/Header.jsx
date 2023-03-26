import {
  Navbar,
  Button,
  Tooltip,
  Modal,
  Label,
  TextInput,
  FileInput,
  Alert,
  Textarea,
} from "flowbite-react";
import { ChevronDoubleUpIcon } from "@heroicons/react/24/solid";
import React from "react";
import { useLocation } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRef, useState } from "react";
import axios from "axios";
import FormData from "form-data";
import createSubmission from "../utils/create-submission";
import { toast } from "react-toastify";
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';

const Header = () => {
  const [popup, setPopup] = useState(false);
  const [image, setImage] = useState("");

  const {connection} = useConnection();
  const wallet = useAnchorWallet();

  const name = useRef();
  const address = useRef();
  const ticker = useRef();
  const description = useRef();

  let location = useLocation();

  const handleFile = (e) => {
    if (e.target.files === null) return;

    var file = e.target.files[0];
    var img = URL.createObjectURL(file);

    setImage(img);
  };

  const handleSubmit = async () => {
    try {
      if (
        image === "" ||
        name.current.value === "" ||
        address.current.value === "" ||
        ticker.current.value === "" ||
        description.current.value === ""
      ) {
        toast.error("Please fill out all fields.", {
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

      let file = await fetch(image).then((r) => r.blob());

      let data = new FormData();
      data.append("logo", file);
      let cid = (await axios.post("http://localhost:5001/api/upload", data))
        .data;
      let logoURL = `https://agora-courts.infura-ipfs.io/ipfs/${cid}`;

      await createSubmission(name.current.value, address.current.value, ticker.current.value, description.current.value, logoURL, connection, wallet);

      toast.success("Token successfully submitted.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } catch (e) {
      alert(e);
    }
  };

  return (
    <Navbar fluid={true} rounded={true} className="mx-20">
      <Navbar.Brand href="/">
        <img
          src="https://flowbite.com/docs/images/logo.svg"
          className="mr-3 h-6 sm:h-9"
          alt="Flowbite Logo"
        />
        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
          Agora Tokens
        </span>
      </Navbar.Brand>
      <div className="flex md:order-2 gap-5 items-center">
        <Tooltip
          content="Your level determines voter reward payouts. Level up by voting on disputes."
          className="w-48"
        >
          <div className="w-28 h-9 bg-blue-300 rounded-xl flex items-center justify-center gap-1.5">
            <ChevronDoubleUpIcon className="text-blue-600 w-5" />
            <p className="text-blue-600 bg-transparent">Level 1</p>
          </div>
        </Tooltip>
        <React.Fragment>
          <Button onClick={() => setPopup(true)}>Submit Token</Button>
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
                  Submit a token
                </h3>
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="name" value="Name" />
                  </div>
                  <TextInput
                    id="name"
                    placeholder="Solana Foundation"
                    ref={name}
                    required={true}
                  />
                </div>
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="address" value="Address" />
                  </div>
                  <TextInput
                    id="address"
                    type="address"
                    placeholder="7xKX...gAsU"
                    ref={address}
                    required={true}
                  />
                </div>
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="ticker" value="Ticker" />
                  </div>
                  <TextInput
                    id="ticker"
                    placeholder="SOL"
                    ref={ticker}
                    required={true}
                  />
                </div>
                <div id="textarea">
                  <div className="mb-2 block">
                    <Label htmlFor="comment" value="Description" />
                  </div>
                  <Textarea
                    id="comment"
                    placeholder="Write a token description..."
                    required={true}
                    ref={description}
                    rows={2}
                  />
                </div>
                <div id="fileUpload">
                  <div className="mb-2 block">
                    <Label htmlFor="file" value="Upload logo" />
                  </div>
                  <FileInput
                    onChange={handleFile}
                    helperText="Please ensure the logo is a transparent, high resolution PNG."
                  />
                </div>
                <h2 className="text-black text-lg font-bold flex justify-between">
                  <span>Deposit Due:</span>
                  <span>10 AGORA</span>
                </h2>
                <Alert color="info">
                  <span>
                    This safety deposit will be reimbursed if the submission is
                    successfully verified.
                  </span>
                </Alert>
                <div className="w-full">
                  <Button onClick={handleSubmit}>Submit for review</Button>
                </div>
              </div>
            </Modal.Body>
          </Modal>
        </React.Fragment>
        <Navbar.Toggle />
        <WalletMultiButton />
      </div>
      <Navbar.Collapse>
        <Navbar.Link href="/" active={location.pathname == "/"}>
          Home
        </Navbar.Link>
        <Navbar.Link href="https://docs.agoracourts.com/products/agora-tokens" target="_blank">Tutorial</Navbar.Link>
        <Navbar.Link href="https://docs.agoracourts.com/products/agora-tokens/token-criteria" target="_blank">Criteria</Navbar.Link>
        <Navbar.Link
          href="/claim"
          active={location.pathname == "/claim"}
        >
          Claim
        </Navbar.Link>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Header;
