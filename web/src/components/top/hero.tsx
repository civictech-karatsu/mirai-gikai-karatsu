import Image from "next/image";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";

export function Hero() {
  return (
    <div className="relative w-full h-[80vh] min-h-[400px] md:h-[70vh]">
      <Image
        src="/img/karatsu.jpg"
        alt={siteConfig.councilName}
        fill
        priority
        className="object-cover opacity-40"
        sizes="100vw"
        quality={85}
      />
      {/* 見出しは背景写真の空の部分に置く */}
      <div className="absolute top-[14vh] md:top-[12vh] left-0 right-0 py-4">
        <Container>
          <p className="font-bold text-xl md:text-2xl leading-relaxed">
            いま{siteConfig.councilName}で議論されていること <br />
            やさしい言葉で説明します
          </p>
          <p className="mt-2 font-lexend text-xs">
            {/* 表示したい場合は `powered by ${siteConfig.operator.name}` とかで*/}
            {siteConfig.features.showTeamMiraiSection
              ? "powered by Team Mirai & AI"
              : ""}
          </p>
        </Container>
      </div>
    </div>
  );
}
