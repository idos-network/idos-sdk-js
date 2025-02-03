import ProfileStatus, { type IconProps } from "./profile-status";

export default function NoProfile(props: IconProps) {
  return <ProfileStatus fill="#7A7A7A" {...props} />;
}
