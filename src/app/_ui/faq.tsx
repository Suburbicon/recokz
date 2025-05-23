import { Typography } from "@/shared/ui/typography";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import Image from "next/image";
import FadeIn from "@/shared/ui/fade-in";

export function FaqSection() {
  return (
    <div id="faq" className="relative">
      <div className="container py-35 grid lg:grid-cols-3 grid-cols-1 lg:gap-0 gap-10">
        <FadeIn delay={0.5}>
          <Typography
            size="cap-18"
            color="light-green"
            className="uppercase mb-6"
          >
            Частые вопросы
          </Typography>
          <Typography size="h2-med">
            Ответы на <span className="text-light-green">самые важные</span>{" "}
            вопросы
          </Typography>
        </FadeIn>
        <FadeIn delay={0.6} className="col-span-2">
          <Accordion type="single" collapsible className="space-y-5">
            <AccordionItem
              value="item-1"
              className="group bg-white-10 sm:px-10 sm:py-8 px-6 py-6 rounded-[20px] border border-white-50 hover:border-light-green"
            >
              <AccordionTrigger>
                <Typography
                  size="subtitle"
                  className="group-hover:text-light-green"
                >
                  Как работает Reco.kz?
                </Typography>
              </AccordionTrigger>
              <AccordionContent>
                <Typography size="body-18" color="gray-200">
                  Reco.kz автоматизирует бухгалтерский учет, упрощает финансовый
                  контроль и дает прозрачность в бизнесе. Вы просто подключаете
                  сервис, и он берет рутину на себя.
                </Typography>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </FadeIn>
      </div>

      <Image
        src="/images/shadow-7.png"
        alt="Shadow"
        width={0}
        height={0}
        sizes="100vw"
        className="absolute left-0 top-0 z-0"
        style={{
          width: "40%",
          height: "auto",
        }}
      />

      <Image
        src="/images/bg-ring.png"
        alt="Shadow"
        width={0}
        height={0}
        sizes="100vw"
        className="absolute -left-50 top-1/3 z-0 animate-spin-reverse [animation-duration:20s]"
        style={{
          width: "40%",
          height: "auto",
        }}
      />
    </div>
  );
}
