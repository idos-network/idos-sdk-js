import styles from "@assets/styles/index.css?inline";
import createShadowRoot from "@utils/createShadowRoot";

import Popup from "./Popup";
import Password from "./Password";

const root = createShadowRoot(styles);

const urlParams = new URLSearchParams(window.location.search);
const type = urlParams.get("type");

if (type === "password") {
  root.render(<Password />);
} else {
  root.render(<Popup />);
}
