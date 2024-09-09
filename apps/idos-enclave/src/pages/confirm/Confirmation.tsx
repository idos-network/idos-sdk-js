export interface ConfirmationProps {
  onSuccess: (result: { confirmed: boolean }) => void;
  origin?: string | null;
  message: string;
}

export default function Confirmation() {
  return <div />;
}
