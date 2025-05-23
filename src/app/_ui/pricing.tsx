import { Typography } from "@/shared/ui/typography";
import CheckIcon from "@/shared/icons/check.svg";
import { Button } from "@/shared/ui/button";
import FadeIn from "@/shared/ui/fade-in";

export function PricingSection() {
  return (
    <div id="pricing" className="relative">
      <div className="container py-35 space-y-15">
        <FadeIn delay={0.5} className="space-y-7 text-center">
          <div className="flex flex-col items-center gap-6">
            <Typography size="cap-18" color="light-green" className="uppercase">
              Стоимость
            </Typography>
            <Typography size="h2-med">
              Простая и <span className="text-light-green">прозрачная</span>{" "}
              подписка
            </Typography>
          </div>

          <Typography size="subtitle" color="gray-200">
            Выбирайте тариф, который подходит вашему бизнесу,
            <br /> и платите только за нужные функции.
          </Typography>
        </FadeIn>

        <div className="flex items-center lg:flex-row flex-col gap-6">
          <FadeIn delay={0.5} className="flex-1 w-full">
            <PricingCard
              title="Бесплатный пробный период"
              price="0"
              unit="два месяца"
              benefits={[
                "Сверка поступлений с продажами",
                "Кассовый отчёт по всем транзакциям",
                "Отчёт о движении денежных средств",
                "Полная аналитика по бизнесу",
              ]}
            />
          </FadeIn>
          <FadeIn delay={0.6} className="flex-1 w-full">
            <PricingCard
              popular
              title="Premium-модель"
              price="10 тыс."
              unit="/в месяц"
              description="Идеально подходит для небольшой команды, и для растущего бизнеса"
              benefits={[
                "Сверка поступлений с продажами",
                "Кассовый отчёт по всем транзакциям",
                "Отчёт о движении денежных средств",
                "Полная аналитика по бизнесу на dashboard",
              ]}
            />
          </FadeIn>
          <FadeIn delay={0.7} className="flex-1 w-full">
            <PricingCard
              title="Кастомные тарифы"
              price="15 тыс."
              unit="/в месяц"
              description="Идеально подходит для небольшой команды, и для растущего бизнеса"
              benefits={[
                "Только сверка",
                "Сверка поступлений с продажами",
                "Аналитика на dashboard по оборотам",
              ]}
            />
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

type PricingCardProps = {
  title: string;
  price: string;
  unit: string;
  description?: string;
  benefits: string[];
  popular?: boolean;
};

function PricingCard({
  title,
  price,
  unit,
  description,
  benefits,
  popular,
}: PricingCardProps) {
  return (
    <div className="relative sm:py-10 sm:px-9 px-6 py-8 bg-linear-(--gradient-4) rounded-[20px] border border-white-10 space-y-12">
      {popular ? (
        <Typography
          size="cap-14"
          className="bg-accent-green px-3 py-1.5 rounded-lg uppercase absolute -top-4 right-10"
        >
          Популярный тариф
        </Typography>
      ) : null}

      <div>
        <Typography size="h5-bold" className="mb-4">
          {title}
        </Typography>
        <div className="flex items-center gap-2 mb-2.5">
          <Typography size="h4-med">{price} ₸</Typography>
          <Typography size="body-16" color="gray-200">
            /{unit}
          </Typography>
        </div>
        {description ? (
          <Typography size="body-14" color="gray-200">
            {description}
          </Typography>
        ) : null}
      </div>

      <div className="space-y-9">
        <div className="space-y-3">
          {benefits?.map((benefit, index) => (
            <Typography
              key={index}
              size="body-16"
              className="flex items-center gap-1.5"
            >
              <CheckIcon />
              {benefit}
            </Typography>
          ))}
        </div>

        <div className="flex flex-col items-center gap-5">
          <Button className="w-full">Попробовать бесплатно</Button>
          <Typography size="body-16">60 дней бесплатно</Typography>
        </div>
      </div>
    </div>
  );
}
