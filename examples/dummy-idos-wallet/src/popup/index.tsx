import styles from "@assets/styles/index.css?inline";
import createShadowRoot from "@utils/createShadowRoot";
import Confirm from "./Confirm";
import Login from "./Login";
import Password from "./Password";
import Popup from "./Popup";

const root = createShadowRoot(styles);

const urlParams = new URLSearchParams(window.location.search);
const type = urlParams.get("type");

if (type === "password") {
  root.render(<Password />);
} else if (type === "login") {
  root.render(<Login />);
} else if (type === "confirm") {
  root.render(<Confirm />);
} else {
  root.render(<Popup />);
}
