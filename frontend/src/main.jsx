import React from 'react'
import ReactDOM from 'react-dom/client'
import Home from './routes/home'
import Claim from './routes/claim'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import ErrorPage from "./routes/error";
import Token from "./routes/token";
import Root from "./routes/root";


const router = createBrowserRouter([
  {
    path: "/",
    element: <Root/>,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/claim",
        element: <Claim />,
      },
      {
        path: "token/:address",
        element: <Token />,
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
