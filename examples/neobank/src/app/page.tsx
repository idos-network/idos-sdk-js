import Image from "next/image";

export default function Home() {
  return (
    <div className="grid h-screen place-content-center">
      <Image src="/logo.svg" alt="NeoBank" width={238} height={41} />
    </div>
  );
}
