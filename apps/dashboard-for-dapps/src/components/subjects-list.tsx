import { openImageInNewTab, transformBase85Image } from "@/utils/imgs";
import { Image, List } from "@chakra-ui/react";
import { DataListItem, DataListRoot } from "@idos-network/ui-kit";
import React from "react";

const safeParse = (content: string) => {
  try {
    return JSON.parse(content);
  } catch (e) {
    return {};
  }
};

export default function SubjectsList({ content }: { content: string }) {
  const parsedContent = safeParse(content);
  const subject = Object.entries(parsedContent.credentialSubject).filter(
    ([key]) => !["emails", "wallets"].includes(key) && !key.endsWith("_file"),
  ) as [string, string][];

  const emails = parsedContent.credentialSubject.emails;
  const wallets = parsedContent.credentialSubject.wallets;
  const files = (
    Object.entries(parsedContent.credentialSubject).filter(([key]) => key.endsWith("_file")) as [
      string,
      string,
    ][]
  ).map(([key, value]) => [key, transformBase85Image(value)]);

  function changeCase(str: string) {
    return str.replace(/_/g, " ");
  }

  return (
    <DataListRoot orientation="horizontal" divideY="1px">
      {subject.map(([key, value]) => (
        <DataListItem
          key={key}
          pt="4"
          grow
          textTransform="uppercase"
          label={changeCase(key)}
          value={value}
        />
      ))}

      <DataListItem
        pt="4"
        grow
        alignItems={{
          base: "flex-start",
          md: "center",
        }}
        flexDir={{
          base: "column",
          md: "row",
        }}
        textTransform="uppercase"
        label="EMAILS"
        value={
          <List.Root align="center" gap="2">
            {emails.map(({ address, verified }: { address: string; verified: boolean }) => (
              <List.Item key={address} alignItems="center" display="inline-flex">
                {address}
                {verified ? " (verified)" : ""}
              </List.Item>
            ))}
          </List.Root>
        }
      />
      <DataListItem
        pt="4"
        grow
        alignItems={{
          base: "flex-start",
          md: "center",
        }}
        flexDir={{
          base: "column",
          md: "row",
        }}
        textTransform="uppercase"
        label="WALLETS"
        value={
          <List.Root align="center" gap="2">
            {wallets.map(
              ({ address, currency }: { address: string; currency: string; verified: boolean }) => (
                <List.Item
                  key={address}
                  display="inline-flex"
                  alignItems="center"
                  textTransform="uppercase"
                >
                  {address} ({currency})
                </List.Item>
              ),
            )}
          </List.Root>
        }
      />
      <DataListItem
        pt="4"
        grow
        alignItems="start"
        flexDir="column"
        label="FILES"
        value={
          <List.Root variant="plain" display="flex" flexDirection="row" gap="4" overflowX="auto">
            {files.map(([key, value]) => (
              <List.Item
                flexShrink="0"
                key={key}
                role="button"
                transition="transform 0.2s"
                cursor="pointer"
                _hover={{ transform: "scale(1.02)" }}
                onClick={() => openImageInNewTab(value)}
              >
                <Image
                  src={value}
                  alt="Identification document front"
                  rounded="md"
                  loading="lazy"
                  width="120px"
                  height="120px"
                  title="Click to open the image in full size"
                />
              </List.Item>
            ))}
          </List.Root>
        }
      />
    </DataListRoot>
  );
}
