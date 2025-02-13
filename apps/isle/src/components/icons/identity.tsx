import { Icon, type IconProps } from "./icon";

export function IdentityIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby="title"
      >
        <title id="title">Identity icon</title>
        <path
          d="M9.01488 8.0053C10.4901 8.0053 11.686 6.81137 11.686 5.33859C11.686 3.8658 10.4901 2.67188 9.01488 2.67188C7.53965 2.67188 6.34375 3.8658 6.34375 5.33859C6.34375 6.81137 7.53965 8.0053 9.01488 8.0053Z"
          fill="currentColor"
        />
        <path
          d="M14.3885 14.7284C14.3885 11.763 11.981 9.35938 9.01068 9.35938C6.04039 9.35938 3.63281 11.763 3.63281 14.7284H14.3885Z"
          fill="currentColor"
        />
        <path
          d="M1 4.98229V2.31273C1 1.5881 1.58907 1 2.31491 1H4.93546"
          stroke="currentColor"
          stroke-miterlimit="10"
        />
        <path
          d="M13.0078 1.02344H15.6818C16.4083 1.02344 16.9967 1.61154 16.9967 2.33617V4.95239"
          stroke="currentColor"
          stroke-miterlimit="10"
        />
        <path
          d="M16.998 13.0156V15.6852C16.998 16.4105 16.4089 16.9979 15.6831 16.9979H13.0625"
          stroke="currentColor"
          stroke-miterlimit="10"
        />
        <path
          d="M4.98888 16.9758H2.31491C1.58836 16.9758 1 16.3877 1 15.6631V13.0469"
          stroke="currentColor"
          stroke-miterlimit="10"
        />
      </svg>
    </Icon>
  );
}
