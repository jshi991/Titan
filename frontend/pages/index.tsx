import Image from "next/image";
import { Inter } from "next/font/google";
import Upload from "../components/upload";
import { Title } from "@mantine/core";
import { Text } from "@mantine/core";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <Text>Welcome to Titan</Text>
      <Upload />
    </main>
  );
}
