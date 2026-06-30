import { Card as CardRoot } from "./Card";
import { CardBody } from "./CardBody";
import { CardHeader } from "./CardHeader";
import { CardTitle } from "./CardTitle";

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Body: CardBody,
});
