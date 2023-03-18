import { Card as FCard, Badge } from "flowbite-react";
import { Link } from "react-router-dom";

const Card = ({ token }) => {
  return (
    <Link to={`/token/${token.address}`} state={{id: token.id}} className="max-w-xs cursor-pointer">
      <FCard imgSrc={token.image}>
        <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          ${token.ticker} by {token.name}
        </h5>
        <p className="text-sm text-gray-700 dark:text-gray-400">
          {token.description}
        </p>
        <div className="flex gap-3">
          {token.badges.map((badge) => {
            let color = "";
            switch (badge) {
              case "Stablecoin Compliant":
                color = "info";
                break;
              case "Token-2022 Compliant":
                color = "purple";
                break;
              default:
                color = "success";
            }

            return (
              <Badge color={color} className="w-fit" size="sm">
                {badge}
              </Badge>
            );
          })}
        </div>
      </FCard>
    </Link>
  );
};

export default Card;
