"use client";

import { api } from "@/shared/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Typography } from "@/shared/ui/typography";
import { Skeleton } from "@/shared/ui/skeleton";
import { User, Mail, Phone, Building2, Briefcase, Hash } from "lucide-react";

export default function ProfilePage() {
  const { data: user, isLoading } = api.user.getCurrent.useQuery();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <Typography size="h4-med">Пользователь не найден</Typography>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <Typography size="h3-med">Профиль пользователя</Typography>
        <Typography size="body-16" color="gray-200" className="mt-2">
          Информация о вашем аккаунте
        </Typography>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Личная информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <Typography size="body-14" color="gray-200">
                ФИО
              </Typography>
              <Typography size="body-16" className="mt-1">
                {user.fullName}
              </Typography>
            </div>
          </div>

          {user.position && (
            <div className="flex items-start gap-4">
              <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <Typography size="body-14" color="gray-200">
                  Должность
                </Typography>
                <Typography size="body-16" className="mt-1">
                  {user.position}
                </Typography>
              </div>
            </div>
          )}

          <div className="flex items-start gap-4">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <Typography size="body-14" color="gray-200">
                Email
              </Typography>
              <Typography size="body-16" className="mt-1">
                {user.email}
              </Typography>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <Typography size="body-14" color="gray-200">
                Номер телефона
              </Typography>
              <Typography size="body-16" className="mt-1">
                {user.phone}
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Информация о компании</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <Typography size="body-14" color="gray-200">
                Наименование компании
              </Typography>
              <Typography size="body-16" className="mt-1">
                {user.companyName}
              </Typography>
            </div>
          </div>

          {user.bin && (
            <div className="flex items-start gap-4">
              <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <Typography size="body-14" color="gray-200">
                  БИН
                </Typography>
                <Typography size="body-16" className="mt-1">
                  {user.bin}
                </Typography>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {user.organizations && user.organizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Организации</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user.organizations.map((userOrg) => (
                <div
                  key={userOrg.id}
                  className="p-4 border rounded-lg bg-muted/50"
                >
                  <Typography size="body-16" className="font-medium">
                    {userOrg.organization.name}
                  </Typography>
                  <Typography size="body-14" color="gray-200" className="mt-1">
                    Создана:{" "}
                    {new Date(userOrg.organization.createdAt).toLocaleDateString(
                      "ru-RU",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </Typography>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

