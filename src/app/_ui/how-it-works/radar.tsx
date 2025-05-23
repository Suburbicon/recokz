import FileIcon from "@/shared/icons/file.svg";
import GraphIcon from "@/shared/icons/graph.svg";
import SettingsIcon from "@/shared/icons/settings.svg";
import StatsThinIcon from "@/shared/icons/stats-thin.svg";
import StatsIcon from "@/shared/icons/stats.svg";
import Image from "next/image";
import RadarBoard from "@/shared/icons/radar-board.svg";
import LogoWhite from "@/shared/icons/logo-white.svg";
import { RadarItem } from "./radar-item";

export const Radar = () => {
  return (
    <div className="relative sm:w-full w-[160%]">
      <div className="relative overflow-hidden">
        <RadarItem absolute className="left-1/2 -translate-x-1/2 top-4">
          <FileIcon className="lg:w-8 w-6" />
        </RadarItem>
        <RadarItem absolute className="sm:left-1/8 left-1/6 bottom-1/8">
          <GraphIcon className="lg:w-8 w-6" />
        </RadarItem>
        <RadarItem absolute className="right-1/3 bottom-1/8">
          <SettingsIcon className="lg:w-8 w-6" />
        </RadarItem>
        <RadarItem absolute className="left-1/5 sm:top-1/6 top-1/12">
          <StatsThinIcon className="lg:w-8 w-6" />
        </RadarItem>
        <RadarItem absolute className="right-1/5 top-1/2 -translate-y-1/2">
          <StatsIcon className="lg:w-8 w-6" />
        </RadarItem>
        <RadarItem
          absolute
          className="sm:left-0 left-1/6 sm:top-1/2 top-1/2"
          size="md"
        >
          <Image
            src="/images/r-keeper.png"
            width={101}
            height={22}
            alt="R-Keeper"
          />
        </RadarItem>
        <RadarItem absolute className="right-1/2 sm:top-1/3 top-2/7" size="md">
          <Image
            src="/images/moy-sklad.png"
            width={119}
            height={18}
            alt="moy-sklad"
          />
        </RadarItem>
        <RadarItem
          absolute
          className="sm:right-1/2 right-3/7 translate-x-1/2 bottom-1/3"
          size="md"
        >
          <Image src="/images/iiko.png" width={54} height={28} alt="iiko" />
        </RadarItem>
        <RadarItem absolute className="right-1/4 top-1/5" size="md">
          <Image
            src="/images/altegio.png"
            width={91}
            height={28}
            alt="altegio"
          />
        </RadarItem>
        <RadarItem
          absolute
          className="sm:right-1/10 right-1/4 translate-x-1/2 bottom-1/5"
          size="md"
        >
          <Image src="/images/1c.png" width={43} height={32} alt="1c" />
        </RadarItem>
        <RadarBoard width="100%" />
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white-50 to-transparent" />
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white to-transparent animate-spin-reverse rotate-10 [animation-duration:10s]" />
      </div>

      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-accent-green h-13 px-6 flex items-center justify-center rounded-full">
        <LogoWhite />
      </div>
    </div>
  );
};
