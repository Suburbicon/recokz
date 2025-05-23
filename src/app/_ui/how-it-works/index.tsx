import { Typography } from "@/shared/ui/typography";
import { Radar } from "./radar";
import Lines from "./lines.svg";
import FileEditIcon from "@/shared/icons/file-edit.svg";
import FileFolderIcon from "@/shared/icons/file-folder.svg";
import LaptopIcon from "@/shared/icons/laptop.svg";
import StatsBoldIcon from "@/shared/icons/stats-bold.svg";
import { RadarItem } from "./radar-item";
import Image from "next/image";
import FadeIn from "@/shared/ui/fade-in";

export function HowItWorksSection() {
  return (
    <div className="relative overflow-hidden">
      <div className="container pt-35 pb-30 flex flex-col items-center gap-20">
        <FadeIn delay={0.4} className="flex flex-col items-center text-center">
          <Typography
            size="cap-18"
            color="light-green"
            className="uppercase mb-6"
          >
            Как это работает?
          </Typography>
          <Typography size="h2-med" className="mb-7">
            Кассовый отчёт и сверка поступлений{" "}
            <span className="text-light-green">с помощью ИИ</span>
          </Typography>
          <Typography size="subtitle" color="gray-200">
            Система сверяет продажи (1С, МойСклад, Altegio) с выпиской,
            <br /> усиливая контроль и снижая риск краж.
          </Typography>
        </FadeIn>

        <FadeIn
          delay={0.5}
          className="flex lg:flex-row flex-col xl:gap-15 lg:gap-10 gap-8"
        >
          <div className="flex-1 grid grid-flow-col grid-cols-[48px_auto_auto] auto-rows-auto gap-y-4 gap-x-6">
            <div className="row-span-2">
              <div className="bg-accent-green w-12 h-12 flex items-center justify-center rounded-full">
                1
              </div>
            </div>
            <Typography size="h5-bold">Подключение</Typography>
            <Typography size="body-18" color="gray-300">
              Свяжите Reco.kz с вашей учетной системой (1С, МойСклад, Altegio) и
              банковской выпиской.
            </Typography>
          </div>
          <div className="flex-1 grid grid-flow-col grid-cols-[48px_auto_auto] auto-rows-auto gap-y-4 gap-x-6">
            <div className="row-span-2">
              <div className="bg-accent-green w-12 h-12 flex items-center justify-center rounded-full">
                2
              </div>
            </div>
            <Typography size="h5-bold">Автоматическая сверка</Typography>
            <Typography size="body-18" color="gray-300">
              ИИ сравнит данные о продажах с банковскими поступлениями, выявляя
              расхождения.
            </Typography>
          </div>
          <div className="flex-1 grid grid-flow-col grid-cols-[48px_auto_auto] auto-rows-auto gap-y-4 gap-x-6">
            <div className="row-span-2">
              <div className="bg-accent-green w-12 h-12 flex items-center justify-center rounded-full">
                3
              </div>
            </div>
            <Typography size="h5-bold">Готовый отчет</Typography>
            <Typography size="body-18" color="gray-300">
              В пару кликов получите кассовый отчет и отчет о движении денежных
              средств.
            </Typography>
          </div>
        </FadeIn>

        <FadeIn delay={0.5} className="flex flex-col items-center w-full">
          <Radar />

          <Lines width="80%" className="lg:block hidden" />

          <div className="grid lg:grid-cols-4 grid-cols-2 w-full lg:pt-7 pt-17 text-center gap-10">
            <div className="flex flex-col items-center gap-6 max-w-35 mx-auto">
              <RadarItem>
                <FileEditIcon className="lg:w-8 w-6" />
              </RadarItem>
              <Typography size="body-18">Сверка поступлений продаж</Typography>
            </div>
            <div className="flex flex-col items-center gap-6 max-w-35 mx-auto">
              <RadarItem>
                <FileFolderIcon className="lg:w-8 w-6" />
              </RadarItem>
              <Typography size="body-18">Сверка поступлений продаж</Typography>
            </div>
            <div className="flex flex-col items-center gap-6 max-w-35 mx-auto">
              <RadarItem>
                <LaptopIcon className="lg:w-8 w-6" />
              </RadarItem>
              <Typography size="body-18">Сверка поступлений продаж</Typography>
            </div>
            <div className="flex flex-col items-center gap-6 max-w-35 mx-auto">
              <RadarItem>
                <StatsBoldIcon className="lg:w-7 w-5" />
              </RadarItem>
              <Typography size="body-18">Сверка поступлений продаж</Typography>
            </div>
          </div>
        </FadeIn>
      </div>

      <Image
        src="/images/shadow-5.png"
        alt="I Mac"
        width={0}
        height={0}
        sizes="100vw"
        className="absolute top-0 right-0"
        style={{
          width: "auto",
          height: "80%",
        }}
      />
    </div>
  );
}
