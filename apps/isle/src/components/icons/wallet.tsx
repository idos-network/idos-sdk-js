import { Icon, type IconProps } from "./icon";

export function WalletIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <svg
        viewBox="0 0 23 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-labelledby="title"
      >
        <title id="title">Wallet icon</title>
        <path
          d="M20.2778 2.89111H2.72967C1.77844 2.89111 1.00732 3.66223 1.00732 4.61346V15.164C1.00732 16.1152 1.77844 16.8863 2.72967 16.8863H20.2778C21.229 16.8863 22.0001 16.1152 22.0001 15.164V4.61346C22.0001 3.66223 21.229 2.89111 20.2778 2.89111Z"
          stroke="currentColor"
          strokeMiterlimit="10"
        />
        <path d="M20.1806 9.79541H14.116" stroke="currentColor" strokeMiterlimit="10" />
        <path
          d="M20.2201 2.83611C20.2201 1.88444 19.4485 1.11377 18.4977 1.11377H2.72234C1.7716 1.11377 1 1.88537 1 2.83611V4.56592"
          stroke="currentColor"
          strokeMiterlimit="10"
        />
      </svg>
    </Icon>
  );
}
