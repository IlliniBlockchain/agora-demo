import Card from "../components/Card";
import Searchbar from "../components/Searchbar";
import getTokens from "../utils/get-tokens";
import { useEffect, useState } from "react";

const Home = () => {
  const [tokens, setTkns] = useState([]);

  useEffect(() => {
    (async () => {
      // make this getTokens(wallet, connection) SEE SOLR PAY REACT
      setTkns(await getTokens());
    })();
  }, []); //[wallet.connected]);

  return (
    <>
      <Searchbar />
      <div className="py-10 flex flex-wrap gap-8">
        {tokens.map(token => <Card token={token}/>)}
      </div>
    </>
  );
};

export default Home;
