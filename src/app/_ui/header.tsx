import LogoWhite from "@/shared/icons/logo-white.svg";
import { Typography } from "@/shared/ui/typography";
import { Button } from "@/shared/ui/button";
import Image from "next/image";
import FadeIn from "@/shared/ui/fade-in";
import Link from "next/link";

export function Header() {
  return (
    <div className="relative">
      <header className="container">
        <FadeIn className="py-5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <LogoWhite />
            <nav className="lg:flex gap-8 bg-white-4 px-8 py-4 rounded-full border border-white-10 hidden">
              <Link href="#pricing">
                <Typography
                  size="body-16"
                  color="gray-200"
                  className="hover:text-white"
                >
                  Тарифы
                </Typography>
              </Link>
              <Link href="#feedbacks">
                <Typography
                  size="body-16"
                  color="gray-200"
                  className="hover:text-white"
                >
                  Отзывы
                </Typography>
              </Link>
              <Link href="#faq">
                <Typography
                  size="body-16"
                  color="gray-200"
                  className="hover:text-white"
                >
                  Вопросы и ответы
                </Typography>
              </Link>
            </nav>
          </div>

          <Button>Попробовать</Button>
        </FadeIn>
      </header>

      <Image
        src="/images/shadow-1.png"
        alt="I Mac"
        width={0}
        height={0}
        sizes="100vw"
        className="absolute top-0 -z-1"
        style={{
          width: "auto",
          height: "auto",
        }}
      />

      <Image
        src="/images/shadow-4.png"
        alt="I Mac"
        width={0}
        height={0}
        sizes="100vw"
        className="absolute top-0 right-0 -z-1"
        style={{
          width: "33%",
          height: "auto",
        }}
      />
    </div>
  );
}
