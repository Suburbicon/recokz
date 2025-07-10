import LogoWhite from "@/shared/icons/logo-white.svg";
import LinkedinIcon from "@/shared/icons/linkedin.svg";
import WhatsAppIcon from "@/shared/icons/whatsapp.svg";
import FacebookIcon from "@/shared/icons/facebook.svg";
import TelegramIcon from "@/shared/icons/telegram.svg";
import MargawIcon from "@/shared/icons/margaw.svg";
import { Typography } from "@/shared/ui/typography";

export function Footer() {
  return (
    <footer className="bg-linear-(--gradient-7)">
      <div className="container">
        <div className="py-20 grid lg:grid-cols-5 grid-cols-1 lg:gap-0 gap-12">
          <div className="col-span-2 space-y-11.5">
            <div className="space-y-6 max-w-[340px]">
              <LogoWhite />
              <Typography size="body-16" color="gray-300">
                Освободите бухгалтеров от ручных пересчетов и бесконечных
                поисков недочетов.
              </Typography>
            </div>

            <div className="flex gap-4">
              <a href="#" target="_blank" className="p-1">
                <LinkedinIcon />
              </a>
              <a href="#" target="_blank" className="p-1">
                <WhatsAppIcon />
              </a>
              <a href="#" target="_blank" className="p-1">
                <FacebookIcon />
              </a>
              <a href="#" target="_blank" className="p-1">
                <TelegramIcon />
              </a>
            </div>
          </div>

          <div className="lg:col-span-3 col-span-1 flex lg:flex-row flex-col lg:gap-0 gap-9">
            <div className="flex-1 space-y-4">
              <Typography size="body-16">Компания</Typography>
              <Typography size="body-16" color="gray-200">
                Преимущества
              </Typography>
              {/* <Typography size="body-16" color="gray-200">
                Отзывы
              </Typography> */}
              <Typography size="body-16" color="gray-200">
                Тарифы
              </Typography>
            </div>
            <div className="flex-1 space-y-4">
              <Typography size="body-16">Для бизнеса</Typography>
              <Typography size="body-16" color="gray-200">
                Пользовательское соглашение
              </Typography>
              <Typography size="body-16" color="gray-200">
                Правила отмены подписки
              </Typography>
              <Typography size="body-16" color="gray-200">
                Расчеты стоимости услуг
              </Typography>
            </div>
            <div className="flex-1 space-y-4">
              <Typography size="body-16">Контакты</Typography>
              <Typography size="body-16" color="gray-200">
                +7 (777) 777 77 77
              </Typography>
              <Typography size="body-16" color="gray-200">
                support@reco.kz
              </Typography>
              <Typography size="body-16" color="gray-200">
                Адрес компании
              </Typography>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 py-11 flex lg:flex-row flex-col lg:gap-0 gap-8 justify-between items-center">
          <Typography size="body-14" color="gray-300">
            Все права защищены, 2010-{new Date().getFullYear()}. AO “Reco.kz”
          </Typography>

          <div className="flex lg:flex-row flex-col items-center lg:gap-10 gap-4">
            <Typography size="body-16" color="gray-200">
              Правила пользования сайтом
            </Typography>
            <Typography size="body-16" color="gray-200">
              Политика конфиденциальности
            </Typography>
          </div>

          <a
            href="https://margaw.design/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MargawIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}
