import { ShareRecord, ShareRecordFormValues } from "@/lib/components/share-record";
import { useTranslation } from "react-i18next";
import { useShareCredential } from "../mutations";
import { Credential } from "../types";

type ShareCredentialProps = {
  isOpen: boolean;
  credential?: Credential;
  onClose: () => void;
};

export function ShareCredential(props: ShareCredentialProps) {
  const { t } = useTranslation();
  const shareCredential = useShareCredential();

  const onSubmit = (values: ShareRecordFormValues) => {
    if (!props.credential) {
      return;
    }

    shareCredential.mutate(
      {
        ...props.credential,
        ...values,
      },
      {
        onSuccess() {
          props.onClose();
        },
      }
    );
  };

  return (
    <ShareRecord
      title={t("share-credential")}
      isOpen={props.isOpen}
      onClose={props.onClose}
      onSubmit={onSubmit}
      isLoading={shareCredential.isLoading}
    />
  );
}
