import Image from "next/image";
import { Typography } from "@/shared/ui/typography";
import { Button } from "@/shared/ui/button";
import FadeIn from "@/shared/ui/fade-in";
import Link from "next/link";

export function HeroSection() {
  return (
    <div className="relative">
      <div className="container flex lg:flex-row lg:pt-21 lg:pb-40 lg:gap-0 flex-col pt-12 pb-17.5 gap-10">
        <FadeIn delay={0.2} className="flex-1 flex flex-col items-start">
          <Typography
            size="cap-14"
            color="light-green"
            className="border border-green-15 py-2.5 px-4 uppercase lg:mb-10 mb-7.5"
          >
            Для бухгалтеров и руководителей мсб
          </Typography>
          <Typography size="h1-reg" className="lg:mb-9 mb-7">
            Отслеживайте доходы и расходы каждый день
          </Typography>
          <Typography
            size="subtitle"
            color="gray-200"
            className="lg:mb-17.5 mb-12"
          >
            Освободите бухгалтеров от ручных пересчетов и <br /> бесконечных
            поисков недочетов.
          </Typography>
          <div className="flex flex-col items-center gap-5 lg:w-auto w-full">
            <Link href="/sign-in">
              <Button size="lg" className="lg:w-auto w-full">
                Начать пробный период
              </Button>
            </Link>
            <Typography size="body-16" color="gray-200">
              60 дней бесплатно
            </Typography>
          </div>
        </FadeIn>
        <div className="flex-1">
          <div className="w-1/2 h-full absolute right-0 max-h-full justify-end lg:flex hidden">
            <div className="relative" style={{ height: "calc(100% - 244px)" }}>
              <Image
                src="/images/i-mac.png"
                alt="I Mac"
                width={0}
                height={0}
                sizes="100vw"
                style={{
                  width: "auto",
                  height: "100%",
                }}
              />

              <FadeIn
                delay={0.3}
                className="border border-white-10 p-4 rounded-xl absolute -top-3 -left-17 backdrop-blur-30 bg-linear-(--gradient-1)"
              >
                <Image
                  src="/images/bi-group.png"
                  width={100}
                  height={25}
                  alt="Bi Group"
                />
              </FadeIn>

              <FadeIn
                delay={0.4}
                className="border border-white-10 p-4 rounded-xl absolute -bottom-6 left-1/2 backdrop-blur-30 bg-linear-(--gradient-1)"
              >
                <Image
                  src="/images/metabody.png"
                  width={100}
                  height={25}
                  alt="Bi Group"
                />
              </FadeIn>

              <FadeIn
                delay={0.35}
                className="border border-white-10 p-6 rounded-xl absolute -bottom-6 -left-41 backdrop-blur-30 bg-linear-(--gradient-1) flex items-center gap-5"
              >
                <Image
                  src="/images/asel.png"
                  width={100}
                  height={100}
                  alt="Bi Group"
                />
                <div>
                  <Typography size="h5-bold" className="mb-1">
                    Асель Машанова
                  </Typography>
                  <Typography size="body-14" color="gray-200" className="mb-2">
                    Основатель LULU Group
                  </Typography>
                  <Typography size="body-16">
                    “Учет денег моих шести
                    <br /> бизнесов я доверяю Reco.kz”
                  </Typography>
                </div>
              </FadeIn>
            </div>
          </div>
          <div className="lg:hidden block">
            <Image
              src="/images/i-mac-full.png"
              alt="I Mac"
              width={0}
              height={0}
              sizes="100vw"
              style={{
                width: "100%",
                height: "auto",
              }}
            />
            <FadeIn className="border border-white-10 p-4 pr-2 rounded-xl -mt-4 backdrop-blur-30 bg-linear-(--gradient-1) flex items-center gap-4">
              <Image
                src="/images/asel.png"
                width={100}
                height={100}
                alt="Bi Group"
              />
              <div>
                <Typography size="h5-bold" className="mb-1">
                  Асель Машанова
                </Typography>
                <Typography size="body-14" color="gray-200" className="mb-2">
                  Основатель LULU Group
                </Typography>
                <Typography size="body-14">
                  “Учет денег моих шести
                  <br /> бизнесов я доверяю Reco.kz”
                </Typography>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      <Image
        src="/images/shadow-2.png"
        alt="I Mac"
        width={0}
        height={0}
        sizes="100vw"
        className="absolute top-2/3 -z-1 opacity-10"
        style={{
          width: "100%",
          height: "auto",
        }}
      />

      <Image
        src="/images/shadow-3.png"
        alt="I Mac"
        width={0}
        height={0}
        sizes="100vw"
        className="absolute top-1/3 left-0 -z-1"
        style={{
          width: "33%",
          height: "auto",
        }}
      />
    </div>
  );
}
