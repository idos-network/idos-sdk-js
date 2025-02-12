import { DeleteIcon } from "../icons/delete";
import { Icon } from "../icons/icon";
import { Button } from "./button";

export default function RevokeButton() {
  return (
    <Button bg="aquamarine.400" color="neutral.950" display="flex" alignItems="center" gap={2}>
      Revoke Access
      <Icon w={5} h={5} color="neutral.950">
        <DeleteIcon />
      </Icon>
    </Button>
  );
}
