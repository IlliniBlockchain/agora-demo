import { useRouteError, Link } from "react-router-dom";
import { Button } from "flowbite-react";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div
      id="error-page"
      className="bg-white min-h-screen w-screen text-black flex flex-col gap-5 items-center justify-center"
    >
      <h1 className="font-semibold">Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{error.statusText || error.message}</i>
      </p>
      <Link to="/">
        <Button>Back To Home</Button>
      </Link>
    </div>
  );
}
