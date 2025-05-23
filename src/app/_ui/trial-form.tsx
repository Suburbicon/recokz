import { Typography } from "@/shared/ui/typography";
import { Button } from "@/shared/ui/button";
import Image from "next/image";
import FadeIn from "@/shared/ui/fade-in";
import Link from "next/link";

export function TrialFormSection() {
  return (
    <div className="relative">
      <div className="container">
        <FadeIn
          delay={0.5}
          className="sm:px-15 sm:py-15 px-6 py-12 bg-linear-(--gradient-3) rounded-[40px] flex lg:flex-row flex-col lg:gap-0 gap-8 justify-between items-end overflow-hidden relative"
        >
          <div className="flex flex-col justify-between gap-6">
            <div className="space-y-6">
              <Typography size="cap-18" className="uppercase">
                Пробный период
              </Typography>
              <Typography size="h3-med">
                Попробуйте
                <br /> Reco.kz{" "}
                <span className="text-light-green">бесплатно!</span>
              </Typography>
            </div>
            <Typography size="body-18" color="gray-200">
              Получите полный доступ ко всем возможностям
              <br /> на 60 дней — без оплаты и ограничений.
            </Typography>
          </div>
          <div>
            <Link href="/sign-in">
              <Button className="lg:w-[400px] w-full z-20 relative">
                Попробовать бесплатно
              </Button>
            </Link>
          </div>

          <Image
            src="/images/shadow-6.png"
            alt="Shadow"
            width={0}
            height={0}
            sizes="100vw"
            className="absolute -top-1/1 right-0 z-0"
            style={{
              width: "40%",
              height: "auto",
            }}
          />
        </FadeIn>
      </div>
    </div>
  );
}
