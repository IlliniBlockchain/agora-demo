import Card from "../components/Card";
import Searchbar from "../components/Searchbar";
import getTokens from "../utils/get-tokens";
import { useEffect, useState } from "react";
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';

const Home = () => {
  const [tokens, setTkns] = useState([]);

  const {connection} = useConnection();
  const wallet = useAnchorWallet();

  useEffect(() => {
    (async () => {
      // make this getTokens(wallet, connection) SEE SOLR PAY REACT
      setTkns(await getTokens(connection, wallet));
    })();
  }, []); //[wallet.connected]);

  return (
    <>
      <p className="text-gray-600 text-m mb-1">
        This demo is intended to showcase a potential implementation of the Agora Court protocol.
        We have created a "demo contract" to interface with the dispute contract. While this is a
        functional demo, please keep in mind that disputes are fully configurable and this is a very simple implementation.
        <span className="text-red-700"> Not all features of the demo are completed</span> - we are planning on creating a more complex interfacing protocol in the future.
      </p>
      <p className="text-gray-600 text-m mb-5">If you have questions, feel free to reach out to us on twitter @agoracourts.</p>
      <Searchbar />
      <div className="py-10 flex flex-wrap gap-8">
        {tokens.map(token => <Card token={token}/>)}
      </div>
    </>
  );
};

export default Home;
