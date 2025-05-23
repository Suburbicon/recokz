import { Typography } from "@/shared/ui/typography";
import { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import Image from "next/image";
import FadeIn from "@/shared/ui/fade-in";
import Link from "next/link";

export function AboutSection() {
  return (
    <div className="p-4">
      <div className="bg-white-4 rounded-4xl lg:pt-30 lg:pb-30 pt-15 pb-5">
        <div className="container flex flex-col items-center gap-15">
          <FadeIn
            delay={0.6}
            className="flex flex-col items-center gap-6 text-center"
          >
            <Typography size="cap-18" color="light-green" className="uppercase">
              Кому подойдет Reco.kz?
            </Typography>
            <Typography size="h2-med">
              Если финансы —{" "}
              <span className="text-light-green">
                часть вашей
                <br /> работы,
              </span>{" "}
              вам сюда
            </Typography>
            <Typography size="subtitle" color="gray-200">
              Решение для бизнеса, бухгалтеров и аутсорса.
            </Typography>
          </FadeIn>

          <FadeIn
            delay={0.7}
            className="grid lg:grid-flow-col lg:grid-cols-2 grid-cols-1 gap-6 w-full"
          >
            <Section className="lg:h-85">
              <div className="space-y-5 mb-6">
                <Typography size="h4-med">МСБ на упрощенке</Typography>
                <Typography size="body-16" color="gray-200">
                  Вам не нужен целый штат для составления управленческой
                  отчётности и ведения учёта — достаточно подключиться к нашей
                  системе, и вы всегда будете держать руку на пульсе.
                </Typography>
              </div>
              <Link href="#pricing">
                <Button className="sm:w-auto w-full">Выбрать тариф</Button>
              </Link>

              <Image
                src="/images/graphic-1.png"
                alt="I Mac"
                width={0}
                height={0}
                sizes="100vw"
                className="absolute bottom-0 right-0 -z-1"
                style={{
                  width: "45%",
                  height: "auto",
                }}
              />
            </Section>
            <Section className="lg:h-85">
              <div className="space-y-5 mb-6">
                <Typography size="h4-med">Любой B2C бизнес</Typography>
                <Typography size="body-16" color="gray-200">
                  Много продаж за день, а в конце смены – путаница в кассе,
                  недостачи и подозрения? Подключите Reco! Контроль каждой
                  сделки, автоматические отчёты и полная прозрачность финансов –
                  всё в одном решении.
                </Typography>
              </div>
              <Link href="#pricing">
                <Button className="sm:w-auto w-full">Выбрать тариф</Button>
              </Link>

              <Image
                src="/images/graphic-2.png"
                alt="I Mac"
                width={0}
                height={0}
                sizes="100vw"
                className="absolute bottom-0 right-0 -z-1"
                style={{
                  width: "50%",
                  height: "auto",
                }}
              />
            </Section>
            <Section className="lg:row-span-2 lg:h-auto h-[550px] justify-start gap-12.5">
              <div className="space-y-5">
                <Typography size="h4-med">
                  Бухгалтеры и аутсорсинговые компании
                </Typography>
                <Typography size="body-16" color="gray-200">
                  С нами ваша работа станет проще и быстрее, а вы сможете
                  увеличить доход за счёт интерактивных отчётов и притока новых
                  клиентов.
                </Typography>
              </div>
              <Link href="#pricing">
                <Button className="sm:w-auto w-full">Выбрать тариф</Button>
              </Link>

              <Image
                src="/images/graphic-3.png"
                alt="I Mac"
                width={0}
                height={0}
                sizes="100vw"
                className="absolute bottom-0 right-0 -z-1"
                style={{
                  width: "100%",
                  height: "auto",
                }}
              />
            </Section>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

const Section = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "group col-span-1 bg-black-15 rounded-4xl border border-white-10 pt-10.5 sm:px-12 sm:py-12 px-6 py-8  flex flex-col items-start justify-between relative overflow-hidden",
        className,
      )}
    >
      {children}

      <Image
        src="/images/card-shadow.png"
        alt="card-shadow"
        width={0}
        height={0}
        sizes="100vw"
        className="absolute right-0 bottom-0 -z-1 invisible group-hover:visible"
        style={{
          width: "50%",
          height: "auto",
        }}
      />
    </div>
  );
};
