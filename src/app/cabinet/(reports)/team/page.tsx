"use client";

import { useMemo, useState } from "react";
import { api } from "@/shared/lib/trpc/client";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography";
import { Input } from "@/shared/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  ArrowUpDown,
  CheckIcon,
  PencilIcon,
  Trash2Icon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";

type SortField = "fullName" | "position" | "joinedAt";
type SortDir = "asc" | "desc";

export default function TeamPage() {
  const utils = api.useUtils();
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("joinedAt");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [positionDraft, setPositionDraft] = useState("");

  const [deleteCandidate, setDeleteCandidate] = useState<{
    id: string;
    fullName: string;
  } | null>(null);

  const { data: members = [], isLoading } =
    api.organization.getMembers.useQuery();

  const { mutateAsync: addUserByEmail, isPending: isAdding } =
    api.organization.addUserByEmail.useMutation({
      onSuccess: (data) => {
        toast.success(`Пользователь ${data.userName} добавлен в компанию`);
        setEmail("");
        void utils.organization.getMembers.invalidate();
      },
      onError: (err) => toast.error(err.message),
    });

  const { mutateAsync: updatePosition, isPending: isSavingPosition } =
    api.organization.updateMemberPosition.useMutation({
      onSuccess: () => {
        toast.success("Должность обновлена");
        setEditingUserId(null);
        void utils.organization.getMembers.invalidate();
      },
      onError: (err) => toast.error(err.message),
    });

  const { mutateAsync: removeMember, isPending: isRemoving } =
    api.organization.removeMember.useMutation({
      onSuccess: () => {
        toast.success("Сотрудник удалён");
        setDeleteCandidate(null);
        void utils.organization.getMembers.invalidate();
      },
      onError: (err) => toast.error(err.message),
    });

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? members.filter(
          (m) =>
            m.fullName.toLowerCase().includes(term) ||
            m.email.toLowerCase().includes(term) ||
            (m.position ?? "").toLowerCase().includes(term),
        )
      : members;

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "fullName") cmp = a.fullName.localeCompare(b.fullName);
      else if (sortField === "position")
        cmp = (a.position ?? "").localeCompare(b.position ?? "");
      else cmp = a.joinedAt.getTime() - b.joinedAt.getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [members, search, sortField, sortDir]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) {
      toast.error("Введите email");
      return;
    }
    await addUserByEmail({ email: value });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const startEditPosition = (userId: string, current: string | null) => {
    setEditingUserId(userId);
    setPositionDraft(current ?? "");
  };

  const cancelEditPosition = () => {
    setEditingUserId(null);
    setPositionDraft("");
  };

  const saveEditPosition = async (userId: string) => {
    await updatePosition({ userId, position: positionDraft });
  };

  return (
    <div className="flex flex-col gap-8 p-6">
      <div>
        <Typography size="h3-med">Команда</Typography>
        <Typography size="body-16" className="mt-1 text-muted-foreground">
          Добавьте пользователя в компанию по email. Он должен быть уже
          зарегистрирован и подтвердил почту.
        </Typography>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex max-w-md flex-col gap-4 rounded-xl border bg-card p-6"
      >
        <label className="space-y-2">
          <Typography size="body-14" className="font-medium">
            Email пользователя
          </Typography>
          <Input
            type="email"
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isAdding}
            className="max-w-sm border-gray-200"
          />
        </label>
        <Button type="submit" disabled={isAdding} className="w-fit gap-2">
          <UserPlusIcon className="h-4 w-4" />
          {isAdding ? "Добавление…" : "Добавить в компанию"}
        </Button>
      </form>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Typography size="h3-med">Сотрудники</Typography>
          <Input
            placeholder="Поиск по имени, email или должности…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs border-gray-200"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("fullName")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  ФИО
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("position")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Должность
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("joinedAt")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Дата добавления
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="w-[120px] text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Загрузка…
                </TableCell>
              </TableRow>
            ) : filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  {search
                    ? "Ничего не найдено"
                    : "В компании пока нет сотрудников"}
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((m) => {
                const isEditing = editingUserId === m.id;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.email}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={positionDraft}
                            onChange={(e) => setPositionDraft(e.target.value)}
                            placeholder="Должность"
                            className="h-8 border-gray-200"
                            autoFocus
                            disabled={isSavingPosition}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => saveEditPosition(m.id)}
                            disabled={isSavingPosition}
                            title="Сохранить"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={cancelEditPosition}
                            disabled={isSavingPosition}
                            title="Отмена"
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditPosition(m.id, m.position)}
                          className="flex items-center gap-2 text-left hover:text-foreground"
                          title="Редактировать должность"
                        >
                          <span
                            className={
                              m.position ? "" : "text-muted-foreground italic"
                            }
                          >
                            {m.position || "не указана"}
                          </span>
                          <PencilIcon className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dayjs(m.joinedAt).format("DD.MM.YYYY")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() =>
                          setDeleteCandidate({
                            id: m.id,
                            fullName: m.fullName,
                          })
                        }
                        title="Удалить из компании"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!deleteCandidate}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить сотрудника?</DialogTitle>
          </DialogHeader>
          <Typography size="body-14" className="text-muted-foreground">
            {deleteCandidate?.fullName} будет отвязан от текущей компании.
            Аккаунт пользователя не удаляется.
          </Typography>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteCandidate(null)}
              disabled={isRemoving}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                deleteCandidate &&
                removeMember({ userId: deleteCandidate.id })
              }
              disabled={isRemoving}
            >
              {isRemoving ? "Удаление…" : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
