import Card from "../components/Card";
import Searchbar from "../components/Searchbar";
import getTokens from "../utils/get-tokens";
import { useEffect, useState } from "react";
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';

const Home = () => {
  const [tokens, setTkns] = useState([]);
  const [query, setQ] = useState([]);
  const [fQuery, setfQ] = useState("Filter By");

  const {connection} = useConnection();
  const wallet = useAnchorWallet();

  const filter = (tokens) => {
    if (!query) return tokens

    return tokens.filter(token => token.name.toLowerCase().startsWith(query) || token.ticker.toLowerCase().startsWith(query))
  }

  useEffect(() => {
    (async () => {
      setTkns(await getTokens(connection, wallet));
    })();
  }, []);

  return (
    <>
      <Searchbar setQ={setQ} setfQ={setfQ}/>
      <div className="py-10 flex flex-wrap gap-8">
        {filter(tokens).map(token => <Card token={token} key={token.id}/>)}
      </div>
    </>
  );
};

export default Home;
