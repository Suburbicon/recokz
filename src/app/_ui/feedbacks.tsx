import { Typography } from "@/shared/ui/typography";
import Image from "next/image";
import { Button } from "@/shared/ui/button";
import FadeIn from "@/shared/ui/fade-in";

export function FeedbacksSection() {
  return (
    <div id="feedbacks" className="p-4">
      <div className="bg-white-4 rounded-4xl sm:py-30 py-15">
        <div className="container flex flex-col items-center gap-15">
          <FadeIn delay={0.5} className="space-y-6 text-center">
            <Typography size="cap-18" color="light-green" className="uppercase">
              Отзывы
            </Typography>
            <Typography size="h2-med">
              Лидеры индустрии <br />
              <span className="text-light-green">уже с нами</span>
            </Typography>
          </FadeIn>

          <div className="grid lg:grid-cols-2 grid-cols-1 gap-6 w-full">
            <FadeIn
              delay={0.6}
              className="bg-linear-(--gradient-5) rounded-[30px] border border-white-10 sm:py-8 sm:px-9 px-6 py-7 sm:space-y-14 space-y-7"
            >
              <Typography size="body-18">
                “Учет денег моих шести бизнесов я доверяю Reco.kz. Учет денег
                моих шести бизнесов я доверяю Reco.kz. Учет денег моих шести
                бизнесов я доверяю Reco.kz”
              </Typography>

              <div className="flex items-center gap-5">
                <Image
                  src="/images/asel.png"
                  width={60}
                  height={60}
                  alt="Bi Group"
                />
                <div className="space-y-1">
                  <Typography size="h5-bold">Асель Машанова</Typography>
                  <Typography size="body-16" color="gray-200">
                    финансовый директор группы Жанны Кан, ex-фин директор BI
                    Group
                  </Typography>
                </div>
              </div>
            </FadeIn>
          </div>

          <div>
            <Button>Отзывы довольных клиентов</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
